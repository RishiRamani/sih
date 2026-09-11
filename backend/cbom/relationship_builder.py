from ..schemas.cbom import CBOMRelationship
from ..schemas.finding import Finding
from .identifiers import component_fingerprint


def build_relationships(
    findings: list[Finding],
) -> list[CBOMRelationship]:
    """
    Build relationships between logical CBOM components.
    """

    relationships: list[CBOMRelationship] = []
    seen: set[tuple[str, str, str]] = set()

    for i, source in enumerate(findings):
        for target in findings[i + 1:]:
            if source.asset_path != target.asset_path:
                continue

            source_id = component_fingerprint(source)
            target_id = component_fingerprint(target)

            if source_id == target_id:
                continue

            relationship = (
                source_id,
                target_id,
                "related_to",
            )

            if relationship in seen:
                continue

            seen.add(relationship)

            relationships.append(
                CBOMRelationship(
                    source=source_id,
                    target=target_id,
                    relationship="related_to",
                )
            )

    return relationships