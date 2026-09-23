# backend/auth/routes.py
from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.errors import DuplicateKeyError

from ..persistence.crud import (
    create_user,
    get_user_by_email,
    update_user_last_login,
)
from ..schemas.auth import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)
from .dependencies import get_current_user
from .passwords import hash_password, verify_password
from .tokens import create_access_token


router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(payload: RegisterRequest) -> TokenResponse:
    existing = get_user_by_email(payload.email)
    if existing is not None:
        raise HTTPException(status_code=409, detail="Email already registered.")

    password_hash = hash_password(payload.password)

    try:
        user = create_user(email=payload.email, password_hash=password_hash)
    except DuplicateKeyError:
        raise HTTPException(status_code=409, detail="Email already registered.")

    token = create_access_token(user_id=user["user_id"], email=user["email"])
    return TokenResponse(user_id=user["user_id"], email=user["email"], token=token)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest) -> TokenResponse:
    user = get_user_by_email(payload.email)
    if user is None or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
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
    )