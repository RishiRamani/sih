// ECDAT domain types.
//
// These mirror the API/DB specification's response schemas. Field names
// must stay in lockstep with the finalized backend contract — when that
// contract lands, update this file first and the rest of the app follows,
// since every page consumes these types rather than ad-hoc shapes.

export type ScanStatus =
  | "CREATED"
  | "QUEUED"
  | "DISCOVERING"
  | "ANALYSING"
  | "NORMALIZING"
  | "BUILDING_CBOM"
  | "ASSESSING_RISK"
  | "GENERATING_RECOMMENDATIONS"
  | "COMPLETED"
  | "FAILED";

export const SCAN_STATUS_ORDER: ScanStatus[] = [
  "CREATED",
  "QUEUED",
  "DISCOVERING",
  "ANALYSING",
  "NORMALIZING",
  "BUILDING_CBOM",
  "ASSESSING_RISK",
  "GENERATING_RECOMMENDATIONS",
  "COMPLETED"
];

export type AssetInputType =
  | "SOURCE_REPOSITORY"
  | "SOURCE_ARCHIVE"
  | "BINARY_LIBRARY"
  | "CONTAINER_IMAGE"
  | "CERTIFICATE"
  | "DEPENDENCY_MANIFEST";

export interface ScanWarning {
  code: string;
  message: string;
  path?: string;
}

export interface ScanCoverage {
  filesScanned: number;
  filesTotal: number;
  unsupportedFiles: number;
  skippedFiles: number;
  parseErrors: number;
  warnings: ScanWarning[];
}

export interface Scan {
  id: string;
  name: string;
  inputType: AssetInputType;
  sourceLabel: string; // repo URL, filename, image ref, etc.
  status: ScanStatus;
  progressPercent: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  requestedBy?: string;
  findingCount?: number;
  highRiskCount?: number;
  coverage?: ScanCoverage;
  businessCriticality?: BusinessCriticality;
  dataLifetimeYears?: number;
  migrationTimeYears?: number;
  errorMessage?: string;
}

export type PrimitiveType =
  | "SYMMETRIC_CIPHER"
  | "ASYMMETRIC_CIPHER"
  | "KEY_EXCHANGE"
  | "DIGITAL_SIGNATURE"
  | "HASH"
  | "MAC"
  | "KDF"
  | "RNG"
  | "CERTIFICATE"
  | "PROTOCOL"
  | "CUSTOM_UNKNOWN";

export type DetectionMethod =
  | "STATIC_AST"
  | "API_CALL_SIGNATURE"
  | "CONFIG_FILE"
  | "CERTIFICATE_PARSE"
  | "DEPENDENCY_MANIFEST"
  | "BINARY_SYMBOL"
  | "HEURISTIC_STRING_MATCH"
  | "TLS_HANDSHAKE_METADATA";

export type Confidence = "HIGH" | "MEDIUM" | "LOW";

export type ExposureStatus =
  | "SAFE"
  | "WEAK"
  | "BROKEN"
  | "DEPRECATED"
  | "UNKNOWN";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type BusinessCriticality = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type DataLifetime = "SHORT" | "MEDIUM" | "LONG" | "INDEFINITE";

export type MigrationEffort = "LOW" | "MEDIUM" | "HIGH" | "UNKNOWN";

export type MigrationDirection =
  | "KEM"
  | "SIGNATURE"
  | "HASH"
  | "SYMMETRIC"
  | "MAC"
  | "MANUAL_REVIEW"
  | "ML_KEM"
  | "HYBRID_KEM"
  | "ML_DSA"
  | "SLH_DSA"
  | "STRONGER_SYMMETRIC"
  | "APPROVED_HASH"
  | "VETTED_STANDARD_REVIEW"
  | "NO_ACTION";

export interface Recommendation {
  id: string;
  findingId: string;
  currentTechnology: string;
  affectedComponents: string[];
  reason: string;
  direction: MigrationDirection;
  candidateAlgorithm: string;
  priority: RiskLevel;              
  findingRiskLevel: RiskLevel;      
  status: "NOT_STARTED" | "IN_PROGRESS" | "MITIGATED" | "ACCEPTED_RISK";
  rationale: string;
  effort?: MigrationEffort;
  tradeOffs?: string;
  isExperimental?: boolean;
}

