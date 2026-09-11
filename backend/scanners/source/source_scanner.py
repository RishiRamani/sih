from .file_enumerator import enumerate_source_files
from .regex_detector import detect_lexical
from .api_detector import detect_api_signatures
from .ast_detector import detect_ast
from .custom_crypto import detect_custom_crypto

# detection-method precedence, used only to decide which method label
# "wins" when the same underlying usage is confirmed by multiple layers
_METHOD_RANK = {"AST": 3, "API_SIGNATURE": 2, "LEXICAL": 1, "CUSTOM_HEURISTIC": 1}


def _read_file(path: str):
    try:
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()
    except OSError:
        return None


def _merge_duplicates(findings):
    """Findings that point at the same (file, line, algorithm) are merged
    into one, keeping the higher confidence and combining detection
    methods. This is the multi-signal dedup described in
    SYSTEM_DESIGN.md section 19 ("Multi-Signal Detection and
    Deduplication")."""
    merged = {}
    for finding in findings:
        key = (finding.asset_path, finding.line_start, finding.algorithm)
        existing = merged.get(key)
        if existing is None:
            merged[key] = finding
            continue

        methods = sorted(
            {existing.detection_method, finding.detection_method},
            key=lambda m: -_METHOD_RANK.get(m, 0),
        )
        winner = existing if existing.confidence >= finding.confidence else finding
        winner.detection_method = "+".join(methods)
        winner.confidence = min(1.0, max(existing.confidence, finding.confidence) + 0.05 * (len(methods) - 1))
        merged[key] = winner

    return list(merged.values())


def scan_source(root_path: str):
    supported_files, unsupported_files, skipped_oversize = enumerate_source_files(root_path)

    all_findings = []
    parse_errors = []

    for entry in supported_files:
        text = _read_file(entry.path)
        if text is None:
            parse_errors.append(entry.path)
            continue

        file_findings = []
        file_findings += detect_lexical(entry.path, text, entry.language)
        file_findings += detect_api_signatures(entry.path, text, entry.language)
        file_findings += detect_ast(entry.path, text, entry.language)
        file_findings += detect_custom_crypto(entry.path, text, entry.language)

        all_findings.extend(_merge_duplicates(file_findings))

    coverage = {
        "files_scanned": len(supported_files),
        "files_unsupported": len(unsupported_files),
        "files_skipped_oversize": len(skipped_oversize),
        "files_parse_error": len(parse_errors),
        "unsupported_paths": unsupported_files,
        "parse_error_paths": parse_errors,
    }

    return [f.to_dict() for f in all_findings], coverage