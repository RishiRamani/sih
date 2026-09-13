// lib/graph.ts
import type { Finding, RiskLevel } from "@/lib/types";
import { riskRank } from "@/lib/utils";

export interface GraphNode {
  id: string;
  label: string;
  sublabel?: string;
  depth: 0 | 1 | 2 | 3;
  riskLevel?: RiskLevel;
  findingCount: number;
  findingIds: string[];
  children: GraphNode[];
}

interface BuildOptions {
  rootLabel: string;
  groupBy: "sourcePath" | "library";
}

export function buildCryptoGraph(
  findings: Finding[],
  { rootLabel, groupBy }: BuildOptions
): GraphNode {
  const root: GraphNode = {
    id: "root",
    label: rootLabel,
    depth: 0,
    findingCount: findings.length,
    findingIds: findings.map((f) => f.id),
    children: [],
    riskLevel: worstRisk(findings),
  };

  // Group by file or library
  const groupMap = new Map<string, Finding[]>();
  for (const f of findings) {
    const key = groupBy === "sourcePath"
      ? (f.sourcePath ?? `(${f.library ?? "unknown source"})`)
      : (f.library ?? "(unknown library)");
    if (!groupMap.has(key)) groupMap.set(key, []);
    groupMap.get(key)!.push(f);
  }

  for (const [groupKey, groupFindings] of groupMap) {
    const groupNode: GraphNode = {
      id: `group:${groupKey}`,
      label: groupKey,
      depth: 1,
      riskLevel: worstRisk(groupFindings),
      findingCount: groupFindings.length,
      findingIds: groupFindings.map((f) => f.id),
      children: [],
    };

    // Group by algorithm
    const algoMap = new Map<string, Finding[]>();
    for (const f of groupFindings) {
      const key = `${f.algorithm}${f.keySize && f.keySize !== "Unknown" ? `-${f.keySize}` : ""}${f.variant ? ` (${f.variant})` : ""}`;
      if (!algoMap.has(key)) algoMap.set(key, []);
      algoMap.get(key)!.push(f);
    }

    for (const [algoKey, algoFindings] of algoMap) {
      const algoNode: GraphNode = {
        id: `algo:${groupKey}:${algoKey}`,
        label: algoKey,
        depth: 2,
        riskLevel: worstRisk(algoFindings),
        findingCount: algoFindings.length,
        findingIds: algoFindings.map((f) => f.id),
        children: [],
      };

      // Group by primitive type (the crypto purpose)
      const primMap = new Map<string, Finding[]>();
      for (const f of algoFindings) {
        const key = f.primitiveType;
        if (!primMap.has(key)) primMap.set(key, []);
        primMap.get(key)!.push(f);
      }

      for (const [prim, primFindings] of primMap) {
        algoNode.children.push({
          id: `prim:${groupKey}:${algoKey}:${prim}`,
          label: humanPrimitive(prim),
          depth: 3,
          riskLevel: worstRisk(primFindings),
          findingCount: primFindings.length,
          findingIds: primFindings.map((f) => f.id),
          children: [],
        });
      }

      groupNode.children.push(algoNode);
    }

    root.children.push(groupNode);
  }

  return root;
}

function worstRisk(findings: Finding[]): RiskLevel | undefined {
  if (findings.length === 0) return undefined;
  return findings.reduce<RiskLevel>((worst, f) => {
    return riskRank(f.riskLevel) > riskRank(worst) ? f.riskLevel : worst;
  }, "LOW");
}

function humanPrimitive(p: string): string {
  const map: Record<string, string> = {
    SYMMETRIC_CIPHER: "Encryption",
    ASYMMETRIC_CIPHER: "Encryption",
    KEY_EXCHANGE: "Key Establishment",
    DIGITAL_SIGNATURE: "Digital Signature",
    HASH: "Hashing",
    MAC: "Integrity",
    KDF: "Key Derivation",
    RNG: "Randomness",
    CERTIFICATE: "Certificate",
    PROTOCOL: "Protocol",
    CUSTOM_UNKNOWN: "Custom / Unknown",
  };
  return map[p] ?? p;
}