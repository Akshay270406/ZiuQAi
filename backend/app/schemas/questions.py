# backend/app/schemas/questions.py
from pydantic import BaseModel, Field, ConfigDict
from app.models.questions import QuestionType

class QuestionCreate(BaseModel):
    quiz_id: int
    question: str
    question_type: QuestionType
    correct_answer: str
    options: list[str] | None = None

class QuestionUpdate(BaseModel):
    question_id: int
    question: str
    question_type: QuestionType
    correct_answer: str
    options: list[str] | None = None

class QuestionDelete(BaseModel):
    question_id: int

class QuestionResponse(BaseModel):
    question_id: int = Field(alias="id")
    quiz_id: int
    question: str
    question_type: QuestionType
    correct_answer: str
    options: list[str] | None = None

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
