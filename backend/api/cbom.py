# backend/api/cbom.py
from fastapi import APIRouter, Depends, HTTPException

from ..auth.dependencies import get_current_user
from ..persistence.crud import get_scan
from ..schemas.cbom import CBOM


router = APIRouter(prefix="/scans", tags=["CBOM"])


@router.get("/{scan_id}/cbom", response_model=CBOM)
def get_cbom(
    scan_id: str,
    current_user: dict = Depends(get_current_user),
) -> CBOM:
    """Return the CycloneDX CBOM for a stored scan."""
    result = get_scan(scan_id, owner_id=current_user["user_id"])
    if result is None:
        raise HTTPException(status_code=404, detail=f"Scan not found: {scan_id}")

    if result.cbom is None:
        raise HTTPException(status_code=404, detail=f"CBOM not available for scan: {scan_id}")

    return result.cbom