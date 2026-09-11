from pathlib import Path

from ..base import BaseScanner
from ...schemas.finding import Finding
from .certificate_parser import CertificateParser


class CertificateScanner(BaseScanner):
    """
    Scans PEM/DER X.509 certificates and converts them
    into the canonical Finding format.
    """

    def __init__(self):
        self.parser = CertificateParser()

    @property
    def name(self) -> str:
        return "X.509 Certificate Scanner"

    def can_scan(self, target: Path) -> bool:
        if not target.is_file():
            return False

        return target.suffix.lower() in {
            ".pem",
            ".crt",
            ".cer",
            ".der",
        }

    def scan(self, target: Path) -> list[Finding]:
        if not self.can_scan(target):
            return []

        try:
            result = self.parser.parse(target)
        except ValueError:
            return []

        return [
            Finding(
                artifact_type="certificate",
                algorithm=result["algorithm"],
                primitive_type="signature",
                variant=result["signature_algorithm"],
                key_size=result["key_size"],
                library=None,
                library_version=None,
                asset_path=str(target),
                line_start=None,
                line_end=None,
                detection_method="X509_CERTIFICATE",
                confidence=1.0,
                evidence=(
                    f"X.509 certificate with "
                    f"{result['algorithm']} public key"
                ),
                metadata={
                    "subject": result["subject"],
                    "issuer": result["issuer"],
                    "signature_algorithm": result["signature_algorithm"],
                    "not_valid_before": result["not_valid_before"],
                    "not_valid_after": result["not_valid_after"],
                },
            )
        ]