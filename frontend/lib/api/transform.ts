import type {
  Finding,
  Scan,
  Recommendation,
  RiskLevel,
  Confidence,
  ScanStatus,
  AssetInputType,
  PrimitiveType,
  DetectionMethod,
  ExposureStatus,
  MigrationDirection,
  QuantumReadinessSummary,
  RiskDistributionBucket,
  DashboardSummary,
} from "@/lib/types";
import type {
  BackendFinding,
  BackendIntelligenceAssessment,
  BackendScanResult,
} from "@/lib/types";

// ------------------------------------------------------------------
// SCAN
// ------------------------------------------------------------------

export function toScan(raw: BackendScanResult): Scan {
  const inputType: AssetInputType = inferInputType(raw.target_path);
  const status = normalizeStatus(raw.status);

  return {
    id: raw.scan_id ?? raw.target_path,
    name: displayName(raw.target_path),
    inputType,
    sourceLabel: raw.target_path,
    status,
    progressPercent: status === "COMPLETED" ? 100 : status === "FAILED" ? 34 : 50,
    createdAt: raw.started_at ?? raw.completed_at ?? new Date().toISOString(),
    startedAt: raw.started_at ?? undefined,
    completedAt: raw.completed_at ?? undefined,
    findingCount: raw.total_findings,
    highRiskCount: raw.intelligence.filter(
      (i) => extractRiskLevel(i) === "HIGH" || extractRiskLevel(i) === "CRITICAL"
    ).length,
    errorMessage: raw.error ?? undefined,
  };
}

function displayName(path: string): string {
  const trimmed = path.replace(/[\\/]+$/, "");
  const parts = trimmed.split(/[\\/]/);
  return parts[parts.length - 1] || path;
}

function inferInputType(path: string): AssetInputType {
  const p = path.toLowerCase();
  if (p.startsWith("http") || p.endsWith(".git") || p.includes("github.com")) {
    return "SOURCE_REPOSITORY";
  }
  if (p.endsWith(".zip") || p.endsWith(".tar.gz") || p.endsWith(".tgz")) {
    return "SOURCE_ARCHIVE";
  }
  if (p.endsWith(".jar") || p.endsWith(".dll") || p.endsWith(".so")) {
    return "BINARY_LIBRARY";
  }
  if (p.endsWith(".pem") || p.endsWith(".crt") || p.endsWith(".cer")) {
    return "CERTIFICATE";
  }
  return "SOURCE_REPOSITORY";
}

function normalizeStatus(raw: string): ScanStatus {
  return raw.toUpperCase().replace(/-/g, "_") as ScanStatus;
}

// ------------------------------------------------------------------
// FINDING — backend Finding + paired IntelligenceAssessment
// ------------------------------------------------------------------

export function toFinding(
  raw: BackendFinding,
  intel: BackendIntelligenceAssessment | undefined,
  scanId: string
): Finding {
  const risk = extractRiskLevel(intel);
  const riskScore = extractRiskScore(intel);
  const classicalStatus = extractClassicalStatus(intel);
  const quantumStatus = extractQuantumStatus(intel);
  const assetType = assetTypeForArtifact(raw.artifact_type);

  return {
    id: `${scanId}:${raw.asset_path}:${raw.line_start ?? 0}:${raw.algorithm ?? "unknown"}`,
    scanId,
    assetType,
    algorithm: raw.algorithm ?? "Unknown",
    variant: raw.variant ?? undefined,
    primitiveType: normalizePrimitive(raw.primitive_type),
    keySize: raw.key_size ?? "Unknown",
    mode: extractFromMetadata(raw.metadata, "mode"),
    parameterSet: extractFromMetadata(raw.metadata, "parameter_set"),
    library: raw.library ?? undefined,
    libraryVersion: raw.library_version ?? undefined,
    protocol: extractFromMetadata(raw.metadata, "protocol"),
    sourcePath: raw.asset_path,
    lineStart: raw.line_start ?? undefined,
    lineEnd: raw.line_end ?? undefined,
    inputType: assetType,
    detectionMethods: [normalizeDetection(raw.detection_method)],
    evidence: raw.evidence ?? undefined,
    confidence: normalizeConfidence(raw.confidence),
    classicalStatus,
    quantumStatus,
    dataLifetime: extractFromMetadata(raw.metadata, "data_lifetime") as Finding["dataLifetime"],
    businessCriticality: extractFromMetadata(raw.metadata, "business_criticality") as Finding["businessCriticality"],
    migrationTime: "UNKNOWN",
    riskLevel: risk,
    riskScore,
    riskExplanation: extractRiskExplanation(intel),
    recommendation: intel?.recommendation
      ? toRecommendation(intel, scanId, raw.algorithm ?? "Unknown")
      : undefined,
  };
}

function assetTypeForArtifact(artifactType: string): AssetInputType {
  switch (artifactType.toLowerCase()) {
    case "binary":
      return "BINARY_LIBRARY";
    case "certificate":
      return "CERTIFICATE";
    case "container":
      return "CONTAINER_IMAGE";
    case "dependency":
      return "DEPENDENCY_MANIFEST";
    default:
      return "SOURCE_REPOSITORY";
  }
}

