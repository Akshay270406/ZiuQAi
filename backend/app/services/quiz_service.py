from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, delete
from fastapi import HTTPException, status

from app.models.quizes import Quiz, Difficulty
from app.models.participants import Participant
from app.models.questions import Question
from app.models.users import User

class QuizService:
    @staticmethod
    def ensure_utc(dt: datetime) -> datetime:
        if dt.tzinfo is None:
            return dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc)

    @classmethod
    async def create_quiz(cls, uid: str, quiz_data: Any, db: AsyncSession) -> Quiz:
        start_time = cls.ensure_utc(quiz_data.quiz_start_time)
        new_quiz = Quiz(
            creator_uid=uid,
            quiz_name=quiz_data.quiz_name,
            question_count=quiz_data.question_count,
            quiz_difficulty=quiz_data.quiz_difficulty,
            quiz_start_time=start_time,
            quiz_duration=quiz_data.quiz_duration,
            show_leaderboard=quiz_data.show_leaderboard,
            question_types=[qt.value if hasattr(qt, 'value') else qt for qt in (quiz_data.question_types or [])],
            status="draft"
        )
        db.add(new_quiz)
        await db.commit()
        await db.refresh(new_quiz)
        return new_quiz

    @classmethod
    async def update_quiz(cls, uid: str, quiz_data: Any, db: AsyncSession) -> Quiz:
        result = await db.execute(select(Quiz).where(Quiz.id == quiz_data.quiz_id))
        quiz = result.scalar_one_or_none()
        if not quiz:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")

        # Security check (IDOR prevention)
        if quiz.creator_uid != uid:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to edit this quiz")

        if quiz_data.quiz_name is not None:
            quiz.quiz_name = quiz_data.quiz_name
        if quiz_data.question_count is not None:
            quiz.question_count = quiz_data.question_count
        if quiz_data.quiz_difficulty is not None:
            quiz.quiz_difficulty = quiz_data.quiz_difficulty
        if quiz_data.quiz_start_time is not None:
            quiz.quiz_start_time = cls.ensure_utc(quiz_data.quiz_start_time)
        if quiz_data.quiz_duration is not None:
            quiz.quiz_duration = quiz_data.quiz_duration
        if quiz_data.show_leaderboard is not None:
            quiz.show_leaderboard = quiz_data.show_leaderboard
        if quiz_data.question_types is not None:
            quiz.question_types = [qt.value if hasattr(qt, 'value') else qt for qt in quiz_data.question_types]

        await db.commit()
        await db.refresh(quiz)
        return quiz

    @classmethod
    async def delete_quiz(cls, uid: str, quiz_id: int, db: AsyncSession) -> Dict[str, str]:
        result = await db.execute(select(Quiz).where(Quiz.id == quiz_id))
        quiz = result.scalar_one_or_none()
        if not quiz:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")

        if quiz.creator_uid != uid:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this quiz")

        await db.delete(quiz)
        await db.commit()
        return {"message": "Quiz deleted successfully"}

    @classmethod
    async def get_quiz_details(cls, quiz_id: int, uid: str, db: AsyncSession) -> Dict[str, Any]:
        result = await db.execute(select(Quiz).where(Quiz.id == quiz_id))
        quiz = result.scalar_one_or_none()
        if not quiz:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")

        p_result = await db.execute(
            select(Participant).where(Participant.quiz_id == quiz_id, Participant.user_id == uid)
        )
        participant = p_result.scalar_one_or_none()

        return {
            "quiz_id": quiz.id,
            "id": quiz.id,
            "quiz_name": quiz.quiz_name,
            "quiz_difficulty": quiz.quiz_difficulty.value if hasattr(quiz.quiz_difficulty, 'value') else quiz.quiz_difficulty,
            "quiz_start_time": quiz.quiz_start_time,
            "quiz_duration": quiz.quiz_duration,
            "question_count": quiz.question_count,
            "show_leaderboard": quiz.show_leaderboard,
            "status": quiz.status,
            "question_types": quiz.question_types,
            "is_registered": participant is not None,
            "registered": participant is not None,
            "is_submitted": participant.submitted if participant else False,
            "submitted": participant.submitted if participant else False,
            "submitted_at": participant.submitted_at.isoformat() if (participant and participant.submitted_at) else None,
            "score": participant.score if participant else None,
            "is_owner": quiz.creator_uid == uid
        }

    @classmethod
    async def get_my_quizzes(cls, uid: str, db: AsyncSession) -> List[Dict[str, Any]]:
        result = await db.execute(select(Quiz).where(Quiz.creator_uid == uid))
        quizzes = result.scalars().all()
        return [
            {
                "id": q.id,
                "quiz_id": q.id,
                "quiz_name": q.quiz_name,
                "quiz_difficulty": q.quiz_difficulty.value if hasattr(q.quiz_difficulty, 'value') else q.quiz_difficulty,
                "quiz_start_time": q.quiz_start_time,
                "quiz_duration": q.quiz_duration,
                "question_count": q.question_count,
                "status": q.status,
            }
            for q in quizzes
        ]

    @classmethod
    async def get_my_drafts(cls, uid: str, db: AsyncSession) -> List[Dict[str, Any]]:
        result = await db.execute(
            select(Quiz).where(Quiz.creator_uid == uid, Quiz.status == "draft")
        )
        quizzes = result.scalars().all()
        return [
            {
                "id": q.id,
                "quiz_id": q.id,
                "quiz_name": q.quiz_name,
                "quiz_difficulty": q.quiz_difficulty.value if hasattr(q.quiz_difficulty, 'value') else q.quiz_difficulty,
                "quiz_start_time": q.quiz_start_time,
                "quiz_duration": q.quiz_duration,
                "question_count": q.question_count,
                "status": q.status,
            }
            for q in quizzes
        ]

    @classmethod
    async def publish_quiz(cls, uid: str, quiz_id: int, db: AsyncSession) -> Dict[str, Any]:
        result = await db.execute(select(Quiz).where(Quiz.id == quiz_id))
        quiz = result.scalar_one_or_none()
        if not quiz:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")

        if quiz.creator_uid != uid:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to publish this quiz")

        quiz.status = "published"
        await db.commit()
        return {"message": "Quiz published successfully", "quiz_id": quiz.id, "status": quiz.status}

    @classmethod
    async def get_dashboard_stats(cls, uid: str, db: AsyncSession) -> Dict[str, Any]:
        p_result = await db.execute(
            select(Participant).where(Participant.user_id == uid)
        )
        participants = p_result.scalars().all()

        total_attempts = len(participants)
        completed_quizzes = [p for p in participants if p.submitted]

        avg_accuracy = 0.0
        recent_activity = []

        if completed_quizzes:
            accuracy_sum = 0.0
            for part in completed_quizzes:
                q_res = await db.execute(select(Quiz).where(Quiz.id == part.quiz_id))
                quiz = q_res.scalar_one_or_none()
                if quiz and quiz.question_count > 0:
                    score = part.score or 0.0
                    percentage = round((score / quiz.question_count) * 100, 1)
                    accuracy_sum += percentage

                    recent_activity.append({
                        "quizName": quiz.quiz_name,
                        "date": part.submitted_at.isoformat() if part.submitted_at else None,
                        "score": int(part.score) if (part.score and part.score.is_integer()) else part.score,
                        "total": quiz.question_count,
                        "percentage": percentage,
                        "difficulty": quiz.quiz_difficulty.value if hasattr(quiz.quiz_difficulty, 'value') else quiz.quiz_difficulty
                    })

            avg_accuracy = round(accuracy_sum / len(completed_quizzes), 1)

        q_created_res = await db.execute(
            select(func.count(Quiz.id)).where(Quiz.creator_uid == uid)
        )
        total_created = q_created_res.scalar() or 0

        return {
            "total_attempts": total_attempts,
            "completed_count": len(completed_quizzes),
            "avg_accuracy": avg_accuracy,
            "total_created": total_created,
            "recent_activity": recent_activity[:5]
        }
