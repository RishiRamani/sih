"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  KeyRound,
  Binary,
  BadgeCheck,
  Library,
  AlertTriangle,
  Atom,
  PlusCircle,
  FileWarning,
  ArrowRight,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { buttonClasses } from "@/components/ui/Button";
import { RiskDistributionChart } from "@/components/charts/RiskDistributionChart";
import { RiskBadge, ScanStatusBadge } from "@/components/ui/Badge";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/States";
import { api } from "@/lib/api";
import type { DashboardSummary } from "@/lib/types";
import { formatDate, INPUT_TYPE_LABEL } from "@/lib/utils";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    setError(null);
    api
      .getDashboardSummary()
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load dashboard."))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  return (
    <AppShell title="Dashboard">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Fleet overview</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-[-0.02em] text-text-primary">
            Cryptographic posture
          </h2>
          <p className="mt-1 max-w-xl text-[13px] text-text-secondary">
            Aggregated across all completed and in-progress scans.
          </p>
        </div>
        <Link href="/scans/new" className={buttonClasses("primary")}>
          <PlusCircle size={15} />
          New scan
        </Link>
      </div>

      {loading ? <LoadingState label="Loading dashboard" /> : null}
      {!loading && error ? <ErrorState description={error} onRetry={load} /> : null}

      {!loading && !error && data ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <StatCard label="Crypto assets" value={data.cryptoAssets} icon={KeyRound} />
            <StatCard label="Algorithms" value={data.algorithms} icon={Binary} />
            <StatCard label="Certificates" value={data.certificates} icon={BadgeCheck} />
            <StatCard label="Libraries" value={data.libraries} icon={Library} />
            <StatCard label="High risk" value={data.highRisk} icon={AlertTriangle} tone="crimson" />
            <StatCard label="Quantum risk" value={data.quantumRisk} icon={Atom} tone="amber" />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card title="Risk distribution" className="lg:col-span-2">
              <RiskDistributionChart data={data.riskDistribution} />
            </Card>

            <Card title="Coverage summary">
              <dl className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-text-secondary">Scans completed</dt>
                  <dd className="font-mono-tabular text-base font-medium text-text-primary">
                    {data.coverageSummary.scansCompleted}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-text-secondary">Files scanned</dt>
                  <dd className="font-mono-tabular text-base font-medium text-text-primary">
                    {data.coverageSummary.filesScanned}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-text-secondary">Unsupported files</dt>
                  <dd className="font-mono-tabular text-base font-medium text-amber">
                    {data.coverageSummary.unsupportedFiles}
                  </dd>
                </div>
              </dl>
              <div className="mt-4 flex items-start gap-2 rounded border border-amber/30 bg-amber/8 p-2.5 text-xs leading-relaxed text-text-secondary">
                <FileWarning size={13} className="mt-0.5 shrink-0 text-amber" />
                A completed scan does not guarantee all cryptography was discovered. Unsupported and unparsed files are excluded from analysis.
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card title="Top risky algorithms & components">
              {data.topRiskyComponents.length === 0 ? (
                <EmptyState title="No components yet" description="Run a scan to populate this list." />
              ) : (
                <ul className="divide-y divide-border">
                  {data.topRiskyComponents.map((c) => (
                    <li key={c.name} className="flex items-center justify-between py-2.5 text-sm">
                      <span className="truncate pr-3 text-text-primary">{c.name}</span>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="font-mono-tabular text-xs text-text-secondary">
                          {c.occurrences} findings
                        </span>
                        <RiskBadge level={c.riskLevel} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card
              title="Recent scans"
              actions={
                <Link
                  href="/scans"
                  className="inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-[0.08em] text-accent hover:text-accent/80"
                >
                  View all
                  <ArrowRight size={11} />
                </Link>
              }
            >
              {data.recentScans.length === 0 ? (
                <EmptyState title="No scans yet" description="Start your first scan to see results here." />
              ) : (
                <ul className="divide-y divide-border">
                  {data.recentScans.map((scan) => (
                    <li key={scan.id}>
                      <Link
                        href={`/scans/${scan.id}/progress`}
                        className="flex items-center justify-between gap-3 rounded py-2.5 pl-2 pr-1 text-sm transition-colors hover:bg-elevated/60"
                      >
                        <div className="min-w-0">
                          <div className="truncate font-medium text-text-primary">{scan.name}</div>
                          <div className="text-xs text-text-secondary">
                            {INPUT_TYPE_LABEL[scan.inputType]} · {formatDate(scan.createdAt)}
                          </div>
                        </div>
                        <ScanStatusBadge status={scan.status} />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}