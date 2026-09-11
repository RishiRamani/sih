from pathlib import Path

from ..base import BaseScanner
from schemas.finding import Finding
from .format_detector import BinaryFormatDetector
from .signatures import CryptoSignatureDetector
from .strings import BinaryStringExtractor
from .symbols import BinarySymbolExtractor


class BinaryScanner(BaseScanner):
    """
    Performs static cryptographic discovery on executable binaries
    and shared libraries.

    The binary is never executed.
    """

    def __init__(self):
        self.format_detector = BinaryFormatDetector()
        self.string_extractor = BinaryStringExtractor()
        self.symbol_extractor = BinarySymbolExtractor()
        self.signature_detector = CryptoSignatureDetector()

    @property
    def name(self) -> str:
        return "Binary Crypto Scanner"

    def can_scan(self, target: Path) -> bool:
        if not target.is_file():
            return False

        return self.format_detector.detect(target) != "unknown"

    def scan(self, target: Path) -> list[Finding]:
        if not self.can_scan(target):
            return []

        binary_format = self.format_detector.detect(target)

        strings = self.string_extractor.extract(target)

        symbols = self.symbol_extractor.extract(target)

        signatures = self.signature_detector.detect(
            strings,
            symbols,
        )

        findings = []

        for signature in signatures:
            evidence_sources = []

            for value in strings:
                if signature.name.lower() in value.lower():
                    evidence_sources.append(
                        f"string: {value}"
                    )

            for value in symbols.get("imports", []):
                if signature.name.lower() in value.lower():
                    evidence_sources.append(
                        f"import: {value}"
                    )

            for value in symbols.get("exports", []):
                if signature.name.lower() in value.lower():
                    evidence_sources.append(
                        f"export: {value}"
                    )

            evidence = "; ".join(evidence_sources)

            findings.append(
                Finding(
                    artifact_type="binary",
                    algorithm=signature.algorithm,
                    primitive_type=signature.primitive_type,
                    variant=None,
                    key_size=None,
                    library=(
                        "OpenSSL"
                        if signature.name in {"OpenSSL", "libcrypto"}
                        else None
                    ),
                    library_version=None,
                    asset_path=str(target),
                    line_start=None,
                    line_end=None,
                    detection_method="BINARY_SIGNATURE",
                    confidence=signature.confidence,
                    evidence=(
                        f"{binary_format} binary: {evidence}"
                    ),
                    metadata={
                        "binary_format": binary_format,
                        "signature": signature.name,
                    },
                )
            )

        return findings