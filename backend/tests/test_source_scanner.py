"""
Minimal smoke tests for the source scanner module.
Run with: python -m unittest discover -s . -p "test_*.py"  (from repo root)
"""
import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from scanners.source.source_scanner import scan_source

SAMPLE_REPO = os.path.join(os.path.dirname(__file__), "sample_repo")


class TestSourceScanner(unittest.TestCase):
    def setUp(self):
        self.findings, self.coverage = scan_source(SAMPLE_REPO)
        self.algorithms = {f["algorithm"] for f in self.findings if f["algorithm"]}

    def test_detects_weak_rsa_key_size(self):
        rsa_findings = [f for f in self.findings if f["algorithm"] == "RSA"]
        self.assertTrue(any(f["key_size"] == 1024 for f in rsa_findings))

    def test_detects_md5(self):
        self.assertIn("MD5", self.algorithms)

    def test_detects_aes(self):
        self.assertIn("AES", self.algorithms)

    def test_ast_findings_have_high_confidence(self):
        ast_findings = [f for f in self.findings if "AST" in f["detection_method"]]
        self.assertTrue(ast_findings, "expected at least one AST-confirmed finding")
        for f in ast_findings:
            self.assertGreaterEqual(f["confidence"], 0.9)

    def test_custom_crypto_flagged(self):
        custom = [f for f in self.findings if f["primitive_type"] == "custom"]
        self.assertTrue(custom, "home-grown XOR/bit-rotation function should be flagged")

    def test_javascript_detection_works(self):
        js_findings = [f for f in self.findings if f["asset_path"].endswith(".js")]
        self.assertTrue(js_findings, "expected findings from the JS sample file")

    def test_coverage_reports_all_sample_files(self):
        self.assertGreaterEqual(self.coverage["files_scanned"], 4)

    def test_every_finding_matches_shared_contract(self):
        required_fields = {
            "artifact_type", "algorithm", "primitive_type", "variant",
            "key_size", "library", "library_version", "asset_path",
            "line_start", "line_end", "detection_method", "confidence",
            "evidence",
        }
        for f in self.findings:
            self.assertEqual(required_fields, set(f.keys()))


if __name__ == "__main__":
    unittest.main()