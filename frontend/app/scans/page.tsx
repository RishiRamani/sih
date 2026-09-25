"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PlusCircle, AlertCircle, GitCompareArrows } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { buttonClasses } from "@/components/ui/Button";
import { ScanStatusBadge } from "@/components/ui/Badge";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/States";
import { RequireAuth } from "@/lib/auth/guard";
import { RescanButton } from "@/components/layout/RescanButton";
import { api } from "@/lib/api";
import type { Scan } from "@/lib/types";
import { INPUT_TYPE_LABEL } from "@/lib/utils";
import { listComparisons, type ComparisonRecord } from "@/lib/comparisons";
import { useRouter } from "next/navigation";

function displaySource(scan: Scan): string {
  const src = scan.sourceLabel;
  if (/^(https?:\/\/|git@)/.test(src)) return src;
  const parts = src.replace(/\\/g, "/").replace(/\/+$/, "").split("/");
  if (scan.name === parts[parts.length - 1]) return "";
  return src;
}

function destinationFor(scan: Scan): string {
  return scan.status === "COMPLETED"
    ? `/scans/${scan.id}/findings`
    : `/scans/${scan.id}/progress`;
}

export default function ScansPage() {
  const [scans, setScans] = useState<Scan[] | null>(null);
  const [comparisonsByScan, setComparisonsByScan] = useState<
    Record<string, ComparisonRecord[]>
  >({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  async function load() {
    setLoading(true);
    setError(null);

    // Scans are required — if this fails, show the error state.
    let scanList: Scan[];
    try {
      scanList = await api.listScans();
      setScans(scanList);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load scans.");
      setScans([]);
      setLoading(false);
      return;
    }

    // Comparisons are optional — if this fails, just leave them empty.
    try {
      const comparisons = await listComparisons();
      const map: Record<string, ComparisonRecord[]> = {};
      for (const c of comparisons) {
        (map[c.oldScanId] ??= []).push(c);
        (map[c.newScanId] ??= []).push(c);
      }
      setComparisonsByScan(map);
    } catch {
      setComparisonsByScan({});
    }

    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <RequireAuth>
      <AppShell title="Scans">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">History</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-[-0.02em] text-text-primary">
              Scan runs
            </h2>
            <p className="mt-1 text-[13px] text-text-secondary">
              Every discovery run across source, binary, container, and certificate assets.
            </p>
          </div>
          <Link href="/scans/new" className={buttonClasses("primary")}>
            <PlusCircle size={15} />
            New scan
          </Link>
        </div>

        {loading ? <LoadingState label="Loading scans" /> : null}
        {!loading && error ? (
          <ErrorState description={error} onRetry={load} />
        ) : null}

        {!loading && !error && scans && scans.length === 0 ? (
          <EmptyState
            title="No scans yet"
            description="Start a new scan against a repository, binary, container image, or certificate set."
            action={
              <Link href="/scans/new" className={buttonClasses("primary")}>
                Start a scan
              </Link>
            }
          />
        ) : null}

        {!loading && !error && scans && scans.length > 0 ? (
          <Card bodyClassName="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] border-collapse text-sm">
                <thead className="bg-elevated">
                  <tr>
                    <th className="border-b border-border px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.11em] text-text-secondary">
                      Scan
                    </th>
                    <th className="border-b border-border px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.11em] text-text-secondary">
                      Input type
                    </th>
                    <th className="border-b border-border px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.11em] text-text-secondary">
                      Status
                    </th>
                    <th className="border-b border-border px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.11em] text-text-secondary">
                      Findings
                    </th>
                    <th className="border-b border-border px-4 py-2.5 text-right text-[10px] font-semibold uppercase tracking-[0.11em] text-text-secondary">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {scans.map((scan) => {
                    const latestComparison = comparisonsByScan[scan.id]?.[0];
                    return (
                      <tr
                        key={scan.id}
                        onClick={() => router.push(destinationFor(scan))}
                        className="cursor-pointer border-b border-border last:border-b-0 transition-colors hover:bg-elevated/60"
                      >
                        <td className="px-4 py-3">
                          <Link
                            href={destinationFor(scan)}
                            className="font-medium text-text-primary hover:text-accent"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {scan.name}
                          </Link>
                          <div className="truncate text-xs text-text-secondary">
                            {displaySource(scan)}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-text-secondary">
                          {INPUT_TYPE_LABEL[scan.inputType]}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <ScanStatusBadge status={scan.status} />
                            {scan.status === "FAILED" && scan.errorMessage ? (
                              <span title={scan.errorMessage}>
                                <AlertCircle size={13} className="text-crimson" />
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono-tabular text-text-primary">
                          {scan.findingCount ?? "—"}
                          {scan.highRiskCount ? (
                            <span className="ml-1.5 text-xs text-crimson">
                              ({scan.highRiskCount} high)
                            </span>
                          ) : null}
                        </td>
                        <td
                          className="px-4 py-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-1.5">
                            {latestComparison ? (
                              <Link
                                href={`/scans/${scan.id}/compare/${
                                  latestComparison.newScanId === scan.id
                                    ? latestComparison.oldScanId
                                    : latestComparison.newScanId
                                }`}
                                className="inline-flex items-center gap-1.5 rounded-sm border border-accent/35 bg-accent/8 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.05em] text-accent transition-colors hover:border-accent/60 hover:bg-accent/12"
                                title={`Compared against ${
                                  latestComparison.newScanId === scan.id
                                    ? latestComparison.oldScanName
                                    : latestComparison.newScanName
                                }`}
                              >
                                <GitCompareArrows size={11} />
                                Compare
                              </Link>
                            ) : null}
                            {scan.status === "COMPLETED" ? (
                              <RescanButton
                                scan={scan}
                                variant="ghost"
                                size="sm"
                                label="Rescan"
                              />
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        ) : null}
      </AppShell>
    </RequireAuth>
  );
}