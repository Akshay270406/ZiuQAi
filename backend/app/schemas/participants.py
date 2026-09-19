# backend/app/schemas/participants.py
from pydantic import BaseModel

class ParticipantCreate(BaseModel):
    quiz_id: int

class ParticipantInfo(BaseModel):
    quiz_id: int
    score: float

class ParticipantDelete(BaseModel):
    quiz_id: int

class ParticipantResponse(BaseModel):
    participant_id: int
    quiz_id: int