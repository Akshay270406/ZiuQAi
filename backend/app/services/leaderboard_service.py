from typing import Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from fastapi import HTTPException, status

from app.models.quizes import Quiz
from app.models.participants import Participant
from app.models.users import User

class LeaderboardService:
    @classmethod
    async def get_leaderboard(cls, quiz_id: int, db: AsyncSession) -> Dict[str, Any]:
        result = await db.execute(select(Quiz).where(Quiz.id == quiz_id))
        quiz = result.scalar_one_or_none()
        if not quiz:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")

        if not quiz.show_leaderboard:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Leaderboard is disabled for this quiz")

        p_result = await db.execute(
            select(Participant, User.username)
            .join(User, Participant.user_id == User.uid)
            .where(Participant.quiz_id == quiz_id, Participant.submitted == True)
            .order_by(Participant.score.desc(), Participant.submitted_at.asc())
        )
        rows = p_result.all()

        leaderboard = []
        for rank, (part, username) in enumerate(rows, start=1):
            leaderboard.append({
                "rank": rank,
                "user_id": part.user_id,
                "username": username or "Anonymous",
                "score": part.score,
                "submitted_at": part.submitted_at.isoformat() if part.submitted_at else None
            })

        return {
            "quiz_id": quiz.id,
            "quiz_name": quiz.quiz_name,
            "question_count": quiz.question_count,
            "total_questions": quiz.question_count,
            "leaderboard": leaderboard
        }
