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
        source_coverage: dict = {}
        certificate_coverage: dict = {}

        for scanner in self.scanners:
            if not scanner.can_scan(target):
                continue
            try:
                scanner_findings = scanner.scan(target)
                raw_findings.extend(scanner_findings)
                if scanner.name == "Source Crypto Scanner":
                    source_coverage = scanner.last_coverage
                elif scanner.name == "X.509 Certificate Scanner":
                    certificate_coverage = scanner.last_coverage

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

        source_scanned = source_coverage.get("files_scanned", 0)
        source_unsupported = set(source_coverage.get("unsupported_paths", []))
        certificate_paths = certificate_coverage.get("candidate_paths", set())
        files_scanned = source_scanned + certificate_coverage.get("files_scanned", 0)
        unsupported_files = source_coverage.get(
            "files_unsupported",
            len(source_unsupported - certificate_paths),
        )
        skipped_files = source_coverage.get("files_skipped_oversize", 0)
        parse_errors = source_coverage.get("files_parse_error", 0) + certificate_coverage.get("parse_errors", 0)
        if source_coverage:
            classified_files = (
                source_scanned
                + unsupported_files
                + skipped_files
                + source_coverage.get("files_parse_error", 0)
            )
            # Files below ignored directories such as __pycache__ are skipped
            # intentionally, but still belong in the coverage denominator.
            skipped_files += max(0, files_total - classified_files)

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
                files_scanned=files_scanned if target.is_dir() else files_scanned,
                unsupported_files=unsupported_files,
                skipped_files=skipped_files,
                parse_errors=parse_errors,
                warnings=warnings,
            ),
        )