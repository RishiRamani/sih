from uuid import uuid4

from ..normalization.deduplication import finding_fingerprint
from ..schemas.cbom import (
    AlgorithmProperties,
    CBOM,
    CBOMComponent,
    CBOMDependency,
    CBOMProperty,
    CryptoProperties,
    CertificateProperties,
)
from ..schemas.finding import Finding
from .identifiers import (
    application_fingerprint,
    component_fingerprint,
    crypto_asset_type,
    library_fingerprint,
)

def _certificate_properties(
    finding: Finding,
) -> CertificateProperties:
    """
    Map an ECDAT certificate finding into CycloneDX
    certificate properties.
    """

    return CertificateProperties(
        serial_number=finding.metadata.get("serial_number"),
        subject_name=finding.metadata.get("subject"),
        issuer_name=finding.metadata.get("issuer"),
        not_valid_before=finding.metadata.get(
            "not_valid_before"
        ),
        not_valid_after=finding.metadata.get(
            "not_valid_after"
        ),
    )

def build_dependencies(
    findings: list[Finding],
) -> list[CBOMDependency]:
    """
    Build CycloneDX dependency relationships.

    Applications depend on discovered libraries.
    Libraries provide discovered cryptographic assets.
    """

    dependencies_by_ref: dict[str, CBOMDependency] = {}

    for finding in findings:
        if not finding.library:
            continue

        application_id = application_fingerprint(finding)

        library_id = library_fingerprint(
            finding.library,
            finding.library_version,
        )

        # Application -> Library
        application_dependency = dependencies_by_ref.setdefault(
            application_id,
            CBOMDependency(ref=application_id),
        )

        if library_id not in application_dependency.depends_on:
            application_dependency.depends_on.append(library_id)

        # Make sure the library itself has a dependency entry.
        library_dependency = dependencies_by_ref.setdefault(
            library_id,
            CBOMDependency(ref=library_id),
        )

        # Library -> Crypto asset
        if (
            finding.artifact_type == "crypto_algorithm"
            and finding.algorithm
        ):
            crypto_id = component_fingerprint(finding)

            if crypto_id not in library_dependency.provides:
                library_dependency.provides.append(crypto_id)

    return list(dependencies_by_ref.values())

