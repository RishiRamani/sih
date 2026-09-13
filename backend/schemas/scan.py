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
    business_criticality: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"] = "MEDIUM"
    data_lifetime_years: float = Field(default=3.0, ge=0)
    migration_time_years: float = Field(default=2.0, ge=0)
    crqc_arrival_years: float | None = Field(default=None, ge=0)

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

    business_criticality: str = "MEDIUM"
    data_lifetime_years: float = 3.0
    migration_time_years: float = 2.0
    crqc_arrival_years: float | None = None
    coverage: "ScanCoverage" = Field(default_factory=lambda: ScanCoverage())


class CoverageWarning(BaseModel):
    code: str
    message: str
    path: str | None = None


class ScanCoverage(BaseModel):
    files_scanned: int = 0
    files_total: int = 0
    unsupported_files: int = 0
    parse_errors: int = 0
    warnings: list[CoverageWarning] = Field(default_factory=list)