// A normalized cryptographic artefact — the canonical finding model.
// Every page that touches a finding uses exactly this shape.
export interface Finding {
  id: string;
  scanId: string;
  assetType: AssetInputType;
  algorithm: string;
  variant?: string;
  primitiveType: PrimitiveType;
  keySize?: number | "Unknown";
  mode?: string;
  parameterSet?: string;
  library?: string;
  libraryVersion?: string;
  protocol?: string;
  sourcePath?: string;
  lineStart?: number;
  lineEnd?: number;
  inputType: AssetInputType;
  detectionMethods: DetectionMethod[];
  evidence?: string;
  confidence: Confidence;
  classicalStatus: ExposureStatus;
  quantumStatus: ExposureStatus;
  dataLifetime?: DataLifetime | number | "Unknown";
  businessCriticality?: BusinessCriticality | "Unknown";
  migrationTime?: MigrationEffort;
  riskLevel: RiskLevel;
  riskScore: number; // 0-100, backend-computed
  riskExplanation?: string;
  recommendation?: Recommendation;
  certificate?: CertificateDetails;
  isAssumption?: {
    dataLifetime?: boolean;
    businessCriticality?: boolean;
  };
}

export interface CertificateDetails {
  subject?: string;
  issuer?: string;
  san?: string[];
  curve?: string;
  signatureAlgorithm?: string;
  signatureOid?: string;
  notValidBefore?: string;
  notValidAfter?: string;
}

export interface CbomComponent {
  application: string;
  library: string;
  libraryVersion?: string;
}

export interface RiskDistributionBucket {
  level: RiskLevel;
  count: number;
}

export interface ExposureBucket {
  status: ExposureStatus;  
  count: number;
}

export interface QuantumReadinessSummary {
  crqcScenario: string; // e.g. "NIST-aligned conservative: CRQC by 2033"
  criticalCount: number;
  classicalExposure: ExposureBucket[];
  quantumExposure: ExposureBucket[];
  prioritizedFindingIds: string[];
}

export interface DashboardSummary {
  cryptoAssets: number;
  algorithms: number;
  certificates: number;
  libraries: number;
  highRisk: number;
  criticalRisk: number;
  quantumRisk: number;
  riskDistribution: RiskDistributionBucket[];
  topRiskyComponents: { name: string; occurrences: number; riskLevel: RiskLevel }[];
  recentScans: Scan[];
  coverageSummary: {
    scansCompleted: number;
    filesScanned: number;
    unsupportedFiles: number;
    skippedFiles: number;
    parseErrors: number;
    warnings: number;
  };
}

export interface NewScanInput {
  name: string;
  inputType: AssetInputType;
  sourceLabel: string;
  fileName?: string;
  businessCriticality?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  dataLifetimeYears?: number;
  migrationTimeYears?: number;
  crqcArrivalYears?: number;
}

// === Real backend types (from openapi.json) ===

export type BackendScanStatus =
  | "created"
  | "queued"
  | "discovering"
  | "analysing"
  | "normalizing"
  | "building_cbom"
  | "assessing_risk"
  | "generating_recommendations"
  | "completed"
  | "failed";

export interface BackendFinding {
  artifact_type: string;
  primitive_type: string | null;
  algorithm: string | null;
  variant: string | null;
  key_size: number | null;
  library: string | null;
  library_version: string | null;
  asset_path: string;
  line_start: number | null;
  line_end: number | null;
  detection_method: string;
  confidence: number; // 0.0–1.0
  evidence: string | null;
  component_id: string | null;
  parent_component_id: string | null;
  metadata: Record<string, unknown>;
}

export interface BackendRecommendationAssessment {
  direction: string;
  candidate_algorithms: string[];
  hybrid_path: string | null;
  migration_priority: string;
  reason?: string;
  rationale: string;
  effort?: string;
  trade_offs?: string;
}

export interface BackendRiskAssessment {
  classical: Record<string, unknown>;
  quantum: Record<string, unknown>;
  mosca: Record<string, unknown>;
  risk: Record<string, unknown>;
}

export interface BackendIntelligenceAssessment {
  finding_index: number;
  algorithm: string | null;
  primitive_type: string | null;
  risk_assessment: BackendRiskAssessment;
  recommendation: BackendRecommendationAssessment;
  metadata: Record<string, unknown>;
}

export interface BackendScanResult {
  scan_id: string | null;
  status: BackendScanStatus;
  target_path: string;
  findings: BackendFinding[];
  intelligence: BackendIntelligenceAssessment[];
  cbom: unknown | null;
  total_findings: number;
  started_at: string | null;
  completed_at: string | null;
  error: string | null;
  business_criticality?: string;
  data_lifetime_years?: number;
  migration_time_years?: number;
  crqc_arrival_years?: number | null;
  coverage?: BackendScanCoverage;
}

export interface BackendScanRequest {
  source_type: "local" | "git";
  source?: string | null;
  target_path?: string | null;
  business_criticality?: BusinessCriticality;
  data_lifetime_years?: number;
  migration_time_years?: number;
  crqc_arrival_years?: number | null;
}

export interface BackendScanCoverage {
  files_scanned: number;
  files_total: number;
  unsupported_files: number;
  skipped_files: number;
  parse_errors: number;
  warnings: { code: string; message: string; path?: string | null }[];
}