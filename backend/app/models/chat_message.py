from __future__ import annotations
from enum import Enum
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import String, Text, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.database import Base

if TYPE_CHECKING:
    from .chat_session import ChatSession


class Role(str, Enum):
    USER = "USER"
    ASSISTANT = "ASSISTANT"
    SYSTEM = "SYSTEM"


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id: Mapped[str] = mapped_column(String, primary_key=True, index=True)
    session_id: Mapped[str] = mapped_column(String, ForeignKey("chat_sessions.id"), nullable=False, index=True)

    role: Mapped[Role] = mapped_column(SQLEnum(Role), nullable=False)

    message: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    session: Mapped[ChatSession] = relationship("ChatSession", back_populates="chat_messages")
