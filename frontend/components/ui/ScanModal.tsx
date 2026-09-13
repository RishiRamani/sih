"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, AlertTriangle, Terminal } from "lucide-react";
import { api } from "@/lib/api";
import type { ScanStatus } from "@/lib/types";
import { SCAN_STATUS_LABEL } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function ScanProgressModal({
  scanId,
  scanName,
  onClose,
}: {
  scanId: string;
  scanName: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<ScanStatus>("CREATED");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const scan = await api.getScanStatus(scanId);
        if (cancelled) return;
        setStatus(scan.status);
        setProgress(scan.progressPercent);
        if (scan.status === "COMPLETED") {
          setTimeout(() => router.push(`/scans/${scanId}/findings`), 900);
          return;
        }
        if (scan.status === "FAILED") {
          setError(scan.errorMessage ?? "Scan failed.");
          return;
        }
        setTimeout(poll, 700);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Polling failed.");
      }
    }
    poll();
    return () => {
      cancelled = true;
    };
  }, [scanId, router]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-base/80 backdrop-blur-sm">
      <div className="w-[520px] brass-frame bg-surface">
        {/* Title bar */}
        <div className="flex items-center gap-2 border-b border-border bg-elevated px-4 py-2.5">
          <Terminal size={13} className="text-accent" />
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-text-secondary">
            discovery run
          </span>
          <span className="ml-auto font-mono text-[10px] text-text-dim">
            {scanId}
          </span>
        </div>

        {/* Scan body */}
        <div className="scanlines px-6 py-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-secondary">
            Target
          </p>
          <p className="mt-1 truncate font-mono text-[15px] text-text-primary">
            {scanName}
          </p>

          {/* Progress bar — instrument style */}
          <div className="mt-6">
            <div className="flex items-baseline justify-between font-mono text-[11px]">
              <span className="uppercase tracking-[0.12em] text-text-secondary">
                {SCAN_STATUS_LABEL[status]}
              </span>
              <span className="font-mono-tabular text-accent">
                {progress.toString().padStart(3, "0")}%
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden bg-elevated">
              <div
                className="h-full bg-accent transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Lifecycle ticker */}
          <div className="mt-6 space-y-1.5 font-mono text-[11px]">
            {LIFECYCLE.map((step, i) => {
              const idx = LIFECYCLE.indexOf(status);
              const done = i < idx;
              const active = i === idx;
              return (
                <div
                  key={step}
                  className={cn(
                    "flex items-center gap-2",
                    done && "text-text-dim",
                    active && "text-accent",
                    !done && !active && "text-text-dim/50"
                  )}
                >
                  {done ? (
                    <CheckCircle2 size={11} />
                  ) : active ? (
                    <Loader2 size={11} className="animate-spin" />
                  ) : (
                    <span className="inline-block h-2.5 w-2.5 rounded-full border border-current" />
                  )}
                  <span>{SCAN_STATUS_LABEL[step]}</span>
                </div>
              );
            })}
          </div>

          {error ? (
            <div className="mt-4 flex items-start gap-2 border border-danger/40 bg-danger/10 px-3 py-2 text-[12px] text-danger">
              <AlertTriangle size={13} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border bg-elevated px-4 py-2.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-dim">
            {status === "COMPLETED" ? "redirecting to findings…" : "scanning…"}
          </span>
          <button
            onClick={onClose}
            className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-secondary hover:text-text-primary"
          >
            run in background
          </button>
        </div>
      </div>
    </div>
  );
}

const LIFECYCLE: ScanStatus[] = [
  "QUEUED",
  "DISCOVERING",
  "ANALYSING",
  "NORMALIZING",
  "BUILDING_CBOM",
  "ASSESSING_RISK",
  "GENERATING_RECOMMENDATIONS",
  "COMPLETED",
];