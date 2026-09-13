"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Atom, ShieldAlert } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
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
        const findings = await Promise.all(
          s.prioritizedFindingIds.map(async (id) => {
            try {
              return await api.getFinding(scanId, id);
            } catch {
              return null;
            }
          })
        );
        setPrioritized(findings.filter((finding): finding is Finding => finding !== null));
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Failed to load risk assessment.")
      )
      .finally(() => setLoading(false));
  }

  useEffect(load, [scanId]);

  return (
    <AppShell title="Risk & quantum readiness">
      <ScanTabs scanId={scanId} />

      {loading ? <LoadingState label="Loading risk assessment" /> : null}
      {error ? <ErrorState description={error} onRetry={load} /> : null}

      {summary ? (
        <div className="space-y-4">
          <Card bodyClassName="px-5 py-4">
            <p className="text-[13px] leading-relaxed text-text-secondary">
              <span className="font-semibold uppercase tracking-[0.08em] text-text-primary">
                CRQC scenario ·{" "}
              </span>
              {summary.crqcScenario}. This assessment, including the scenario, is computed by the
              backend and rendered as returned — it is not recalculated in this UI.
            </p>
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card
              title="Classical exposure"
              actions={<ShieldAlert size={14} className="text-accent" />}
            >
              <RiskDistributionChart data={summary.classicalExposure} />
            </Card>
            <Card
              title="Quantum exposure"
              actions={<Atom size={14} className="text-accent" />}
            >
              <RiskDistributionChart data={summary.quantumExposure} />
            </Card>
          </div>

          <Card title="Prioritized findings">
            {prioritized.length === 0 ? (
              <p className="text-sm text-text-secondary">
                No findings were prioritized for this scan.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {prioritized.map((f) => (
                  <li key={f.id}>
                    <Link
                      href={`/scans/${scanId}/findings/${encodeURIComponent(f.id)}`}
                      className="flex items-center justify-between gap-3 rounded py-2.5 pl-2 pr-1 text-sm transition-colors hover:bg-elevated/60"
                    >
                      <div className="min-w-0">
                        <div className="truncate font-medium text-text-primary">
                          {f.algorithm}
                          {f.variant ? (
                            <span className="font-normal text-text-secondary">
                              {" "}
                              · {f.variant}
                            </span>
                          ) : null}
                        </div>
                        <div className="truncate font-mono text-xs text-text-secondary">
                          {f.sourcePath ?? f.library ?? "—"}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="font-mono-tabular text-xs text-text-secondary">
                          {f.riskScore}
                        </span>
                        <RiskBadge level={f.riskLevel} />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      ) : null}
    </AppShell>
  );
}