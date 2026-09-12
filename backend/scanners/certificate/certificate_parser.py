from pathlib import Path

from cryptography import x509
from cryptography.hazmat.primitives.asymmetric import dsa, ec, ed25519, ed448, rsa

CURVE_NAME_MAP = {
    "secp256r1": "P-256",
    "secp384r1": "P-384",
    "secp521r1": "P-521",
    "secp256k1": "secp256k1",
}

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
        curve = None

        if isinstance(public_key, rsa.RSAPublicKey):
            algorithm = "RSA"
            key_size = public_key.key_size

        elif isinstance(public_key, ec.EllipticCurvePublicKey):
            algorithm = "EC"
            key_size = public_key.key_size
            curve = CURVE_NAME_MAP.get(
                public_key.curve.name,
                public_key.curve.name,
            )

        elif isinstance(public_key, dsa.DSAPublicKey):
            algorithm = "DSA"
            key_size = public_key.key_size

        elif isinstance(public_key, ed25519.Ed25519PublicKey):
            algorithm = "Ed25519"

        elif isinstance(public_key, ed448.Ed448PublicKey):
            algorithm = "Ed448"

        signature_algorithm = certificate.signature_hash_algorithm

        signature_algorithm_name = (
            signature_algorithm.name
            if signature_algorithm is not None
            else None
        )

        signature_oid = certificate.signature_algorithm_oid

        san = self._get_subject_alternative_names(certificate)

        return {
            "algorithm": algorithm,
            "key_size": key_size,
            "curve": curve,
            "signature_algorithm": signature_algorithm_name,
            "signature_oid": signature_oid.dotted_string,
            "subject": certificate.subject.rfc4514_string(),
            "issuer": certificate.issuer.rfc4514_string(),
            "san": san,
            "not_valid_before": certificate.not_valid_before_utc.isoformat(),
            "not_valid_after": certificate.not_valid_after_utc.isoformat(),
        }

    def _get_subject_alternative_names(
        self,
        certificate: x509.Certificate,
    ) -> list[str]:
        try:
            extension = certificate.extensions.get_extension_for_class(
                x509.SubjectAlternativeName
            )
        except x509.ExtensionNotFound:
            return []

        names = extension.value

        return [
            name.value
            for name in names
            if isinstance(name, x509.DNSName)
        ]

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