function normalizePrimitive(p: string | null): PrimitiveType {
  if (!p) return "CUSTOM_UNKNOWN";
  const upper = p.toUpperCase().replace(/[-\s]/g, "_");
  const known: PrimitiveType[] = [
    "SYMMETRIC_CIPHER", "ASYMMETRIC_CIPHER", "KEY_EXCHANGE", "DIGITAL_SIGNATURE",
    "HASH", "MAC", "KDF", "RNG", "CERTIFICATE", "PROTOCOL", "CUSTOM_UNKNOWN",
  ];
  if (known.includes(upper as PrimitiveType)) return upper as PrimitiveType;
  // Map freeform strings
  if (upper === "SYMMETRIC") return "SYMMETRIC_CIPHER";
  if (upper === "ASYMMETRIC") return "ASYMMETRIC_CIPHER";
  if (upper.includes("SIGN")) return "DIGITAL_SIGNATURE";
  if (upper.includes("KEY_EST") || upper.includes("KEY_EXCH")) return "KEY_EXCHANGE";
  if (upper.includes("HASH")) return "HASH";
  if (upper.includes("CIPHER") || upper.includes("ENCRYPT")) return "SYMMETRIC_CIPHER";
  if (upper.includes("MAC")) return "MAC";
  return "CUSTOM_UNKNOWN";
}

function normalizeDetection(d: string): DetectionMethod {
  const upper = d.toUpperCase().replace(/[-\s]/g, "_");
  const known: DetectionMethod[] = [
    "STATIC_AST", "API_CALL_SIGNATURE", "CONFIG_FILE", "CERTIFICATE_PARSE",
    "DEPENDENCY_MANIFEST", "BINARY_SYMBOL", "HEURISTIC_STRING_MATCH", "TLS_HANDSHAKE_METADATA",
  ];
  if (known.includes(upper as DetectionMethod)) return upper as DetectionMethod;
  return "HEURISTIC_STRING_MATCH";
}

function normalizeConfidence(c: number): Confidence {
  if (c >= 0.75) return "HIGH";
  if (c >= 0.4) return "MEDIUM";
  return "LOW";
}

function extractFromMetadata(metadata: Record<string, unknown> | undefined, key: string): any {
  if (!metadata) return undefined;
  // Try direct key, snake_case, camelCase
  const candidates = [key, key.replace(/_/g, ""), key.replace(/_([a-z])/g, (_, c) => c.toUpperCase())];
  for (const k of candidates) {
    if (metadata[k] !== undefined) return metadata[k];
  }
  return undefined;
}

function extractRiskLevel(intel: BackendIntelligenceAssessment | undefined): RiskLevel {
  if (!intel) return "LOW";
  const risk = intel.risk_assessment?.risk ?? {};
  const level =
    (risk.level as string) ??
    (risk.risk_level as string) ??
    (risk.severity as string) ??
    (intel.metadata?.risk_level as string);
  if (!level) return "LOW";
  const upper = String(level).toUpperCase();
  if (upper === "CRITICAL" || upper === "HIGH" || upper === "MEDIUM" || upper === "LOW") {
    return upper as RiskLevel;
  }
  return "LOW";
}

function extractRiskScore(intel: BackendIntelligenceAssessment | undefined): number {
  if (!intel) return 0;
  const risk = intel.risk_assessment?.risk ?? {};
  const score = (risk.score as number) ?? (risk.risk_score as number) ?? (risk.value as number);
  if (typeof score === "number") return Math.round(score);
  // Fall back to level mapping
  const level = extractRiskLevel(intel);
  return { LOW: 20, MEDIUM: 50, HIGH: 75, CRITICAL: 92 }[level];
}

function extractRiskExplanation(intel: BackendIntelligenceAssessment | undefined): string | undefined {
  if (!intel) return undefined;
  const risk = intel.risk_assessment?.risk ?? {};
  return (
    (risk.explanation as string) ??
    (risk.reason as string) ??
    (risk.rationale as string) ??
    (intel.recommendation?.rationale || undefined)
  );
}

function extractClassicalStatus(intel: BackendIntelligenceAssessment | undefined): ExposureStatus {
  if (!intel) return "UNKNOWN";
  const classical = intel.risk_assessment?.classical ?? {};
  const status = (classical.status as string) ?? (classical.assessment as string);
  return normalizeExposure(status);
}

function extractQuantumStatus(intel: BackendIntelligenceAssessment | undefined): ExposureStatus {
  if (!intel) return "UNKNOWN";
  const quantum = intel.risk_assessment?.quantum ?? {};
  const status = (quantum.status as string) ?? (quantum.assessment as string);
  return normalizeExposure(status);
}

function normalizeExposure(s: string | undefined): ExposureStatus {
  if (!s) return "UNKNOWN";
  const upper = s.toUpperCase();
  if (["SAFE", "WEAK", "BROKEN", "DEPRECATED", "UNKNOWN"].includes(upper)) {
    return upper as ExposureStatus;
  }
  return "UNKNOWN";
}

