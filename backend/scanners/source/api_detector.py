from ...schemas.finding import Finding
from .algorithm_rules import api_signatures_for_language, detect_mode_on_line
from .key_size_extractor import extract_key_size_from_match

API_CONFIDENCE = 0.75

# algorithms for which a detected block-cipher mode is meaningful to
# capture in finding metadata (only symmetric block ciphers have a mode)
_MODE_AWARE_ALGORITHMS = {"AES", "DES", "3DES"}


def detect_api_signatures(file_path: str, source_text: str, language: str):
    findings = []
    signatures = api_signatures_for_language(language)
    if not signatures:
        return findings

    lines = source_text.splitlines()

    for sig in signatures:
        for line_no, line in enumerate(lines, start=1):
            match = sig["compiled"].search(line)
            if not match:
                continue

            key_size = extract_key_size_from_match(match, sig["algorithm"])
            mode = None
            if sig["algorithm"] in _MODE_AWARE_ALGORITHMS:
                mode = detect_mode_on_line(line)

            # A signature can pin a fixed variant (e.g. algorithm="EdDSA",
            # variant="Ed25519") when the call site names a specific curve
            # or construction that isn't derivable from key size or mode.
            # This matters beyond cosmetics: `algorithm` must be a
            # CycloneDX cryptographic-asset registry family name (e.g.
            # "EdDSA", "ChaCha20") for Rishi's CBOM generator to validate;
            # the specific variant/curve name belongs in `variant`, never
            # in `algorithm` itself.
            fixed_variant = sig.get("variant")
            if fixed_variant:
                variant = fixed_variant
            else:
                variant_parts = [sig["algorithm"]]
                if key_size:
                    variant_parts.append(str(key_size))
                variant = "-".join(variant_parts) if len(variant_parts) > 1 else None

            findings.append(Finding(
                artifact_type="source",
                algorithm=sig["algorithm"],
                primitive_type=sig["primitive_type"],
                variant=variant,
                key_size=key_size,
                library=sig.get("library"),
                library_version=None,
                asset_path=file_path,
                line_start=line_no,
                line_end=line_no,
                detection_method="API_SIGNATURE",
                confidence=API_CONFIDENCE,
                evidence=line.strip()[:200],
                metadata={"mode": mode} if mode else {},
            ))
    return findings