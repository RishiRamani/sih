from datetime import datetime, timedelta, timezone

from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec, rsa
from cryptography.x509.oid import NameOID

from backend.scanners.certificate.certificate_parser import CertificateParser
from backend.scanners.certificate.certificate_scanner import CertificateScanner


def create_rsa_certificate():
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
    )

    subject = issuer = x509.Name(
        [
            x509.NameAttribute(
                NameOID.COMMON_NAME,
                "ecdattest.local",
            )
        ]
    )

    certificate = (
        x509.CertificateBuilder()
        .subject_name(subject)
        .issuer_name(issuer)
        .public_key(private_key.public_key())
        .serial_number(x509.random_serial_number())
        .add_extension(
            x509.SubjectAlternativeName(
                [
                    x509.DNSName("ecdattest.local"),
                    x509.DNSName("api.ecdattest.local"),
                ]
            ),
            critical=False,
        )
        .not_valid_before(
            datetime.now(timezone.utc) - timedelta(minutes=1)
        )
        .not_valid_after(
            datetime.now(timezone.utc) + timedelta(days=30)
        )
        .sign(private_key, hashes.SHA256())
    )

    return certificate


def create_ec_certificate():
    private_key = ec.generate_private_key(
        ec.SECP256R1()
    )

    subject = issuer = x509.Name(
        [
            x509.NameAttribute(
                NameOID.COMMON_NAME,
                "ec-test.local",
            )
        ]
    )

    certificate = (
        x509.CertificateBuilder()
        .subject_name(subject)
        .issuer_name(issuer)
        .public_key(private_key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(
            datetime.now(timezone.utc) - timedelta(minutes=1)
        )
        .not_valid_after(
            datetime.now(timezone.utc) + timedelta(days=30)
        )
        .sign(private_key, hashes.SHA256())
    )

    return certificate


def test_parse_rsa_certificate(tmp_path):
    certificate = create_rsa_certificate()

    certificate_path = tmp_path / "server.pem"

    certificate_path.write_bytes(
        certificate.public_bytes(
            serialization.Encoding.PEM
        )
    )

    parser = CertificateParser()

    result = parser.parse(certificate_path)

    assert result["algorithm"] == "RSA"
    assert result["key_size"] == 2048
    assert result["signature_algorithm"] == "sha256"
    assert "CN=ecdattest.local" in result["subject"]
    assert "CN=ecdattest.local" in result["issuer"]


def test_parse_ec_certificate(tmp_path):
    certificate = create_ec_certificate()

    certificate_path = tmp_path / "server.pem"

    certificate_path.write_bytes(
        certificate.public_bytes(
            serialization.Encoding.PEM
        )
    )

    parser = CertificateParser()

    result = parser.parse(certificate_path)

    assert result["algorithm"] == "EC"
    assert result["key_size"] == 256
    assert result["curve"] == "P-256"
    assert result["signature_algorithm"] == "sha256"


def test_parse_der_certificate(tmp_path):
    certificate = create_rsa_certificate()

    certificate_path = tmp_path / "server.der"

    certificate_path.write_bytes(
        certificate.public_bytes(
            serialization.Encoding.DER
        )
    )

    parser = CertificateParser()

    result = parser.parse(certificate_path)

    assert result["algorithm"] == "RSA"
    assert result["key_size"] == 2048

def test_parse_subject_alternative_names(tmp_path):
    certificate = create_rsa_certificate()

    certificate_path = tmp_path / "server.pem"

    certificate_path.write_bytes(
        certificate.public_bytes(
            serialization.Encoding.PEM
        )
    )

    parser = CertificateParser()

    result = parser.parse(certificate_path)

    assert "ecdattest.local" in result["san"]
    assert "api.ecdattest.local" in result["san"]


def test_invalid_certificate(tmp_path):
    certificate_path = tmp_path / "invalid.pem"

    certificate_path.write_text(
        "this is not a certificate",
        encoding="utf-8",
    )

    parser = CertificateParser()

    try:
        parser.parse(certificate_path)
        assert False, "Expected ValueError"
    except ValueError as error:
        assert "Unsupported or invalid certificate format" in str(error)

def test_certificate_scanner_returns_finding(tmp_path):
    certificate = create_rsa_certificate()

    certificate_path = tmp_path / "server.pem"

    certificate_path.write_bytes(
        certificate.public_bytes(
            serialization.Encoding.PEM
        )
    )

    scanner = CertificateScanner()

    findings = scanner.scan(certificate_path)

    assert len(findings) == 1

    finding = findings[0]

    assert finding.artifact_type == "certificate"
    assert finding.algorithm == "RSA"
    assert finding.key_size == 2048
    assert finding.detection_method == "X509_CERTIFICATE"
    assert finding.confidence == 1.0
    assert finding.metadata["subject"]
    assert finding.metadata["issuer"]
    assert finding.metadata["subject"]
    assert finding.metadata["issuer"]
    assert finding.metadata["curve"] is None
    assert finding.metadata["signature_algorithm"] == "sha256"
    assert finding.metadata["san"]


def test_certificate_scanner_ignores_non_certificate(tmp_path):
    file_path = tmp_path / "hello.txt"
    file_path.write_text("hello")

    scanner = CertificateScanner()

    findings = scanner.scan(file_path)

    assert findings == []