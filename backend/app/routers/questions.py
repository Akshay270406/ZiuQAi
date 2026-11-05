from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_uid
from app.models.questions import Question, QuestionType
from app.models.quizes import Quiz
from app.schemas.questions import (
    QuestionCreate,
    QuestionUpdate,
    QuestionDelete,
    QuestionResponse,
)


router = APIRouter()


async def verify_quiz_owner(
    quiz_id: int,
    uid: str,
    db: AsyncSession,
) -> Quiz:
    result = await db.execute(
        select(Quiz).where(Quiz.id == quiz_id)
    )

    quiz = result.scalar_one_or_none()

    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found.",
        )

    if quiz.creator_uid != uid:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized for this quiz.",
        )

    return quiz


def serialize_question(question: Question) -> dict:
    return {
        "id": question.id,
        "quiz_id": question.quiz_id,
        "question": question.question,
        "question_type": (
            question.question_type.value
            if hasattr(question.question_type, "value")
            else str(question.question_type)
        ),
        "correct_answer": question.correct_answer,
        "options": question.options,
    }


def normalize_question_type(value: QuestionType | str) -> QuestionType:
    if isinstance(value, QuestionType):
        return value

    try:
        return QuestionType(str(value).lower())
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid question type: {value}",
        )


@router.post("/create", response_model=QuestionResponse)
async def create_question(
    ques: QuestionCreate,
    uid: str = Depends(get_current_uid),
    db: AsyncSession = Depends(get_db),
):
    quiz = await verify_quiz_owner(
        ques.quiz_id,
        uid,
        db,
    )

    if quiz.status != "draft":
        raise HTTPException(
            status_code=400,
            detail="Questions can only be added to draft quizzes.",
        )

    question_type = normalize_question_type(
        ques.question_type
    )

    new_question = Question(
        quiz_id=ques.quiz_id,
        question=ques.question.strip(),
        question_type=question_type,
        correct_answer=ques.correct_answer.strip(),
        options=ques.options,
    )

    db.add(new_question)
    await db.commit()
    await db.refresh(new_question)

    return new_question


@router.put("/update", response_model=QuestionResponse)
async def update_question(
    ques: QuestionUpdate,
    uid: str = Depends(get_current_uid),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Question).where(
            Question.id == ques.question_id
        )
    )

    question_obj = result.scalar_one_or_none()

    if not question_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found.",
        )

    quiz = await verify_quiz_owner(
        question_obj.quiz_id,
        uid,
        db,
    )

    if quiz.status != "draft":
        raise HTTPException(
            status_code=400,
            detail="Published quiz questions cannot be edited.",
        )

    question_obj.question = ques.question.strip()
    question_obj.question_type = normalize_question_type(
        ques.question_type
    )
    question_obj.correct_answer = ques.correct_answer.strip()
    question_obj.options = ques.options

    await db.commit()
    await db.refresh(question_obj)

    return question_obj


@router.delete("/delete")
async def delete_question(
    ques: QuestionDelete,
    uid: str = Depends(get_current_uid),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Question).where(
            Question.id == ques.question_id
        )
    )

    question_obj = result.scalar_one_or_none()

    if not question_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found.",
        )

    quiz = await verify_quiz_owner(
        question_obj.quiz_id,
        uid,
        db,
    )

    if quiz.status != "draft":
        raise HTTPException(
            status_code=400,
            detail="Published quiz questions cannot be deleted.",
        )

    await db.delete(question_obj)
    await db.commit()

    return {
        "message": "Question deleted successfully."
    }


@router.get("/quiz/{quiz_id}")
async def get_quiz_questions(
    quiz_id: int,
    uid: str = Depends(get_current_uid),
    db: AsyncSession = Depends(get_db),
):
    await verify_quiz_owner(
        quiz_id,
        uid,
        db,
    )

    result = await db.execute(
        select(Question)
        .where(Question.quiz_id == quiz_id)
        .order_by(Question.id)
    )

    questions = result.scalars().all()

    return [
        serialize_question(question)
        for question in questions
    ]
