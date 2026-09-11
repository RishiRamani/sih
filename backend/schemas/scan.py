from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field

from .cbom import CBOM
from .finding import Finding


class ScanStatus(str, Enum):
    CREATED = "created"
    QUEUED = "queued"
    DISCOVERING = "discovering"
    ANALYSING = "analysing"
    NORMALIZING = "normalizing"
    BUILDING_CBOM = "building_cbom"
    ASSESSING_RISK = "assessing_risk"
    GENERATING_RECOMMENDATIONS = "generating_recommendations"
    COMPLETED = "completed"
    FAILED = "failed"


class ScanRequest(BaseModel):
    """Request to start an ECDAT scan."""

    target_path: str


class ScanResult(BaseModel):
    """Complete result produced by an ECDAT scan."""

    model_config = ConfigDict(extra="allow")

    scan_id: str | None = None

    status: ScanStatus = ScanStatus.COMPLETED

    target_path: str

    findings: list[Finding] = Field(
        default_factory=list,
    )

    cbom: CBOM | None = None

    total_findings: int = 0

    started_at: datetime | None = None
    completed_at: datetime | None = None

    error: str | None = None