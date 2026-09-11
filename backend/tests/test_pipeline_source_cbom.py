from pathlib import Path

from backend.cbom.serializer import serialize_cbom
from backend.cbom.validator import validate_cbom_json
from backend.cbom.generator import generate_cbom
from backend.normalization.normalizer import normalize_findings
from backend.scanners.source.source_scanner import scan_source


def test_source_scanner_to_cbom() -> None:
    target = Path(
        "backend/data/demo/source/sample_repo"
    )

    raw_findings, coverage = scan_source(str(target))

    findings = normalize_findings(raw_findings)

    assert findings
    assert coverage["files_scanned"] > 0

    crypto_findings = [
        finding
        for finding in findings
        if finding.algorithm
    ]

    assert crypto_findings

    cbom = generate_cbom(findings)

    crypto_assets = [
        component
        for component in cbom.components
        if component.type == "cryptographic-asset"
    ]

    assert crypto_assets

    serialized = serialize_cbom(cbom)

    errors = validate_cbom_json(serialized)

    assert errors == [], "\n".join(errors)