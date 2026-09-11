from dataclasses import dataclass


@dataclass(frozen=True)
class CryptoSignature:
    """
    Known static indicator of cryptographic functionality.
    """

    name: str
    algorithm: str | None
    primitive_type: str | None
    confidence: float


CRYPTO_SIGNATURES = [
    # OpenSSL / libcrypto
    CryptoSignature(
        name="OpenSSL",
        algorithm=None,
        primitive_type=None,
        confidence=0.90,
    ),
    CryptoSignature(
        name="libcrypto",
        algorithm=None,
        primitive_type=None,
        confidence=0.90,
    ),

    # AES
    CryptoSignature(
        name="AES",
        algorithm="AES",
        primitive_type="symmetric",
        confidence=0.85,
    ),
    CryptoSignature(
        name="EVP_aes_128",
        algorithm="AES",
        primitive_type="symmetric",
        confidence=0.95,
    ),
    CryptoSignature(
        name="EVP_aes_256",
        algorithm="AES",
        primitive_type="symmetric",
        confidence=0.95,
    ),
    CryptoSignature(
        name="AES-GCM",
        algorithm="AES",
        primitive_type="symmetric",
        confidence=0.95,
    ),

    # RSA
    CryptoSignature(
        name="RSA",
        algorithm="RSA",
        primitive_type="asymmetric",
        confidence=0.90,
    ),
    CryptoSignature(
        name="RSA_public_encrypt",
        algorithm="RSA",
        primitive_type="asymmetric",
        confidence=0.98,
    ),
    CryptoSignature(
        name="RSA_private_decrypt",
        algorithm="RSA",
        primitive_type="asymmetric",
        confidence=0.98,
    ),

    # Elliptic curve / ECDSA / ECDH
    CryptoSignature(
        name="ECDSA",
        algorithm="ECDSA",
        primitive_type="signature",
        confidence=0.95,
    ),
    CryptoSignature(
        name="ECDSA_sign",
        algorithm="ECDSA",
        primitive_type="signature",
        confidence=0.98,
    ),
    CryptoSignature(
        name="ECDH",
        algorithm="ECDH",
        primitive_type="key_exchange",
        confidence=0.95,
    ),

    # Hashes
    CryptoSignature(
        name="SHA256",
        algorithm="SHA-256",
        primitive_type="hash",
        confidence=0.90,
    ),
    CryptoSignature(
        name="SHA1",
        algorithm="SHA-1",
        primitive_type="hash",
        confidence=0.90,
    ),
    CryptoSignature(
        name="MD5",
        algorithm="MD5",
        primitive_type="hash",
        confidence=0.90,
    ),
]


class CryptoSignatureDetector:
    """
    Detects known cryptographic indicators in strings and symbols.

    Matches are static indicators only. A match does not prove that
    the cryptographic operation is actually executed at runtime.
    """

    def detect(
        self,
        strings: list[str],
        symbols: dict[str, list[str]],
    ) -> list[CryptoSignature]:
        evidence = set(strings)

        evidence.update(symbols.get("imports", []))
        evidence.update(symbols.get("exports", []))

        matches = []

        for signature in CRYPTO_SIGNATURES:
            for value in evidence:
                if signature.name.lower() in value.lower():
                    matches.append(signature)
                    break

        return matches