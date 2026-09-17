// import type {
//   ApiClient,
//   CbomResponse,
//   FindingsQuery,
//   FindingsResponse,
//   ReportResponse
// } from "@/lib/api/client";
// import { ApiError } from "@/lib/api/client";
// import { MOCK_SCANS, MOCK_FINDINGS } from "@/lib/api/mock-data";
// import type {
//   Scan,
//   Finding,
//   NewScanInput,
//   DashboardSummary,
//   QuantumReadinessSummary,
//   Recommendation,
//   RiskLevel,
//   ScanStatus
// } from "@/lib/types";
// import { SCAN_STATUS_ORDER } from "@/lib/types";

// // In-memory mutable copies so the demo can create scans, advance progress,
// // and record recommendation-status edits without a real backend.
// let scans: Scan[] = MOCK_SCANS.map((s) => ({ ...s }));
// let findings: Finding[] = MOCK_FINDINGS.map((f) => ({ ...f }));

// function delay(ms = 350) {
//   return new Promise((resolve) => setTimeout(resolve, ms));
// }

// function requireScan(scanId: string): Scan {
//   const scan = scans.find((s) => s.id === scanId);
//   if (!scan) throw new ApiError(`Scan ${scanId} was not found.`, 404);
//   return scan;
// }

// function riskDistribution(items: Finding[]) {
//   const levels: RiskLevel[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
//   return levels.map((level) => ({
//     level,
//     count: items.filter((f) => f.riskLevel === level).length
//   }));
// }

// export class MockApiAdapter implements ApiClient {
//   async getDashboardSummary(): Promise<DashboardSummary> {
//     await delay();
//     const completedFindings = findings;
//     const libraries = new Set(completedFindings.map((f) => f.library).filter(Boolean));
//     const algorithms = new Set(completedFindings.map((f) => f.algorithm));
//     const certs = completedFindings.filter((f) => f.primitiveType === "CERTIFICATE").length;

//     const componentCounts = new Map<string, { count: number; risk: RiskLevel }>();
//     completedFindings.forEach((f) => {
//       const key = f.library ?? f.algorithm;
//       const existing = componentCounts.get(key);
//       const rank: Record<RiskLevel, number> = { LOW: 0, MEDIUM: 1, HIGH: 2, CRITICAL: 3 };
//       if (!existing) {
//         componentCounts.set(key, { count: 1, risk: f.riskLevel });
//       } else {
//         existing.count += 1;
//         if (rank[f.riskLevel] > rank[existing.risk]) existing.risk = f.riskLevel;
//       }
//     });

//     const topRiskyComponents = Array.from(componentCounts.entries())
//       .map(([name, v]) => ({ name, occurrences: v.count, riskLevel: v.risk }))
//       .sort((a, b) => b.occurrences - a.occurrences)
//       .slice(0, 6);

//     return {
//       cryptoAssets: completedFindings.length,
//       algorithms: algorithms.size,
//       certificates: certs,
//       libraries: libraries.size,
//       highRisk: completedFindings.filter((f) => f.riskLevel === "HIGH" || f.riskLevel === "CRITICAL").length,
//       criticalRisk: completedFindings.filter((f) => f.riskLevel === "CRITICAL").length,
//       quantumRisk: completedFindings.filter((f) => f.quantumStatus === "BROKEN" || f.quantumStatus === "WEAK").length,
//       riskDistribution: riskDistribution(completedFindings),
//       topRiskyComponents,
//       recentScans: [...scans].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 5),
//       coverageSummary: {
//         scansCompleted: scans.filter((s) => s.status === "COMPLETED").length,
//         filesScanned: scans.reduce((sum, s) => sum + (s.coverage?.filesScanned ?? 0), 0),
//         unsupportedFiles: scans.reduce((sum, s) => sum + (s.coverage?.unsupportedFiles ?? 0), 0),
//         skippedFiles: scans.reduce((sum, s) => sum + (s.coverage?.skippedFiles ?? 0), 0),
//         parseErrors: scans.reduce((sum, s) => sum + (s.coverage?.parseErrors ?? 0), 0),
//         warnings: scans.reduce((sum, s) => sum + (s.coverage?.warnings.length ?? 0), 0)
//       }
//     };
//   }

//   async listScans(): Promise<Scan[]> {
//     await delay();
//     return [...scans].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
//   }

