from typing import Any

from pydantic import BaseModel, ConfigDict, Field

class AlgorithmProperties(BaseModel):
    """CycloneDX 1.7 algorithmProperties."""

    model_config = ConfigDict(populate_by_name=True)

    primitive: str | None = None

    algorithm_family: str | None = Field(
        default=None,
        alias="algorithmFamily",
    )

    parameter_set_identifier: str | None = Field(
        default=None,
        alias="parameterSetIdentifier",
    )

    elliptic_curve: str | None = Field(
        default=None,
        alias="ellipticCurve",
    )

    mode: str | None = None
    padding: str | None = None

    crypto_functions: list[str] = Field(
        default_factory=list,
        alias="cryptoFunctions",
    )

    classical_security_level: int | None = Field(
        default=None,
        alias="classicalSecurityLevel",
    )

    nist_quantum_security_level: int | None = Field(
        default=None,
        alias="nistQuantumSecurityLevel",
    )

class CryptoProperties(BaseModel):
    """CycloneDX 1.7 cryptoProperties."""

    model_config = ConfigDict(populate_by_name=True)

    asset_type: str = Field(alias="assetType")

    algorithm_properties: AlgorithmProperties | None = Field(
        default=None,
        alias="algorithmProperties",
    )

    oid: str | None = None


class CBOMComponent(BaseModel):
    """
    CycloneDX cryptographic-asset component.
    """

    model_config = ConfigDict(populate_by_name=True)

    bom_ref: str = Field(alias="bom-ref")
    type: str = "cryptographic-asset"

    name: str
    version: str | None = None

    crypto_properties: CryptoProperties = Field(
        alias="cryptoProperties"
    )

    # ECDAT-specific information can live in CycloneDX properties.
    properties: dict[str, Any] = Field(default_factory=dict)


class CBOMDependency(BaseModel):
    """
    CycloneDX dependency graph entry.
    """

    ref: str
    depends_on: list[str] = Field(
        default_factory=list,
        alias="dependsOn",
    )
    provides: list[str] = Field(default_factory=list)


class CBOM(BaseModel):
    """
    CycloneDX 1.7 CBOM.
    """

    model_config = ConfigDict(populate_by_name=True)

    schema_url: str = Field(
        default="http://cyclonedx.org/schema/bom-1.7.schema.json",
        alias="$schema",
    )

    bom_format: str = Field(
        default="CycloneDX",
        alias="bomFormat",
    )

    spec_version: str = Field(
        default="1.7",
        alias="specVersion",
    )

    serial_number: str = Field(alias="serialNumber")

    version: int = 1

    components: list[CBOMComponent] = Field(
        default_factory=list
    )

    dependencies: list[CBOMDependency] = Field(
        default_factory=list
    )

    metadata: dict[str, Any] = Field(
        default_factory=dict
    )