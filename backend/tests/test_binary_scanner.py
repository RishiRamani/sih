from pathlib import Path
import shutil
import subprocess

from backend.scanners.binary.format_detector import BinaryFormatDetector
from backend.scanners.binary.strings import BinaryStringExtractor
from backend.scanners.binary.symbols import BinarySymbolExtractor
from backend.scanners.binary.signatures import CryptoSignatureDetector
from backend.scanners.binary.binary_scanner import BinaryScanner

def test_unknown_file(tmp_path):
    file_path = tmp_path / "hello.txt"
    file_path.write_text("hello")

    detector = BinaryFormatDetector()

    assert detector.detect(file_path) == "unknown"

def test_extract_printable_strings(tmp_path):
    binary_path = tmp_path / "test.bin"

    binary_path.write_bytes(
        b"\x00\x01OpenSSL\x00"
        b"\x00EVP_aes_256_gcm\x00"
        b"\x00RSA_public_encrypt\x00"
        b"\x00"
    )

    extractor = BinaryStringExtractor()

    strings = extractor.extract(binary_path)

    assert "OpenSSL" in strings
    assert "EVP_aes_256_gcm" in strings
    assert "RSA_public_encrypt" in strings


def test_ignores_short_strings(tmp_path):
    binary_path = tmp_path / "test.bin"

    binary_path.write_bytes(
        b"\x00abc\x00"
        b"\x00hello\x00"
    )

    extractor = BinaryStringExtractor(min_length=4)

    strings = extractor.extract(binary_path)

    assert "abc" not in strings
    assert "hello" in strings

def test_extracts_three_character_crypto_strings(tmp_path):
    binary_path = tmp_path / "test.bin"

    binary_path.write_bytes(
        b"\x00RSA\x00"
        b"\x00MD5\x00"
        b"\x00AES\x00"
        b"\x00hello\x00"
    )

    extractor = BinaryStringExtractor()

    strings = extractor.extract(binary_path)

    assert "RSA" in strings
    assert "MD5" in strings
    assert "AES" in strings
    assert "hello" in strings

def test_missing_file(tmp_path):
    binary_path = tmp_path / "missing.bin"

    extractor = BinaryStringExtractor()

    assert extractor.extract(binary_path) == []

def test_missing_binary_returns_empty_symbols(tmp_path):
    binary_path = tmp_path / "missing.exe"

    extractor = BinarySymbolExtractor()

    result = extractor.extract(binary_path)

    assert result == {
        "imports": [],
        "exports": [],
    }

def test_detects_crypto_from_strings():
    detector = CryptoSignatureDetector()

    strings = [
        "some_application",
        "OpenSSL",
        "EVP_aes_256_gcm",
        "normal_string",
    ]

    symbols = {
        "imports": [],
        "exports": [],
    }

    matches = detector.detect(strings, symbols)

    names = [match.name for match in matches]

    assert "OpenSSL" in names
    assert "EVP_aes_256" in names


def test_detects_crypto_from_symbols():
    detector = CryptoSignatureDetector()

    strings = []

    symbols = {
        "imports": [
            "RSA_public_encrypt",
            "ECDSA_sign",
        ],
        "exports": [],
    }

    matches = detector.detect(strings, symbols)

    names = [match.name for match in matches]

    assert "RSA_public_encrypt" in names
    assert "ECDSA_sign" in names


def test_no_crypto_indicators():
    detector = CryptoSignatureDetector()

    strings = [
        "hello",
        "application_start",
        "database_connect",
    ]

    symbols = {
        "imports": [],
        "exports": [],
    }

    matches = detector.detect(strings, symbols)

    assert matches == []

def test_binary_scanner_ignores_unknown_file(tmp_path):
    file_path = tmp_path / "hello.txt"
    file_path.write_text("hello")

    scanner = BinaryScanner()

    findings = scanner.scan(file_path)

    assert findings == []


def test_binary_scanner_name():
    scanner = BinaryScanner()

    assert scanner.name == "Binary Crypto Scanner"

def test_demo_binary_scanner(tmp_path):
    source = Path("backend/data/demo/binaries/demo_crypto.cpp")
    output = tmp_path / "demo_crypto.exe"

    if shutil.which("g++") is None:
        return

    subprocess.run(
        ["g++", str(source), "-o", str(output)],
        check=True,
    )

    scanner = BinaryScanner()
    findings = scanner.scan(output)

    algorithms = [finding.algorithm for finding in findings]

    assert "AES" in algorithms
    assert "RSA" in algorithms
    assert "ECDSA" in algorithms
    assert "ECDH" in algorithms
    assert "SHA-256" in algorithms
    assert "SHA-1" in algorithms
    assert "MD5" in algorithms