import json
from pathlib import Path

from jsonschema import Draft202012Validator


SCHEMA_PATH = (
    Path(__file__).resolve().parents[1]
    / "data"
    / "schemas"
    / "cyclonedx-1.7.schema.json"
)


def validate_cbom_json(cbom_json: str) -> list[str]:
    """
    Validate serialized CBOM JSON against the official
    CycloneDX 1.7 JSON schema.

    Returns an empty list when valid.
    """

    document = json.loads(cbom_json)

    with SCHEMA_PATH.open("r", encoding="utf-8") as file:
        schema = json.load(file)

    validator = Draft202012Validator(schema)

    errors = sorted(
        validator.iter_errors(document),
        key=lambda error: list(error.absolute_path),
    )

    return [
        f"{'/'.join(str(part) for part in error.absolute_path)}: "
        f"{error.message}"
        for error in errors
    ]