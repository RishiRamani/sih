from pathlib import Path
import json
from typing import Any


class LibraryDetector:
    """
    Detects known cryptographic libraries from parsed dependencies.

    Important:
    Detecting a cryptographic library does NOT prove that a
    particular cryptographic algorithm is being used.
    """

    DEFAULT_LIBRARIES = {
        "python": {
            "cryptography": {
                "category": "cryptographic_library",
                "confidence": 0.95,
            },
            "pycryptodome": {
                "category": "cryptographic_library",
                "confidence": 0.95,
            },
            "pycryptodomex": {
                "category": "cryptographic_library",
                "confidence": 0.95,
            },
            "pynacl": {
                "category": "cryptographic_library",
                "confidence": 0.95,
            },
            "bcrypt": {
                "category": "cryptographic_library",
                "confidence": 0.90,
            },
        },

        "javascript": {
            "crypto-js": {
                "category": "cryptographic_library",
                "confidence": 0.95,
            },
            "tweetnacl": {
                "category": "cryptographic_library",
                "confidence": 0.95,
            },
            "node-forge": {
                "category": "cryptographic_library",
                "confidence": 0.95,
            },
            "libsodium-wrappers": {
                "category": "cryptographic_library",
                "confidence": 0.95,
            },
            "jsonwebtoken": {
                "category": "cryptographic_security_library",
                "confidence": 0.85,
            },
            "jose": {
                "category": "cryptographic_security_library",
                "confidence": 0.90,
            },
        },

        "java": {
            "org.bouncycastle:bcprov-jdk18on": {
                "category": "cryptographic_library",
                "confidence": 0.98,
            },
            "org.bouncycastle:bcprov-jdk15on": {
                "category": "cryptographic_library",
                "confidence": 0.98,
            },
            "org.bouncycastle:bcpkix-jdk18on": {
                "category": "cryptographic_library",
                "confidence": 0.98,
            },
            "org.conscrypt:conscrypt-openjdk-uber": {
                "category": "cryptographic_library",
                "confidence": 0.95,
            },
        },

        "cpp": {
            "openssl": {
                "category": "cryptographic_library",
                "confidence": 0.98,
            },
            "libsodium": {
                "category": "cryptographic_library",
                "confidence": 0.98,
            },
            "botan": {
                "category": "cryptographic_library",
                "confidence": 0.95,
            },
            "mbedtls": {
                "category": "cryptographic_library",
                "confidence": 0.95,
            },
        },
    }

    def __init__(self, knowledge_path: Path | None = None):
        self.libraries = self._load_knowledge(knowledge_path)

    def detect(
        self,
        dependencies: list[dict[str, Any]],
    ) -> list[dict[str, Any]]:
        """
        Return dependencies that match known crypto libraries.
        """

        findings = []

        for dependency in dependencies:
            ecosystem = dependency["ecosystem"]
            name = dependency["name"].lower()

            ecosystem_libraries = self.libraries.get(ecosystem, {})

            matched_name = self._find_match(
                name,
                ecosystem_libraries,
            )

            if matched_name is None:
                continue

            info = ecosystem_libraries[matched_name]

            findings.append(
                {
                    **dependency,
                    "library": matched_name,
                    "category": info.get(
                        "category",
                        "cryptographic_library",
                    ),
                    "confidence": info.get(
                        "confidence",
                        0.80,
                    ),
                }
            )

        return findings

    @staticmethod
    def _find_match(
        dependency_name: str,
        libraries: dict[str, Any],
    ) -> str | None:
        """
        Match dependency names case-insensitively.

        Exact matching is intentional. We do not want a package
        called something like "openssl-helper" to automatically
        become OpenSSL.
        """

        for library_name in libraries:
            if dependency_name == library_name.lower():
                return library_name

        return None

    def _load_knowledge(
        self,
        knowledge_path: Path | None,
    ) -> dict[str, Any]:
        """
        Load external knowledge base if available.

        Falls back to built-in mappings so the scanner still works
        during development.
        """

        if knowledge_path and knowledge_path.is_file():
            try:
                data = json.loads(
                    knowledge_path.read_text(encoding="utf-8")
                )

                if isinstance(data, dict):
                    return self._merge_with_defaults(data)

            except (
                OSError,
                UnicodeDecodeError,
                json.JSONDecodeError,
            ):
                pass

        return self.DEFAULT_LIBRARIES

    def _merge_with_defaults(
        self,
        external: dict[str, Any],
    ) -> dict[str, Any]:
        """
        External knowledge takes priority while retaining defaults.
        """

        merged = {
            ecosystem: dict(libraries)
            for ecosystem, libraries in self.DEFAULT_LIBRARIES.items()
        }

        for ecosystem, libraries in external.items():
            if not isinstance(libraries, dict):
                continue

            if ecosystem not in merged:
                merged[ecosystem] = {}

            merged[ecosystem].update(libraries)

        return merged