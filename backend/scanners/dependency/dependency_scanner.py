from pathlib import Path
from typing import Any

from ..base import BaseScanner
from schemas.finding import Finding

from .manifest_parser import ManifestParser
from .library_detector import LibraryDetector


class DependencyScanner(BaseScanner):
    """
    Scans dependency manifests for known cryptographic libraries.

    This scanner reports library-level evidence only.

    Example:

        package.json
            ↓
        crypto-js
            ↓
        crypto library detected

    It does NOT claim that AES/RSA/etc. is actually used.
    Source-level usage must be established by the source scanner.
    """

    SUPPORTED_MANIFESTS = {
        "package.json",
        "requirements.txt",
        "pyproject.toml",
        "pom.xml",
        "build.gradle",
        "build.gradle.kts",
        "cmakelists.txt",
    }

    def __init__(
        self,
        knowledge_path: Path | None = None,
    ):
        self.parser = ManifestParser()
        self.detector = LibraryDetector(knowledge_path)

    @property
    def name(self) -> str:
        return "dependency"

    def can_scan(self, target: Any) -> bool:
        """
        Return True when target is a supported dependency manifest
        or a directory containing one.
        """

        if not isinstance(target, Path):
            target = Path(target)

        if target.is_file():
            return target.name.lower() in self.SUPPORTED_MANIFESTS

        if target.is_dir():
            return any(
                path.name.lower() in self.SUPPORTED_MANIFESTS
                for path in target.rglob("*")
                if path.is_file()
            )

        return False

    def scan(self, target: Path) -> list[Finding]:
        """
        Scan a manifest or directory for crypto-related dependencies.
        """

        target = Path(target)

        manifests = self._find_manifests(target)

        findings = []

        for manifest in manifests:
            dependencies = self.parser.parse(manifest)

            crypto_libraries = self.detector.detect(dependencies)

            for library in crypto_libraries:
                findings.append(
                    Finding(
                        artifact_type="dependency",

                        # We don't know the actual algorithm yet.
                        algorithm=None,

                        # Library-level finding.
                        primitive_type="unknown",

                        variant=None,
                        key_size=None,

                        library=library["library"],
                        library_version=library["version"],

                        asset_path=str(manifest),

                        line_start=None,
                        line_end=None,

                        detection_method="DEPENDENCY_MATCH",

                        confidence=library["confidence"],

                        evidence=(
                            f"{manifest.name} declares "
                            f"{library['name']}"
                            f"@{library['version']}"
                            if library["version"]
                            else
                            f"{manifest.name} declares "
                            f"{library['name']}"
                        ),

                        metadata={
                            "ecosystem": library["ecosystem"],
                            "category": library["category"],
                            "manifest": library["manifest"],
                        },
                    )
                )

        return findings

    def _find_manifests(self, target: Path) -> list[Path]:
        """
        Return supported manifests.

        If a specific manifest was supplied, scan only that file.
        If a directory was supplied, recursively discover manifests.
        """

        if target.is_file():
            if target.name.lower() in self.SUPPORTED_MANIFESTS:
                return [target]

            return []

        if not target.is_dir():
            return []

        manifests = []

        for path in target.rglob("*"):
            if not path.is_file():
                continue

            if path.name.lower() in self.SUPPORTED_MANIFESTS:
                manifests.append(path)

        return manifests