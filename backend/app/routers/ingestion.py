import asyncio
import ipaddress
import os
import shutil
import socket
from pathlib import Path
from urllib.parse import urlparse

import httpx
from bs4 import BeautifulSoup
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from langchain_community.document_loaders import (
    PyMuPDFLoader,
    UnstructuredPowerPointLoader,
    UnstructuredWordDocumentLoader,
)
from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.database import get_db
from app.dependencies import get_current_uid
from app.models.chunk import Chunk
from app.models.quiz_resource import QuizResource
from app.ai.embedding_provider import generate_embeddings
from app.models.quizes import Quiz


UPLOAD_DIR = (
    Path(__file__).resolve().parent.parent.parent / "uploads"
)

router = APIRouter(tags=["Ingestion"])

MAX_FILE_SIZE = 10 * 1024 * 1024
MAX_URL_SIZE = 5 * 1024 * 1024
MAX_TEXT_CHARS = 100_000


def extract_text(file_path: str) -> str:
    suffix = Path(file_path).suffix.lower()

    if suffix == ".pdf":
        loader = PyMuPDFLoader(file_path)
        documents = loader.load()
        return "\n\n".join(doc.page_content for doc in documents)

    if suffix in [".ppt", ".pptx"]:
        loader = UnstructuredPowerPointLoader(file_path)
        documents = loader.load()
        return "\n\n".join(doc.page_content for doc in documents)

    if suffix in [".doc", ".docx"]:
        loader = UnstructuredWordDocumentLoader(file_path)
        documents = loader.load()
        return "\n\n".join(doc.page_content for doc in documents)

    if suffix == ".txt":
        with open(
            file_path,
            "r",
            encoding="utf-8",
            errors="ignore",
        ) as file:
            return file.read()

    raise ValueError(f"Unsupported file format: {suffix}")


def cleanup_quiz_directory(quiz_id: int) -> None:
    directory = UPLOAD_DIR / str(quiz_id)

    if directory.exists():
        shutil.rmtree(directory, ignore_errors=True)


async def ensure_quiz_owner(
    quiz_id: int,
    uid: str,
    db: AsyncSession,
) -> Quiz:
    result = await db.execute(
        select(Quiz).where(Quiz.id == quiz_id)
    )

    quiz = result.scalar_one_or_none()

    if not quiz:
        raise HTTPException(
            status_code=404,
            detail="Quiz not found.",
        )

    if quiz.creator_uid != uid:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to modify this quiz.",
        )

    if quiz.status != "draft":
        raise HTTPException(
            status_code=400,
            detail="Resources can only be changed for draft quizzes.",
        )

    return quiz


def split_text(text_content: str) -> list[str]:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len,
        is_separator_regex=False,
    )

    return splitter.split_text(text_content[:MAX_TEXT_CHARS])


async def save_text_chunks(
    quiz_id: int,
    resource_id: int,
    text_content: str,
    db: AsyncSession,
) -> int:
    if not text_content.strip():
        raise HTTPException(
            status_code=422,
            detail="No readable text was extracted from this resource.",
        )

    chunks = split_text(text_content)

    if not chunks:
        raise HTTPException(
            status_code=422,
            detail="No usable text chunks were extracted.",
        )

    embeddings = await generate_embeddings(chunks)

    if len(embeddings) != len(chunks):
        raise RuntimeError(
            "Embedding provider returned an unexpected number of vectors."
        )

    for chunk_text, embedding in zip(chunks, embeddings):
        db.add(
            Chunk(
                quiz_id=quiz_id,
                resource_id=resource_id,
                content=chunk_text,
                embedding=embedding,
            )
        )

    await db.commit()
    return len(chunks)


