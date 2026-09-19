# backend/app/main.py
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.config import settings
from app.middleware import AuthMiddleware
from app.database import engine, Base

from app.routers import auth, quizzes, ingestion, questions, responses

# Ensure all SQLAlchemy models are loaded for metadata discovery
from app.models import User, Quiz, Participant, Question, UserResponse, QuizResource
from app.models.chunk import Chunk

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.execute(text('CREATE EXTENSION IF NOT EXISTS vector'))
        await conn.run_sync(Base.metadata.create_all)
        await conn.execute(text('ALTER TABLE participants ADD COLUMN IF NOT EXISTS submitted BOOLEAN DEFAULT FALSE;'))
        await conn.execute(text('ALTER TABLE participants ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP WITH TIME ZONE;'))
    yield

app = FastAPI(
    title="ZiuQAI API",
    description="Intelligent Quiz Generation & Hosting Platform API",
    version="1.0.0",
    docs_url="/docs",
    lifespan=lifespan
)

app.add_middleware(AuthMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(quizzes.router, prefix="/quizzes", tags=["Quizzes"])
# Also mapping quizes for backward compatibility
app.include_router(quizzes.router, prefix="/quizes", tags=["Quizzes"])
app.include_router(ingestion.router, prefix="/ingest", tags=["Ingestion"])
app.include_router(questions.router, prefix="/questions", tags=["Questions"])
app.include_router(responses.router, prefix="/responses", tags=["Responses"])

@app.get(path="/", tags=["Health"])
async def health_check():
    return {"status": "ok", "service": "ZiuQAI Backend API"}