//   async deleteScan(scanId: string): Promise<void> {
//     await delay(200);
//     const before = scans.length;
//     scans = scans.filter((scan) => scan.id !== scanId);
//     if (scans.length === before) throw new ApiError(`Scan ${scanId} was not found.`, 404);
//   }

//   async createScan(input: NewScanInput): Promise<Scan> {
//     await delay(500);
//     const scan: Scan = {
//       id: `scan_${Math.random().toString(36).slice(2, 8)}`,
//       name: input.name,
//       inputType: input.inputType,
//       sourceLabel: input.sourceLabel,
//       status: "CREATED",
//       progressPercent: 0,
//       createdAt: new Date().toISOString(),
//       requestedBy: "you"
//     };
//     scans = [scan, ...scans];
//     return scan;
//   }

//   async getScan(scanId: string): Promise<Scan> {
//     await delay(200);
//     return { ...requireScan(scanId) };
//   }

//   async startScan(scanId: string): Promise<Scan> {
//     await delay(300);
//     const scan = requireScan(scanId);
//     scan.status = "QUEUED";
//     scan.startedAt = new Date().toISOString();
//     return { ...scan };
//   }

//   // Simulates backend progress: each poll advances the scan one lifecycle
//   // stage, so the Scan Progress page has something to animate against
//   // without needing a real running scanner.
//   async getScanStatus(scanId: string): Promise<Scan> {
//     await delay(400);
//     const scan = requireScan(scanId);
//     if (scan.status !== "COMPLETED" && scan.status !== "FAILED") {
//       const idx = SCAN_STATUS_ORDER.indexOf(scan.status);
//       const next: ScanStatus = SCAN_STATUS_ORDER[Math.min(idx + 1, SCAN_STATUS_ORDER.length - 1)] ?? "COMPLETED";
//       scan.status = next;
//       scan.progressPercent = Math.round(((idx + 1) / (SCAN_STATUS_ORDER.length - 1)) * 100);
//       if (next === "COMPLETED") {
//         scan.completedAt = new Date().toISOString();
//         scan.progressPercent = 100;
//         scan.findingCount = findings.filter((f) => f.scanId === scanId).length;
//         scan.highRiskCount = findings.filter(
//           (f) => f.scanId === scanId && (f.riskLevel === "HIGH" || f.riskLevel === "CRITICAL")
//         ).length;
//       }
//     }
//     return { ...scan };
//   }

//   async getFindings(scanId: string, query: FindingsQuery = {}): Promise<FindingsResponse> {
//     await delay();
//     requireScan(scanId);
//     let items = findings.filter((f) => f.scanId === scanId);

//     if (query.riskLevel) items = items.filter((f) => f.riskLevel === query.riskLevel);
//     if (query.confidence) items = items.filter((f) => f.confidence === query.confidence);
//     if (query.algorithm) items = items.filter((f) => f.algorithm === query.algorithm);
//     if (query.assetType) items = items.filter((f) => f.assetType === query.assetType);
//     if (query.inputType) items = items.filter((f) => f.inputType === query.inputType);
//     if (query.library) items = items.filter((f) => f.library === query.library);
//     if (query.search) {
//       const q = query.search.toLowerCase();
//       items = items.filter(
//         (f) =>
//           f.algorithm.toLowerCase().includes(q) ||
//           (f.library ?? "").toLowerCase().includes(q) ||
//           (f.sourcePath ?? "").toLowerCase().includes(q)
//       );
//     }

//     if (query.sortBy) {
//       const dir = query.sortDir === "desc" ? -1 : 1;
//       const key = query.sortBy as keyof Finding;
//       items = [...items].sort((a, b) => {
//         const av = a[key];
//         const bv = b[key];
//         if (av === undefined || bv === undefined) return 0;
//         if (av < bv) return -1 * dir;
//         if (av > bv) return 1 * dir;
//         return 0;
//       });
//     }

//     const total = items.length;
//     const page = query.page ?? 1;
//     const pageSize = query.pageSize ?? 20;
//     const start = (page - 1) * pageSize;
//     items = items.slice(start, start + pageSize);

//     return { items, total, page, pageSize };
//   }

