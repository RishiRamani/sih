import type {
  ApiClient,
  CbomResponse,
  FindingsQuery,
  FindingsResponse,
  ReportResponse,
} from "@/lib/api/client";
import { ApiError } from "@/lib/api/client";
import type {
  Scan,
  Finding,
  NewScanInput,
  DashboardSummary,
  QuantumReadinessSummary,
  Recommendation,
  BackendScanResult,
  BackendFinding,
  BackendIntelligenceAssessment,
} from "@/lib/types";
import {
  toScan,
  toFinding,
  toRecommendation,
  toQuantumReadinessSummary,
  computeDashboardSummary,
} from "./transform";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
  } catch {
    throw new ApiError(`Could not reach ECDAT backend at ${BASE_URL}${path}.`);
  }
  if (!res.ok) {
    let message = `Request to ${path} failed with status ${res.status}.`;
    try {
      const body = await res.json();
      if (body?.detail) {
        message = typeof body.detail === "string"
          ? body.detail
          : JSON.stringify(body.detail);
      }
    } catch { /* ignore */ }
    throw new ApiError(message, res.status);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export class RealApiAdapter implements ApiClient {
  // Cache the last fetched full scan results so subsequent calls don't re-fetch
  private scanCache = new Map<string, BackendScanResult>();

  async getDashboardSummary(): Promise<DashboardSummary> {
    const scans = await this.listScans();
    const findingsByScan = new Map<string, Finding[]>();
    const completed = scans.filter((s) => s.status === "COMPLETED");

    await Promise.all(
      completed.map(async (s) => {
        const findings = await this.getFindings(s.id, { pageSize: 10000 });
        findingsByScan.set(s.id, findings.items);
      })
    );

    return computeDashboardSummary(scans, findingsByScan);
  }

  async listScans(): Promise<Scan[]> {
    const raw = await request<BackendScanResult[]>("/scans");
    raw.forEach((r) => {
      if (r.scan_id) this.scanCache.set(r.scan_id, r);
    });
    return raw.map(toScan);
  }

  async deleteScan(scanId: string): Promise<void> {
    await request(`/scans/${encodeURIComponent(scanId)}`, { method: "DELETE" });
    this.scanCache.delete(scanId);
  }

  async createScan(input: NewScanInput): Promise<Scan> {
    // Backend: { source_type: "local"|"git", source, target_path }
    // Frontend sends { name, inputType, sourceLabel }
    const isGit =
      input.inputType === "SOURCE_REPOSITORY" &&
      /^(https?:\/\/|git@)/.test(input.sourceLabel);

    const body = isGit
      ? { source_type: "git", source: input.sourceLabel }
      : { source_type: "local", target_path: input.sourceLabel };

    Object.assign(body, {
      business_criticality: input.businessCriticality ?? "MEDIUM",
      data_lifetime_years: input.dataLifetimeYears ?? 3,
      migration_time_years: input.migrationTimeYears ?? 2,
      crqc_arrival_years: input.crqcArrivalYears,
    });

    const raw = await request<BackendScanResult>("/scans", {
      method: "POST",
      body: JSON.stringify(body),
    });
    if (raw.scan_id) this.scanCache.set(raw.scan_id, raw);
    return toScan(raw);
  }

  async getScan(scanId: string): Promise<Scan> {
    const raw = await request<BackendScanResult>(`/scans/${scanId}`);
    this.scanCache.set(scanId, raw);
    return toScan(raw);
  }

  // Backend has no separate /start — scan runs on create.
  // Just return the already-cached result.
  async startScan(scanId: string): Promise<Scan> {
    const cached = this.scanCache.get(scanId);
    if (cached) return toScan(cached);
    return this.getScan(scanId);
  }

  // Backend has no /status endpoint. Return the cached scan immediately.
  // This makes the progress page jump straight to COMPLETED.
  async getScanStatus(scanId: string): Promise<Scan> {
    const cached = this.scanCache.get(scanId);
    if (cached) return toScan(cached);
    return this.getScan(scanId);
  }

  async getAllScans(): Promise<Scan[]> {
    const raw = await request<BackendScanResult[]>("/scans");
    raw.forEach((r) => {
      if (r.scan_id) this.scanCache.set(r.scan_id, r);
    });
    return raw.map(toScan);
  }

  async getFindings(scanId: string, query: FindingsQuery = {}): Promise<FindingsResponse> {
    const raw = await this.ensureScanLoaded(scanId);
    let findings = raw.findings.map((f, idx) =>
      toFinding(f, findIntelForFinding(raw.intelligence, idx, f), scanId, raw)
    );

    // Apply filtering client-side (backend has no query params)
    if (query.riskLevel) findings = findings.filter((f) => f.riskLevel === query.riskLevel);
    if (query.confidence) findings = findings.filter((f) => f.confidence === query.confidence);
    if (query.algorithm) findings = findings.filter((f) => f.algorithm === query.algorithm);
    if (query.assetType) findings = findings.filter((f) => f.assetType === query.assetType);
    if (query.library) findings = findings.filter((f) => f.library === query.library);
    if (query.search) {
      const q = query.search.toLowerCase();
      findings = findings.filter(
        (f) =>
          f.algorithm.toLowerCase().includes(q) ||
          (f.library ?? "").toLowerCase().includes(q) ||
          (f.sourcePath ?? "").toLowerCase().includes(q)
      );
    }

    // Sort
    if (query.sortBy) {
      const dir = query.sortDir === "desc" ? -1 : 1;
      const key = query.sortBy as keyof Finding;
      findings = [...findings].sort((a, b) => {
        const av = a[key]; const bv = b[key];
        if (av === undefined || bv === undefined) return 0;
        if (av < bv) return -1 * dir;
        if (av > bv) return 1 * dir;
        return 0;
      });
    }

    // Paginate
    const total = findings.length;
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const start = (page - 1) * pageSize;

    return {
      items: findings.slice(start, start + pageSize),
      total,
      page,
      pageSize,
    };
  }

  async getFinding(scanId: string, findingId: string): Promise<Finding> {
    const raw = await this.ensureScanLoaded(scanId);
    // Pass `raw` as context so relativeAssetPath can strip the base path
    const all = raw.findings.map((f, idx) =>
      toFinding(f, findIntelForFinding(raw.intelligence, idx, f), scanId, raw)
    );
    const decodedFindingId = decodeURIComponent(findingId);
    const found = all.find((f) => f.id === findingId || f.id === decodedFindingId);
    if (!found) throw new ApiError(`Finding ${findingId} not found in scan ${scanId}.`, 404);
    return found;
  }

  async getCbom(scanId: string): Promise<CbomResponse> {
    const raw = await this.ensureScanLoaded(scanId);
    // Pass `raw` as context so relativeAssetPath can strip the base path
    const findings = raw.findings.map((f, idx) =>
      toFinding(f, findIntelForFinding(raw.intelligence, idx, f), scanId, raw)
    );
    const components = Array.from(
      new Map(
        findings
          .filter((f) => f.library)
          .map((f) => [
            `${f.library}@${f.libraryVersion ?? "?"}`,
            {
              application: displayName(raw.target_path),
              library: f.library!,
              libraryVersion: f.libraryVersion,
            },
          ])
      ).values()
    );
    return {
      scanId,
      generatedAt: raw.completed_at ?? new Date().toISOString(),
      components,
      findings,
    };
  }

  async getRisk(scanId: string): Promise<QuantumReadinessSummary> {
    const raw = await this.ensureScanLoaded(scanId);
    // Pass `raw` as context so relativeAssetPath can strip the base path
    const findings = raw.findings.map((f, idx) =>
      toFinding(f, findIntelForFinding(raw.intelligence, idx, f), scanId, raw)
    );
    return toQuantumReadinessSummary(raw.intelligence, findings);
  }

  async updateFindingAssumptions(
    scanId: string,
    findingId: string,
    assumptions: { dataLifetime?: string; businessCriticality?: string }
  ): Promise<Finding> {
    const raw = await this.ensureScanLoaded(scanId);
    const index = raw.findings.findIndex((f) => this.toFindingId(scanId, f) === findingId);
    if (index < 0) throw new ApiError(`Finding ${findingId} not found.`, 404);
    const updated = await request<BackendFinding>(`/scans/${scanId}/findings/${index}`, {
      method: "PATCH",
      body: JSON.stringify({
        data_lifetime_years: assumptions.dataLifetime
          ? ({ SHORT: 1, MEDIUM: 3, LONG: 10, INDEFINITE: 20 } as Record<string, number>)[assumptions.dataLifetime] ?? Number(assumptions.dataLifetime)
          : undefined,
        business_criticality: assumptions.businessCriticality,
      }),
    });
    raw.findings[index] = updated;
    // Pass `raw` as context here too
    return toFinding(updated, raw.intelligence[index], scanId, raw);
  }

  async getRecommendations(scanId: string): Promise<Recommendation[]> {
    const raw = await this.ensureScanLoaded(scanId);
    return raw.intelligence
      .filter((i) => i.recommendation && i.recommendation.direction !== "NONE")
      .map((i) => {
        const finding = raw.findings[i.finding_index];
        const findingId = finding
          ? `${scanId}:${finding.asset_path}:${finding.line_start ?? 0}:${finding.algorithm ?? "unknown"}`
          : undefined;
        return toRecommendation(i, scanId, i.algorithm ?? "Unknown", findingId);
      });
  }

  async updateRecommendationStatus(
    scanId: string,
    recommendationId: string,
    status: Recommendation["status"]
  ): Promise<Recommendation> {
    const match = recommendationId.match(/^rec:.+:(\d+)$/);
    if (!match) throw new ApiError(`Recommendation ${recommendationId} not found.`, 404);
    const index = Number(match[1]);
    const updated = await request<BackendIntelligenceAssessment>(`/scans/${scanId}/recommendations/${index}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    const raw = await this.ensureScanLoaded(scanId);
    raw.intelligence[index] = updated;
    const finding = raw.findings[index];
    return toRecommendation(updated, scanId, updated.algorithm ?? "Unknown", finding ? this.toFindingId(scanId, finding) : undefined);
  }

  async getReport(scanId: string): Promise<ReportResponse> {
    const raw = await this.ensureScanLoaded(scanId);
    return {
      scanId,
      format: "json",
      generatedAt: raw.completed_at ?? new Date().toISOString(),
      payload: raw,
    };
  }

  private toFindingId(scanId: string, finding: BackendFinding): string {
    return `${scanId}:${finding.asset_path}:${finding.line_start ?? 0}:${finding.algorithm ?? "unknown"}`;
  }

  private async ensureScanLoaded(scanId: string): Promise<BackendScanResult> {
    const cached = this.scanCache.get(scanId);
    if (cached) return cached;
    const raw = await request<BackendScanResult>(`/scans/${scanId}`);
    this.scanCache.set(scanId, raw);
    return raw;
  }
}

function findIntelForFinding(
  intelligence: BackendIntelligenceAssessment[],
  index: number,
  finding: BackendFinding
): BackendIntelligenceAssessment | undefined {
  const byIndex = intelligence.find((i) => i.finding_index === index);
  if (byIndex) return byIndex;
  return intelligence.find((i) => i.algorithm === finding.algorithm);
}

function displayName(path: string): string {
  const trimmed = path.replace(/[\\/]+$/, "");
  const parts = trimmed.split(/[\\/]/);
  return parts[parts.length - 1] || path;
}