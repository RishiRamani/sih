from pathlib import Path

from orchestration.pipeline import ScanPipeline
from scanners.base import BaseScanner
from schemas.finding import Finding


class FakeScanner(BaseScanner):

    @property
    def name(self) -> str:
        return "fake"

    def can_scan(self, target: Path) -> bool:
        return True

    def scan(self, target: Path) -> list[Finding]:
        return [
            Finding(
                artifact_type="source",
                algorithm="RSA",
                primitive_type="digital_signature",
                variant="RSA-2048",
                key_size=2048,
                asset_path=str(target),
                detection_method="TEST",
                confidence=1.0,
                evidence="Fake RSA finding",
            )
        ]


def test_pipeline():
    pipeline = ScanPipeline([FakeScanner()])

    findings = pipeline.run(Path("demo.py"))

    assert len(findings) == 1
    assert findings[0].algorithm == "RSA"
    assert findings[0].key_size == 2048