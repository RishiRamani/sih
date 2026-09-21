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
  CertificateDetails,
  MigrationEffort,
  ExposureBucket,
} from "@/lib/types";
import type {
  BackendFinding,
  BackendIntelligenceAssessment,
  BackendScanResult,
  BackendScanCoverage,
} from "@/lib/types";

// ------------------------------------------------------------------
// SCAN
// ------------------------------------------------------------------

export function toScan(raw: BackendScanResult): Scan {
  const inputType: AssetInputType = inferInputType(raw.target_path);
  const status = normalizeStatus(raw.status);
  const backendCoverage = raw.coverage as BackendScanCoverage | undefined;
  const coverage = backendCoverage
    ? {
        filesScanned: backendCoverage.files_scanned,
        filesTotal: backendCoverage.files_total,
        unsupportedFiles: backendCoverage.unsupported_files,
        skippedFiles: backendCoverage.skipped_files,
        parseErrors: backendCoverage.parse_errors,
        warnings: backendCoverage.warnings.map((warning) => ({
          code: warning.code,
          message: warning.message,
          path: warning.path ?? undefined,
        })),
      }
    : undefined;

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
    coverage,
    businessCriticality: raw.business_criticality as Scan["businessCriticality"],
    dataLifetimeYears: raw.data_lifetime_years,
    migrationTimeYears: raw.migration_time_years,
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
  scanId: string,
  context?: Pick<BackendScanResult, "target_path" | "business_criticality" | "data_lifetime_years">
): Finding {
  const risk = extractRiskLevel(intel);
  const riskScore = extractRiskScore(intel);
  const classicalStatus = extractClassicalStatus(intel);
  const quantumStatus = extractQuantumStatus(intel);
  const assetType = assetTypeForArtifact(raw.artifact_type);
  const certificate = raw.artifact_type.toLowerCase() === "certificate"
    ? toCertificateDetails(raw.metadata)
    : undefined;
  const findingId = `${scanId}:${raw.asset_path}:${raw.line_start ?? 0}:${raw.algorithm ?? "unknown"}`;

  return {
    id: findingId,
    scanId,
    assetType,
    algorithm: raw.algorithm ?? "Unknown",
    variant: raw.variant ?? undefined,
    primitiveType: raw.artifact_type.toLowerCase() === "certificate"
      ? "CERTIFICATE"
      : normalizePrimitive(raw.primitive_type),
    keySize: raw.key_size ?? "Unknown",
    mode: extractFromMetadata(raw.metadata, "mode"),
    parameterSet: extractFromMetadata(raw.metadata, "parameter_set"),
    library: raw.library ?? undefined,
    libraryVersion: raw.library_version ?? undefined,
    protocol: extractFromMetadata(raw.metadata, "protocol"),
    sourcePath: relativeAssetPath(raw.asset_path, context?.target_path),
    lineStart: raw.line_start ?? undefined,
    lineEnd: raw.line_end ?? undefined,
    inputType: assetType,
    detectionMethods: [normalizeDetection(raw.detection_method)],
    evidence: raw.evidence ?? undefined,
    confidence: normalizeConfidence(raw.confidence),
    classicalStatus,
    quantumStatus,
    dataLifetime: context?.data_lifetime_years ?? extractFromMetadata(raw.metadata, "data_lifetime") as Finding["dataLifetime"] ?? 3,
    businessCriticality: normalizeBusinessCriticality(context?.business_criticality ?? extractFromMetadata(raw.metadata, "business_criticality")) ?? "MEDIUM",
    migrationTime: normalizeMigrationEffort(intel?.recommendation?.effort),
    riskLevel: risk,
    riskScore,
    riskExplanation: extractRiskExplanation(intel),
    recommendation: intel?.recommendation
      ? toRecommendation(intel, scanId, raw.algorithm ?? "Unknown", findingId)
      : undefined,
    certificate,
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

function toCertificateDetails(
  metadata: Record<string, unknown> | undefined
): CertificateDetails | undefined {
  if (!metadata) return undefined;

  return {
    subject: metadata.subject as string | undefined,
    issuer: metadata.issuer as string | undefined,
    san: Array.isArray(metadata.san)
      ? metadata.san.filter((value): value is string => typeof value === "string")
      : undefined,
    curve: metadata.curve as string | undefined,
    signatureAlgorithm: metadata.signature_algorithm as string | undefined,
    signatureOid: metadata.signature_oid as string | undefined,
    notValidBefore: metadata.not_valid_before as string | undefined,
    notValidAfter: metadata.not_valid_after as string | undefined,
  };
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
  if (upper === "X509_CERTIFICATE" || upper === "CERTIFICATE") return "CERTIFICATE_PARSE";
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

export function extractRiskLevel(
  intel: BackendIntelligenceAssessment | undefined
): RiskLevel {
  if (!intel) return "LOW";
  const severity = intel.risk_assessment?.risk?.severity as string | undefined;
  if (!severity) return "LOW";
  const upper = severity.trim().toUpperCase();
  if (upper === "CRITICAL" || upper === "HIGH" || upper === "MEDIUM" || upper === "LOW") {
    return upper as RiskLevel;
  }
  // INFORMATIONAL and anything unrecognized fall to LOW for UI purposes.
  return "LOW";
}

function extractRiskScore(intel: BackendIntelligenceAssessment | undefined): number {
  if (!intel) return 0;
  const score = intel.risk_assessment?.risk?.risk_score;
  if (typeof score === "number") return Math.round(score);
  return { LOW: 20, MEDIUM: 50, HIGH: 75, CRITICAL: 92 }[extractRiskLevel(intel)];
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

function extractClassicalStatus(
  intel: BackendIntelligenceAssessment | undefined
): ExposureStatus {
  if (!intel) return "UNKNOWN";
  const status = intel.risk_assessment?.classical?.classical_status as string | undefined;
  return normalizeExposure(status);
}

function extractQuantumStatus(
  intel: BackendIntelligenceAssessment | undefined
): ExposureStatus {
  if (!intel) return "UNKNOWN";
  const status = intel.risk_assessment?.quantum?.quantum_status as string | undefined;
  return normalizeExposure(status);
}

function normalizeExposure(s: string | undefined): ExposureStatus {
  if (!s) return "UNKNOWN";
  const upper = s.toUpperCase();
  if (upper === "WEAKENED") return "WEAK";
  if (["SAFE", "WEAK", "BROKEN", "DEPRECATED", "RESILIENT", "UNKNOWN"].includes(upper)) {
    return upper === "RESILIENT" ? "SAFE" : upper as ExposureStatus;
  }
  return "UNKNOWN";
}

// ------------------------------------------------------------------
// RECOMMENDATION
// ------------------------------------------------------------------

export function toRecommendation(
  intel: BackendIntelligenceAssessment,
  scanId: string,
  algorithmFallback: string,
  findingId?: string,
  finding?: BackendFinding,          // NEW
  targetPath?: string,               // NEW — for path stripping
): Recommendation {
  const r = intel.recommendation;
  return {
    id: `rec:${scanId}:${intel.finding_index}`,
    findingId: findingId ?? `rec:${scanId}:${intel.finding_index}`,
    currentTechnology: intel.algorithm ?? algorithmFallback,
    affectedComponents: [r.hybrid_path ?? "application"].filter(Boolean) as string[],
    reason: r.reason || "Migration is recommended based on risk assessment.",
    direction: normalizeDirection(r.direction),
    candidateAlgorithm: r.candidate_algorithms.join(", ") || "See rationale",
    priority: normalizePriority(r.migration_priority),
    findingRiskLevel: extractRiskLevel(intel),
    status: normalizeRecommendationStatus(intel.metadata?.status as string | undefined),
    rationale: r.rationale,
    effort: normalizeMigrationEffort(r.effort),
    tradeOffs: r.trade_offs || undefined,
    isExperimental: false,
    // NEW:
    sourcePath: finding ? relativeAssetPath(finding.asset_path, targetPath) : undefined,
    lineStart: finding?.line_start ?? undefined,
    lineEnd: finding?.line_end ?? undefined,
    evidence: finding?.evidence ?? undefined,
  };
}

function normalizeDirection(d: string): MigrationDirection {
  const upper = d.toUpperCase().replace(/[-\s]/g, "_");
  const known: MigrationDirection[] = [
    "KEM", "SIGNATURE", "HASH", "SYMMETRIC", "MAC", "MANUAL_REVIEW",
    "ML_KEM", "HYBRID_KEM", "ML_DSA", "SLH_DSA", "STRONGER_SYMMETRIC",
    "APPROVED_HASH", "VETTED_STANDARD_REVIEW", "NO_ACTION",
  ];
  if (known.includes(upper as MigrationDirection)) return upper as MigrationDirection;
  if (upper.includes("MANUAL") || upper.includes("REVIEW")) return "VETTED_STANDARD_REVIEW";
  return "NO_ACTION";
}

function normalizePriority(p: string): RiskLevel {
  const upper = p.toUpperCase();
  if (upper === "CRITICAL" || upper === "HIGH" || upper === "MEDIUM" || upper === "LOW") {
    return upper as RiskLevel;
  }
  if (upper === "IMMEDIATE") return "CRITICAL";
  if (upper === "PLANNED") return "MEDIUM";
  if (upper === "MONITOR") return "LOW";
  if (upper === "NONE") return "LOW";
  return "LOW";
}

function normalizeMigrationEffort(value: string | undefined): MigrationEffort {
  const upper = value?.toUpperCase();
  if (upper === "LOW" || upper === "MEDIUM" || upper === "HIGH" || upper === "UNKNOWN") {
    return upper;
  }
  return "UNKNOWN";
}

// ------------------------------------------------------------------
// RISK SUMMARY (synthesized from intelligence array)
// ------------------------------------------------------------------

export function toQuantumReadinessSummary(
  intel: BackendIntelligenceAssessment[],
  findings: Finding[]
): QuantumReadinessSummary {
  const prioritized = [...findings]
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 10)
    .map((f) => f.id);

  return {
    crqcScenario:
      "Backend-supplied CRQC scenario — see individual risk assessments for reasoning",

    criticalCount: findings.filter((f) => f.riskLevel === "CRITICAL").length,

    classicalExposure: exposureBuckets(findings, (f) => f.classicalStatus),
    quantumExposure: exposureBuckets(findings, (f) => f.quantumStatus),

    prioritizedFindingIds: prioritized,
  };
}

function exposureBuckets(
  findings: Finding[],
  pick: (f: Finding) => ExposureStatus
): ExposureBucket[] {
  const statuses: ExposureStatus[] = [
    "SAFE",
    "WEAK",
    "BROKEN",
    "DEPRECATED",
    "UNKNOWN",
  ];
  return statuses.map((status) => ({
    status,
    count: findings.filter((f) => pick(f) === status).length,
  }));
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
    criticalRisk: allFindings.filter((f) => f.riskLevel === "CRITICAL").length,
    quantumRisk: allFindings.filter((f) => f.quantumStatus === "BROKEN" || f.quantumStatus === "WEAK").length,
    riskDistribution: distribution(allFindings),
    topRiskyComponents: Array.from(componentCounts.entries())
      .map(([name, v]) => ({ name, occurrences: v.count, riskLevel: v.risk }))
      .sort((a, b) => b.occurrences - a.occurrences)
      .slice(0, 6),
    recentScans: scans.slice(0, 5),
    coverageSummary: {
      scansCompleted: scans.filter((s) => s.status === "COMPLETED").length,
      filesScanned: scans.reduce((sum, scan) => sum + (scan.coverage?.filesScanned ?? 0), 0),
      unsupportedFiles: scans.reduce((sum, scan) => sum + (scan.coverage?.unsupportedFiles ?? 0), 0),
      skippedFiles: scans.reduce((sum, scan) => sum + (scan.coverage?.skippedFiles ?? 0), 0),
      parseErrors: scans.reduce((sum, scan) => sum + (scan.coverage?.parseErrors ?? 0), 0),
      warnings: scans.reduce((sum, scan) => sum + (scan.coverage?.warnings.length ?? 0), 0),
    },
  };
}

function normalizeRecommendationStatus(value: string | undefined): Recommendation["status"] {
  const status = value?.toUpperCase();
  if (status === "IN_PROGRESS" || status === "MITIGATED" || status === "ACCEPTED_RISK") {
    return status;
  }
  return "NOT_STARTED";
}


function relativeAssetPath(assetPath: string, targetPath?: string): string {
  const asset = assetPath.replace(/\\/g, "/");
  const target = targetPath ? targetPath.replace(/\\/g, "/").replace(/\/+$/, "") : "";

  if (target) {
    // Strategy 1: strip prefix
    const assetLower = asset.toLowerCase();
    const targetLower = target.toLowerCase();

    if (assetLower === targetLower) {
      return asset.split("/").pop() ?? asset;
    }
    if (assetLower.startsWith(`${targetLower}/`)) {
      return asset.slice(target.length + 1);
    }

    // Strategy 2: find the deepest segment of target that appears in asset
    const targetSegments = target.split("/").filter(Boolean);
    for (let i = 0; i < targetSegments.length; i += 1) {
      const suffix = targetSegments.slice(i).join("/").toLowerCase();
      if (!suffix) continue;
      const idx = assetLower.indexOf(`/${suffix}/`);
      if (idx >= 0) {
        return asset.slice(idx + suffix.length + 2);
      }
    }
  }

  // Strategy 3: fall back to stripping common root prefixes so we never
  // leak a full absolute path to the UI.
  return stripKnownRoots(asset);
}


function stripKnownRoots(p: string): string {
  let s = p;

  // Windows drive: C:/...
  s = s.replace(/^[A-Za-z]:\//, "");

  // Common Unix roots
  s = s.replace(/^\/(home|Users|tmp|var|opt|mnt|workspace)\/[^/]+\//, "");

  // Any remaining leading slash
  s = s.replace(/^\/+/, "");

  return s || p;
}

function normalizeBusinessCriticality(value: unknown): Finding["businessCriticality"] {
  const normalized = String(value ?? "").toUpperCase();
  return ["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(normalized)
    ? normalized as Finding["businessCriticality"]
    : undefined;
}