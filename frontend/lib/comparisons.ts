/**
 * Comparison records live in localStorage for the SIH prototype.
 * When the backend adds a `/comparisons` endpoint, replace the storage
 * layer here — every consumer already imports from this module.
 */

export interface ComparisonRecord {
  /** unique id for this comparison */
  id: string;
  /** the older scan (before) */
  oldScanId: string;
  oldScanName: string;
  oldGrade: string;
  /** the newer scan (after) */
  newScanId: string;
  newScanName: string;
  newGrade: string;
  /** verdict */
  verdict: "improved" | "regressed" | "unchanged";
  /** counts at time of comparison */
  removedCount: number;
  addedCount: number;
  /** ISO timestamp of when this comparison was recorded */
  createdAt: string;
}

const STORAGE_KEY = "ecdat-comparisons";
const CHANGE_EVENT = "ecdat-comparisons-changed";

function readAll(): ComparisonRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as ComparisonRecord[];
  } catch {
    return [];
  }
}

function writeAll(records: ComparisonRecord[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    // Same-tab listeners don't get the native "storage" event, so fire our own
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    /* quota exceeded — ignore */
  }
}

export function listComparisons(): ComparisonRecord[] {
  return readAll().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** All comparisons involving this scan (as either old or new). */
export function listComparisonsForScan(scanId: string): ComparisonRecord[] {
  return listComparisons().filter(
    (r) => r.oldScanId === scanId || r.newScanId === scanId
  );
}

/**
 * Given a scan id, return the "other" scan id in the most recent comparison.
 * Useful for showing a "Compare" shortcut next to a scan.
 */
export function findLatestComparisonForScan(scanId: string): {
  otherScanId: string;
  otherScanName: string;
  role: "old" | "new";
  record: ComparisonRecord;
} | null {
  const matches = listComparisonsForScan(scanId);
  // Use destructuring — TS narrows `latest` to `ComparisonRecord | undefined`
  const [latest] = matches;
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

export function recordComparison(
  record: Omit<ComparisonRecord, "id" | "createdAt">
): ComparisonRecord {
  const full: ComparisonRecord = {
    ...record,
    id: `cmp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
  };

  // De-dupe: if we already have a comparison with the same old/new pair, replace it
  const existing = readAll().filter(
    (r) => !(r.oldScanId === full.oldScanId && r.newScanId === full.newScanId)
  );
  writeAll([full, ...existing]);
  return full;
}

export function deleteComparison(id: string): void {
  writeAll(readAll().filter((r) => r.id !== id));
}

export function clearAllComparisons(): void {
  writeAll([]);
}

/**
 * Subscribe to changes. Returns an unsubscribe function.
 * Use inside a useEffect:
 *
 *   useEffect(() => subscribeComparisons(refresh), []);
 */
export function subscribeComparisons(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(CHANGE_EVENT, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(CHANGE_EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}