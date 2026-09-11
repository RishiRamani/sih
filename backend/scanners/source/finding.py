from dataclasses import dataclass, asdict
from typing import Optional

PRIMITIVE_TYPES = {
    "symmetric", "asymmetric", "hash", "signature",
    "key_exchange", "protocol", "custom", "unknown",
}

ARTIFACT_TYPES = {"source", "dependency", "certificate", "binary", "container"}


@dataclass
class Finding:
    artifact_type: str
    algorithm: Optional[str]
    primitive_type: str
    variant: Optional[str]
    key_size: Optional[int]
    library: Optional[str]
    library_version: Optional[str]
    asset_path: str
    line_start: Optional[int]
    line_end: Optional[int]
    detection_method: str
    confidence: float
    evidence: Optional[str]

    def __post_init__(self):
        if self.artifact_type not in ARTIFACT_TYPES:
            raise ValueError(f"invalid artifact_type: {self.artifact_type}")
        if self.primitive_type not in PRIMITIVE_TYPES:
            raise ValueError(f"invalid primitive_type: {self.primitive_type}")
        if not (0.0 <= self.confidence <= 1.0):
            raise ValueError(f"confidence out of range: {self.confidence}")

    def to_dict(self):
        return asdict(self)

    def identity_key(self):
        """Used to de-duplicate overlapping detections of the same
        logical usage (same file, same rough location, same algorithm)."""
        return (self.asset_path, self.algorithm, self.line_start)