# backend/app/routers/ingestion.py
import os
import shutil
from pathlib import Path
from fastapi import APIRouter, Request, Depends, HTTPException, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from langchain_community.document_loaders import PyMuPDFLoader, UnstructuredPowerPointLoader, UnstructuredWordDocumentLoader

from app.database import get_db
from app.models.quiz_resource import QuizResource
from app.models.chunk import Chunk
from app.ai.embedding_provider import generate_embeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "uploads"
router = APIRouter(tags=["Ingestion"])

from app.dependencies import get_current_uid

def extract_text(file_path: str) -> str:
    suffix = os.path.splitext(file_path)[1].lower()
    if suffix == ".pdf":
        loader = PyMuPDFLoader(file_path)
        docs = loader.load()
        return "\n\n".join([doc.page_content for doc in docs])
    elif suffix in [".ppt", ".pptx"]:
        loader = UnstructuredPowerPointLoader(file_path)
        docs = loader.load()
        return "\n\n".join([doc.page_content for doc in docs])
    elif suffix in [".doc", ".docx"]:
        loader = UnstructuredWordDocumentLoader(file_path)
        docs = loader.load()
        return "\n\n".join([doc.page_content for doc in docs])
    elif suffix == ".txt":
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()
    else:
        raise ValueError(f"Unsupported file format: {suffix}")

def cleanup_quiz_directory(quiz_id: int) -> None:
    quiz_upload_dir = UPLOAD_DIR / str(quiz_id)
    if quiz_upload_dir.exists():
        shutil.rmtree(quiz_upload_dir, ignore_errors=True)

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    quiz_id: int = None,
    uid: str = Depends(get_current_uid),
    db: AsyncSession = Depends(get_db),
):
    if not quiz_id:
        raise HTTPException(status_code=400, detail="quiz_id parameter is required")

    from app.models.quizes import Quiz
    q_result = await db.execute(select(Quiz).where(Quiz.id == quiz_id))
    quiz = q_result.scalar_one_or_none()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    if quiz.creator_uid != uid:
        raise HTTPException(status_code=403, detail="Not authorized to modify this quiz")
        
    if not file.filename:
        raise HTTPException(status_code=400, detail="Invalid file")

    quiz_upload_dir = UPLOAD_DIR / str(quiz_id)
    quiz_upload_dir.mkdir(parents=True, exist_ok=True)
    file_path = quiz_upload_dir / file.filename

    try:
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {e}")
    finally:
        await file.close()

    file_size_mb = round(len(content) / (1024 * 1024), 2)
    resource = QuizResource(
        quiz_id=quiz_id,
        filename=file.filename,
        file_path=str(file_path),
        file_size_mb=file_size_mb,
    )
    db.add(resource)
    await db.commit()
    await db.refresh(resource)

    # RAG Integration: Process the file text, chunk it, and save embeddings
    try:
        text_content = extract_text(str(file_path))
        if text_content.strip():
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=1000,
                chunk_overlap=200,
                length_function=len,
                is_separator_regex=False,
            )
            chunks = text_splitter.split_text(text_content)
            
            if chunks:
                embeddings = await generate_embeddings(chunks)
                
                db_chunks = []
                for chunk_text, embedding in zip(chunks, embeddings):
                    db_chunk = Chunk(
                        quiz_id=quiz_id,
                        resource_id=resource.id,
                        content=chunk_text,
                        embedding=embedding
                    )
                    db.add(db_chunk)
                    db_chunks.append(db_chunk)
                    
                await db.commit()
    except Exception as e:
        print(f"Failed to process RAG chunks: {e}")
        # Even if RAG processing fails, we return success for the file upload, 
        # or we could rollback. Let's just print a warning for now.

    return {
        "status": "success",
        "resource_id": resource.id,
        "filename": resource.filename,
        "file_size_mb": resource.file_size_mb,
        "quiz_id": quiz_id,
    }

@router.get("/resources/{quiz_id}")
async def list_resources(
    quiz_id: int,
    uid: str = Depends(get_current_uid),
    db: AsyncSession = Depends(get_db),
):
    from app.models.quizes import Quiz
    q_result = await db.execute(select(Quiz).where(Quiz.id == quiz_id))
    quiz = q_result.scalar_one_or_none()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    if quiz.creator_uid != uid:
        raise HTTPException(status_code=403, detail="Not authorized to view resources for this quiz")

    result = await db.execute(select(QuizResource).where(QuizResource.quiz_id == quiz_id))
    resources = result.scalars().all()
    
    return [
        {
            "id": r.id,
            "filename": r.filename,
            "file_size_mb": r.file_size_mb,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in resources
    ]

@router.delete("/resources/{quiz_id}/{resource_id}")
async def delete_resource(
    quiz_id: int,
    resource_id: int,
    uid: str = Depends(get_current_uid),
    db: AsyncSession = Depends(get_db),
):
    from app.models.quizes import Quiz
    q_result = await db.execute(select(Quiz).where(Quiz.id == quiz_id))
    quiz = q_result.scalar_one_or_none()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    if quiz.creator_uid != uid:
        raise HTTPException(status_code=403, detail="Not authorized to delete resources for this quiz")
    
    result = await db.execute(
        select(QuizResource).where(QuizResource.id == resource_id, QuizResource.quiz_id == quiz_id)
    )
    resource = result.scalar_one_or_none()
    
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    try:
        file_path = Path(resource.file_path)
        if file_path.exists():
            file_path.unlink()
    except Exception:
        pass

    await db.delete(resource)
    await db.commit()
    return {"message": "Resource deleted successfully"}
