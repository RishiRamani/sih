import tarfile

from scanners.container.image_inspector import ContainerImageInspector
from scanners.container.package_detector import ContainerPackageDetector
from scanners.container.container_scanner import ContainerScanner

def create_test_archive(path):
    with tarfile.open(path, "w") as archive:
        info = tarfile.TarInfo("app/config.json")
        data = b'{"name": "test"}'

        info.size = len(data)

        import io

        archive.addfile(
            info,
            io.BytesIO(data),
        )


def test_inspect_container_archive(tmp_path):
    archive_path = tmp_path / "image.tar"

    create_test_archive(archive_path)

    inspector = ContainerImageInspector()

    results = inspector.inspect(archive_path)

    assert len(results) == 1
    assert results[0]["path"] == "app/config.json"
    assert results[0]["size"] > 0


def test_ignores_non_tar_file(tmp_path):
    file_path = tmp_path / "hello.txt"
    file_path.write_text("hello")

    inspector = ContainerImageInspector()

    assert inspector.inspect(file_path) == []


def test_missing_archive(tmp_path):
    archive_path = tmp_path / "missing.tar"

    inspector = ContainerImageInspector()

    assert inspector.inspect(archive_path) == []


def test_rejects_path_traversal(tmp_path):
    archive_path = tmp_path / "malicious.tar"

    with tarfile.open(archive_path, "w") as archive:
        info = tarfile.TarInfo("../../evil.txt")
        data = b"malicious"

        info.size = len(data)

        import io

        archive.addfile(
            info,
            io.BytesIO(data),
        )

    inspector = ContainerImageInspector()

    results = inspector.inspect(archive_path)

    assert results == []

def test_detects_openssl_library():
    detector = ContainerPackageDetector()

    files = [
        {
            "path": "usr/lib/libcrypto.so.3",
            "size": 123456,
        },
        {
            "path": "usr/bin/myapp",
            "size": 50000,
        },
    ]

    findings = detector.detect(files)

    assert len(findings) == 1
    assert findings[0]["library"] == "OpenSSL"
    assert findings[0]["path"] == "usr/lib/libcrypto.so.3"
    assert findings[0]["detection_method"] == "CONTAINER_PACKAGE_MATCH"


def test_detects_libsodium():
    detector = ContainerPackageDetector()

    files = [
        {
            "path": "usr/lib/libsodium.so.23",
            "size": 100000,
        }
    ]

    findings = detector.detect(files)

    assert len(findings) == 1
    assert findings[0]["library"] == "libsodium"


def test_ignores_unrelated_files():
    detector = ContainerPackageDetector()

    files = [
        {
            "path": "usr/bin/python",
            "size": 50000,
        },
        {
            "path": "app/server.js",
            "size": 10000,
        },
    ]

    findings = detector.detect(files)

    assert findings == []


def test_ignores_missing_path():
    detector = ContainerPackageDetector()

    files = [
        {
            "size": 100,
        },
        {
            "path": "",
            "size": 200,
        },
    ]

    findings = detector.detect(files)

    assert findings == []

def test_container_scanner_name():
    scanner = ContainerScanner()

    assert scanner.name == "Container Crypto Scanner"


def test_container_scanner_ignores_non_tar(tmp_path):
    file_path = tmp_path / "hello.txt"
    file_path.write_text("hello")

    scanner = ContainerScanner()

    assert scanner.scan(file_path) == []


def test_container_scanner_missing_archive(tmp_path):
    archive_path = tmp_path / "missing.tar"

    scanner = ContainerScanner()

    assert scanner.scan(archive_path) == []