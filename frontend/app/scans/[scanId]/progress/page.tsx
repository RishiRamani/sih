"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2, ArrowRight } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ScanTabs } from "@/components/layout/ScanTabs";
import { ErrorState, LoadingState } from "@/components/ui/States";
import { api } from "@/lib/api";
import type { Scan } from "@/lib/types";
import { SCAN_STATUS_ORDER } from "@/lib/types";
import { SCAN_STATUS_LABEL, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function ScanProgressPage({ params }: { params: { scanId: string } }) {
  const { scanId } = params;
  const [scan, setScan] = useState<Scan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function poll() {
    api
      .getScanStatus(scanId)
      .then((s) => {
        setScan(s);
        setError(null);
        if (s.status !== "COMPLETED" && s.status !== "FAILED") {
          timer.current = setTimeout(poll, 1400);
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load scan status."));
  }

  useEffect(() => {
    poll();
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanId]);

  return (
    <AppShell title="Scan progress">
      <ScanTabs scanId={scanId} />

      {!scan && !error ? <LoadingState label="Loading scan" /> : null}
      {error && !scan ? <ErrorState description={error} onRetry={poll} /> : null}

      {scan ? (
        <div className="mx-auto max-w-2xl">
          <div className="mb-5 flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">{scan.name}</h2>
              <p className="text-sm text-text-secondary">{scan.sourceLabel}</p>
            </div>
            {scan.status === "COMPLETED" ? (
              <Link
                href={`/scans/${scanId}/findings`}
                className="flex items-center gap-1.5 rounded bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accent/90"
              >
                View results
                <ArrowRight size={14} />
              </Link>
            ) : null}
          </div>

          {scan.status === "FAILED" ? (
            <div className="rounded-md border border-crimson/30 bg-crimson/5 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-crimson">
                <XCircle size={16} />
                Scan failed
              </div>
              <p className="mt-1 text-sm text-text-secondary">{scan.errorMessage ?? "The scan could not complete."}</p>
            </div>
          ) : (
            <ol className="space-y-1">
              {SCAN_STATUS_ORDER.map((stage, idx) => {
                const currentIdx = SCAN_STATUS_ORDER.indexOf(scan.status);
                const done = idx < currentIdx || scan.status === "COMPLETED";
                const active = idx === currentIdx && scan.status !== "COMPLETED";
                return (
                  <li
                    key={stage}
                    className={cn(
                      "flex items-center gap-3 rounded-md border px-3 py-2.5",
                      active ? "border-accent/40 bg-accent/5" : "border-border bg-surface"
                    )}
                  >
                    {done ? (
                      <CheckCircle2 size={16} className="shrink-0 text-teal" />
                    ) : active ? (
                      <Loader2 size={16} className="shrink-0 animate-spin text-accent" />
                    ) : (
                      <span className="h-4 w-4 shrink-0 rounded-full border-2 border-border" />
                    )}
                    <span
                      className={cn(
                        "text-sm",
                        done ? "text-text-primary" : active ? "font-medium text-text-primary" : "text-text-secondary"
                      )}
                    >
                      {SCAN_STATUS_LABEL[stage]}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}

          <div className="mt-4 flex items-center justify-between text-xs text-text-secondary">
            <span>Created {formatDate(scan.createdAt)}</span>
            <span className="font-mono-tabular">{scan.progressPercent}%</span>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-elevated">
            <div
              className={cn("h-full rounded-full transition-all", scan.status === "FAILED" ? "bg-crimson" : "bg-accent")}
              style={{ width: `${scan.progressPercent}%` }}
            />
          </div>

          {scan.coverage && scan.coverage.warnings.length > 0 ? (
            <div className="mt-5 rounded-md border border-amber/30 bg-amber/5 p-3">
              <h3 className="text-sm font-semibold text-amber">Warnings</h3>
              <ul className="mt-1.5 space-y-1 text-xs text-text-secondary">
                {scan.coverage.warnings.map((w, i) => (
                  <li key={i}>
                    {w.message}
                    {w.path ? <span className="font-mono-tabular"> ({w.path})</span> : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </AppShell>
  );
}
