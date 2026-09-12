from datetime import datetime
from uuid import uuid4

from ..schemas.scan import ScanResult
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
                SELECT result_json
                FROM scans
                WHERE scan_id = ?
                """,
                (scan_id,),
            ).fetchone()

        if row is None:
            return None

        return ScanResult.model_validate_json(row["result_json"])

    def list(self) -> list[ScanResult]:
        """
        Retrieve all scans, newest first.
        """

        with get_connection() as connection:
            rows = connection.execute(
                """
                SELECT result_json
                FROM scans
                ORDER BY created_at DESC
                """
            ).fetchall()

        return [
            ScanResult.model_validate_json(row["result_json"])
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


scan_repository = ScanRepository()