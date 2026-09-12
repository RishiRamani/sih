from datetime import datetime
from enum import Enum
from .intelligence import IntelligenceAssessment
from typing import Literal
from .cbom import CBOM
from .finding import Finding

from pydantic import BaseModel, ConfigDict, Field, model_validator


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

    source_type: Literal["local", "git"] = "local"
    source: str | None = None
    target_path: str | None = None

    @model_validator(mode="after")
    def validate_source(self) -> "ScanRequest":
        if self.source is None and self.target_path is None:
            raise ValueError(
                "Either 'source' or 'target_path' must be provided."
            )

        if self.source is not None and self.target_path is not None:
            raise ValueError(
                "Provide either 'source' or 'target_path', not both."
            )

        return self

class ScanResult(BaseModel):
    """Complete result produced by an ECDAT scan."""

    model_config = ConfigDict(extra="allow")

    scan_id: str | None = None

    status: ScanStatus = ScanStatus.COMPLETED

    target_path: str

    findings: list[Finding] = Field(
        default_factory=list,
    )

    intelligence: list[IntelligenceAssessment] = Field(default_factory=list)

    cbom: CBOM | None = None

    total_findings: int = 0

    started_at: datetime | None = None
    completed_at: datetime | None = None
    
    error: str | None = None