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
        self.last_coverage = {
            "files_scanned": 0,
            "parse_errors": 0,
            "candidate_paths": set(),
        }

    @property
    def name(self) -> str:
        return "X.509 Certificate Scanner"

    def can_scan(self, target: Path) -> bool:
        if target.is_file():
            return target.suffix.lower() in {".pem", ".crt", ".cer", ".der"}
        return target.is_dir() and any(
            path.is_file() and path.suffix.lower() in {".pem", ".crt", ".cer", ".der"}
            for path in target.rglob("*")
        )

    def scan(self, target: Path) -> list[Finding]:
        if not self.can_scan(target):
            return []

        paths = [target] if target.is_file() else [
            path
            for path in target.rglob("*")
            if path.is_file() and path.suffix.lower() in {".pem", ".crt", ".cer", ".der"}
        ]
        self.last_coverage = {
            "files_scanned": 0,
            "parse_errors": 0,
            "candidate_paths": set(paths),
        }
        findings = []

        for path in paths:
            try:
                result = self.parser.parse(path)
            except ValueError:
                self.last_coverage["parse_errors"] += 1
                continue

            self.last_coverage["files_scanned"] += 1
            findings.append(
                Finding(
                    artifact_type="certificate",
                    algorithm=result["algorithm"],
                    primitive_type="asymmetric",
                    variant=result["curve"],
                    key_size=result["key_size"],
                    library=None,
                    library_version=None,
                    asset_path=str(path),
                    line_start=None,
                    line_end=None,
                    detection_method="X509_CERTIFICATE",
                    confidence=1.0,
                    evidence=(
                        f"X.509 certificate with "
                        f"{result['algorithm']} public key"
                    ),
                    metadata={
                        "curve": result["curve"],
                        "signature_algorithm": result["signature_algorithm"],
                        "signature_oid": result["signature_oid"],
                        "subject": result["subject"],
                        "issuer": result["issuer"],
                        "san": result["san"],
                        "not_valid_before": result["not_valid_before"],
                        "not_valid_after": result["not_valid_after"],
                    },
                )
            )

        return findings