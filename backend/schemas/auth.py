# backend/schemas/auth.py
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class RegisterResponse(BaseModel):
    status: str = "otp_sent"
    email: str
    message: str = "Verification code sent to email."


class VerifyOtpRequest(BaseModel):
    email: EmailStr
    otp: str = Field(min_length=4, max_length=8)


class ResendOtpRequest(BaseModel):
    email: EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    user_id: str
    email: str
    token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    user_id: str
    email: str
    created_at: datetime
    is_verified: bool