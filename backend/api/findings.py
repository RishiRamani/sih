from fastapi import APIRouter, HTTPException

from ..persistence.crud import get_scan
from ..schemas.finding import Finding


router = APIRouter(
    prefix="/scans",
    tags=["Findings"],
)


@router.get(
    "/{scan_id}/findings",
    response_model=list[Finding],
)
def get_findings(scan_id: str) -> list[Finding]:
    """
    Return normalized findings for a stored scan.
    """

    result = get_scan(scan_id)

    if result is None:
        raise HTTPException(
            status_code=404,
            detail=f"Scan not found: {scan_id}",
        )

    return result.findings