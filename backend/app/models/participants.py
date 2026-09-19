# backend/app/models/participants.py
from __future__ import annotations
from datetime import datetime
from typing import List, Optional, TYPE_CHECKING

from sqlalchemy import Integer, Float, String, Boolean, ForeignKey, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from .quizes import Quiz
    from .users import User
    from .user_responses import UserResponse


class Participant(Base):
    __tablename__ = "participants"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)

    quiz_id: Mapped[int] = mapped_column(Integer, ForeignKey("quizes.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.uid", ondelete="CASCADE"), nullable=False, index=True)

    score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    submitted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    submitted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    quiz: Mapped[Quiz] = relationship("Quiz", back_populates="participants")
    user: Mapped[User] = relationship("User", back_populates="participants")
    user_responses: Mapped[List[UserResponse]] = relationship(
        "UserResponse",
        back_populates="participant",
        cascade="all, delete-orphan",
    )
