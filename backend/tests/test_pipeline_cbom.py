from pathlib import Path

from backend.orchestration.pipeline import ScanPipeline
from backend.scanners.certificate.certificate_scanner import (
    CertificateScanner,
)


def test_pipeline_generates_cbom_from_scanner() -> None:
    certificate = Path(
        "backend/data/demo/certificates/server.crt"
    )

    pipeline = ScanPipeline(
        scanners=[
            CertificateScanner(),
        ]
    )

    result = pipeline.run(certificate)

    assert len(result.findings) == 1

    assert result.findings[0].artifact_type == "certificate"

    certificate_assets = [
        component
        for component in result.cbom.components
        if (
            component.type == "cryptographic-asset"
            and component.crypto_properties.asset_type
            == "certificate"
        )
    ]

    assert len(certificate_assets) == 1