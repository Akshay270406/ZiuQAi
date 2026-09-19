# backend/app/core/middleware.py
from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from app.database import AsyncSessionLocal
from app.authentication_helper import decode_access_token
from app.models.users import User
from sqlalchemy import select

EXCLUDED_PATH_PREFIXES = (
    "/auth/register",
    "/auth/login",
    "/docs",
    "/openapi.json",
    "/favicon.ico"
)

EXCLUDED_EXACT_PATHS = {
    "/",
    "/auth/logout"
}

class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        if (
            request.method == "OPTIONS"
            or path in EXCLUDED_EXACT_PATHS
            or any(path.startswith(prefix) for prefix in EXCLUDED_PATH_PREFIXES)
        ):
            return await call_next(request)

        auth_token = request.cookies.get("access_token")
        if not auth_token:
            auth_header = request.headers.get("Authorization")
            if auth_header and auth_header.startswith("Bearer "):
                auth_token = auth_header.split(" ")[1]

        if not auth_token:
            return JSONResponse(
                status_code=401,
                content={"detail": "Authentication token missing"}
            )

        uid = decode_access_token(auth_token)
        if not uid:
            return JSONResponse(
                status_code=401,
                content={"detail": "Invalid authentication token"}
            )

        async with AsyncSessionLocal() as db:
            result = await db.execute(select(User).where(User.uid == uid))
            user = result.scalar_one_or_none()
            if not user:
                return JSONResponse(
                    status_code=401,
                    content={"detail": "User not found"}
                )
            request.state.uid = user.uid

        return await call_next(request)
