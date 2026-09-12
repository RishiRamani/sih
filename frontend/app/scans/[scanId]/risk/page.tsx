"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Atom, ShieldAlert } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ScanTabs } from "@/components/layout/ScanTabs";
import { RiskDistributionChart } from "@/components/charts/RiskDistributionChart";
import { ErrorState, LoadingState } from "@/components/ui/States";
import { RiskBadge } from "@/components/ui/Badge";
import { api } from "@/lib/api";
import type { QuantumReadinessSummary, Finding } from "@/lib/types";

export default function RiskPage({ params }: { params: { scanId: string } }) {
  const { scanId } = params;
  const [summary, setSummary] = useState<QuantumReadinessSummary | null>(null);
  const [prioritized, setPrioritized] = useState<Finding[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    setError(null);
    api
      .getRisk(scanId)
      .then(async (s) => {
        setSummary(s);
        const findings = await Promise.all(s.prioritizedFindingIds.map((id) => api.getFinding(scanId, id)));
        setPrioritized(findings);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load risk assessment."))
      .finally(() => setLoading(false));
  }

  useEffect(load, [scanId]);

  return (
    <AppShell title="Risk & quantum readiness">
      <ScanTabs scanId={scanId} />

      {loading ? <LoadingState label="Loading risk assessment" /> : null}
      {error ? <ErrorState description={error} onRetry={load} /> : null}

      {summary ? (
        <div className="space-y-5">
          <div className="rounded-md border border-accent/30 bg-accent/5 p-3 text-sm text-text-secondary">
            <span className="font-medium text-text-primary">CRQC scenario in use: </span>
            {summary.crqcScenario}. This assessment, including the scenario, is computed by the backend and rendered
            as returned — it is not recalculated in this UI.
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-md border border-border bg-surface p-4 shadow-subtle">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-text-primary">
                <ShieldAlert size={15} className="text-amber" />
                Classical exposure
              </h3>
              <RiskDistributionChart data={summary.classicalExposure} />
            </div>
            <div className="rounded-md border border-border bg-surface p-4 shadow-subtle">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-text-primary">
                <Atom size={15} className="text-accent" />
                Quantum exposure
              </h3>
              <RiskDistributionChart data={summary.quantumExposure} />
            </div>
          </div>

          <div className="rounded-md border border-border bg-surface p-4 shadow-subtle">
            <h3 className="mb-3 text-sm font-semibold text-text-primary">Prioritized findings</h3>
            {prioritized.length === 0 ? (
              <p className="text-sm text-text-secondary">No findings were prioritized for this scan.</p>
            ) : (
              <ul className="divide-y divide-border">
                {prioritized.map((f) => (
                  <li key={f.id}>
                    <Link
                      href={`/scans/${scanId}/findings/${f.id}`}
                      className="flex items-center justify-between gap-3 py-2.5 text-sm hover:bg-elevated"
                    >
                      <div className="min-w-0">
                        <div className="truncate font-medium text-text-primary">
                          {f.algorithm}
                          {f.variant ? <span className="font-normal text-text-secondary"> · {f.variant}</span> : null}
                        </div>
                        <div className="truncate text-xs text-text-secondary">{f.sourcePath ?? f.library ?? "—"}</div>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="font-mono-tabular text-xs text-text-secondary">Score {f.riskScore}</span>
                        <RiskBadge level={f.riskLevel} />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
