from pathlib import Path
import unittest

from backend.scanners.source.source_scanner import scan_source


SAMPLE_REPO = (
    Path(__file__).resolve().parent
    / ".."
    / "data"
    / "demo"
    / "source"
)


class TestSourceScanner(unittest.TestCase):
    def setUp(self):
        self.findings, self.coverage = scan_source(
            str(SAMPLE_REPO)
        )

        self.algorithms = {
            finding.algorithm
            for finding in self.findings
            if finding.algorithm
        }

    def test_detects_weak_rsa_key_size(self):
        rsa_findings = [
            finding
            for finding in self.findings
            if finding.algorithm == "RSA"
        ]

        self.assertTrue(
            any(finding.key_size == 1024 for finding in rsa_findings)
        )

    def test_detects_md5(self):
        self.assertIn("MD5", self.algorithms)

    def test_detects_aes(self):
        self.assertIn("AES", self.algorithms)

    def test_ast_findings_have_high_confidence(self):
        ast_findings = [
            finding
            for finding in self.findings
            if "AST" in finding.detection_method
        ]

        self.assertTrue(
            ast_findings,
            "expected at least one AST-confirmed finding",
        )

        for finding in ast_findings:
            self.assertGreaterEqual(finding.confidence, 0.9)

    def test_custom_crypto_flagged(self):
        custom = [
            finding
            for finding in self.findings
            if finding.primitive_type == "custom"
        ]

        self.assertTrue(
            custom,
            "home-grown XOR/bit-rotation function should be flagged",
        )

    def test_javascript_detection_works(self):
        js_findings = [
            finding
            for finding in self.findings
            if finding.asset_path.endswith(".js")
        ]

        self.assertTrue(
            js_findings,
            "expected findings from the JS sample file",
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
            "component_id",
            "parent_component_id",
            "metadata",
        }

        for finding in self.findings:
            self.assertEqual(
                required_fields,
                set(finding.model_dump().keys()),
            )


if __name__ == "__main__":
    unittest.main()