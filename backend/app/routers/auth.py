# backend/app/routers/auth.py
import uuid
import string
import random
from typing import Dict, Any
from fastapi import APIRouter, Depends, Request, Response, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.config import settings
from app.authentication_helper import get_password_hash, verify_password, create_access_token
from app.models.users import User
from app.schemas.auth import UserCreate, UserLogin, UserResponse

router = APIRouter()

@router.post("/register")
async def register_user(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).filter(User.email == user_data.email))
    existing_user = result.scalars().first()
    
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered.")

    hashed_password = get_password_hash(user_data.password)
    uid = str(uuid.uuid4())
    user_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=10))

    new_user = User(
        uid=uid,
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_password,
        user_code=user_code,
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    return {
        "message": "User registered successfully, login to continue",
        "user_code": user_code
    }

@router.post("/login")
async def login(response: Response, credentials: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).filter(User.email == credentials.email))
    user = result.scalars().first()
    
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token(uid=user.uid)
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
        samesite="lax",
        secure=False,
    )
    return {
        "message": "Login successful",
        "email": user.email,
        "username": user.username
    }

@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("access_token")
    return {"message": "Logout successful"}

@router.get("/me", response_model=UserResponse)
async def read_users_me(request: Request, db: AsyncSession = Depends(get_db)):
    uid = getattr(request.state, "uid", None)
    if not uid:
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    result = await db.execute(select(User).filter(User.uid == uid))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    return user