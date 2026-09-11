import json

from backend.scanners.dependency.dependency_scanner import DependencyScanner


def get_libraries(findings):
    return {finding.library for finding in findings}


def test_package_json_crypto_dependencies(tmp_path):
    package_json = tmp_path / "package.json"

    package_json.write_text(
        json.dumps(
            {
                "dependencies": {
                    "crypto-js": "^4.2.0",
                    "express": "^5.0.0",
                    "jsonwebtoken": "^9.0.2",
                }
            }
        ),
        encoding="utf-8",
    )

    scanner = DependencyScanner()
    findings = scanner.scan(package_json)

    assert len(findings) == 2

    libraries = get_libraries(findings)

    assert "crypto-js" in libraries
    assert "jsonwebtoken" in libraries
    assert "express" not in libraries


def test_requirements_txt_crypto_dependencies(tmp_path):
    requirements = tmp_path / "requirements.txt"

    requirements.write_text(
        """
        fastapi==0.116.1
        cryptography==46.0.1
        requests>=2.32.0
        pycryptodome==3.23.0
        """,
        encoding="utf-8",
    )

    scanner = DependencyScanner()
    findings = scanner.scan(requirements)

    libraries = get_libraries(findings)

    assert "cryptography" in libraries
    assert "pycryptodome" in libraries
    assert "fastapi" not in libraries
    assert "requests" not in libraries


def test_pyproject_toml_crypto_dependencies(tmp_path):
    pyproject = tmp_path / "pyproject.toml"

    pyproject.write_text(
        """
        [project]
        name = "demo"
        version = "1.0.0"

        dependencies = [
            "fastapi>=0.100.0",
            "cryptography>=42.0.0",
            "requests>=2.0.0"
        ]

        [project.optional-dependencies]
        security = [
            "pycryptodome>=3.0"
        ]
        """,
        encoding="utf-8",
    )

    scanner = DependencyScanner()
    findings = scanner.scan(pyproject)

    libraries = get_libraries(findings)

    assert "cryptography" in libraries
    assert "pycryptodome" in libraries
    assert "fastapi" not in libraries
    assert "requests" not in libraries


def test_pom_xml_crypto_dependencies(tmp_path):
    pom = tmp_path / "pom.xml"

    pom.write_text(
        """
        <project xmlns="http://maven.apache.org/POM/4.0.0">
            <dependencies>
                <dependency>
                    <groupId>org.bouncycastle</groupId>
                    <artifactId>bcprov-jdk18on</artifactId>
                    <version>1.78.1</version>
                </dependency>

                <dependency>
                    <groupId>org.springframework</groupId>
                    <artifactId>spring-core</artifactId>
                    <version>6.2.0</version>
                </dependency>
            </dependencies>
        </project>
        """,
        encoding="utf-8",
    )

    scanner = DependencyScanner()
    findings = scanner.scan(pom)

    libraries = get_libraries(findings)

    assert "org.bouncycastle:bcprov-jdk18on" in libraries
    assert "org.springframework:spring-core" not in libraries


def test_gradle_crypto_dependencies(tmp_path):
    gradle = tmp_path / "build.gradle"

    gradle.write_text(
        """
        plugins {
            id 'java'
        }

        dependencies {
            implementation 'org.bouncycastle:bcprov-jdk18on:1.78.1'
            implementation 'org.springframework:spring-core:6.2.0'
        }
        """,
        encoding="utf-8",
    )

    scanner = DependencyScanner()
    findings = scanner.scan(gradle)

    libraries = get_libraries(findings)

    assert "org.bouncycastle:bcprov-jdk18on" in libraries
    assert "org.springframework:spring-core" not in libraries


def test_cmake_crypto_dependencies(tmp_path):
    cmake = tmp_path / "CMakeLists.txt"

    cmake.write_text(
        """
        cmake_minimum_required(VERSION 3.20)

        project(CryptoDemo)

        find_package(OpenSSL REQUIRED)
        find_package(Boost 1.80 REQUIRED)
        """,
        encoding="utf-8",
    )

    scanner = DependencyScanner()
    findings = scanner.scan(cmake)

    libraries = get_libraries(findings)

    assert "openssl" in libraries
    assert "Boost" not in libraries