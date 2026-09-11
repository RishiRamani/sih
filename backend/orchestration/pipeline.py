from pathlib import Path

from ..normalization.normalizer import normalize_findings
from ..schemas.finding import Finding
from ..scanners.base import BaseScanner


class ScanPipeline:
    """
    Coordinates scanner execution and normalization.
    """

    def __init__(self, scanners: list[BaseScanner]) -> None:
        self.scanners = scanners

    def run(self, target: Path) -> list[Finding]:
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

        return normalize_findings(raw_findings)