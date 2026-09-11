from pathlib import Path
from typing import Any

from ..schemas.finding import Finding
from ..scanners.base import BaseScanner


class ScanPipeline:
    """
    Coordinates scanner execution and returns raw findings.

    This class deliberately does not contain cryptographic detection rules.
    """

    def __init__(self, scanners: list[BaseScanner]) -> None:
        self.scanners = scanners

    def run(self, target: Path) -> list[Finding]:
        findings: list[Finding] = []

        for scanner in self.scanners:
            if not scanner.can_scan(target):
                continue

            try:
                scanner_findings = scanner.scan(target)
                findings.extend(scanner_findings)
            except Exception as exc:
                # Scanner failures should not automatically destroy the
                # entire scan. Later we will record this in scan diagnostics.
                print(
                    f"[WARN] Scanner '{scanner.name}' failed: "
                    f"{type(exc).__name__}: {exc}"
                )

        return findings