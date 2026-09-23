# backend/persistence/crud.py
from ..schemas.scan import ScanResult
from .repositories import scan_repository, user_repository


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

def create_user(email: str, password_hash: str) -> dict:
    return user_repository.create(email=email, password_hash=password_hash)


def get_user_by_id(user_id: str) -> dict | None:
    return user_repository.get_by_id(user_id)


def get_user_by_email(email: str) -> dict | None:
    return user_repository.get_by_email(email)


def update_user_last_login(user_id: str) -> None:
    user_repository.update_last_login(user_id)