def generate_cbom(findings: list[Finding]) -> CBOM:
    """
    Convert normalized ECDAT findings into a CycloneDX 1.7 CBOM.
    """

    components_by_id: dict[str, CBOMComponent] = {}
    libraries_by_id: dict[str, CBOMComponent] = {}
    applications_by_id: dict[str, CBOMComponent] = {}

    for finding in findings:
        component_id = component_fingerprint(finding)
        finding_id = finding_fingerprint(finding)
        application_id = application_fingerprint(finding)

        # --------------------------------------------------
        # Application component
        # --------------------------------------------------

        if application_id not in applications_by_id:
            applications_by_id[application_id] = CBOMComponent(
                **{
                    "bom-ref": application_id,
                    "type": "application",
                    "name": application_id.removeprefix(
                        "application|"
                    ),
                    "properties": [],
                }
            )

        # --------------------------------------------------
        # Library component
        # --------------------------------------------------

        if finding.library:
            library_id = library_fingerprint(
                finding.library,
                finding.library_version,
            )

            if library_id not in libraries_by_id:
                libraries_by_id[library_id] = CBOMComponent(
                    **{
                        "bom-ref": library_id,
                        "type": "library",
                        "name": finding.library,
                        "version": finding.library_version,
                        "properties": [
                            CBOMProperty(
                                name="ecdat:assetPath",
                                value=finding.asset_path,
                            )
                        ],
                    }
                )

        # --------------------------------------------------
        # Cryptographic asset
        # --------------------------------------------------

        asset_type = crypto_asset_type(finding)

        # Dependency findings, for example, can create
        # an application and library but not a crypto asset.
        if asset_type is None:
            continue

        if component_id not in components_by_id:
            components_by_id[component_id] = CBOMComponent(
                **{
                    "bom-ref": component_id,
                    "type": "cryptographic-asset",
                    "name": (
                        finding.algorithm
                        or finding.artifact_type
                    ),
                    "cryptoProperties": CryptoProperties(
                        asset_type=asset_type,
                        algorithm_properties=(
                            _algorithm_properties(finding)
                            if asset_type == "algorithm"
                            else None
                        ),
                        certificate_properties=(
                            _certificate_properties(finding)
                            if asset_type == "certificate"
                            else None
                        ),
                    ),
                    "properties": [
                        CBOMProperty(
                            name="ecdat:assetPath",
                            value=finding.asset_path,
                        ),
                        CBOMProperty(
                            name="ecdat:detectionMethod",
                            value=finding.detection_method,
                        ),
                        CBOMProperty(
                            name="ecdat:confidence",
                            value=str(finding.confidence),
                        ),
                        CBOMProperty(
                            name="ecdat:sourceFinding",
                            value=finding_id,
                        ),
                        *(
                            [
                                CBOMProperty(
                                    name="ecdat:signatureAlgorithm",
                                    value=str(
                                        finding.metadata["signature_algorithm"]
                                    ),
                                ),
                                CBOMProperty(
                                    name="ecdat:signatureOid",
                                    value=str(
                                        finding.metadata["signature_oid"]
                                    ),
                                ),
                            ]
                            if asset_type == "certificate"
                            and finding.metadata.get("signature_algorithm")
                            and finding.metadata.get("signature_oid")
                            else []
                        ),
                    ],
                }
            )

            continue

        # --------------------------------------------------
        # Aggregate additional evidence for existing asset
        # --------------------------------------------------

        component = components_by_id[component_id]

        source_finding_exists = any(
            prop.name == "ecdat:sourceFinding"
            and prop.value == finding_id
            for prop in component.properties
        )

        if not source_finding_exists:
            component.properties.append(
                CBOMProperty(
                    name="ecdat:sourceFinding",
                    value=finding_id,
                )
            )

        asset_path_exists = any(
            prop.name == "ecdat:assetPath"
            and prop.value == finding.asset_path
            for prop in component.properties
        )

        if not asset_path_exists:
            component.properties.append(
                CBOMProperty(
                    name="ecdat:assetPath",
                    value=finding.asset_path,
                )
            )

    dependencies = build_dependencies(findings)

    return CBOM(
        serialNumber=f"urn:uuid:{uuid4()}",
        components=[
            *applications_by_id.values(),
            *libraries_by_id.values(),
            *components_by_id.values(),
        ],
        dependencies=dependencies,
    )


def _cyclonedx_algorithm_family(finding: Finding) -> str | None:
    """Normalize scanner algorithm names to CycloneDX 1.7 registry values.

    These are prototype-level heuristics. The exact RSA construction cannot
    always be known from source-level evidence alone.
    """
    algorithm = finding.algorithm
    primitive = finding.primitive_type

    if algorithm == "RSA":
        if primitive == "signature":
            return "RSASSA-PKCS1"
        if primitive == "asymmetric":
            return "RSAES-PKCS1"
        return "RSA"

    mapping = {
        "AES": "AES",
        "DES": "DES",
        "3DES": "3DES",
        "TripleDES": "3DES",
        "ECDSA": "ECDSA",
        "ECDH": "ECDH",
        "DSA": "DSA",
        "DH": "DH",
        "Ed25519": "Ed25519",
        "Ed448": "Ed448",
        "SHA1": "SHA-1",
        "SHA-224": "SHA-2",
        "SHA256": "SHA-2",
        "SHA384": "SHA-2",
        "SHA512": "SHA-2",
        "SHA2": "SHA-2",
        "SHA3": "SHA-3",
        "SHA3-256": "SHA-3",
        "SHA3-384": "SHA-3",
        "SHA3-512": "SHA-3",
        "MD5": "MD5",
        "BLAKE2": "BLAKE2",
    }

    return mapping.get(algorithm, algorithm)


def _cyclonedx_primitive(finding: Finding) -> str | None:
    mapping = {
        "signature": "signature",
        "hash": "hash",
        "symmetric": "block-cipher",
        "asymmetric": "pke",
        "key_exchange": "key-agree",
        "key_agreement": "key-agree",
        "kdf": "kdf",
        "mac": "mac",
        "custom": "other",
        "unknown": "unknown",
    }

    return mapping.get(finding.primitive_type, finding.primitive_type)


def _algorithm_properties(finding: Finding) -> AlgorithmProperties:
    return AlgorithmProperties(
        primitive=_cyclonedx_primitive(finding),
        algorithm_family=_cyclonedx_algorithm_family(finding),
        parameter_set_identifier=(
            str(finding.key_size)
            if finding.key_size is not None
            else finding.variant
        ),
    )