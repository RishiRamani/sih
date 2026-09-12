
"""
Minimal smoke tests for the source scanner module.

Run from E:\\sih:
    python -m pytest backend/tests/test_source_scanner.py -v
"""

import os
import sys
import unittest
from pathlib import Path

# Add the repository root to sys.path.
REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT))

from backend.scanners.source.source_scanner import scan_source
from backend.scanners.source.api_detector import detect_api_signatures


# Actual demo repository used by the integration tests.
BACKEND_DIR = REPO_ROOT / "backend"
SOURCE_DIR = BACKEND_DIR / "data" / "demo" / "source" / "sample_repo"


def finding_value(finding, field):
    """Read a Finding field, supporting dataclass and dictionary objects."""
    if isinstance(finding, dict):
        return finding[field]
    return getattr(finding, field)


def finding_fields(finding):
    """Return the Finding fields as a dictionary."""
    if isinstance(finding, dict):
        return finding
    if hasattr(finding, "__dataclass_fields__"):
        return {
            field: getattr(finding, field)
            for field in finding.__dataclass_fields__
        }
    return vars(finding)


class TestSourceScanner(unittest.TestCase):
    def setUp(self):
        self.assertTrue(
            SOURCE_DIR.is_dir(),
            f"Demo source directory not found: {SOURCE_DIR}",
        )

        self.findings, self.coverage = scan_source(str(SOURCE_DIR))

        self.algorithms = {
            finding_value(f, "algorithm")
            for f in self.findings
            if finding_value(f, "algorithm")
        }

    def test_detects_weak_rsa_key_size(self):
        rsa_findings = [
            f for f in self.findings
            if finding_value(f, "algorithm") == "RSA"
        ]
        self.assertTrue(
            any(finding_value(f, "key_size") == 1024 for f in rsa_findings)
        )

    def test_detects_md5(self):
        self.assertIn("MD5", self.algorithms)

    def test_detects_aes(self):
        self.assertIn("AES", self.algorithms)

    def test_ast_findings_have_high_confidence(self):
        ast_findings = [
            f for f in self.findings
            if "AST" in finding_value(f, "detection_method")
        ]
        self.assertTrue(
            ast_findings,
            "expected at least one AST-confirmed finding",
        )
        for f in ast_findings:
            self.assertGreaterEqual(
                finding_value(f, "confidence"),
                0.9,
            )

    def test_custom_crypto_flagged(self):
        custom = [
            f for f in self.findings
            if finding_value(f, "primitive_type") == "custom"
        ]
        self.assertTrue(
            custom,
            "home-grown XOR/bit-rotation function should be flagged",
        )

    def test_javascript_detection_works(self):
        js_findings = [
            f for f in self.findings
            if finding_value(f, "asset_path").endswith(".js")
        ]
        self.assertTrue(
            js_findings,
            "expected findings from the JS sample file",
        )

    def test_go_detection_works(self):
        go_findings = [
            f for f in self.findings
            if finding_value(f, "asset_path").endswith(".go")
        ]
        self.assertTrue(
            go_findings,
            "expected findings from the Go sample file",
        )

        go_algorithms = {
            finding_value(f, "algorithm")
            for f in go_findings
        }

        self.assertIn("RSA", go_algorithms)
        self.assertIn("MD5", go_algorithms)
        self.assertIn("SHA256", go_algorithms)

    def test_go_rsa_key_size_extracted(self):
        go_rsa = [
            f for f in self.findings
            if (
                finding_value(f, "asset_path").endswith(".go")
                and finding_value(f, "algorithm") == "RSA"
            )
        ]
        self.assertTrue(
            any(finding_value(f, "key_size") == 1024 for f in go_rsa)
        )

    def test_ecdsa_and_ecdh_both_detected(self):
        ecc_file = [
            f for f in self.findings
            if finding_value(f, "asset_path").endswith("ecc_usage.py")
        ]
        self.assertTrue(
            ecc_file,
            "expected findings from ecc_usage.py",
        )

        primitive_types = {
            finding_value(f, "primitive_type")
            for f in ecc_file
            if finding_value(f, "algorithm")
        }

        self.assertIn("signature", primitive_types)
        self.assertIn("key_exchange", primitive_types)

    def test_eddsa_detected(self):
        self.assertIn("EdDSA", self.algorithms)

        eddsa_findings = [
            f for f in self.findings
            if finding_value(f, "algorithm") == "EdDSA"
        ]

        self.assertTrue(
            any(
                finding_value(f, "variant") == "Ed25519"
                for f in eddsa_findings
            )
        )

    def test_chacha20_poly1305_detected(self):
        self.assertIn("ChaCha20", self.algorithms)

        chacha_findings = [
            f for f in self.findings
            if finding_value(f, "algorithm") == "ChaCha20"
        ]

        self.assertTrue(
            any(
                finding_value(f, "variant") == "ChaCha20-Poly1305"
                for f in chacha_findings
            )
        )

    def test_aes_modes_are_optional_metadata(self):
        cases = {
            "GCM": "algorithms.AES(key), modes.GCM(iv)",
            "CBC": "algorithms.AES(key), modes.CBC(iv)",
            "ECB": "algorithms.AES(key), modes.ECB()",
            "CTR": "algorithms.AES(key), modes.CTR(nonce)",
        }

        for expected_mode, source_line in cases.items():
            with self.subTest(mode=expected_mode):
                findings = detect_api_signatures(
                    "example.py",
                    source_line,
                    "python",
                )
                aes_finding = next(
                    finding for finding in findings
                    if finding_value(finding, "algorithm") == "AES"
                )
                self.assertEqual(
                    finding_value(aes_finding, "metadata")["mode"],
                    expected_mode,
                )

        generic_findings = detect_api_signatures(
            "example.py",
            "cipher = algorithms.AES(key)",
            "python",
        )
        generic_aes = next(
            finding for finding in generic_findings
            if finding_value(finding, "algorithm") == "AES"
        )
        self.assertNotIn("mode", finding_value(generic_aes, "metadata"))

    def test_comment_only_lexical_hits_get_lower_confidence(self):
        comment_findings = [
            f for f in self.findings
            if finding_value(f, "detection_method") == "LEXICAL_COMMENT"
        ]

        for f in comment_findings:
            self.assertLess(
                finding_value(f, "confidence"),
                0.35,
            )

    def test_extensionless_python_script_detected_via_shebang(self):
        import tempfile

        with tempfile.TemporaryDirectory() as tmp:
            script_path = os.path.join(tmp, "run_migration")

            with open(script_path, "w", encoding="utf-8") as f:
                f.write(
                    "#!/usr/bin/env python3\n"
                    "import hashlib\n"
                    "hashlib.md5(b'x')\n"
                )

            findings, coverage = scan_source(tmp)

            self.assertEqual(coverage["files_unsupported"], 0)
            self.assertTrue(
                any(
                    finding_value(f, "algorithm") == "MD5"
                    for f in findings
                )
            )

    def test_coverage_reports_all_sample_files(self):
        self.assertGreaterEqual(
            self.coverage["files_scanned"],
            4,
        )

    def test_every_finding_matches_shared_contract(self):
        required_fields = {
    "artifact_type",
    "algorithm",
    "primitive_type",
    "variant",
    "key_size",
    "library",
    "library_version",
    "asset_path",
    "line_start",
    "line_end",
    "detection_method",
    "confidence",
    "evidence",
    "metadata",
    "parent_component_id",
    "component_id",
}
        for f in self.findings:
            self.assertEqual(
                required_fields,
                set(finding_fields(f).keys()),
            )


if __name__ == "__main__":
    unittest.main()