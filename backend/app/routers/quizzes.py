from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import datetime

from app.database import get_db
from app.dependencies import get_current_uid
from app.models.quizes import Quiz
from app.models.quiz_resource import QuizResource
from app.schemas.quizes import QuizCreate, QuizUpdate, QuizDelete
from app.services.quiz_service import QuizService
from app.services.attempt_service import AttemptService
from app.services.leaderboard_service import LeaderboardService
from app.ai.graph import run_quiz_pipeline
from pydantic import BaseModel

router = APIRouter()

class SubmitResponses(BaseModel):
    responses: Dict[str, Any]

@router.post("/create")
async def create_quiz(
    quiz_data: QuizCreate,
    uid: str = Depends(get_current_uid),
    db: AsyncSession = Depends(get_db)
):
    quiz = await QuizService.create_quiz(uid, quiz_data, db)
    return {
        "message": "Quiz created successfully",
        "id": quiz.id,
        "quiz_id": quiz.id,
        "status": quiz.status
    }

@router.put("/update")
async def update_quiz(
    quiz_data: QuizUpdate,
    uid: str = Depends(get_current_uid),
    db: AsyncSession = Depends(get_db)
):
    quiz = await QuizService.update_quiz(uid, quiz_data, db)
    return {
        "message": "Quiz updated successfully",
        "quiz_id": quiz.id,
        "status": quiz.status
    }

@router.delete("/delete")
async def delete_quiz(
    body: QuizDelete,
    uid: str = Depends(get_current_uid),
    db: AsyncSession = Depends(get_db)
):
    return await QuizService.delete_quiz(uid, body.quiz_id, db)

@router.get("/my-quizzes")
async def get_my_quizzes(
    uid: str = Depends(get_current_uid),
    db: AsyncSession = Depends(get_db)
):
    return await QuizService.get_my_quizzes(uid, db)

@router.get("/my-drafts")
async def get_my_drafts(
    uid: str = Depends(get_current_uid),
    db: AsyncSession = Depends(get_db)
):
    return await QuizService.get_my_drafts(uid, db)

@router.get("/dashboard/stats")
async def get_dashboard_stats(
    uid: str = Depends(get_current_uid),
    db: AsyncSession = Depends(get_db)
):
    return await QuizService.get_dashboard_stats(uid, db)

@router.get("/{quiz_id}")
async def get_quiz_details(
    quiz_id: int,
    uid: str = Depends(get_current_uid),
    db: AsyncSession = Depends(get_db)
):
    return await QuizService.get_quiz_details(quiz_id, uid, db)

@router.post("/{quiz_id}/publish")
async def publish_quiz(
    quiz_id: int,
    uid: str = Depends(get_current_uid),
    db: AsyncSession = Depends(get_db)
):
    return await QuizService.publish_quiz(uid, quiz_id, db)

@router.post("/{quiz_id}/register")
async def register_for_quiz(
    quiz_id: int,
    uid: str = Depends(get_current_uid),
    db: AsyncSession = Depends(get_db)
):
    return await AttemptService.register_participant(quiz_id, uid, db)

@router.get("/{quiz_id}/attempt/questions")
async def get_quiz_questions(
    quiz_id: int,
    uid: str = Depends(get_current_uid),
    db: AsyncSession = Depends(get_db)
):
    return await AttemptService.get_questions_for_attempt(quiz_id, uid, db)

@router.get("/{quiz_id}/attempt/responses")
async def get_attempt_responses(
    quiz_id: int,
    uid: str = Depends(get_current_uid),
    db: AsyncSession = Depends(get_db)
):
    return await AttemptService.get_participant_responses(quiz_id, uid, db)

@router.post("/{quiz_id}/attempt/save")
async def save_attempt_responses(
    quiz_id: int,
    body: SubmitResponses,
    uid: str = Depends(get_current_uid),
    db: AsyncSession = Depends(get_db)
):
    return await AttemptService.save_responses(quiz_id, uid, body.responses, db)

@router.post("/{quiz_id}/attempt/submit")
async def submit_quiz(
    quiz_id: int,
    body: SubmitResponses,
    uid: str = Depends(get_current_uid),
    db: AsyncSession = Depends(get_db)
):
    return await AttemptService.submit_quiz(quiz_id, uid, body.responses, db)

@router.get("/{quiz_id}/leaderboard")
async def get_leaderboard(
    quiz_id: int,
    uid: str = Depends(get_current_uid),
    db: AsyncSession = Depends(get_db)
):
    return await LeaderboardService.get_leaderboard(quiz_id, db)

@router.post("/{quiz_id}/generate")
async def generate_quiz_ai(
    quiz_id: int,
    uid: str = Depends(get_current_uid),
    db: AsyncSession = Depends(get_db)
):
    # Verify quiz ownership (IDOR protection)
    result = await db.execute(select(Quiz).where(Quiz.id == quiz_id))
    quiz = result.scalar_one_or_none()
    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")
    if quiz.creator_uid != uid:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to generate questions for this quiz")

    # Load context from quiz resources
    res_result = await db.execute(select(QuizResource).where(QuizResource.quiz_id == quiz_id))
    resources = res_result.scalars().all()
    context = "\n\n".join(
        chunk.chunk_text for r in resources for chunk in (r.chunks if hasattr(r, 'chunks') and r.chunks else [])
    ) if resources else ""

    # Call pipeline with correct arguments
    questions = await run_quiz_pipeline(
        quiz_id=quiz_id,
        question_count=quiz.question_count,
        difficulty=quiz.quiz_difficulty.value if hasattr(quiz.quiz_difficulty, 'value') else str(quiz.quiz_difficulty),
        question_types=quiz.question_types or ["scq", "mcq"],
        context=context,
    )
    return {"questions": questions, "count": len(questions)}
