# backend/app/models/questions.py
from __future__ import annotations
from datetime import datetime
from typing import List, Optional, TYPE_CHECKING
import enum

from sqlalchemy import String, Enum as SQLEnum, ForeignKey, DateTime, func, Integer, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from .quizes import Quiz
    from .user_responses import UserResponse


class QuestionType(str, enum.Enum):
    FIB = "fib"
    SCQ = "scq"
    MCQ = "mcq"
    TOF = "tof"


class Question(Base):
    __tablename__ = "questions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)

    quiz_id: Mapped[int] = mapped_column(Integer, ForeignKey("quizes.id", ondelete="CASCADE"), nullable=False, index=True)

    question: Mapped[str] = mapped_column(String, nullable=False)
    question_type: Mapped[QuestionType] = mapped_column(
        SQLEnum(QuestionType, name="question_type_enum"),
        nullable=False,
    )
    correct_answer: Mapped[str] = mapped_column(String, nullable=False)
    options: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    quiz: Mapped[Quiz] = relationship("Quiz", back_populates="questions")
    user_responses: Mapped[List[UserResponse]] = relationship(
        "UserResponse",
        back_populates="question",
        cascade="all, delete-orphan",
    )
