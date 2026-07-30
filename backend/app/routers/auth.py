from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from app.config import settings
from app.core.security import verify_password, get_password_hash, create_access_token

router = APIRouter()

class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest):
    admin_user = settings.ADMIN_USERNAME
    admin_pass = settings.ADMIN_PASSWORD

    # Password verified using passlib bcrypt context
    hashed_admin_pass = get_password_hash(admin_pass)

    if payload.username != admin_user or not verify_password(payload.password, hashed_admin_pass):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin username or password",
        )

    token = create_access_token(data={"sub": payload.username, "role": "admin"})
    return {"access_token": token, "token_type": "bearer"}

