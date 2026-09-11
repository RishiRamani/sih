from pathlib import Path


CRYPTO_PACKAGE_INDICATORS = {
    # Debian / Ubuntu
    "libssl": "OpenSSL",
    "libssl-dev": "OpenSSL",
    "openssl": "OpenSSL",
    "libgcrypt": "libgcrypt",
    "libsodium": "libsodium",

    # Alpine
    "openssl-libs": "OpenSSL",

    # RPM-based systems
    "openssl-libs": "OpenSSL",

    # Common library files
    "libcrypto.so": "OpenSSL",
    "libssl.so": "OpenSSL",
    "libsodium.so": "libsodium",
}


class ContainerPackageDetector:
    """
    Detects known cryptographic libraries/packages from a
    container filesystem listing.

    Detection is based on file/package names only.
    """

    def detect(self, files: list[dict]) -> list[dict]:
        findings = []

        for file_info in files:
            file_path = file_info.get("path")

            if not file_path:
                continue

            match = self._match_package(file_path)

            if match is None:
                continue

            findings.append(
                {
                    "library": match,
                    "path": file_path,
                    "detection_method": "CONTAINER_PACKAGE_MATCH",
                    "confidence": 0.85,
                }
            )

        return findings

    def _match_package(self, file_path: str) -> str | None:
        name = Path(file_path).name.lower()

        for indicator, library in CRYPTO_PACKAGE_INDICATORS.items():
            if indicator.lower() in name:
                return library

        return None