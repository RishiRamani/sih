from pathlib import Path

from ..base import BaseScanner
from ...schemas.finding import Finding
from .source_scanner import scan_source


class SourceScanner(BaseScanner):
    """Adapter that exposes the existing source scanner to ScanPipeline."""

    @property
    def name(self) -> str:
        return "Source Crypto Scanner"

    def can_scan(self, target: Path) -> bool:
        return target.is_dir()

    def scan(self, target: Path) -> list[Finding]:
        findings, _coverage = scan_source(str(target))
        return findings