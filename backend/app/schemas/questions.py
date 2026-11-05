from pydantic import BaseModel, Field, ConfigDict, field_validator

from app.models.questions import QuestionType


class QuestionCreate(BaseModel):
    quiz_id: int = Field(gt=0)
    question: str = Field(min_length=1)
    question_type: QuestionType
    correct_answer: str = Field(min_length=1)
    options: list[str] | None = None

    @field_validator("question", "correct_answer")
    @classmethod
    def strip_text(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError("Field cannot be empty.")

        return value


class QuestionUpdate(BaseModel):
    question_id: int = Field(gt=0)
    question: str = Field(min_length=1)
    question_type: QuestionType
    correct_answer: str = Field(min_length=1)
    options: list[str] | None = None

    @field_validator("question", "correct_answer")
    @classmethod
    def strip_text(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError("Field cannot be empty.")

        return value


class QuestionDelete(BaseModel):
    question_id: int = Field(gt=0)


class QuestionResponse(BaseModel):
    question_id: int = Field(alias="id")
    quiz_id: int
    question: str
    question_type: QuestionType
    correct_answer: str
    options: list[str] | None = None

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
    )
