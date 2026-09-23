# backend/api/risk.py
from fastapi import APIRouter, Depends, HTTPException

from ..auth.dependencies import get_current_user
from ..persistence.crud import get_scan
from ..schemas.intelligence import IntelligenceAssessment


router = APIRouter(prefix="/scans", tags=["Risk"])


@router.get("/{scan_id}/risk", response_model=list[IntelligenceAssessment])
def get_risk(
    scan_id: str,
    current_user: dict = Depends(get_current_user),
) -> list[IntelligenceAssessment]:
    """Return intelligence/risk assessments for a stored scan."""
    result = get_scan(scan_id, owner_id=current_user["user_id"])
    if result is None:
        raise HTTPException(status_code=404, detail=f"Scan not found: {scan_id}")
    return result.intelligence