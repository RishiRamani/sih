from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class Finding(BaseModel):
    """
    Canonical representation of a cryptographic artefact discovered by ECDAT.

    Every scanner should emit this model.
    Downstream systems should not need to know which scanner produced it.
    """

    model_config = ConfigDict(extra="allow")

    # -------------------------
    # What was discovered
    # -------------------------

    artifact_type: str
    primitive_type: str | None = None

    algorithm: str | None = None
    variant: str | None = None
    key_size: int | None = None

    library: str | None = None
    library_version: str | None = None

    # -------------------------
    # Where it was discovered
    # -------------------------

    asset_path: str

    line_start: int | None = None
    line_end: int | None = None

    # -------------------------
    # How it was discovered
    # -------------------------

    detection_method: str
    confidence: float = Field(ge=0.0, le=1.0)

    evidence: str | None = None

    # -------------------------
    # Correlation metadata
    # -------------------------

    component_id: str | None = None
    parent_component_id: str | None = None

    # Allows scanners to attach useful
    # scanner-specific information without
    # breaking the common contract.
    metadata: dict[str, Any] = Field(default_factory=dict)