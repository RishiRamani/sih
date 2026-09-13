from pathlib import Path
from html import escape

from ..schemas.scan import ScanResult


def render_html(result: ScanResult) -> str:
    template = Path(__file__).parent / "templates" / "report.html"
    body = template.read_text(encoding="utf-8")
    high_risk = []
    for index, finding in enumerate(result.findings):
        intel = result.intelligence[index] if index < len(result.intelligence) else None
        level = (intel.risk_assessment.risk.get("severity", "LOW") if intel else "LOW")
        if str(level).upper() in {"HIGH", "CRITICAL"}:
            high_risk.append(finding)
    finding_rows = "".join(
        f"<tr><td>{escape(f.algorithm or 'Unknown')}</td><td>{escape(f.asset_path)}</td>"
        f"<td>{escape(f.artifact_type)}</td><td>{escape(f.evidence or '')}</td></tr>"
        for f in high_risk
    ) or '<tr><td colspan="4">No high-risk findings.</td></tr>'
    inventory_rows = "".join(
        f"<tr><td>{escape(f.algorithm or 'Unknown')}</td><td>{escape(f.asset_path)}</td>"
        f"<td>{escape(f.artifact_type)}</td><td>{f.confidence:.0%}</td></tr>"
        for f in result.findings
    ) or '<tr><td colspan="4">No cryptographic findings.</td></tr>'
    recommendations = "".join(
        f"<li><strong>{escape(i.algorithm or 'Unknown')}</strong>: "
        f"{escape(i.recommendation.direction)} - {escape(i.recommendation.reason)}</li>"
        for i in result.intelligence if i.recommendation.direction != "NONE"
    ) or "<li>No recommendations generated.</li>"
    replacements = {
        "{{ target }}": escape(result.target_path),
        "{{ scan_id }}": escape(result.scan_id or "unknown"),
        "{{ total_findings }}": str(result.total_findings),
        "{{ high_risk_rows }}": finding_rows,
        "{{ inventory_rows }}": inventory_rows,
        "{{ recommendations }}": recommendations,
        "{{ coverage }}": escape(result.coverage.model_dump_json(indent=2)),
    }
    for key, value in replacements.items():
        body = body.replace(key, value)
    return body