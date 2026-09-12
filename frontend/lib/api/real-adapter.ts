import type {
  ApiClient,
  CbomResponse,
  FindingsQuery,
  FindingsResponse,
  ReportResponse
} from "@/lib/api/client";
import { ApiError } from "@/lib/api/client";
import type {
  Scan,
  Finding,
  NewScanInput,
  DashboardSummary,
  QuantumReadinessSummary,
  Recommendation
} from "@/lib/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) }
    });
  } catch (err) {
    throw new ApiError(`Could not reach ECDAT backend at ${BASE_URL}${path}.`);
  }
  if (!res.ok) {
    let message = `Request to ${path} failed with status ${res.status}.`;
    try {
      const body = await res.json();
      if (body?.detail) message = String(body.detail);
    } catch {
      // ignore body parse failure, keep default message
    }
    throw new ApiError(message, res.status);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

function qs(query: Record<string, string | number | undefined>): string {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined && v !== "") params.set(k, String(v));
  });
  const s = params.toString();
  return s ? `?${s}` : "";
}

/**
 * Talks to the real ECDAT FastAPI backend using the endpoints listed in the
 * API/DB specification. This is intentionally thin — no business logic,
 * no client-side risk math — it only shapes requests/responses to match
 * the ApiClient contract. Swap this in via NEXT_PUBLIC_USE_MOCK_API=false.
 */
export class RealApiAdapter implements ApiClient {
  async getDashboardSummary(): Promise<DashboardSummary> {
    // NOTE: not in the base resource list in the spec. Until a dedicated
    // /dashboard endpoint exists, point this at the backend's summary
    // endpoint once defined.
    return request<DashboardSummary>("/dashboard/summary");
  }

  listScans(): Promise<Scan[]> {
    return request<Scan[]>("/scans");
  }

  createScan(input: NewScanInput): Promise<Scan> {
    return request<Scan>("/scans", { method: "POST", body: JSON.stringify(input) });
  }

  getScan(scanId: string): Promise<Scan> {
    return request<Scan>(`/scans/${scanId}`);
  }

  startScan(scanId: string): Promise<Scan> {
    return request<Scan>(`/scans/${scanId}/start`, { method: "POST" });
  }

  getScanStatus(scanId: string): Promise<Scan> {
    return request<Scan>(`/scans/${scanId}/status`);
  }

  getFindings(scanId: string, query: FindingsQuery = {}): Promise<FindingsResponse> {
    return request<FindingsResponse>(
      `/scans/${scanId}/findings${qs({
        risk_level: query.riskLevel,
        confidence: query.confidence,
        algorithm: query.algorithm,
        asset_type: query.assetType,
        input_type: query.inputType,
        library: query.library,
        search: query.search,
        page: query.page,
        page_size: query.pageSize,
        sort_by: query.sortBy,
        sort_dir: query.sortDir
      })}`
    );
  }

  getFinding(scanId: string, findingId: string): Promise<Finding> {
    return request<Finding>(`/scans/${scanId}/findings/${findingId}`);
  }

  getCbom(scanId: string): Promise<CbomResponse> {
    return request<CbomResponse>(`/scans/${scanId}/cbom`);
  }

  getRisk(scanId: string): Promise<QuantumReadinessSummary> {
    return request<QuantumReadinessSummary>(`/scans/${scanId}/risks`);
  }

  updateFindingAssumptions(
    scanId: string,
    findingId: string,
    assumptions: { dataLifetime?: string; businessCriticality?: string }
  ): Promise<Finding> {
    return request<Finding>(`/scans/${scanId}/findings/${findingId}/assumptions`, {
      method: "PATCH",
      body: JSON.stringify(assumptions)
    });
  }

  getRecommendations(scanId: string): Promise<Recommendation[]> {
    return request<Recommendation[]>(`/scans/${scanId}/recommendations`);
  }

  updateRecommendationStatus(
    scanId: string,
    recommendationId: string,
    status: Recommendation["status"]
  ): Promise<Recommendation> {
    return request<Recommendation>(`/scans/${scanId}/recommendations/${recommendationId}`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    });
  }

  getReport(scanId: string): Promise<ReportResponse> {
    return request<ReportResponse>(`/scans/${scanId}/report`);
  }
}
