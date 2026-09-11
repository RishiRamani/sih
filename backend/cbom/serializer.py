import json
from pathlib import Path

from ..schemas.cbom import CBOM


def serialize_cbom(cbom: CBOM) -> str:
    """
    Serialize a CBOM using CycloneDX JSON field names.
    """

    return json.dumps(
        cbom.model_dump(
            by_alias=True,
            exclude_none=True,
        ),
        indent=2,
    )


def save_cbom(cbom: CBOM, output_path: Path) -> None:
    """
    Save a serialized CBOM to disk.
    """

    output_path.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    output_path.write_text(
        serialize_cbom(cbom),
        encoding="utf-8",
    )