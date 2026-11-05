from typing import Dict, Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_uid
from app.models.quizes import Quiz
from app.models.chunk import Chunk
from app.models.questions import Question, QuestionType
from app.schemas.quizes import QuizCreate, QuizUpdate, QuizDelete
from app.services.quiz_service import QuizService
from app.services.attempt_service import AttemptService
from app.services.leaderboard_service import LeaderboardService
from app.ai.graph import run_quiz_pipeline


router = APIRouter()


class SubmitResponses(BaseModel):
    responses: Dict[str, Any]


@router.post("/create")
async def create_quiz(
    quiz_data: QuizCreate,
    uid: str = Depends(get_current_uid),
    db: AsyncSession = Depends(get_db),
):
    quiz = await QuizService.create_quiz(
        uid,
        quiz_data,
        db,
    )

    return {
        "message": "Quiz created successfully",
        "id": quiz.id,
        "quiz_id": quiz.id,
        "status": quiz.status,
    }


@router.put("/update")
async def update_quiz(
    quiz_data: QuizUpdate,
    uid: str = Depends(get_current_uid),
    db: AsyncSession = Depends(get_db),
):
    quiz = await QuizService.update_quiz(
        uid,
        quiz_data,
        db,
    )

    return {
        "message": "Quiz updated successfully",
        "quiz_id": quiz.id,
        "status": quiz.status,
    }


@router.delete("/delete")
async def delete_quiz(
    body: QuizDelete,
    uid: str = Depends(get_current_uid),
    db: AsyncSession = Depends(get_db),
):
    return await QuizService.delete_quiz(
        uid,
        body.quiz_id,
        db,
    )


@router.get("/my-quizzes")
async def get_my_quizzes(
    uid: str = Depends(get_current_uid),
    db: AsyncSession = Depends(get_db),
):
    return await QuizService.get_my_quizzes(uid, db)


@router.get("/my-drafts")
async def get_my_drafts(
    uid: str = Depends(get_current_uid),
    db: AsyncSession = Depends(get_db),
):
    return await QuizService.get_my_drafts(uid, db)


@router.get("/dashboard/stats")
async def get_dashboard_stats(
    uid: str = Depends(get_current_uid),
    db: AsyncSession = Depends(get_db),
):
    return await QuizService.get_dashboard_stats(uid, db)


@router.get("/{quiz_id}")
async def get_quiz_details(
    quiz_id: int,
    uid: str = Depends(get_current_uid),
    db: AsyncSession = Depends(get_db),
):
    return await QuizService.get_quiz_details(
        quiz_id,
        uid,
        db,
    )


@router.post("/{quiz_id}/publish")
async def publish_quiz(
    quiz_id: int,
    uid: str = Depends(get_current_uid),
    db: AsyncSession = Depends(get_db),
):
    return await QuizService.publish_quiz(
        uid,
        quiz_id,
        db,
    )


@router.post("/{quiz_id}/register")
async def register_for_quiz(
    quiz_id: int,
    uid: str = Depends(get_current_uid),
    db: AsyncSession = Depends(get_db),
):
    return await AttemptService.register_participant(
        quiz_id,
        uid,
        db,
    )


@router.get("/{quiz_id}/attempt/questions")
async def get_quiz_questions(
    quiz_id: int,
    uid: str = Depends(get_current_uid),
    db: AsyncSession = Depends(get_db),
):
    return await AttemptService.get_questions_for_attempt(
        quiz_id,
        uid,
        db,
    )


@router.get("/{quiz_id}/attempt/responses")
async def get_attempt_responses(
    quiz_id: int,
    uid: str = Depends(get_current_uid),
    db: AsyncSession = Depends(get_db),
):
    return await AttemptService.get_participant_responses(
        quiz_id,
        uid,
        db,
    )


@router.post("/{quiz_id}/attempt/save")
async def save_attempt_responses(
    quiz_id: int,
    body: SubmitResponses,
    uid: str = Depends(get_current_uid),
    db: AsyncSession = Depends(get_db),
):
    return await AttemptService.save_responses(
        quiz_id,
        uid,
        body.responses,
        db,
    )


@router.post("/{quiz_id}/attempt/submit")
async def submit_quiz(
    quiz_id: int,
    body: SubmitResponses,
    uid: str = Depends(get_current_uid),
    db: AsyncSession = Depends(get_db),
):
    return await AttemptService.submit_quiz(
        quiz_id,
        uid,
        body.responses,
        db,
    )


