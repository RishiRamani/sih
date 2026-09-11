from backend.normalization.normalizer import normalize_findings
from backend.schemas.finding import Finding


def test_duplicate_findings_are_merged() -> None:
    findings = [
        Finding(
            artifact_type="crypto_algorithm",
            algorithm="RSA",
            key_size=2048,
            asset_path=r"src\auth.py",
            line_start=42,
            line_end=42,
            detection_method="regex",
            confidence=0.7,
            evidence="RSA_sign(...)",
        ),
        Finding(
            artifact_type="crypto_algorithm",
            algorithm="RSA",
            key_size=2048,
            asset_path="src/auth.py",
            line_start=42,
            line_end=42,
            detection_method="ast",
            confidence=0.95,
            evidence="Call node: RSA_sign",
        ),
    ]

    result = normalize_findings(findings)

    assert len(result) == 1
    assert result[0].confidence == 0.95
    assert "RSA_sign(...)" in result[0].evidence
    assert "Call node: RSA_sign" in result[0].evidence