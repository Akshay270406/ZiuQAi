# backend/app/models/quizes.py
from __future__ import annotations
from datetime import datetime
from typing import List, Optional, TYPE_CHECKING
from enum import Enum
from typing import Callable

from sqlalchemy import String, DateTime, func, ForeignKey, Enum as SQLEnum, Boolean, Integer, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .users import User
from app.database import Base

if TYPE_CHECKING:
    from .participants import Participant
    from .questions import Question
    from .quiz_resource import QuizResource
    from .chat_session import ChatSession

class Difficulty(str, Enum):
    EASY = "EASY"
    MEDIUM = "MEDIUM"
    HARD = "HARD"

class Quiz(Base):
    __tablename__ = "quizes"

    id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    creator_uid: Mapped[str] = mapped_column(String, ForeignKey(User.uid), nullable=False, index=True)

    quiz_name: Mapped[str] = mapped_column(String, nullable=False)
    question_count: Mapped[int] = mapped_column(nullable=False)
    quiz_difficulty: Mapped[Difficulty] = mapped_column(
        SQLEnum(Difficulty, name="quiz_difficulty_enum"),
        nullable=False,
    )

    quiz_start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    quiz_duration: Mapped[int] = mapped_column(Integer, nullable=False)

    show_leaderboard: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    status: Mapped[str] = mapped_column(String, default="draft", nullable=False)
    question_types: Mapped[Optional[list]] = mapped_column(JSON, default=lambda: ["scq", "mcq"], nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    creator: Mapped[User] = relationship(
        User,
        back_populates="quizzes",
    )

    participants: Mapped[List[Participant]] = relationship(
        "Participant",
        back_populates="quiz",
        cascade="all, delete-orphan",
    )

    questions: Mapped[List[Question]] = relationship(
        "Question",
        back_populates="quiz",
        cascade="all, delete-orphan",
    )

    resources: Mapped[List[QuizResource]] = relationship(
        "QuizResource",
        back_populates="quiz",
        cascade="all, delete-orphan",
    )

    chat_sessions: Mapped[List[ChatSession]] = relationship(
        "ChatSession",
        back_populates="quiz",
        cascade="all, delete-orphan",
    )
