"""
Direct unit tests for language_detector.py in isolation, per
WORK_DIVISION.md Integration Rule 2: "every core subsystem should have a
simple direct test." This doesn't need the full scan_source() pipeline.
"""
import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from scanners.source.language_detector import (
    detect_language,
    detect_language_from_extension,
    detect_language_from_shebang,
    supported_languages,
)


class TestLanguageDetector(unittest.TestCase):
    def test_common_extensions(self):
        self.assertEqual(detect_language_from_extension("app.py"), "python")
        self.assertEqual(detect_language_from_extension("index.js"), "javascript")
        self.assertEqual(detect_language_from_extension("Component.tsx"), "javascript")
        self.assertEqual(detect_language_from_extension("Main.java"), "java")
        self.assertEqual(detect_language_from_extension("util.c"), "c")
        self.assertEqual(detect_language_from_extension("util.hpp"), "c")
        self.assertEqual(detect_language_from_extension("main.go"), "go")

    def test_unknown_extension_returns_none(self):
        self.assertIsNone(detect_language_from_extension("README.md"))
        self.assertIsNone(detect_language_from_extension("data.json"))
        self.assertIsNone(detect_language_from_extension("noextension"))

    def test_extension_matching_is_case_insensitive(self):
        self.assertEqual(detect_language_from_extension("Script.PY"), "python")

    def test_shebang_python(self):
        self.assertEqual(
            detect_language_from_shebang("#!/usr/bin/env python3\n"), "python"
        )
        self.assertEqual(
            detect_language_from_shebang("#!/usr/bin/python\n"), "python"
        )

    def test_shebang_node(self):
        self.assertEqual(
            detect_language_from_shebang("#!/usr/bin/env node\n"), "javascript"
        )

    def test_shebang_shell_recognized_but_no_language(self):
        # Recognized as a script, but not a language this scanner has
        # detectors for -- distinct from "not a shebang at all".
        self.assertIsNone(detect_language_from_shebang("#!/bin/bash\n"))

    def test_non_shebang_line_returns_none(self):
        self.assertIsNone(detect_language_from_shebang("import os\n"))
        self.assertIsNone(detect_language_from_shebang(""))

    def test_detect_language_prefers_extension_over_shebang(self):
        # a .py file with a (hypothetically wrong) node shebang should
        # still resolve via extension, since extension is checked first
        result = detect_language("script.py", content="#!/usr/bin/env node\n")
        self.assertEqual(result, "python")

    def test_detect_language_falls_back_to_shebang(self):
        result = detect_language("run_migration", content="#!/usr/bin/env python3\nprint('hi')\n")
        self.assertEqual(result, "python")

    def test_detect_language_without_content_only_uses_extension(self):
        self.assertIsNone(detect_language("run_migration"))

    def test_supported_languages_includes_core_set(self):
        langs = supported_languages()
        for expected in ("python", "javascript", "java", "c", "go"):
            self.assertIn(expected, langs)


if __name__ == "__main__":
    unittest.main()