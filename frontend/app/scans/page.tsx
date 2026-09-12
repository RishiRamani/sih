"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PlusCircle, AlertCircle } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ScanStatusBadge } from "@/components/ui/Badge";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/States";
import { api } from "@/lib/api";
import type { Scan } from "@/lib/types";
import { formatDate, formatDuration, INPUT_TYPE_LABEL } from "@/lib/utils";

function destinationFor(scan: Scan): string {
  return scan.status === "COMPLETED" ? `/scans/${scan.id}/findings` : `/scans/${scan.id}/progress`;
}

export default function ScansPage() {
  const [scans, setScans] = useState<Scan[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <AppShell title="Scans">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Scan history</h2>
          <p className="text-sm text-text-secondary">Every discovery run across source, binary, container, and certificate assets.</p>
        </div>
        <Link
          href="/scans/new"
          className="flex items-center gap-2 rounded bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accent/90"
        >
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
            <Link href="/scans/new" className="rounded bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent/90">
              Start a scan
            </Link>
          }
        />
      ) : null}

      {!loading && !error && scans && scans.length > 0 ? (
        <div className="overflow-hidden rounded-md border border-border bg-surface">
          <table className="w-full min-w-[860px] border-collapse text-sm">
            <thead className="bg-elevated">
              <tr>
                <th className="border-b border-border px-3 py-2 text-left text-xs font-semibold text-text-secondary">Scan</th>
                <th className="border-b border-border px-3 py-2 text-left text-xs font-semibold text-text-secondary">Input type</th>
                <th className="border-b border-border px-3 py-2 text-left text-xs font-semibold text-text-secondary">Status</th>
                <th className="border-b border-border px-3 py-2 text-left text-xs font-semibold text-text-secondary">Findings</th>
                <th className="border-b border-border px-3 py-2 text-left text-xs font-semibold text-text-secondary">Duration</th>
                <th className="border-b border-border px-3 py-2 text-left text-xs font-semibold text-text-secondary">Created</th>
              </tr>
            </thead>
            <tbody>
              {scans.map((scan) => (
                <tr key={scan.id} className="border-b border-border last:border-b-0 hover:bg-elevated">
                  <td className="px-3 py-2.5">
                    <Link href={destinationFor(scan)} className="font-medium text-text-primary hover:text-accent">
                      {scan.name}
                    </Link>
                    <div className="truncate text-xs text-text-secondary">{scan.sourceLabel}</div>
                  </td>
                  <td className="px-3 py-2.5 text-text-secondary">{INPUT_TYPE_LABEL[scan.inputType]}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <ScanStatusBadge status={scan.status} />
                      {scan.status === "FAILED" && scan.errorMessage ? (
                        <span title={scan.errorMessage}>
                          <AlertCircle size={14} className="text-crimson" />
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 font-mono-tabular text-text-primary">
                    {scan.findingCount ?? "—"}
                    {scan.highRiskCount ? <span className="ml-1 text-xs text-crimson">({scan.highRiskCount} high)</span> : null}
                  </td>
                  <td className="px-3 py-2.5 font-mono-tabular text-text-secondary">{formatDuration(scan.startedAt, scan.completedAt)}</td>
                  <td className="px-3 py-2.5 text-text-secondary">{formatDate(scan.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </AppShell>
  );
}
