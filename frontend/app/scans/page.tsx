"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PlusCircle, AlertCircle, Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { buttonClasses } from "@/components/ui/Button";
import { ScanStatusBadge } from "@/components/ui/Badge";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/States";
import { api } from "@/lib/api";
import type { Scan } from "@/lib/types";
import { formatDate, formatDuration, INPUT_TYPE_LABEL } from "@/lib/utils";

function destinationFor(scan: Scan): string {
  return `/scans/${scan.id}/progress`;
}

export default function ScansPage() {
  const [scans, setScans] = useState<Scan[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function load() {
    setLoading(true);
    setError(null);
    api
      .listScans()
      .then(setScans)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load scans."))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleDelete(scan: Scan) {
    if (!window.confirm(`Delete scan "${scan.name}"? This cannot be undone.`)) return;
    setDeletingId(scan.id);
    try {
      await api.deleteScan(scan.id);
      setScans((current) => current?.filter((item) => item.id !== scan.id) ?? current);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete scan.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
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
      {!loading && error ? <ErrorState description={error} onRetry={load} /> : null}

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
            <table className="w-full min-w-[920px] border-collapse text-sm">
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
                  <th className="border-b border-border px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.11em] text-text-secondary">
                    Duration
                  </th>
                  <th className="border-b border-border px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.11em] text-text-secondary">
                    Created
                  </th>
                  <th className="border-b border-border px-4 py-2.5 text-right text-[10px] font-semibold uppercase tracking-[0.11em] text-text-secondary">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {scans.map((scan) => (
                  <tr
                    key={scan.id}
                    className="border-b border-border last:border-b-0 transition-colors hover:bg-elevated/60"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={destinationFor(scan)}
                        className="font-medium text-text-primary hover:text-accent"
                      >
                        {scan.name}
                      </Link>
                      <div className="truncate text-xs text-text-secondary">
                        {scan.sourceLabel}
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
                    <td className="px-4 py-3 font-mono-tabular text-text-secondary">
                      {formatDuration(scan.startedAt, scan.completedAt)}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {formatDate(scan.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        title="Delete scan"
                        aria-label={`Delete scan ${scan.name}`}
                        disabled={deletingId === scan.id}
                        onClick={() => handleDelete(scan)}
                        className="inline-flex items-center justify-center rounded p-1.5 text-text-secondary transition-colors hover:bg-crimson/10 hover:text-crimson disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}
    </AppShell>
  );
}