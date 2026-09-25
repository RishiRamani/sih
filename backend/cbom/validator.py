# backend/cbom/validator.py
import json
from pathlib import Path

from jsonschema import Draft202012Validator
from referencing import Registry, Resource
from referencing.jsonschema import DRAFT202012


SCHEMA_DIR = Path(__file__).resolve().parents[1] / "data" / "schemas"

BOM_PATH = SCHEMA_DIR / "cyclonedx-1.7.schema.json"
CRYPTO_DEFS_PATH = SCHEMA_DIR / "cryptography-defs.schema.json"
JSF_PATH = SCHEMA_DIR / "jsf-0.82.schema.json"


def _load_resource(path: Path) -> Resource:
    with path.open("r", encoding="utf-8") as f:
        return Resource.from_contents(
            json.load(f),
            default_specification=DRAFT202012,
        )


def _build_registry() -> Registry:
    """
    Map the remote URLs referenced inside the CycloneDX schema to local
    files so validation never touches the network.
    """
    return Registry().with_resources([
        (
            "http://cyclonedx.org/schema/bom-1.7.schema.json",
            _load_resource(BOM_PATH),
        ),
        (
            "http://cyclonedx.org/schema/cryptography-defs.schema.json",
            _load_resource(CRYPTO_DEFS_PATH),
        ),
        (
            "http://cyclonedx.org/schema/jsf-0.82.schema.json",
            _load_resource(JSF_PATH),
        ),
    ])


def validate_cbom_json(cbom_json: str) -> list[str]:
    """
    Validate serialized CBOM JSON against the official CycloneDX 1.7
    JSON schema.

    All `$ref`s resolve from local files. Returns an empty list when valid.
    """

    document = json.loads(cbom_json)

    with BOM_PATH.open("r", encoding="utf-8") as file:
        schema = json.load(file)

    validator = Draft202012Validator(schema, registry=_build_registry())

    errors = sorted(
        validator.iter_errors(document),
        key=lambda error: list(error.absolute_path),
    )

    return [
        f"{'/'.join(str(part) for part in error.absolute_path)}: "
        f"{error.message}"
        for error in errors
    ]