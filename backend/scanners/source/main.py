"""
Standalone CLI to run the source scanner against a directory and print
results as JSON. Useful for local testing and for demoing this module
independently of the rest of the pipeline (WORK_DIVISION.md Integration
Rule 2: "every core subsystem should have a simple direct test").

Usage:
    python -m scanner.source.main <path-to-repo>
"""
import json
import sys

from .source_scanner import scan_source


def main():
    if len(sys.argv) != 2:
        print("Usage: python -m scanner.source.main <path-to-repo>")
        sys.exit(1)

    root = sys.argv[1]
    findings, coverage = scan_source(root)

    print(json.dumps({
        "findings": findings,
        "coverage": coverage,
        "summary": {
            "total_findings": len(findings),
            "high_confidence_count": len([f for f in findings if f["confidence"] >= 0.7]),
            "algorithms_detected": sorted({f["algorithm"] for f in findings if f["algorithm"]}),
        },
    }, indent=2))


if __name__ == "__main__":
    main()