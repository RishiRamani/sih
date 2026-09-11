from pathlib import Path

from cryptography import x509
from cryptography.hazmat.primitives.asymmetric import ec, rsa


class CertificateParser:
    """
    Parses X.509 certificates in PEM or DER format.
    """

    def parse(self, path: Path) -> dict:
        data = path.read_bytes()

        certificate = self._load_certificate(data)

        public_key = certificate.public_key()

        algorithm = None
        key_size = None

        if isinstance(public_key, rsa.RSAPublicKey):
            algorithm = "RSA"
            key_size = public_key.key_size

        elif isinstance(public_key, ec.EllipticCurvePublicKey):
            algorithm = "EC"
            key_size = public_key.key_size

        signature_algorithm = certificate.signature_hash_algorithm

        return {
            "algorithm": algorithm,
            "key_size": key_size,
            "signature_algorithm": (
                signature_algorithm.name
                if signature_algorithm is not None
                else None
            ),
            "subject": certificate.subject.rfc4514_string(),
            "issuer": certificate.issuer.rfc4514_string(),
            "not_valid_before": certificate.not_valid_before_utc.isoformat(),
            "not_valid_after": certificate.not_valid_after_utc.isoformat(),
        }

    def _load_certificate(self, data: bytes) -> x509.Certificate:
        """
        Try PEM first, then DER.
        """

        try:
            return x509.load_pem_x509_certificate(data)
        except ValueError:
            pass

        try:
            return x509.load_der_x509_certificate(data)
        except ValueError:
            raise ValueError(
                "Unsupported or invalid certificate format. "
                "Expected a PEM or DER X.509 certificate."
            )