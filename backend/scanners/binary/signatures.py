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
    mode: str | None = None
    key_size: int | None = None


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
        key_size=128,
    ),
    CryptoSignature(
        name="EVP_aes_256",
        algorithm="AES",
        primitive_type="symmetric",
        confidence=0.95,
        key_size=256,
    ),
    CryptoSignature(
        name="AES-GCM",
        algorithm="AES",
        primitive_type="symmetric",
        confidence=0.95,
        mode="GCM",
    ),
    CryptoSignature(
        name="AES-CBC",
        algorithm="AES",
        primitive_type="symmetric",
        confidence=0.95,
        mode="CBC",
    ),
    CryptoSignature(
        name="AES-CTR",
        algorithm="AES",
        primitive_type="symmetric",
        confidence=0.95,
        mode="CTR",
    ),
    CryptoSignature(
        name="AES-ECB",
        algorithm="AES",
        primitive_type="symmetric",
        confidence=0.95,
        mode="ECB",
    ),

    # RSA
    CryptoSignature(
        name="RSA",
        algorithm="RSA",
        primitive_type="asymmetric",
        confidence=0.90,
    ),
    CryptoSignature(
        name="RSA-1024",
        algorithm="RSA",
        primitive_type="asymmetric",
        confidence=0.95,
        key_size=1024,
    ),
    CryptoSignature(
        name="RSA-2048",
        algorithm="RSA",
        primitive_type="asymmetric",
        confidence=0.95,
        key_size=2048,
    ),
    CryptoSignature(
        name="RSA-3072",
        algorithm="RSA",
        primitive_type="asymmetric",
        confidence=0.95,
        key_size=3072,
    ),
    CryptoSignature(
        name="RSA-4096",
        algorithm="RSA",
        primitive_type="asymmetric",
        confidence=0.95,
        key_size=4096,
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

        evidence.update(str(value) for value in symbols.get("imports", []))
        evidence.update(str(value) for value in symbols.get("exports", []))

        matches = []

        for signature in CRYPTO_SIGNATURES:
            signature_name = signature.name.lower()
            for value in evidence:
                value_lower = value.lower()

                # Exact match: AES should match "AES",
                # but not "AES-GCM" or "AES-CBC".
                if value_lower == signature_name:
                    matches.append(signature)
                    break

                # Allow specific signatures to match longer
                # function/symbol names, e.g. RSA_public_encrypt.
                if (
                    value_lower.startswith(signature_name + "_")
                    or value_lower.startswith(signature_name + "-")
                ):
                    matches.append(signature)
                    break

        return matches