//   async getFinding(scanId: string, findingId: string): Promise<Finding> {
//     await delay(200);
//     const finding = findings.find((f) => f.scanId === scanId && f.id === findingId);
//     if (!finding) throw new ApiError(`Finding ${findingId} was not found in scan ${scanId}.`, 404);
//     return { ...finding };
//   }

//   async getCbom(scanId: string): Promise<CbomResponse> {
//     await delay();
//     requireScan(scanId);
//     const scanFindings = findings.filter((f) => f.scanId === scanId);
//     const componentMap = new Map<string, { application: string; library: string; libraryVersion?: string }>();
//     scanFindings.forEach((f) => {
//       const key = `${f.library ?? "unknown"}@${f.libraryVersion ?? "unknown"}`;
//       if (!componentMap.has(key)) {
//         componentMap.set(key, {
//           application: scans.find((s) => s.id === scanId)?.name ?? scanId,
//           library: f.library ?? "Unknown",
//           libraryVersion: f.libraryVersion
//         });
//       }
//     });
//     return {
//       scanId,
//       generatedAt: new Date().toISOString(),
//       components: Array.from(componentMap.values()),
//       findings: scanFindings
//     };
//   }

//   async getRisk(scanId: string): Promise<QuantumReadinessSummary> {
//     await delay();
//     const scanFindings = findings.filter((f) => f.scanId === scanId);
//     const classicalExposure = riskDistribution(
//       scanFindings.filter((f) => f.classicalStatus === "WEAK" || f.classicalStatus === "BROKEN")
//     );
//     const quantumExposure = riskDistribution(
//       scanFindings.filter((f) => f.quantumStatus === "WEAK" || f.quantumStatus === "BROKEN")
//     );
//     const prioritized = [...scanFindings].sort((a, b) => b.riskScore - a.riskScore).slice(0, 5).map((f) => f.id);

//     return {
//       crqcScenario: "NIST-aligned conservative scenario: cryptographically relevant quantum computer by ~2033",
//       criticalCount: scanFindings.filter((f) => f.riskLevel === "CRITICAL").length,
//       classicalExposure,
//       quantumExposure,
//       prioritizedFindingIds: prioritized
//     };
//   }

//   async updateFindingAssumptions(
//     scanId: string,
//     findingId: string,
//     assumptions: { dataLifetime?: string; businessCriticality?: string }
//   ): Promise<Finding> {
//     await delay(400);
//     const finding = findings.find((f) => f.scanId === scanId && f.id === findingId);
//     if (!finding) throw new ApiError(`Finding ${findingId} was not found.`, 404);
//     // NOTE: in the real backend, submitting new assumptions triggers a
//     // server-side risk recalculation. The mock adapter only echoes the
//     // assumption back — it deliberately does not recompute riskScore or
//     // riskLevel client-side.
//     if (assumptions.dataLifetime) {
//       finding.dataLifetime = assumptions.dataLifetime as Finding["dataLifetime"];
//       finding.isAssumption = { ...finding.isAssumption, dataLifetime: true };
//     }
//     if (assumptions.businessCriticality) {
//       finding.businessCriticality = assumptions.businessCriticality as Finding["businessCriticality"];
//       finding.isAssumption = { ...finding.isAssumption, businessCriticality: true };
//     }
//     return { ...finding };
//   }

//   async getRecommendations(scanId: string): Promise<Recommendation[]> {
//     await delay();
//     return findings
//       .filter((f) => f.scanId === scanId && f.recommendation)
//       .map((f) => f.recommendation as Recommendation);
//   }

//   async updateRecommendationStatus(
//     scanId: string,
//     recommendationId: string,
//     status: Recommendation["status"]
//   ): Promise<Recommendation> {
//     await delay(300);
//     const finding = findings.find((f) => f.scanId === scanId && f.recommendation?.id === recommendationId);
//     if (!finding || !finding.recommendation) throw new ApiError(`Recommendation ${recommendationId} was not found.`, 404);
//     finding.recommendation = { ...finding.recommendation, status };
//     return { ...finding.recommendation };
//   }

//   async getReport(scanId: string): Promise<ReportResponse> {
//     await delay(500);
//     const scan = requireScan(scanId);
//     const scanFindings = findings.filter((f) => f.scanId === scanId);
//     return {
//       scanId,
//       format: "json",
//       generatedAt: new Date().toISOString(),
//       payload: { scan, findings: scanFindings }
//     };
//   }
// }
