# backend/app/models/users.py
from __future__ import annotations
from datetime import datetime
from typing import List, Optional, TYPE_CHECKING

from sqlalchemy import String, DateTime, func, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from .participants import Participant
    from .quizes import Quiz


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    uid: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    username: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String, nullable=False)
    user_code: Mapped[Optional[str]] = mapped_column(String(10), unique=True, index=True, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )



    participants: Mapped[List[Participant]] = relationship(
        "Participant",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    quizzes: Mapped[List[Quiz]] = relationship(
        "Quiz",
        back_populates="creator",
        cascade="all, delete-orphan",
    )
