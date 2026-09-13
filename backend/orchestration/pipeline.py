from pathlib import Path

from ..cbom.generator import generate_cbom
from ..normalization.normalizer import normalize_findings
from ..schemas.finding import Finding
from ..schemas.scan import ScanCoverage, ScanResult, ScanStatus, CoverageWarning
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
        business_criticality: str = "MEDIUM",
        data_lifetime_years: float = 3.0,
        migration_time_years: float = 2.0,
        crqc_arrival_years: float | None = None,
    ) -> ScanResult:
        raw_findings: list[Finding] = []
        warnings: list[CoverageWarning] = []
        files_total = sum(1 for path in target.rglob("*") if path.is_file()) if target.is_dir() else 1
        supported_scanners = 0

        for scanner in self.scanners:
            if not scanner.can_scan(target):
                continue
            supported_scanners += 1

            try:
                scanner_findings = scanner.scan(target)
                raw_findings.extend(scanner_findings)

            except Exception as exc:
                warnings.append(
                    CoverageWarning(
                        code="SCANNER_FAILED",
                        message=f"{scanner.name} failed: {type(exc).__name__}: {exc}",
                    )
                )

        _make_finding_paths_relative(raw_findings, target)
        findings = normalize_findings(raw_findings)

        intelligence = assess_findings(
            findings,
            business_criticality=business_criticality,
            data_lifetime_years=data_lifetime_years,
            migration_time_years=migration_time_years,
            crqc_arrival_years=crqc_arrival_years,
        )

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
            business_criticality=business_criticality,
            data_lifetime_years=data_lifetime_years,
            migration_time_years=migration_time_years,
            crqc_arrival_years=crqc_arrival_years,
            coverage=ScanCoverage(
                files_total=files_total,
                files_scanned=files_total if supported_scanners else 0,
                unsupported_files=files_total if not supported_scanners else 0,
                warnings=warnings,
            ),
        )