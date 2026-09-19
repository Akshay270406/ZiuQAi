# backend/app/schemas/user_responses.py
from pydantic import BaseModel

class UserResponseCreate(BaseModel):
    participant_id: int
    question_id: int
    response: str

class UserResponseUpdate(BaseModel):
    response_id: int
    response: str

class UserResponseDelete(BaseModel):
    response_id: int

class UserResponseResponse(BaseModel):
    id: int
    response: str