from pathlib import Path

from backend.scanners.source.source_scanner_adapter import SourceScanner


def test_source_scanner_adapter_can_scan_directory() -> None:
    scanner = SourceScanner()

    target = Path("backend/data/demo/source/sample_repo")

    assert scanner.can_scan(target)


def test_source_scanner_adapter_returns_findings() -> None:
    scanner = SourceScanner()

    target = Path("backend/data/demo/source/sample_repo")

    findings = scanner.scan(target)

    assert findings

    algorithms = {
        finding.algorithm
        for finding in findings
        if finding.algorithm
    }

    assert "RSA" in algorithms
    assert "AES" in algorithms
    assert "SHA256" in algorithms