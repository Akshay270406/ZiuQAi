# backend/app/models/chunk.py
from __future__ import annotations
from sqlalchemy import String, Text, DateTime, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from pgvector.sqlalchemy import Vector
from datetime import datetime
from sqlalchemy.sql import func
from typing import TYPE_CHECKING

from app.database import Base

if TYPE_CHECKING:
    from .quizes import Quiz
    from .quiz_resource import QuizResource

class Chunk(Base):
    __tablename__ = "chunks"

    id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    quiz_id: Mapped[int] = mapped_column(Integer, ForeignKey("quizes.id", ondelete="CASCADE"), nullable=False, index=True)
    resource_id: Mapped[int] = mapped_column(Integer, ForeignKey("quiz_resources.id", ondelete="CASCADE"), nullable=True, index=True)
    
    content: Mapped[str] = mapped_column(Text, nullable=False)
    embedding: Mapped[list[float]] = mapped_column(Vector(768), nullable=False)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    quiz: Mapped[Quiz] = relationship("Quiz")
    resource: Mapped[QuizResource] = relationship("QuizResource")
