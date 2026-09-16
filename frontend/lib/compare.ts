import type { Finding, RiskLevel } from "@/lib/types";
import type { Grade } from "@/lib/grade";

export interface FindingDelta {
  /** A stable key that identifies the same artefact across scans */
  key: string;
  algorithm: string;
  sourcePath: string | null;
  library: string | null;
  oldFinding: Finding | null;
  newFinding: Finding | null;
}

export interface ScanComparison {
  removed: FindingDelta[];     // present in old, gone in new (FIXED)
  added: FindingDelta[];       // present in new, not old (NEW RISK)
  unchanged: FindingDelta[];   // present in both
  changedRisk: FindingDelta[]; // present in both but with different riskLevel
  counts: {
    oldTotal: number;
    newTotal: number;
    removedCount: number;
    addedCount: number;
    unchangedCount: number;
    improvedRiskCount: number;
    regressedRiskCount: number;
  };
}

/**
 * A finding's "identity" across scans — what makes it the same artefact.
 * Algorithm + normalized path is the correct granularity: the same MD5 use
 * in the same file is the same finding; the same MD5 in a different file is
 * a different finding.
 */
function findingKey(f: Finding): string {
  const path = (f.sourcePath ?? "").replace(/\\/g, "/").toLowerCase();
  const algo = f.algorithm.toUpperCase();
  const variant = (f.variant ?? "").toLowerCase();
  return `${path}::${algo}::${variant}`;
}

const RISK_RANK: Record<RiskLevel, number> = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
  CRITICAL: 3,
};

export function compareScans(
  oldFindings: Finding[],
  newFindings: Finding[]
): ScanComparison {
  const oldMap = new Map<string, Finding>();
  const newMap = new Map<string, Finding>();

  oldFindings.forEach((f) => oldMap.set(findingKey(f), f));
  newFindings.forEach((f) => newMap.set(findingKey(f), f));

  const removed: FindingDelta[] = [];
  const added: FindingDelta[] = [];
  const unchanged: FindingDelta[] = [];
  const changedRisk: FindingDelta[] = [];
  let improvedRiskCount = 0;
  let regressedRiskCount = 0;

  // Iterate old — find what was removed or changed
  oldMap.forEach((oldF, key) => {
    const newF = newMap.get(key);
    const delta: FindingDelta = {
      key,
      algorithm: oldF.algorithm,
      sourcePath: oldF.sourcePath ?? null,
      library: oldF.library ?? null,
      oldFinding: oldF,
      newFinding: newF ?? null,
    };

    if (!newF) {
      removed.push(delta);
    } else if (RISK_RANK[newF.riskLevel] !== RISK_RANK[oldF.riskLevel]) {
      changedRisk.push(delta);
      if (RISK_RANK[newF.riskLevel] < RISK_RANK[oldF.riskLevel]) {
        improvedRiskCount += 1;
      } else {
        regressedRiskCount += 1;
      }
    } else {
      unchanged.push(delta);
    }
  });

  // Iterate new — find what was added
  newMap.forEach((newF, key) => {
    if (!oldMap.has(key)) {
      added.push({
        key,
        algorithm: newF.algorithm,
        sourcePath: newF.sourcePath ?? null,
        library: newF.library ?? null,
        oldFinding: null,
        newFinding: newF,
      });
    }
  });

  // Sort each bucket for stable display
  const byAlgo = (a: FindingDelta, b: FindingDelta) =>
    a.algorithm.localeCompare(b.algorithm) ||
    (a.sourcePath ?? "").localeCompare(b.sourcePath ?? "");

  removed.sort(byAlgo);
  added.sort(byAlgo);
  changedRisk.sort(byAlgo);
  unchanged.sort(byAlgo);

  return {
    removed,
    added,
    unchanged,
    changedRisk,
    counts: {
      oldTotal: oldFindings.length,
      newTotal: newFindings.length,
      removedCount: removed.length,
      addedCount: added.length,
      unchangedCount: unchanged.length,
      improvedRiskCount,
      regressedRiskCount,
    },
  };
}

import { GRADE_RANK } from "@/lib/grade-style";

export function comparisonVerdict(
  oldGrade: Grade,
  newGrade: Grade
): {
  verdict: "improved" | "regressed" | "unchanged";
  tone: "teal" | "crimson" | "accent";
  text: string;
} {
  const oldRank = GRADE_RANK[oldGrade];
  const newRank = GRADE_RANK[newGrade];

  if (newRank > oldRank) {
    return {
      verdict: "improved",
      tone: "teal",
      text: `Grade improved from ${oldGrade} to ${newGrade}.`,
    };
  }
  if (newRank < oldRank) {
    return {
      verdict: "regressed",
      tone: "crimson",
      text: `Grade regressed from ${oldGrade} to ${newGrade}.`,
    };
  }
  return {
    verdict: "unchanged",
    tone: "accent",
    text: `Grade unchanged at ${newGrade}.`,
  };
}