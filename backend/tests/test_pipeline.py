from pathlib import Path

from backend.orchestration.pipeline import ScanPipeline
from backend.scanners.base import BaseScanner
from backend.schemas.finding import Finding


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

    result = pipeline.run(Path("demo.py"))

    assert len(result.findings) == 1
    assert result.findings[0].algorithm == "RSA"
    assert result.findings[0].key_size == 2048


def test_pipeline_makes_absolute_finding_paths_relative(tmp_path):
    target = tmp_path / "repo"
    target.mkdir()

    class AbsolutePathScanner(FakeScanner):
        def scan(self, target: Path) -> list[Finding]:
            findings = super().scan(target)
            findings[0].asset_path = str(target / "src" / "crypto.py")
            return findings

    result = ScanPipeline([AbsolutePathScanner()]).run(target)

    assert result.findings[0].asset_path == "src/crypto.py"