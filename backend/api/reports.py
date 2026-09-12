from fastapi import APIRouter, HTTPException

from ..persistence.crud import get_scan
from ..schemas.scan import ScanResult


router = APIRouter(
    prefix="/scans",
    tags=["Reports"],
)


@router.get(
    "/{scan_id}/report",
    response_model=ScanResult,
)
def get_report(scan_id: str) -> ScanResult:
    """
    Return the complete persisted scan result as the ECDAT report.
    """

    result = get_scan(scan_id)

    if result is None:
        raise HTTPException(
            status_code=404,
            detail=f"Scan not found: {scan_id}",
        )

    return result