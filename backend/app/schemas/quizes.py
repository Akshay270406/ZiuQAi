# backend/app/schemas/quizes.py
from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import List, Optional, Any
from app.models.quizes import Difficulty
from datetime import datetime

ALLOWED_QUESTION_TYPES = {"scq", "mcq", "tof", "fib"}

class QuizCreate(BaseModel):
    quiz_name: str = Field(min_length=1, max_length=200)
    question_count: int = Field(gt=0, le=100)
    quiz_difficulty: Difficulty
    quiz_start_time: datetime
    quiz_duration: int = Field(gt=0, le=1440)
    show_leaderboard: bool = True
    status: str = Field(default="draft", pattern="^(draft|published)$")
    question_types: List[str] = ["scq", "mcq"]

    @field_validator("quiz_difficulty", mode="before")
    @classmethod
    def uppercase_difficulty(cls, v: Any) -> Any:
        if isinstance(v, str):
            return v.strip().upper()
        return v

    @field_validator("quiz_name", mode="before")
    @classmethod
    def strip_quiz_name(cls, v: str) -> str:
        if isinstance(v, str):
            v = v.strip()
            if not v:
                raise ValueError("quiz_name cannot be empty or blank whitespace")
        return v

    @field_validator("question_types")
    @classmethod
    def validate_question_types(cls, v: List[str]) -> List[str]:
        for qt in v:
            if qt not in ALLOWED_QUESTION_TYPES:
                raise ValueError(f"Invalid question type '{qt}'. Allowed: {ALLOWED_QUESTION_TYPES}")
        return v

class QuizUpdate(BaseModel):
    quiz_id: int
    quiz_name: Optional[str] = Field(default=None, min_length=1, max_length=200)
    question_count: Optional[int] = Field(default=None, gt=0, le=100)
    quiz_difficulty: Optional[Difficulty] = None
    quiz_start_time: Optional[datetime] = None
    quiz_duration: Optional[int] = Field(default=None, gt=0, le=1440)
    show_leaderboard: Optional[bool] = None
    status: Optional[str] = Field(default=None, pattern="^(draft|published)$")
    question_types: Optional[List[str]] = None

    @field_validator("quiz_difficulty", mode="before")
    @classmethod
    def uppercase_difficulty(cls, v: Any) -> Any:
        if isinstance(v, str):
            return v.strip().upper()
        return v

    @field_validator("quiz_name", mode="before")
    @classmethod
    def strip_quiz_name(cls, v: Optional[str]) -> Optional[str]:
        if isinstance(v, str):
            v = v.strip()
            if not v:
                raise ValueError("quiz_name cannot be empty or blank whitespace")
        return v

    @field_validator("question_types")
    @classmethod
    def validate_question_types(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        if v is not None:
            for qt in v:
                if qt not in ALLOWED_QUESTION_TYPES:
                    raise ValueError(f"Invalid question type '{qt}'. Allowed: {ALLOWED_QUESTION_TYPES}")
        return v

class QuizDelete(BaseModel):
    quiz_id: int

class QuizResponse(BaseModel):
    quiz_id: int = Field(alias="id")
    quiz_name: str
    question_count: int
    quiz_difficulty: Difficulty
    quiz_start_time: datetime
    quiz_duration: int
    show_leaderboard: bool
    status: str
    question_types: Optional[List[str]] = None

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)