@router.get("/{quiz_id}/leaderboard")
async def get_leaderboard(
    quiz_id: int,
    uid: str = Depends(get_current_uid),
    db: AsyncSession = Depends(get_db),
):
    return await LeaderboardService.get_leaderboard(
        quiz_id,
        db,
    )


@router.post("/{quiz_id}/generate")
async def generate_quiz_ai(
    quiz_id: int,
    uid: str = Depends(get_current_uid),
    db: AsyncSession = Depends(get_db),
):
    # Verify quiz ownership.
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
            detail="Not authorized to generate questions.",
        )

    if quiz.status != "draft":
        raise HTTPException(
            status_code=400,
            detail="Questions can only be generated for draft quizzes.",
        )

    # Retrieve extracted content from PostgreSQL.
    chunks_result = await db.execute(
        select(Chunk)
        .where(Chunk.quiz_id == quiz_id)
        .order_by(Chunk.id)
    )

    chunks = chunks_result.scalars().all()

    context = "\n\n".join(
        chunk.content
        for chunk in chunks
        if chunk.content
    )

    print(f"CHUNKS FOUND: {len(chunks)}", flush=True)
    print(f"CONTEXT LENGTH: {len(context)}", flush=True)

    if not context.strip():
        raise HTTPException(
            status_code=400,
            detail="No extracted text found. Upload a readable resource first.",
        )

    # Run AI pipeline.
    questions = await run_quiz_pipeline(
        quiz_id=quiz_id,
        question_count=quiz.question_count,
        difficulty=(
            quiz.quiz_difficulty.value
            if hasattr(quiz.quiz_difficulty, "value")
            else str(quiz.quiz_difficulty)
        ),
        question_types=quiz.question_types or ["scq", "mcq"],
        context=context,
    )

    print(
        f"QUESTIONS GENERATED: {len(questions)}",
        flush=True,
    )

    if not questions:
        raise HTTPException(
            status_code=502,
            detail="AI could not generate valid questions. Please try again.",
        )

    if len(questions) != quiz.question_count:
        raise HTTPException(
            status_code=502,
            detail=(
                f"Expected {quiz.question_count} questions, "
                f"but AI generated {len(questions)}."
            ),
        )

    # Validate and prepare all questions before inserting.
    prepared_questions = []

    for index, item in enumerate(questions):
        if not isinstance(item, dict):
            raise HTTPException(
                status_code=502,
                detail=f"AI returned an invalid question at position {index + 1}.",
            )

        try:
            question_type = QuestionType(
                str(item.get("question_type", "")).lower()
            )
        except ValueError:
            raise HTTPException(
                status_code=502,
                detail=f"AI returned an unsupported question type at position {index + 1}.",
            )

        question_text = item.get("question")
        correct_answer = item.get("correct_answer")
        options = item.get("options")

        if not isinstance(question_text, str) or not question_text.strip():
            raise HTTPException(
                status_code=502,
                detail=f"Question {index + 1} has no question text.",
            )

        if correct_answer is None:
            raise HTTPException(
                status_code=502,
                detail=f"Question {index + 1} has no correct answer.",
            )

        if isinstance(correct_answer, list):
            correct_answer = ", ".join(
                str(value) for value in correct_answer
            )

        if question_type in {
            QuestionType.SCQ,
            QuestionType.MCQ,
        }:
            if not isinstance(options, list) or len(options) < 2:
                raise HTTPException(
                    status_code=502,
                    detail=f"Question {index + 1} has invalid options.",
                )

        if question_type == QuestionType.TOF:
            options = ["True", "False"]

        if question_type == QuestionType.FIB:
            options = None

        prepared_questions.append(
            Question(
                quiz_id=quiz_id,
                question=question_text.strip(),
                question_type=question_type,
                correct_answer=str(correct_answer).strip(),
                options=options,
            )
        )

    # Replace previous generated questions atomically.
    try:
        existing_result = await db.execute(
            select(Question).where(
                Question.quiz_id == quiz_id
            )
        )

        for old_question in existing_result.scalars().all():
            await db.delete(old_question)

        db.add_all(prepared_questions)
        await db.flush()
        await db.commit()

        for question in prepared_questions:
            await db.refresh(question)

    except Exception:
        await db.rollback()
        raise

    print(
        f"QUESTIONS SAVED TO DATABASE: {len(prepared_questions)}",
        flush=True,
    )

    return {
        "questions": [
            {
                "id": question.id,
                "question": question.question,
                "question_type": question.question_type.value,
                "correct_answer": question.correct_answer,
                "options": question.options,
            }
            for question in prepared_questions
        ],
        "count": len(prepared_questions),
    }
