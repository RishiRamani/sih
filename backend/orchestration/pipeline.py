from pathlib import Path

from ..cbom.generator import generate_cbom
from ..normalization.normalizer import normalize_findings
from ..schemas.finding import Finding
from ..schemas.scan import ScanResult, ScanStatus
from ..scanners.base import BaseScanner
from ..intelligence.evaluator import assess_findings


def _make_finding_paths_relative(findings: list[Finding], target: Path) -> None:
    """Remove the local acquisition root from filesystem finding paths."""
    root = target.resolve()

    for finding in findings:
        path = Path(finding.asset_path)
        if not path.is_absolute():
            continue

        try:
            finding.asset_path = path.resolve().relative_to(root).as_posix()
        except ValueError:
            # Some scanners report paths from another namespace, such as a
            # path inside a container archive. Preserve those paths.
            continue


class ScanPipeline:
    """
    Coordinates scanner execution and normalization.
    """

    def __init__(self, scanners: list[BaseScanner]) -> None:
        self.scanners = scanners

    def run(
        self,
        target: Path,
        application_name_override: str | None = None,
    ) -> ScanResult:
        raw_findings: list[Finding] = []

        for scanner in self.scanners:
            if not scanner.can_scan(target):
                continue

            try:
                scanner_findings = scanner.scan(target)
                raw_findings.extend(scanner_findings)

            except Exception as exc:
                print(
                    f"[WARN] Scanner '{scanner.name}' failed: "
                    f"{type(exc).__name__}: {exc}"
                )

        _make_finding_paths_relative(raw_findings, target)
        findings = normalize_findings(raw_findings)

        intelligence = assess_findings(findings)

        cbom = generate_cbom(
            findings,
            application_name_override=application_name_override,
        )

        return ScanResult(
            target_path=str(target),
            status=ScanStatus.COMPLETED,
            findings=findings,
            intelligence=intelligence,
            cbom=cbom,
            total_findings=len(findings),
        )