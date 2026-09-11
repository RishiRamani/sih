import ast
from ...schemas.finding import Finding

AST_CONFIDENCE = 0.95

# Recognized call patterns, keyed by the resolved dotted call name
# (e.g. "RSA.generate", "hashlib.md5") -> (algorithm, primitive_type, library)
_CALL_ALGORITHM_MAP = {
    "RSA.generate": ("RSA", "asymmetric", "pycryptodome"),
    "hashlib.md5": ("MD5", "hash", "hashlib"),
    "hashlib.sha1": ("SHA1", "hash", "hashlib"),
    "hashlib.sha256": ("SHA256", "hash", "hashlib"),
    "hashlib.sha384": ("SHA384", "hash", "hashlib"),
    "hashlib.sha512": ("SHA512", "hash", "hashlib"),
    "AES.new": ("AES", "symmetric", "pycryptodome"),
    "DES.new": ("DES", "symmetric", "pycryptodome"),
    "hmac.new": ("HMAC", "hash", "hmac"),
    "rsa.generate_private_key": ("RSA", "asymmetric", "cryptography"),
    "dsa.generate_private_key": ("DSA", "signature", "cryptography"),
    "ec.generate_private_key": ("ECDSA", "signature", "cryptography"),
}


class _CallVisitor(ast.NodeVisitor):
    def __init__(self):
        self.matches = []  # (map_key, node)

    def _dotted_name(self, node):
        parts = []
        while isinstance(node, ast.Attribute):
            parts.append(node.attr)
            node = node.value
        if isinstance(node, ast.Name):
            parts.append(node.id)
            return ".".join(reversed(parts))
        return None

    def visit_Call(self, node):
        dotted = None
        if isinstance(node.func, ast.Attribute):
            dotted = self._dotted_name(node.func)
        elif isinstance(node.func, ast.Name):
            dotted = node.func.id

        if dotted:
            if dotted in _CALL_ALGORITHM_MAP:
                self.matches.append((dotted, node))
            else:
                # import aliases can change the prefix (e.g. `crypto.RSA.generate`)
                short = ".".join(dotted.split(".")[-2:])
                if short in _CALL_ALGORITHM_MAP:
                    self.matches.append((short, node))

        self.generic_visit(node)


_PREFERRED_KEYWORD_NAMES = {"key_size", "keysize", "bits", "nbits"}
_IGNORED_KEYWORD_NAMES = {"public_exponent", "e", "iterations"}


def _extract_first_int_arg(node):
    # Prefer an explicitly-named key-size keyword (e.g. key_size=4096) over
    # any other integer argument in the same call (e.g. public_exponent=65537),
    # since both can be present and only one is the actual key length.
    for kw in node.keywords:
        if kw.arg and kw.arg.lower() in _PREFERRED_KEYWORD_NAMES:
            if isinstance(kw.value, ast.Constant) and isinstance(kw.value.value, int):
                return kw.value.value

    for kw in node.keywords:
        if kw.arg and kw.arg.lower() in _IGNORED_KEYWORD_NAMES:
            continue
        if isinstance(kw.value, ast.Constant) and isinstance(kw.value.value, int):
            return kw.value.value

    for arg in node.args:
        if isinstance(arg, ast.Constant) and isinstance(arg.value, int):
            return arg.value

    return None


def detect_ast(file_path: str, source_text: str, language: str):
    if language != "python":
        return []

    try:
        tree = ast.parse(source_text, filename=file_path)
    except SyntaxError:
        # malformed file: surfaced via the orchestrator's coverage/error
        # summary, must not fail the whole scan (SRS NFR-08)
        return []

    lines = source_text.splitlines()
    visitor = _CallVisitor()
    visitor.visit(tree)

    findings = []
    for map_key, node in visitor.matches:
        algorithm, primitive_type, library = _CALL_ALGORITHM_MAP[map_key]
        key_size = _extract_first_int_arg(node)
        line_no = node.lineno
        snippet = lines[line_no - 1].strip()[:200] if 0 < line_no <= len(lines) else None

        findings.append(Finding(
            artifact_type="source",
            algorithm=algorithm,
            primitive_type=primitive_type,
            variant=f"{algorithm}-{key_size}" if key_size else None,
            key_size=key_size,
            library=library,
            library_version=None,
            asset_path=file_path,
            line_start=line_no,
            line_end=getattr(node, "end_lineno", line_no),
            detection_method="AST",
            confidence=AST_CONFIDENCE,
            evidence=snippet,
        ))
    return findings