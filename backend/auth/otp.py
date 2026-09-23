# backend/auth/otp.py
import secrets

from ..core.config import settings
from .passwords import hash_password, verify_password


def generate_otp() -> str:
    """Generate a numeric OTP of configured length."""
    return "".join(secrets.choice("0123456789") for _ in range(settings.OTP_LENGTH))


def hash_otp(otp: str) -> str:
    return hash_password(otp)


def verify_otp(otp: str, otp_hash: str) -> bool:
    return verify_password(otp, otp_hash)