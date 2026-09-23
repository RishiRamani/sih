# backend/api/findings.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from ..auth.dependencies import get_current_user
from ..intelligence.evaluator import assess_findings
from ..persistence.crud import get_scan, update_scan
from ..schemas.finding import Finding


router = APIRouter(prefix="/scans", tags=["Findings"])


class FindingAssumptionsPatch(BaseModel):
    data_lifetime_years: float | None = None
    business_criticality: str | None = None


@router.get("/{scan_id}/findings", response_model=list[Finding])
def get_findings(
    scan_id: str,
    current_user: dict = Depends(get_current_user),
) -> list[Finding]:
    """Return normalized findings for a stored scan."""
    result = get_scan(scan_id, owner_id=current_user["user_id"])
    if result is None:
        raise HTTPException(status_code=404, detail=f"Scan not found: {scan_id}")
    return result.findings


@router.patch("/{scan_id}/findings/{finding_index}", response_model=Finding)
def update_finding_assumptions(
    scan_id: str,
    finding_index: int,
    patch: FindingAssumptionsPatch,
    current_user: dict = Depends(get_current_user),
) -> Finding:
    result = get_scan(scan_id, owner_id=current_user["user_id"])
    if result is None or finding_index < 0 or finding_index >= len(result.findings):
        raise HTTPException(status_code=404, detail="Finding not found")

    finding = result.findings[finding_index]
    if patch.data_lifetime_years is not None:
        finding.metadata["data_lifetime_years"] = patch.data_lifetime_years
    if patch.business_criticality is not None:
        finding.metadata["business_criticality"] = patch.business_criticality

    result.intelligence = assess_findings(
        result.findings,
        business_criticality=patch.business_criticality or result.business_criticality,
        data_lifetime_years=patch.data_lifetime_years or result.data_lifetime_years,
        migration_time_years=result.migration_time_years,
        crqc_arrival_years=result.crqc_arrival_years,
    )
    update_scan(result)
    return finding