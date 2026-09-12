from pathlib import Path

from backend.orchestration.pipeline import ScanPipeline
from backend.scanners.source.source_scanner import scan_source
from backend.schemas.finding import Finding
from backend.intelligence.evaluator import assess_findings


class SourceScannerAdapter:
    """Adapt the existing source scanner to the ScanPipeline interface."""

    @property
    def name(self) -> str:
        return "Source Scanner"

    def can_scan(self, target: Path) -> bool:
        return target.is_dir()

    def scan(self, target: Path) -> list[Finding]:
        findings, _ = scan_source(str(target))
        return findings


def test_pipeline_generates_intelligence_from_normalized_findings() -> None:
    target = Path("backend/data/demo/source/sample_repo")

    pipeline = ScanPipeline(
        scanners=[SourceScannerAdapter()]
    )

    result = pipeline.run(target)

    assert result.findings
    assert result.intelligence

    # There should be one intelligence assessment per normalized finding.
    assert len(result.intelligence) == len(result.findings)

    for index, assessment in enumerate(result.intelligence):
        finding = result.findings[index]

        assert assessment.finding_index == index
        assert assessment.algorithm == finding.algorithm
        assert assessment.primitive_type == finding.primitive_type
        assert assessment.risk_assessment is not None
        assert assessment.recommendation is not None


def test_pipeline_intelligence_handles_known_and_unknown_algorithms() -> None:
    target = Path("backend/data/demo/source/sample_repo")

    pipeline = ScanPipeline(
        scanners=[SourceScannerAdapter()]
    )

    result = pipeline.run(target)

    algorithms = {
        finding.algorithm
        for finding in result.findings
        if finding.algorithm
    }

    assert "RSA" in algorithms
    assert "AES" in algorithms

    rsa_assessments = [
        assessment
        for assessment in result.intelligence
        if assessment.algorithm == "RSA"
    ]

    assert rsa_assessments

    for assessment in rsa_assessments:
        assert "quantum_status" in assessment.risk_assessment.quantum
        assert "classical_status" in assessment.risk_assessment.classical
        assert "risk_score" in assessment.risk_assessment.risk