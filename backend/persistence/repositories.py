from datetime import datetime
from pathlib import Path
from uuid import uuid4

from ..schemas.scan import ScanResult
from ..scanners.source.file_enumerator import enumerate_source_files
from .database import get_connection


class ScanRepository:
    """
    Persistence operations for scan results.
    """

    def create(self, result: ScanResult) -> ScanResult:
        """
        Persist a completed scan and assign a scan ID if needed.
        """

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

        result_json = result.model_dump_json()

        with get_connection() as connection:
            connection.execute(
                """
                INSERT OR REPLACE INTO scans (
                    scan_id,
                    target_path,
                    status,
                    result_json,
                    created_at
                )
                VALUES (?, ?, ?, ?, ?)
                """,
                (
                    scan_id,
                    result.target_path,
                    result.status.value,
                    result_json,
                    created_at.isoformat(),
                ),
            )

            connection.commit()

        return result

    def get(self, scan_id: str) -> ScanResult | None:
        """
        Retrieve a scan by ID.
        """

        with get_connection() as connection:
            row = connection.execute(
                """
                SELECT result_json, created_at
                FROM scans
                WHERE scan_id = ?
                """,
                (scan_id,),
            ).fetchone()

        if row is None:
            return None

        result = _attach_persisted_timestamp(
            ScanResult.model_validate_json(row["result_json"]),
            row["created_at"],
        )
        return _repair_legacy_coverage(result)

    def update(self, result: ScanResult) -> ScanResult:
        if not result.scan_id:
            raise ValueError("Cannot update a scan without a scan ID")
        with get_connection() as connection:
            cursor = connection.execute(
                "UPDATE scans SET result_json = ?, status = ? WHERE scan_id = ?",
                (result.model_dump_json(), result.status.value, result.scan_id),
            )
            connection.commit()
        if cursor.rowcount == 0:
            raise KeyError(result.scan_id)
        return result

    def list(self) -> list[ScanResult]:
        """
        Retrieve all scans, newest first.
        """

        with get_connection() as connection:
            rows = connection.execute(
                """
                SELECT result_json, created_at
                FROM scans
                ORDER BY created_at DESC
                """
            ).fetchall()

        return [
            _repair_legacy_coverage(
                _attach_persisted_timestamp(
                    ScanResult.model_validate_json(row["result_json"]),
                    row["created_at"],
                )
            )
            for row in rows
        ]

    def delete(self, scan_id: str) -> bool:
        """
        Delete a stored scan.
        """

        with get_connection() as connection:
            cursor = connection.execute(
                """
                DELETE FROM scans
                WHERE scan_id = ?
                """,
                (scan_id,),
            )

            connection.commit()

        return cursor.rowcount > 0


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


def _attach_persisted_timestamp(result: ScanResult, created_at: str) -> ScanResult:
    """Expose the database creation time for legacy JSON scan results."""
    if result.started_at is None:
        result.started_at = datetime.fromisoformat(created_at)
    if result.completed_at is None and result.status.value == "completed":
        result.completed_at = result.started_at
    return result