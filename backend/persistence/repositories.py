# backend/persistence/repositories.py
from datetime import datetime
from pathlib import Path
from uuid import uuid4

from ..schemas.scan import ScanResult
from ..scanners.source.file_enumerator import enumerate_source_files
from .database import get_collection


class ScanRepository:
    """
    Persistence operations for scan results.
    Backed by MongoDB; stores each ScanResult as one document.
    """

    def create(self, result: ScanResult) -> ScanResult:
        scan_id = result.scan_id or str(uuid4())
        result.scan_id = scan_id

        created_at = (
            result.completed_at
            or result.started_at
            or datetime.now()
        )
        if result.started_at is None:
            result.started_at = created_at
        if result.completed_at is None and result.status.value == "completed":
            result.completed_at = created_at

        document = {
            "scan_id": scan_id,
            "target_path": result.target_path,
            "status": result.status.value,
            "created_at": created_at,
            "result_json": result.model_dump(mode="json"),
        }

        collection = get_collection()
        collection.replace_one(
            {"scan_id": scan_id},
            document,
            upsert=True,
        )

        return result

    def get(self, scan_id: str) -> ScanResult | None:
        row = get_collection().find_one(
            {"scan_id": scan_id},
            {"_id": 0},
        )

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

        update = {
            "$set": {
                "result_json": result.model_dump(mode="json"),
                "status": result.status.value,
            }
        }

        outcome = get_collection().update_one(
            {"scan_id": result.scan_id},
            update,
        )

        if outcome.matched_count == 0:
            raise KeyError(result.scan_id)

        return result

    def list(self) -> list[ScanResult]:
        cursor = (
            get_collection()
            .find({}, {"_id": 0})
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

    def delete(self, scan_id: str) -> bool:
        outcome = get_collection().delete_one({"scan_id": scan_id})
        return outcome.deleted_count > 0


def _repair_legacy_coverage(result: ScanResult) -> ScanResult:
    """Recover coverage for scans saved before coverage was populated."""

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


scan_repository = ScanRepository()


def _attach_persisted_timestamp(
    result: ScanResult,
    created_at: datetime,
) -> ScanResult:
    """Expose the database creation time for legacy JSON scan results."""
    if result.started_at is None:
        result.started_at = created_at
    if result.completed_at is None and result.status.value == "completed":
        result.completed_at = result.started_at
    return result