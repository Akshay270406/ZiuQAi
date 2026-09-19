# backend/app/models/chat_session.py
from __future__ import annotations
from datetime import datetime
from typing import List, Optional, TYPE_CHECKING

from sqlalchemy import Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.database import Base

if TYPE_CHECKING:
    from .quizes import Quiz
    from .chat_message import ChatMessage

class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id: Mapped[str] = mapped_column(String, primary_key=True, index=True)
    quiz_id: Mapped[int] = mapped_column(Integer, ForeignKey("quizes.id"), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    quiz: Mapped[Quiz] = relationship("Quiz", back_populates="chat_sessions")    
    chat_messages: Mapped[List[ChatMessage]] = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan")
