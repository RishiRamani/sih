# backend/persistence/crud.py
from ..schemas.scan import ScanResult
from .repositories import scan_repository, user_repository
from .repositories import comparison_repository

# ---- Scans ----

def create_scan(result: ScanResult, owner_id: str) -> ScanResult:
    return scan_repository.create(result, owner_id=owner_id)


def get_scan(scan_id: str, owner_id: str | None = None) -> ScanResult | None:
    return scan_repository.get(scan_id, owner_id=owner_id)


def list_scans(owner_id: str) -> list[ScanResult]:
    return scan_repository.list(owner_id=owner_id)


def delete_scan(scan_id: str, owner_id: str | None = None) -> bool:
    return scan_repository.delete(scan_id, owner_id=owner_id)


def update_scan(result: ScanResult) -> ScanResult:
    return scan_repository.update(result)


# ---- Users ----

def create_pending_user(email: str, password_hash: str, otp_hash: str) -> dict:
    return user_repository.create_pending(email, password_hash, otp_hash)


def get_user_by_id(user_id: str) -> dict | None:
    return user_repository.get_by_id(user_id)


def get_user_by_email(email: str) -> dict | None:
    return user_repository.get_by_email(email)


def update_user_otp(user_id: str, otp_hash: str) -> None:
    user_repository.update_otp(user_id, otp_hash)


def increment_otp_attempts(user_id: str) -> int:
    return user_repository.increment_otp_attempts(user_id)


def mark_user_verified(user_id: str) -> None:
    user_repository.mark_verified(user_id)


def update_user_last_login(user_id: str) -> None:
    user_repository.update_last_login(user_id)


def upsert_comparison(owner_id: str, payload: dict) -> dict:
    return comparison_repository.upsert(owner_id, payload)


def list_comparisons(owner_id: str) -> list[dict]:
    return comparison_repository.list_for_owner(owner_id)


def list_comparisons_for_scan(owner_id: str, scan_id: str) -> list[dict]:
    return comparison_repository.list_for_scan(owner_id, scan_id)


def delete_comparison(owner_id: str, comparison_id: str) -> bool:
    return comparison_repository.delete(owner_id, comparison_id)