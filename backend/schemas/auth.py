# backend/schemas/auth.py
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    user_id: str
    email: str
    created_at: datetime


class TokenResponse(BaseModel):
    user_id: str
    email: str
    token: str
    token_type: str = "bearer"