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
        cls,
        quiz_id: int,
        uid: str,
        db: AsyncSession,
        grace_period_seconds: int = 0,
    ) -> Tuple[Quiz, Participant]:

        result = await db.execute(
            select(Quiz).where(Quiz.id == quiz_id)
        )

        quiz = result.scalar_one_or_none()

        if not quiz:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Quiz not found.",
            )

        if quiz.status != "published":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This quiz has not been published.",
            )

        question_result = await db.execute(
            select(Question.id)
            .where(Question.quiz_id == quiz_id)
            .limit(1)
        )

        if question_result.scalar_one_or_none() is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This quiz has no questions available.",
            )

        participant_result = await db.execute(
            select(Participant).where(
                Participant.quiz_id == quiz_id,
                Participant.user_id == uid,
            )
        )

        participant = participant_result.scalar_one_or_none()

        if not participant:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not registered for this quiz.",
            )

        if participant.submitted:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Quiz attempt already submitted.",
            )

        now = cls.get_utc_now()
        start_time = cls.ensure_utc(quiz.quiz_start_time)

        end_time = start_time + timedelta(
            minutes=quiz.quiz_duration,
            seconds=grace_period_seconds,
        )

        if now < start_time:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Quiz has not started yet.",
            )

        if now > end_time:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Quiz time window has expired.",
            )

        return quiz, participant

    @classmethod
    async def register_participant(
        cls,
        quiz_id: int,
        uid: str,
        db: AsyncSession,
    ) -> Dict[str, Any]:

        result = await db.execute(
            select(Quiz).where(Quiz.id == quiz_id)
        )

        quiz = result.scalar_one_or_none()

        if not quiz:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Quiz not found.",
            )

        if quiz.status != "published":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This quiz is not published.",
            )

        question_result = await db.execute(
            select(Question.id)
            .where(Question.quiz_id == quiz_id)
            .limit(1)
        )

        if question_result.scalar_one_or_none() is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This quiz has no questions available.",
            )

        now = cls.get_utc_now()
        start_time = cls.ensure_utc(quiz.quiz_start_time)

        participant_result = await db.execute(
            select(Participant).where(
                Participant.quiz_id == quiz_id,
                Participant.user_id == uid,
            )
        )

        existing = participant_result.scalar_one_or_none()

        if existing:
            return {
                "message": "Already registered",
                "quiz_name": quiz.quiz_name,
                "quiz_start_time": quiz.quiz_start_time,
                "quiz_duration": quiz.quiz_duration,
                "question_count": quiz.question_count,
            }

        if now >= start_time:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Registration is closed as the quiz "
                    "has already started."
                ),
            )

        participant = Participant(
            quiz_id=quiz_id,
            user_id=uid,
            score=0.0,
            submitted=False,
        )

        db.add(participant)
        await db.commit()

        return {
            "message": "Registered successfully",
            "quiz_name": quiz.quiz_name,
            "quiz_start_time": quiz.quiz_start_time,
            "quiz_duration": quiz.quiz_duration,
            "question_count": quiz.question_count,
        }

    @classmethod
    async def get_questions_for_attempt(
        cls,
        quiz_id: int,
        uid: str,
        db: AsyncSession,
    ) -> List[Dict[str, Any]]:

        await cls._get_validated_participant_and_quiz(
            quiz_id,
            uid,
            db,
            grace_period_seconds=0,
        )

        result = await db.execute(
            select(Question)
            .where(Question.quiz_id == quiz_id)
            .order_by(Question.id)
        )

        questions = result.scalars().all()

        return [
            {
                "id": question.id,
                "question": question.question,
                "question_type": (
                    question.question_type.value
                    if hasattr(question.question_type, "value")
                    else str(question.question_type)
                ),
                "options": question.options,
            }
            for question in questions
        ]

    @classmethod
    async def get_participant_responses(
        cls,
        quiz_id: int,
        uid: str,
        db: AsyncSession,
    ) -> Dict[str, Any]:

        quiz, participant = await cls._get_validated_participant_and_quiz(
            quiz_id,
            uid,
            db,
            grace_period_seconds=SAVE_GRACE_PERIOD_SECONDS,
        )

        result = await db.execute(
            select(UserResponse).where(
                UserResponse.participant_id == participant.id
            )
        )

        responses = {
            str(response.qid): response.response
            for response in result.scalars().all()
            if (
                response.response is not None
                and response.response != "None"
            )
        }

        return {
            "responses": responses
        }

    @classmethod
    async def _save_responses_internal(
        cls,
        participant: Participant,
        responses: Dict[str, Any],
        db: AsyncSession,
    ):

        if not responses:
            return

        valid_question_result = await db.execute(
            select(Question.id).where(
                Question.quiz_id == participant.quiz_id
            )
        )

        valid_question_ids = set(
            valid_question_result.scalars().all()
        )

        existing_result = await db.execute(
            select(UserResponse).where(
                UserResponse.participant_id == participant.id
            )
        )

        existing_responses = {
            response.qid: response
            for response in existing_result.scalars().all()
        }

        for question_id_str, response_value in responses.items():

            if not str(question_id_str).isdigit():
                continue

            question_id = int(question_id_str)

            if question_id not in valid_question_ids:
                continue

            response_text = str(response_value)

            if question_id in existing_responses:
                existing_responses[question_id].response = response_text
            else:
                db.add(
                    UserResponse(
                        participant_id=participant.id,
                        qid=question_id,
                        response=response_text,
                    )
                )

    @classmethod
    async def save_responses(
        cls,
        quiz_id: int,
        uid: str,
        responses: Dict[str, Any],
        db: AsyncSession,
        grace_period_seconds: int = SAVE_GRACE_PERIOD_SECONDS,
    ) -> Dict[str, str]:

        quiz, participant = await cls._get_validated_participant_and_quiz(
            quiz_id,
            uid,
            db,
            grace_period_seconds=grace_period_seconds,
        )

        await cls._save_responses_internal(
            participant,
            responses,
            db,
        )

        await db.commit()

        return {
            "status": "saved"
        }

    @staticmethod
    def _score_question(
        question: Question,
        user_response: Any,
    ) -> float:

        if user_response is None:
            return 0.0

        user_text = str(user_response).strip()
        correct_text = str(question.correct_answer).strip()

        question_type = (
            question.question_type.value
            if hasattr(question.question_type, "value")
            else str(question.question_type)
        )

        if question_type.lower() == "mcq":
            user_set = {
                value.strip().lower()
                for value in user_text.split(",")
                if value.strip()
            }

            correct_set = {
                value.strip().lower()
                for value in correct_text.split(",")
                if value.strip()
            }

            return 1.0 if user_set == correct_set else 0.0

        return (
            1.0
            if user_text.lower() == correct_text.lower()
            else 0.0
        )

    @classmethod
    async def submit_quiz(
        cls,
        quiz_id: int,
        uid: str,
        responses: Dict[str, Any],
        db: AsyncSession,
    ) -> Dict[str, Any]:

        quiz, participant = await cls._get_validated_participant_and_quiz(
            quiz_id,
            uid,
            db,
            grace_period_seconds=SUBMIT_GRACE_PERIOD_SECONDS,
        )

        await cls._save_responses_internal(
            participant,
            responses,
            db,
        )

        participant.submitted = True
        participant.submitted_at = cls.get_utc_now()

        result = await db.execute(
            select(Question)
            .where(Question.quiz_id == quiz_id)
            .order_by(Question.id)
        )

        questions = result.scalars().all()

        total_score = sum(
            cls._score_question(
                question,
                responses.get(str(question.id)),
            )
            for question in questions
        )

        participant.score = total_score

        await db.commit()

        return {
            "message": "Submitted successfully",
            "score": total_score,
            "total_questions": len(questions),
        }
