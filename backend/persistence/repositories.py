# backend/persistence/repositories.py
from datetime import datetime, timedelta
from pathlib import Path
from uuid import uuid4

from ..core.config import settings
from ..schemas.scan import ScanResult
from ..scanners.source.file_enumerator import enumerate_source_files
from .database import get_collection, get_users_collection


# ----------------------------------------------------------------------
# Users
# ----------------------------------------------------------------------

class UserRepository:
    """Persistence operations for user accounts."""

    def create_pending(
        self,
        email: str,
        password_hash: str,
        otp_hash: str,
    ) -> dict:
        """Create a pending (unverified) user with an OTP attached."""
        user_id = f"usr_{uuid4().hex[:12]}"
        now = datetime.utcnow()

        document = {
            "user_id": user_id,
            "email": email,
            "email_lower": email.lower(),
            "password_hash": password_hash,
            "is_verified": False,
            "otp_hash": otp_hash,
            "otp_expires_at": now + timedelta(minutes=settings.OTP_EXPIRE_MINUTES),
            "otp_attempts": 0,
            "last_otp_sent_at": now,
            "created_at": now,
            "last_login_at": None,
        }

        get_users_collection().insert_one(document)
        return document

    def get_by_id(self, user_id: str) -> dict | None:
        return get_users_collection().find_one({"user_id": user_id}, {"_id": 0})

    def get_by_email(self, email: str) -> dict | None:
        return get_users_collection().find_one(
            {"email_lower": email.lower()}, {"_id": 0}
        )

    def update_otp(self, user_id: str, otp_hash: str) -> None:
        now = datetime.utcnow()
        get_users_collection().update_one(
            {"user_id": user_id},
            {
                "$set": {
                    "otp_hash": otp_hash,
                    "otp_expires_at": now
                    + timedelta(minutes=settings.OTP_EXPIRE_MINUTES),
                    "otp_attempts": 0,
                    "last_otp_sent_at": now,
                }
            },
        )

    def increment_otp_attempts(self, user_id: str) -> int:
        result = get_users_collection().find_one_and_update(
            {"user_id": user_id},
            {"$inc": {"otp_attempts": 1}},
            projection={"otp_attempts": 1, "_id": 0},
            return_document=True,
        )
        return result["otp_attempts"] if result else 0

    def mark_verified(self, user_id: str) -> None:
        get_users_collection().update_one(
            {"user_id": user_id},
            {
                "$set": {
                    "is_verified": True,
                    "last_login_at": datetime.utcnow(),
                },
                "$unset": {
                    "otp_hash": "",
                    "otp_expires_at": "",
                    "otp_attempts": "",
                },
            },
        )

    def update_last_login(self, user_id: str) -> None:
        get_users_collection().update_one(
            {"user_id": user_id},
            {"$set": {"last_login_at": datetime.utcnow()}},
        )


user_repository = UserRepository()


# ----------------------------------------------------------------------
# Scans
# ----------------------------------------------------------------------

class ScanRepository:
    """Persistence operations for scan results."""

    def create(self, result: ScanResult, owner_id: str) -> ScanResult:
        scan_id = result.scan_id or str(uuid4())
        result.scan_id = scan_id

        created_at = (
            result.completed_at or result.started_at or datetime.now()
        )
        if result.started_at is None:
            result.started_at = created_at
        if result.completed_at is None and result.status.value == "completed":
            result.completed_at = created_at

        document = {
            "scan_id": scan_id,
            "owner_id": owner_id,
            "target_path": result.target_path,
            "status": result.status.value,
            "created_at": created_at,
            "result_json": result.model_dump(mode="json"),
        }

        get_collection().replace_one(
            {"scan_id": scan_id}, document, upsert=True
        )
        return result

    def get(self, scan_id: str, owner_id: str | None = None) -> ScanResult | None:
        query: dict = {"scan_id": scan_id}
        if owner_id is not None:
            query["owner_id"] = owner_id

        row = get_collection().find_one(query, {"_id": 0})
        if row is None:
            return None

        result = _attach_persisted_timestamp(
            ScanResult.model_validate(row["result_json"]),
            row["created_at"],
        )
        return _repair_legacy_coverage(result)

    def update(self, result: ScanResult) -> ScanResult:
        if not result.scan_id:
            raise ValueError("Cannot update a scan without a scan ID")

        outcome = get_collection().update_one(
            {"scan_id": result.scan_id},
            {
                "$set": {
                    "result_json": result.model_dump(mode="json"),
                    "status": result.status.value,
                }
            },
        )

        if outcome.matched_count == 0:
            raise KeyError(result.scan_id)

        return result

    def list(self, owner_id: str) -> list[ScanResult]:
        cursor = (
            get_collection()
            .find({"owner_id": owner_id}, {"_id": 0})
            .sort("created_at", -1)
        )

        return [
            _repair_legacy_coverage(
                _attach_persisted_timestamp(
                    ScanResult.model_validate(row["result_json"]),
                    row["created_at"],
                )
            )
            for row in cursor
        ]

    def delete(self, scan_id: str, owner_id: str | None = None) -> bool:
        query: dict = {"scan_id": scan_id}
        if owner_id is not None:
            query["owner_id"] = owner_id
        outcome = get_collection().delete_one(query)
        return outcome.deleted_count > 0


scan_repository = ScanRepository()


# ----------------------------------------------------------------------
# Helpers
# ----------------------------------------------------------------------

def _repair_legacy_coverage(result: ScanResult) -> ScanResult:
    coverage = result.coverage
    target = Path(result.target_path)
    if not target.exists():
        return result

    if target.is_file():
        coverage.files_total = 1
        coverage.files_scanned = 1
        return result

    supported, unsupported, _oversize = enumerate_source_files(str(target))
    total_files = sum(1 for path in target.rglob("*") if path.is_file())
    coverage.files_scanned = len(supported)
    coverage.files_total = total_files
    coverage.unsupported_files = len(unsupported)
    coverage.skipped_files = max(0, total_files - len(supported) - len(unsupported))
    return result


def _attach_persisted_timestamp(
    result: ScanResult,
    created_at: datetime,
) -> ScanResult:
    if result.started_at is None:
        result.started_at = created_at
    if result.completed_at is None and result.status.value == "completed":
        result.completed_at = result.started_at
    return result