# backend/app/schemas/auth.py
from pydantic import BaseModel, ConfigDict

class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    username: str
    email: str | None = None
    user_code: str | None = None

    model_config = ConfigDict(from_attributes=True)

class UserInDB(UserResponse):
    hashed_password: str

class TokenData(BaseModel):
    uid: str | None = None
