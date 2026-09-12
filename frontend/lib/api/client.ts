import type {
  Scan,
  Finding,
  NewScanInput,
  DashboardSummary,
  QuantumReadinessSummary,
  Recommendation,
  CbomComponent
} from "@/lib/types";

export interface CbomResponse {
  scanId: string;
  generatedAt: string;
  components: CbomComponent[];
  findings: Finding[];
}

export interface FindingsQuery {
  riskLevel?: string;
  confidence?: string;
  algorithm?: string;
  assetType?: string;
  inputType?: string;
  library?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

export interface FindingsResponse {
  items: Finding[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ReportResponse {
  scanId: string;
  format: "json";
  generatedAt: string;
  payload: unknown;
}

/**
 * The single contract every page depends on. The frontend never talks to
 * fetch() or mock data directly — it goes through this interface, so
 * swapping the mock adapter for the real FastAPI backend is a one-line
 * change (see lib/api/index.ts).
 */
export interface ApiClient {
  getDashboardSummary(): Promise<DashboardSummary>;

  listScans(): Promise<Scan[]>;
  createScan(input: NewScanInput): Promise<Scan>;
  getScan(scanId: string): Promise<Scan>;
  startScan(scanId: string): Promise<Scan>;
  getScanStatus(scanId: string): Promise<Scan>;

  getFindings(scanId: string, query?: FindingsQuery): Promise<FindingsResponse>;
  getFinding(scanId: string, findingId: string): Promise<Finding>;

  getCbom(scanId: string): Promise<CbomResponse>;

  getRisk(scanId: string): Promise<QuantumReadinessSummary>;
  updateFindingAssumptions(
    scanId: string,
    findingId: string,
    assumptions: { dataLifetime?: string; businessCriticality?: string }
  ): Promise<Finding>;

  getRecommendations(scanId: string): Promise<Recommendation[]>;
  updateRecommendationStatus(
    scanId: string,
    recommendationId: string,
    status: Recommendation["status"]
  ): Promise<Recommendation>;

  getReport(scanId: string): Promise<ReportResponse>;
}

export class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}
