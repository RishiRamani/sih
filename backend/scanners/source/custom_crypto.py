import ast
from schemas.finding import Finding

CUSTOM_CRYPTO_CONFIDENCE = 0.4  # advisory only, not a proven detection

_MIN_SCORE_TO_FLAG = 3


class _FunctionHeuristic:
    def __init__(self):
        self.score = 0
        self.indicators = []
        self.has_loop = False

    def evaluate(self, func_node: ast.FunctionDef):
        for child in ast.walk(func_node):
            if isinstance(child, ast.BinOp):
                if isinstance(child.op, ast.BitXor):
                    self.score += 1
                    self.indicators.append("Repeated XOR transformation")
                if isinstance(child.op, (ast.LShift, ast.RShift)):
                    self.score += 1
                    self.indicators.append("Bit rotation/shift operation")
            if isinstance(child, (ast.For, ast.While)):
                self.has_loop = True

        arg_names = {a.arg.lower() for a in func_node.args.args}
        has_key_param = any("key" in name for name in arg_names)

        if has_key_param and self.has_loop and self.score > 0:
            self.score += 1
            self.indicators.append("Key-dependent byte manipulation")

        if self.has_loop and self.score > 0:
            self.score += 1
            self.indicators.append("Iterative transformation over data")


def detect_custom_crypto(file_path: str, source_text: str, language: str):
    if language != "python":
        return []

    try:
        tree = ast.parse(source_text, filename=file_path)
    except SyntaxError:
        return []

    findings = []
    for node in ast.walk(tree):
        if not isinstance(node, ast.FunctionDef):
            continue

        heuristic = _FunctionHeuristic()
        heuristic.evaluate(node)

        if heuristic.score >= _MIN_SCORE_TO_FLAG:
            findings.append(Finding(
                artifact_type="source",
                algorithm=None,
                primitive_type="custom",
                variant="potential_custom_crypto",
                key_size=None,
                library=None,
                library_version=None,
                asset_path=file_path,
                line_start=node.lineno,
                line_end=getattr(node, "end_lineno", node.lineno),
                detection_method="CUSTOM_HEURISTIC",
                confidence=CUSTOM_CRYPTO_CONFIDENCE,
                evidence="; ".join(dict.fromkeys(heuristic.indicators))[:300],
            ))
    return findings