// ------------------------------------------------------------------
// RECOMMENDATION
// ------------------------------------------------------------------

export function toRecommendation(
  intel: BackendIntelligenceAssessment,
  scanId: string,
  algorithmFallback: string
): Recommendation {
  const r = intel.recommendation;
  return {
    id: `rec:${scanId}:${intel.finding_index}`,
    findingId: `rec:${scanId}:${intel.finding_index}`, // see note below
    currentTechnology: intel.algorithm ?? algorithmFallback,
    affectedComponents: [r.hybrid_path ?? "application"].filter(Boolean) as string[],
    reason: r.rationale || "Migration is recommended based on risk assessment.",
    direction: normalizeDirection(r.direction),
    candidateAlgorithm: r.candidate_algorithms.join(", ") || "See rationale",
    priority: normalizePriority(r.migration_priority),
    status: "NOT_STARTED",
    rationale: r.rationale,
    isExperimental: false,
  };
}

function normalizeDirection(d: string): MigrationDirection {
  const upper = d.toUpperCase().replace(/[-\s]/g, "_");
  const known: MigrationDirection[] = [
    "ML_KEM", "HYBRID_KEM", "ML_DSA", "SLH_DSA", "STRONGER_SYMMETRIC",
    "APPROVED_HASH", "VETTED_STANDARD_REVIEW", "NO_ACTION",
  ];
  if (known.includes(upper as MigrationDirection)) return upper as MigrationDirection;
  if (upper.includes("MANUAL") || upper.includes("REVIEW")) return "VETTED_STANDARD_REVIEW";
  return "NO_ACTION";
}

function normalizePriority(p: string): RiskLevel {
  const upper = p.toUpperCase();
  if (upper === "CRITICAL") return "CRITICAL";
  if (upper === "HIGH") return "HIGH";
  if (upper === "MEDIUM") return "MEDIUM";
  return "LOW";
}

// ------------------------------------------------------------------
// RISK SUMMARY (synthesized from intelligence array)
// ------------------------------------------------------------------

export function toQuantumReadinessSummary(
  intel: BackendIntelligenceAssessment[],
  findings: Finding[]
): QuantumReadinessSummary {
  const classicalExposure = distribution(
    findings.filter((f) => f.classicalStatus === "WEAK" || f.classicalStatus === "BROKEN")
  );
  const quantumExposure = distribution(
    findings.filter((f) => f.quantumStatus === "WEAK" || f.quantumStatus === "BROKEN")
  );
  const prioritized = [...findings]
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 10)
    .map((f) => f.id);

  return {
    crqcScenario:
      "Backend-supplied CRQC scenario — see individual risk assessments for reasoning",
    classicalExposure,
    quantumExposure,
    prioritizedFindingIds: prioritized,
  };
}

function distribution(findings: Finding[]): RiskDistributionBucket[] {
  return (["LOW", "MEDIUM", "HIGH", "CRITICAL"] as RiskLevel[]).map((level) => ({
    level,
    count: findings.filter((f) => f.riskLevel === level).length,
  }));
}

// ------------------------------------------------------------------
// DASHBOARD SUMMARY (computed client-side since backend has no endpoint)
// ------------------------------------------------------------------

export function computeDashboardSummary(
  scans: Scan[],
  findingsByScan: Map<string, Finding[]>
): DashboardSummary {
  const allFindings = Array.from(findingsByScan.values()).flat();
  const algorithms = new Set(allFindings.map((f) => f.algorithm));
  const libraries = new Set(allFindings.map((f) => f.library).filter(Boolean));
  const certs = allFindings.filter((f) => f.primitiveType === "CERTIFICATE");

  const componentCounts = new Map<string, { count: number; risk: RiskLevel }>();
  const rank: Record<RiskLevel, number> = { LOW: 0, MEDIUM: 1, HIGH: 2, CRITICAL: 3 };
  allFindings.forEach((f) => {
    const key = f.library ?? f.algorithm;
    const existing = componentCounts.get(key);
    if (!existing) componentCounts.set(key, { count: 1, risk: f.riskLevel });
    else {
      existing.count += 1;
      if (rank[f.riskLevel] > rank[existing.risk]) existing.risk = f.riskLevel;
    }
  });

  return {
    cryptoAssets: allFindings.length,
    algorithms: algorithms.size,
    certificates: certs.length,
    libraries: libraries.size,
    highRisk: allFindings.filter((f) => f.riskLevel === "HIGH" || f.riskLevel === "CRITICAL").length,
    quantumRisk: allFindings.filter((f) => f.quantumStatus === "BROKEN" || f.quantumStatus === "WEAK").length,
    riskDistribution: distribution(allFindings),
    topRiskyComponents: Array.from(componentCounts.entries())
      .map(([name, v]) => ({ name, occurrences: v.count, riskLevel: v.risk }))
      .sort((a, b) => b.occurrences - a.occurrences)
      .slice(0, 6),
    recentScans: [...scans].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 5),
    coverageSummary: {
      scansCompleted: scans.filter((s) => s.status === "COMPLETED").length,
      filesScanned: 0, // backend doesn't expose this
      unsupportedFiles: 0,
    },
  };
}