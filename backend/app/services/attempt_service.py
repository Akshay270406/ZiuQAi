from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from fastapi import HTTPException, status

from app.models.quizes import Quiz
from app.models.participants import Participant
from app.models.questions import Question
from app.models.user_responses import UserResponse

SAVE_GRACE_PERIOD_SECONDS = 30
SUBMIT_GRACE_PERIOD_SECONDS = 60

class AttemptService:
    @staticmethod
    def get_utc_now() -> datetime:
        return datetime.now(timezone.utc)

    @staticmethod
    def ensure_utc(dt: datetime) -> datetime:
        if dt.tzinfo is None:
            return dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc)

    @classmethod
    async def _get_validated_participant_and_quiz(
        cls, quiz_id: int, uid: str, db: AsyncSession, grace_period_seconds: int = 0
    ) -> Tuple[Quiz, Participant]:
        result = await db.execute(select(Quiz).where(Quiz.id == quiz_id))
        quiz = result.scalar_one_or_none()
        if not quiz:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")

        p_result = await db.execute(
            select(Participant).where(Participant.quiz_id == quiz_id, Participant.user_id == uid)
        )
        participant = p_result.scalar_one_or_none()
        if not participant:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not registered for this quiz")
        
        if participant.submitted:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Quiz attempt already submitted")

        now = cls.get_utc_now()
        start_time = cls.ensure_utc(quiz.quiz_start_time)
        end_time = start_time + timedelta(minutes=quiz.quiz_duration, seconds=grace_period_seconds)

        if now < start_time:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Quiz has not started yet")

        if now > end_time:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Quiz time window has expired")

        return quiz, participant

    @classmethod
    async def register_participant(cls, quiz_id: int, uid: str, db: AsyncSession) -> Dict[str, Any]:
        result = await db.execute(select(Quiz).where(Quiz.id == quiz_id))
        quiz = result.scalar_one_or_none()
        if not quiz:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")

        now = cls.get_utc_now()
        start_time = cls.ensure_utc(quiz.quiz_start_time)

        p_result = await db.execute(
            select(Participant).where(Participant.quiz_id == quiz_id, Participant.user_id == uid)
        )
        existing = p_result.scalar_one_or_none()
        if existing:
            return {
                "message": "Already registered",
                "quiz_name": quiz.quiz_name,
                "quiz_start_time": quiz.quiz_start_time,
                "quiz_duration": quiz.quiz_duration,
                "question_count": quiz.question_count
            }

        if now >= start_time:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Registration is closed as the quiz has already started"
            )

        participant = Participant(quiz_id=quiz_id, user_id=uid, score=0.0, submitted=False)
        db.add(participant)
        await db.commit()

        return {
            "message": "Registered successfully",
            "quiz_name": quiz.quiz_name,
            "quiz_start_time": quiz.quiz_start_time,
            "quiz_duration": quiz.quiz_duration,
            "question_count": quiz.question_count
        }

    @classmethod
    async def get_questions_for_attempt(cls, quiz_id: int, uid: str, db: AsyncSession) -> List[Dict[str, Any]]:
        quiz, participant = await cls._get_validated_participant_and_quiz(quiz_id, uid, db, grace_period_seconds=0)

        q_result = await db.execute(select(Question).where(Question.quiz_id == quiz_id))
        questions = q_result.scalars().all()

        return [
            {
                "id": q.id,
                "question": q.question,
                "question_type": q.question_type.value if hasattr(q.question_type, 'value') else str(q.question_type),
                "options": q.options
            }
            for q in questions
        ]

    @classmethod
    async def get_participant_responses(cls, quiz_id: int, uid: str, db: AsyncSession) -> Dict[str, Any]:
        quiz, participant = await cls._get_validated_participant_and_quiz(
            quiz_id, uid, db, grace_period_seconds=SAVE_GRACE_PERIOD_SECONDS
        )

        ur_result = await db.execute(
            select(UserResponse).where(UserResponse.participant_id == participant.id)
        )
        responses = {
            str(ur.qid): ur.response
            for ur in ur_result.scalars().all()
            if ur.response is not None and ur.response != "None"
        }
        return {"responses": responses}

    @classmethod
    async def _save_responses_internal(cls, participant: Participant, responses: Dict[str, Any], db: AsyncSession):
        ur_result = await db.execute(
            select(UserResponse).where(UserResponse.participant_id == participant.id)
        )
        existing_responses = {ur.qid: ur for ur in ur_result.scalars().all()}

        for qid_str, resp_val in responses.items():
            if not qid_str.isdigit():
                continue
            qid = int(qid_str)
            resp_str = str(resp_val)

            if qid in existing_responses:
                existing_responses[qid].response = resp_str
            else:
                new_ur = UserResponse(
                    participant_id=participant.id,
                    qid=qid,
                    response=resp_str
                )
                db.add(new_ur)

    @classmethod
    async def save_responses(
        cls, quiz_id: int, uid: str, responses: Dict[str, Any], db: AsyncSession, grace_period_seconds: int = SAVE_GRACE_PERIOD_SECONDS
    ) -> Dict[str, str]:
        quiz, participant = await cls._get_validated_participant_and_quiz(
            quiz_id, uid, db, grace_period_seconds=grace_period_seconds
        )

        await cls._save_responses_internal(participant, responses, db)
        await db.commit()
        return {"status": "saved"}

    @staticmethod
    def _score_question(question: Question, user_resp: Any) -> float:
        if user_resp is None:
            return 0.0
            
        user_str = str(user_resp).strip()
        target_str = str(question.correct_answer).strip()

        q_type = question.question_type.value if hasattr(question.question_type, 'value') else str(question.question_type)
        
        # Scoring strategy based on question type
        if q_type.lower() == "mcq":
            user_set = {s.strip().lower() for s in user_str.split(",") if s.strip()}
            target_set = {s.strip().lower() for s in target_str.split(",") if s.strip()}
            return 1.0 if user_set == target_set else 0.0
        else:
            return 1.0 if user_str.lower() == target_str.lower() else 0.0

    @classmethod
    async def submit_quiz(cls, quiz_id: int, uid: str, responses: Dict[str, Any], db: AsyncSession) -> Dict[str, Any]:
        quiz, participant = await cls._get_validated_participant_and_quiz(
            quiz_id, uid, db, grace_period_seconds=SUBMIT_GRACE_PERIOD_SECONDS
        )

        # Save responses directly to avoid redundant validation
        await cls._save_responses_internal(participant, responses, db)

        # Mark as submitted
        participant.submitted = True
        participant.submitted_at = cls.get_utc_now()

        # Compute score
        q_result = await db.execute(select(Question).where(Question.quiz_id == quiz_id))
        questions = q_result.scalars().all()

        total_score = sum(cls._score_question(q, responses.get(str(q.id))) for q in questions)

        participant.score = total_score
        await db.commit()

        return {
            "message": "Submitted successfully",
            "score": total_score,
            "total_questions": len(questions)
        }