async def extract_public_url(url: str) -> str:
    parsed = urlparse(url)

    if parsed.scheme not in {"http", "https"}:
        raise HTTPException(
            status_code=400,
            detail="Only HTTP and HTTPS URLs are supported.",
        )

    if not parsed.hostname:
        raise HTTPException(
            status_code=400,
            detail="Invalid website URL.",
        )

    if parsed.username or parsed.password:
        raise HTTPException(
            status_code=400,
            detail="URLs containing credentials are not supported.",
        )

    try:
        addresses = await asyncio.to_thread(
            socket.getaddrinfo,
            parsed.hostname,
            parsed.port or (443 if parsed.scheme == "https" else 80),
            type=socket.SOCK_STREAM,
        )
    except socket.gaierror:
        raise HTTPException(
            status_code=400,
            detail="Could not resolve the website hostname.",
        )

    for address in addresses:
        ip = ipaddress.ip_address(address[4][0])

        if (
            ip.is_private
            or ip.is_loopback
            or ip.is_link_local
            or ip.is_reserved
            or ip.is_multicast
            or ip.is_unspecified
        ):
            raise HTTPException(
                status_code=400,
                detail="Private or local network URLs are not allowed.",
            )

    try:
        async with httpx.AsyncClient(
            timeout=20,
            follow_redirects=False,
            headers={
                "User-Agent": "ZiuQAI/1.0",
                "Accept": "text/html,text/plain",
            },
        ) as client:
            response = await client.get(url)

            if response.is_redirect:
                raise HTTPException(
                    status_code=400,
                    detail="Website redirects are not supported. Add the final URL instead.",
                )

            response.raise_for_status()

            content_type = response.headers.get(
                "content-type",
                "",
            ).lower()

            if not (
                "text/html" in content_type
                or "text/plain" in content_type
            ):
                raise HTTPException(
                    status_code=415,
                    detail="The URL must return an HTML or plain-text page.",
                )

            if len(response.content) > MAX_URL_SIZE:
                raise HTTPException(
                    status_code=413,
                    detail="The webpage is too large to process.",
                )

            if "text/plain" in content_type:
                text_content = response.text
            else:
                soup = BeautifulSoup(
                    response.text,
                    "html.parser",
                )

                for element in soup(
                    ["script", "style", "noscript", "svg"]
                ):
                    element.decompose()

                text_content = soup.get_text(
                    separator="\n",
                    strip=True,
                )

            if not text_content.strip():
                raise HTTPException(
                    status_code=422,
                    detail="No readable text was found on this webpage.",
                )

            return text_content[:MAX_TEXT_CHARS]

    except HTTPException:
        raise
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to retrieve webpage: {exc}",
        )


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    quiz_id: int = None,
    uid: str = Depends(get_current_uid),
    db: AsyncSession = Depends(get_db),
):
    if not quiz_id:
        raise HTTPException(
            status_code=400,
            detail="quiz_id parameter is required.",
        )

    await ensure_quiz_owner(quiz_id, uid, db)

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="Invalid file.",
        )

    filename = Path(file.filename).name
    suffix = Path(filename).suffix.lower()

    supported = {
        ".pdf",
        ".txt",
        ".doc",
        ".docx",
        ".ppt",
        ".pptx",
    }

    if suffix not in supported:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type: {suffix}",
        )

    content = await file.read()

    if not content:
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is empty.",
        )

    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="Files must be 10 MB or smaller.",
        )

    quiz_upload_dir = UPLOAD_DIR / str(quiz_id)
    quiz_upload_dir.mkdir(parents=True, exist_ok=True)

    file_path = quiz_upload_dir / filename

    try:
        with open(file_path, "wb") as output_file:
            output_file.write(content)

        text_content = await asyncio.to_thread(
            extract_text,
            str(file_path),
        )

        if not text_content.strip():
            raise HTTPException(
                status_code=422,
                detail="No readable text was extracted from the file.",
            )

        resource = QuizResource(
            quiz_id=quiz_id,
            filename=filename,
            file_path=str(file_path),
            file_size_mb=round(
                len(content) / (1024 * 1024),
                2,
            ),
        )

        db.add(resource)
        await db.flush()

        chunk_count = await save_text_chunks(
            quiz_id,
            resource.id,
            text_content,
            db,
        )

        await db.refresh(resource)

        return {
            "status": "success",
            "resource_id": resource.id,
            "filename": resource.filename,
            "file_size_mb": resource.file_size_mb,
            "quiz_id": quiz_id,
            "chunks_created": chunk_count,
        }

    except HTTPException:
        await db.rollback()

        if file_path.exists():
            file_path.unlink()

        raise

    except Exception as exc:
        await db.rollback()

        if file_path.exists():
            file_path.unlink()

        print(
            f"[INGESTION] Failed to process {filename}: {repr(exc)}",
            flush=True,
        )

        raise HTTPException(
            status_code=500,
            detail="File processing failed. Check the backend terminal.",
        )

    finally:
        await file.close()


@router.post("/url")
async def ingest_website_url(
    quiz_id: int,
    url: str,
    uid: str = Depends(get_current_uid),
    db: AsyncSession = Depends(get_db),
):
    await ensure_quiz_owner(quiz_id, uid, db)

    text_content = await extract_public_url(url)

    resource = QuizResource(
        quiz_id=quiz_id,
        filename=url,
        file_path=url,
        file_size_mb=0,
    )

    try:
        db.add(resource)
        await db.flush()

        chunk_count = await save_text_chunks(
            quiz_id,
            resource.id,
            text_content,
            db,
        )

        return {
            "status": "success",
            "resource_id": resource.id,
            "filename": url,
            "quiz_id": quiz_id,
            "chunks_created": chunk_count,
        }

    except Exception:
        await db.rollback()
        raise


@router.get("/resources/{quiz_id}")
async def list_resources(
    quiz_id: int,
    uid: str = Depends(get_current_uid),
    db: AsyncSession = Depends(get_db),
):
    await ensure_quiz_owner(quiz_id, uid, db)

    result = await db.execute(
        select(QuizResource).where(
            QuizResource.quiz_id == quiz_id
        )
    )

    resources = result.scalars().all()

    return [
        {
            "id": resource.id,
            "filename": resource.filename,
            "file_size_mb": resource.file_size_mb,
            "created_at": (
                resource.created_at.isoformat()
                if resource.created_at
                else None
            ),
        }
        for resource in resources
    ]


@router.delete("/resources/{quiz_id}/{resource_id}")
async def delete_resource(
    quiz_id: int,
    resource_id: int,
    uid: str = Depends(get_current_uid),
    db: AsyncSession = Depends(get_db),
):
    await ensure_quiz_owner(quiz_id, uid, db)

    result = await db.execute(
        select(QuizResource).where(
            QuizResource.id == resource_id,
            QuizResource.quiz_id == quiz_id,
        )
    )

    resource = result.scalar_one_or_none()

    if not resource:
        raise HTTPException(
            status_code=404,
            detail="Resource not found.",
        )

    file_path = Path(resource.file_path)

    if file_path.exists():
        file_path.unlink()

    await db.delete(resource)
    await db.commit()

    return {
        "message": "Resource deleted successfully."
    }
