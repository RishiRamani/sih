// frontend/lib/comparisons.ts
import { ApiError } from "@/lib/api/client";
import type { Grade } from "@/lib/grade";
import { BASE_URL } from "./api/auth";



export interface ComparisonRecord {
  id: string;
  oldScanId: string;
  oldScanName: string;
  oldGrade: string;
  newScanId: string;
  newScanName: string;
  newGrade: string;
  verdict: "improved" | "regressed" | "unchanged";
  removedCount: number;
  addedCount: number;
  createdAt: string;
}

// Backend returns snake_case — normalize at the boundary.
interface BackendComparison {
  comparison_id: string;
  owner_id: string;
  old_scan_id: string;
  old_scan_name: string;
  old_grade: string;
  new_scan_id: string;
  new_scan_name: string;
  new_grade: string;
  verdict: "improved" | "regressed" | "unchanged";
  removed_count: number;
  added_count: number;
  created_at: string;
}

function toRecord(raw: BackendComparison): ComparisonRecord {
  return {
    id: raw.comparison_id,
    oldScanId: raw.old_scan_id,
    oldScanName: raw.old_scan_name,
    oldGrade: raw.old_grade,
    newScanId: raw.new_scan_id,
    newScanName: raw.new_scan_name,
    newGrade: raw.new_grade,
    verdict: raw.verdict,
    removedCount: raw.removed_count,
    addedCount: raw.added_count,
    createdAt: raw.created_at,
  };
}

function authHeaders(): Record<string, string> {
  const token =
    typeof window !== "undefined"
      ? window.localStorage.getItem("ecdat-token")
      : null;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { ...authHeaders(), ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    let message = `Request failed: ${res.status}`;
    try {
      const body = await res.json();
      if (body?.detail) message = String(body.detail);
    } catch {
      /* ignore */
    }
    throw new ApiError(message, res.status);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export async function listComparisons(): Promise<ComparisonRecord[]> {
  const raw = await request<BackendComparison[]>("/comparisons");
  return raw.map(toRecord);
}

export async function listComparisonsForScan(
  scanId: string
): Promise<ComparisonRecord[]> {
  const raw = await request<BackendComparison[]>(
    `/comparisons/for-scan/${encodeURIComponent(scanId)}`
  );
  return raw.map(toRecord);
}

export async function recordComparison(record: {
  oldScanId: string;
  oldScanName: string;
  oldGrade: Grade | string;
  newScanId: string;
  newScanName: string;
  newGrade: Grade | string;
  verdict: "improved" | "regressed" | "unchanged";
  removedCount: number;
  addedCount: number;
}): Promise<ComparisonRecord> {
  const raw = await request<BackendComparison>("/comparisons", {
    method: "POST",
    body: JSON.stringify({
      old_scan_id: record.oldScanId,
      old_scan_name: record.oldScanName,
      old_grade: String(record.oldGrade),
      new_scan_id: record.newScanId,
      new_scan_name: record.newScanName,
      new_grade: String(record.newGrade),
      verdict: record.verdict,
      removed_count: record.removedCount,
      added_count: record.addedCount,
    }),
  });
  return toRecord(raw);
}

export async function deleteComparison(id: string): Promise<void> {
  await request(`/comparisons/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function clearAllComparisons(): Promise<void> {
  const records = await listComparisons();
  await Promise.all(records.map((r) => deleteComparison(r.id)));
}

export function findLatestComparisonForScan(
  scanId: string,
  records: ComparisonRecord[]
): {
  otherScanId: string;
  otherScanName: string;
  role: "old" | "new";
  record: ComparisonRecord;
} | null {
  const [latest] = records;
  if (!latest) return null;
  if (latest.oldScanId === scanId) {
    return {
      otherScanId: latest.newScanId,
      otherScanName: latest.newScanName,
      role: "old",
      record: latest,
    };
  }
  return {
    otherScanId: latest.oldScanId,
    otherScanName: latest.oldScanName,
    role: "new",
    record: latest,
  };
}