from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.dependencies import get_current_uid
from app.models.user_responses import UserResponse
from app.models.participants import Participant
from app.schemas.user_responses import (
    UserResponseCreate, UserResponseUpdate, UserResponseDelete, UserResponseResponse
)

router = APIRouter()

async def verify_participant_owner(participant_id: int, uid: str, db: AsyncSession) -> Participant:
    from datetime import datetime, timezone, timedelta
    from app.models.quizes import Quiz

    result = await db.execute(select(Participant).where(Participant.id == participant_id))
    participant = result.scalar_one_or_none()
    if not participant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Participant not found")
    if participant.user_id != uid:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized for this attempt")
    if participant.submitted:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Quiz attempt already submitted")

    q_result = await db.execute(select(Quiz).where(Quiz.id == participant.quiz_id))
    quiz = q_result.scalar_one_or_none()
    if quiz:
        now = datetime.now(timezone.utc)
        start_time = quiz.quiz_start_time.replace(tzinfo=timezone.utc) if quiz.quiz_start_time.tzinfo is None else quiz.quiz_start_time.astimezone(timezone.utc)
        end_time = start_time + timedelta(minutes=quiz.quiz_duration, seconds=30)
        if now < start_time:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Quiz has not started yet")
        if now > end_time:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Quiz time window has expired")

    return participant

@router.post("/create", response_model=UserResponseResponse)
async def create_user_response(
    user_response: UserResponseCreate,
    uid: str = Depends(get_current_uid),
    db: AsyncSession = Depends(get_db)
):
    await verify_participant_owner(user_response.participant_id, uid, db)
    new_user_response = UserResponse(
        participant_id=user_response.participant_id,
        qid=user_response.question_id,
        response=user_response.response,
    )
    db.add(new_user_response)
    await db.commit()
    await db.refresh(new_user_response)
    return new_user_response

@router.put("/update", response_model=UserResponseResponse)
async def update_user_response(
    user_response: UserResponseUpdate,
    uid: str = Depends(get_current_uid),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(UserResponse).where(UserResponse.id == user_response.response_id)
    )
    resp_obj = result.scalar_one_or_none()
    if not resp_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User response not found")
    
    await verify_participant_owner(resp_obj.participant_id, uid, db)

    resp_obj.response = user_response.response
    await db.commit()
    await db.refresh(resp_obj)
    return resp_obj

@router.delete("/delete")
async def delete_user_response(
    user_response: UserResponseDelete,
    uid: str = Depends(get_current_uid),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(UserResponse).where(UserResponse.id == user_response.response_id)
    )
    resp_obj = result.scalar_one_or_none()
    if not resp_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User response not found")
    
    await verify_participant_owner(resp_obj.participant_id, uid, db)

    await db.delete(resp_obj)
    await db.commit()
    return {"message": "Response deleted successfully"}
