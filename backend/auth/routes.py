# backend/auth/routes.py
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.errors import DuplicateKeyError

from ..core.config import settings
from ..persistence.crud import (
    create_pending_user,
    get_user_by_email,
    increment_otp_attempts,
    mark_user_verified,
    update_user_last_login,
    update_user_otp,
)
from ..schemas.auth import (
    LoginRequest,
    RegisterRequest,
    RegisterResponse,
    ResendOtpRequest,
    TokenResponse,
    UserResponse,
    VerifyOtpRequest,
)
from .dependencies import get_current_user
from .email import send_otp_email
from .otp import generate_otp, hash_otp, verify_otp
from .passwords import hash_password, verify_password
from .tokens import create_access_token


router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=RegisterResponse, status_code=201)
def register(payload: RegisterRequest) -> RegisterResponse:
    existing = get_user_by_email(payload.email)

    if existing is not None and existing.get("is_verified"):
        raise HTTPException(status_code=409, detail="Email already registered.")

    otp = generate_otp()
    otp_hash = hash_otp(otp)
    password_hash = hash_password(payload.password)

    if existing is not None:
        # Pending user re-registering: refresh OTP only
        update_user_otp(existing["user_id"], otp_hash)
    else:
        try:
            create_pending_user(payload.email, password_hash, otp_hash)
        except DuplicateKeyError:
            raise HTTPException(status_code=409, detail="Email already registered.")

    try:
        send_otp_email(payload.email, otp)
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    return RegisterResponse(email=payload.email)


@router.post("/verify-otp", response_model=TokenResponse)
def verify_otp_endpoint(payload: VerifyOtpRequest) -> TokenResponse:
    user = get_user_by_email(payload.email)
    if user is None:
        raise HTTPException(
            status_code=404, detail="No pending registration for this email."
        )

    if user.get("is_verified"):
        raise HTTPException(
            status_code=409, detail="Email already verified. Please log in."
        )

    otp_hash = user.get("otp_hash")
    expires_at = user.get("otp_expires_at")
    attempts = user.get("otp_attempts", 0)

    if not otp_hash or expires_at is None:
        raise HTTPException(
            status_code=410, detail="OTP expired. Please request a new one."
        )

    if datetime.utcnow() > expires_at:
        raise HTTPException(
            status_code=410, detail="OTP expired. Please request a new one."
        )

    if attempts >= settings.OTP_MAX_ATTEMPTS:
        raise HTTPException(
            status_code=429, detail="Too many attempts. Request a new OTP."
        )

    if not verify_otp(payload.otp, otp_hash):
        new_attempts = increment_otp_attempts(user["user_id"])
        remaining = settings.OTP_MAX_ATTEMPTS - new_attempts
        if remaining <= 0:
            raise HTTPException(
                status_code=429, detail="Too many attempts. Request a new OTP."
            )
        raise HTTPException(
            status_code=401,
            detail=f"Invalid OTP. {remaining} attempts remaining.",
        )

    mark_user_verified(user["user_id"])
    token = create_access_token(user_id=user["user_id"], email=user["email"])
    return TokenResponse(user_id=user["user_id"], email=user["email"], token=token)


@router.post("/resend-otp", response_model=RegisterResponse)
def resend_otp(payload: ResendOtpRequest) -> RegisterResponse:
    user = get_user_by_email(payload.email)

    # Do not reveal whether the email exists
    if user is None or user.get("is_verified"):
        return RegisterResponse(
            email=payload.email,
            message="If pending, a new code was sent.",
        )

    last_sent = user.get("last_otp_sent_at")
    if last_sent is not None:
        elapsed = (datetime.utcnow() - last_sent).total_seconds()
        if elapsed < settings.OTP_RESEND_COOLDOWN_SECONDS:
            remaining = int(settings.OTP_RESEND_COOLDOWN_SECONDS - elapsed)
            raise HTTPException(
                status_code=429,
                detail=f"Please wait {remaining} seconds before requesting a new OTP.",
            )

    otp = generate_otp()
    update_user_otp(user["user_id"], hash_otp(otp))

    try:
        send_otp_email(payload.email, otp)
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    return RegisterResponse(email=payload.email)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest) -> TokenResponse:
    user = get_user_by_email(payload.email)
    if user is None or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    if not user.get("is_verified"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified. Please verify your email first.",
        )

    update_user_last_login(user["user_id"])
    token = create_access_token(user_id=user["user_id"], email=user["email"])
    return TokenResponse(user_id=user["user_id"], email=user["email"], token=token)


@router.get("/me", response_model=UserResponse)
def me(current_user: dict = Depends(get_current_user)) -> UserResponse:
    return UserResponse(
        user_id=current_user["user_id"],
        email=current_user["email"],
        created_at=current_user["created_at"],
        is_verified=current_user.get("is_verified", False),
    )