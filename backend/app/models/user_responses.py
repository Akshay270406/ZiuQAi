# backend/app/models/user_responses.py
from __future__ import annotations
from datetime import datetime
from typing import Optional, TYPE_CHECKING

from sqlalchemy import Integer, String, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from .participants import Participant
    from .questions import Question


class UserResponse(Base):
    __tablename__ = "user_responses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)

    participant_id: Mapped[int] = mapped_column(Integer, ForeignKey("participants.id", ondelete="CASCADE"), nullable=False, index=True)

    qid: Mapped[int] = mapped_column(Integer, ForeignKey("questions.id"), nullable=False, index=True)

    response: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    #user: Mapped["User"] = relationship("User", back_populates="user_responses")
    participant: Mapped[Participant] = relationship("Participant", back_populates="user_responses")
    question: Mapped[Question] = relationship("Question", back_populates="user_responses")
