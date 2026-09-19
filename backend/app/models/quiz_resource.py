# backend/app/models/quiz_resource.py
from __future__ import annotations
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import String, DateTime, Integer, ForeignKey, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.database import Base

if TYPE_CHECKING:
    from .quizes import Quiz


class QuizResource(Base):
    """Tracks files uploaded for a quiz draft. Files are stored locally on disk."""
    __tablename__ = "quiz_resources"

    id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    quiz_id: Mapped[int] = mapped_column(Integer, ForeignKey("quizes.id", ondelete="CASCADE"), nullable=False, index=True)
    filename: Mapped[str] = mapped_column(String, nullable=False)
    file_path: Mapped[str] = mapped_column(String, nullable=False)
    file_size_mb: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    quiz: Mapped[Quiz] = relationship("Quiz", back_populates="resources")
