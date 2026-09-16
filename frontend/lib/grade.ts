import type { Finding, RiskLevel, Scan } from "@/lib/types";
import { INPUT_TYPE_LABEL } from "@/lib/utils";

export type Grade = "A" | "B" | "C" | "D" | "E" | "F";

export interface GradeResult {
  grade: Grade;
  directive: string;
  subtext: string;
  rationale: string;
  contributingFindings: Finding[];
  coverageWarning: string | null;
  counts: GradeCounts;
}

export interface GradeCounts {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  quantumBroken: number;
}

const QUANTUM_SAFE_ALGOS = [
  "AES",
  "CHACHA20",
  "POLY1305",
  "SHA-256",
  "SHA256",
  "SHA-384",
  "SHA384",
  "SHA-512",
  "SHA512",
  "SHA-3",
  "SHA3",
  "BLAKE2",
  "BLAKE3",
  "ML-KEM",
  "KYBER",
  "ML-DSA",
  "DILITHIUM",
  "SLH-DSA",
  "SPHINCS",
];

function isQuantumSafe(f: Finding): boolean {
  const a = f.algorithm.toUpperCase();
  return QUANTUM_SAFE_ALGOS.some((safe) => a.includes(safe));
}

export function countFindings(findings: Finding[]): GradeCounts {
  return {
    total: findings.length,
    critical: findings.filter((f) => f.riskLevel === "CRITICAL").length,
    high: findings.filter((f) => f.riskLevel === "HIGH").length,
    medium: findings.filter((f) => f.riskLevel === "MEDIUM").length,
    low: findings.filter((f) => f.riskLevel === "LOW").length,
    quantumBroken: findings.filter(
      (f) => f.quantumStatus === "BROKEN" || f.quantumStatus === "WEAK"
    ).length,
  };
}

const RISK_RANK: Record<RiskLevel, number> = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
  CRITICAL: 3,
};

/**
 * Six-tier grading — evaluated top-down, first match wins.
 *
 *   A  — all quantum-safe, no high/critical
 *   B  — few mediums, no highs, no criticals
 *   C  — some highs (≤5), no criticals
 *   D  — many highs (>5), OR exactly 1 critical with low quantum exposure
 *   E  — 2–3 criticals, OR 1 critical with heavy quantum exposure
 *   F  — 4+ criticals, OR multiple criticals + heavy quantum exposure
 */
export function computeGrade(
  findings: Finding[],
  scan: Scan | null
): GradeResult {
  const c = countFindings(findings);

  if (c.total === 0) {
    const inputType = scan?.inputType;
    const maybeUnparsed =
      inputType === "CERTIFICATE" ||
      inputType === "BINARY_LIBRARY" ||
      inputType === "CONTAINER_IMAGE" ||
      inputType === "DEPENDENCY_MANIFEST";

    if (maybeUnparsed && inputType) {
      const label = INPUT_TYPE_LABEL[inputType] ?? "asset";
      return {
        grade: "A",
        directive: "No cryptographic artefacts were detected.",
        subtext: `This ${label.toLowerCase()} scan produced no findings. This may mean the asset contains no cryptography, or the scanner could not parse it.`,
        rationale:
          "Zero findings for a non-source asset is ambiguous. Verify the file type was correctly detected by the backend.",
        contributingFindings: [],
        coverageWarning: `Zero findings from a ${label.toLowerCase()} scan is unusual. Confirm the backend parsed the asset.`,
        counts: c,
      };
    }

    return {
      grade: "A",
      directive: "Nothing to migrate. Sit back and relax.",
      subtext: "This scan produced no cryptographic findings.",
      rationale: "No cryptographic artefacts were detected in this scan.",
      contributingFindings: [],
      coverageWarning: null,
      counts: c,
    };
  }

  const quantumBrokenRatio = c.quantumBroken / c.total;
  const quantumSafeAll = findings.every(isQuantumSafe);

  let grade: Grade;
  let rationale: string;

  // ---- Tiered grading — evaluated in order, first match wins ----
  if (quantumSafeAll && c.critical === 0 && c.high === 0) {
    grade = "A";
    rationale =
      "Every detected algorithm is quantum-safe at this key size. No action required.";
  } else if (c.critical === 0 && c.high === 0 && c.medium <= 2) {
    grade = "B";
    rationale = `Only ${c.medium} medium-risk finding${
      c.medium === 1 ? "" : "s"
    }. No critical or high-risk exposure.`;
  } else if (c.critical === 0 && c.high <= 5) {
    grade = "C";
    rationale = `${c.high} high-risk and ${c.medium} medium-risk findings need review. No critical exposure yet.`;
  } else if (
    (c.critical === 0 && c.high > 5) ||
    (c.critical === 1 && quantumBrokenRatio < 0.25)
  ) {
    grade = "D";
    rationale =
      c.critical === 0
        ? `${c.high} high-risk findings, no criticals. Broad exposure that warrants a migration plan.`
        : `1 critical-risk finding with limited quantum exposure. Plan migration this cycle.`;
  } else if (
    (c.critical >= 2 && c.critical <= 3 && quantumBrokenRatio < 0.5) ||
    (c.critical === 1 && quantumBrokenRatio >= 0.25)
  ) {
    grade = "E";
    rationale = `${c.critical} critical-risk finding${
      c.critical === 1 ? "" : "s"
    } and ${Math.round(quantumBrokenRatio * 100)}% quantum-vulnerable. Migrate soon.`;
  } else {
    grade = "F";
    rationale = `${c.critical} critical-risk findings and ${Math.round(
      quantumBrokenRatio * 100
    )}% quantum-vulnerable. Immediate migration required.`;
  }

  const directive =
    grade === "A" || grade === "B"
      ? "Nothing to migrate. Sit back and relax."
      : grade === "F"
        ? "Start migrating now."
        : grade === "E"
          ? "Prioritize migration this quarter."
          : "Consider migrating the flagged components.";

  const subtext =
    grade === "A"
      ? "All cryptography in this scan meets current and post-quantum guidance."
      : grade === "B"
        ? "Minor medium-risk exposure. No immediate action required."
        : grade === "F"
          ? "This repository has multiple critical weaknesses. Prioritize the findings below."
          : grade === "E"
            ? "Multiple critical components would fail under a CRQC. Migration is urgent."
            : "Some components would not survive a cryptographically relevant quantum computer. Review the recommendations.";

  const contributingFindings = [...findings]
    .sort((a, b) => {
      const riskDiff = RISK_RANK[b.riskLevel] - RISK_RANK[a.riskLevel];
      if (riskDiff !== 0) return riskDiff;
      return b.riskScore - a.riskScore;
    })
    .slice(0, 6);

  return {
    grade,
    directive,
    subtext,
    rationale,
    contributingFindings,
    coverageWarning: null,
    counts: c,
  };
}

export function computeCumulativeGrade(
  findings: Finding[],
  scannedScanCount: number
): GradeResult {
  const base = computeGrade(findings, null);
  if (base.counts.total === 0) {
    return {
      ...base,
      directive: "Nothing to migrate. Sit back and relax.",
      subtext: `No cryptographic findings across ${scannedScanCount} completed scan${
        scannedScanCount === 1 ? "" : "s"
      }.`,
      rationale:
        "No cryptographic artefacts were detected across any completed scan.",
    };
  }
  return {
    ...base,
    rationale: `${base.rationale} (aggregated across ${scannedScanCount} scan${
      scannedScanCount === 1 ? "" : "s"
    })`,
  };
}