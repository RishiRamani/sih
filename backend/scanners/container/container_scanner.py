from pathlib import Path

from ..base import BaseScanner
from ...schemas.finding import Finding
from .image_inspector import ContainerImageInspector
from .package_detector import ContainerPackageDetector


class ContainerScanner(BaseScanner):
    """
    Performs static cryptographic discovery on container image
    archives.

    The container is never executed.
    """

    def __init__(self):
        self.image_inspector = ContainerImageInspector()
        self.package_detector = ContainerPackageDetector()

    @property
    def name(self) -> str:
        return "Container Crypto Scanner"

    def can_scan(self, target: Path) -> bool:
        if not target.is_file():
            return False

        return target.suffix.lower() == ".tar"

    def scan(self, target: Path) -> list[Finding]:
        if not self.can_scan(target):
            return []

        files = self.image_inspector.inspect(target)

        package_findings = self.package_detector.detect(files)

        findings = []

        for package in package_findings:
            findings.append(
                Finding(
                    artifact_type="container",
                    algorithm=None,
                    primitive_type=None,
                    variant=None,
                    key_size=None,
                    library=package["library"],
                    library_version=None,
                    asset_path=package["path"],
                    line_start=None,
                    line_end=None,
                    detection_method=package["detection_method"],
                    confidence=package["confidence"],
                    evidence=(
                        f"Container filesystem contains "
                        f"{package['library']} indicator: "
                        f"{package['path']}"
                    ),
                    metadata={
                        "container_archive": str(target),
                        "file_size": next(
                            (
                                file_info["size"]
                                for file_info in files
                                if file_info["path"] == package["path"]
                            ),
                            None,
                        ),
                    },
                )
            )

        return findings