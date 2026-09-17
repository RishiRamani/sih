"use client";

import { useEffect, useMemo, useState } from "react";
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
  FileText,
  Sparkles,
  ScanLine,
  Layers,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { buttonClasses } from "@/components/ui/Button";
import { RiskDistributionChart } from "@/components/charts/RiskDistributionChart";
import { RiskBadge, ScanStatusBadge } from "@/components/ui/Badge";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/States";
import { api } from "@/lib/api";
import type { DashboardSummary, Finding, Scan } from "@/lib/types";
import { formatDate, INPUT_TYPE_LABEL, cn } from "@/lib/utils";
import { computeGrade } from "@/lib/grade";
import { GRADE_STYLE } from "@/lib/grade-style";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [latestFindings, setLatestFindings] = useState<Finding[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    setError(null);
    api
      .getDashboardSummary()
      .then(async (summary) => {
        setData(summary);
        const latest = summary.recentScans.find((s) => s.status === "COMPLETED");
        if (latest) {
          const res = await api.getFindings(latest.id, { pageSize: 10000 });
          setLatestFindings(res.items);
        } else {
          setLatestFindings([]);
        }
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Failed to load dashboard.")
      )
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  const latestScan: Scan | null =
    (data?.recentScans ?? []).find((s) => s.status === "COMPLETED") ?? null;

  const gradeResult = useMemo(
    () => computeGrade(latestFindings, latestScan),
    [latestFindings, latestScan]
  );

  const gradeStyle = GRADE_STYLE[gradeResult.grade];

  return (
    <AppShell >
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Posture</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-[-0.02em] text-text-primary">
            Cryptographic health
          </h2>
          <p className="mt-1 max-w-xl text-[13px] text-text-secondary">
            Grade computed from the most recent completed scan.
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
          {/* ───────── GRADE HERO ───────── */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            {/* Left: grade panel — spans 7 columns */}
            <Card
              className={cn("lg:col-span-7", gradeStyle.border)}
              bodyClassName="px-6 py-6"
            >
              {/* Top row: label + big grade letter */}
              <div className="flex items-start justify-between gap-6">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Layers size={12} className="text-text-secondary" />
                    <p className="eyebrow">
                      Latest scan
                      {latestScan
                        ? ` · ${INPUT_TYPE_LABEL[latestScan.inputType]}`
                        : ""}
                    </p>
                  </div>
                  {latestScan ? (
                    <>
                      <h3 className="mt-2 truncate text-lg font-semibold tracking-[-0.015em] text-text-primary">
                        {latestScan.name}
                      </h3>
                      <p className="mt-0.5 truncate font-mono text-xs text-text-secondary">
                        {latestScan.sourceLabel}
                      </p>
                    </>
                  ) : null}
                </div>

                <div className="flex shrink-0 flex-col items-center">
                  <div
                    className="flex h-28 w-28 items-center justify-center rounded border-2 font-mono text-[64px] font-semibold leading-none"
                    style={{
                      color: gradeStyle.hex,
                      borderColor: `${gradeStyle.hex}80`,
                      backgroundColor: `${gradeStyle.hex}14`,
                    }}
                    aria-label={`Grade ${gradeResult.grade}`}
                  >
                    {gradeResult.grade}
                  </div>
                  <span
                    className="mt-2 text-[10px] font-semibold uppercase tracking-[0.14em]"
                    style={{ color: gradeStyle.hex }}
                  >
                    {gradeStyle.label}
                  </span>
                </div>
              </div>

              {/* Directive + subtext, full width below */}
              <p
                className="mt-5 text-[15px] font-semibold leading-snug"
                style={{ color: gradeStyle.hex }}
              >
                {gradeResult.directive}
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-text-secondary">
                {gradeResult.subtext}
              </p>

              {/* Action buttons */}
              <div className="mt-5 flex flex-wrap items-center gap-2">
                {latestScan ? (
                  <>
                    <Link
                      href={`/scans/${latestScan.id}/cbom`}
                      className={buttonClasses("primary", "sm")}
                    >
                      <FileText size={13} />
                      View CBOM
                    </Link>
                    <Link
                      href={`/scans/${latestScan.id}/recommendations`}
                      className={buttonClasses("secondary", "sm")}
                    >
                      <Sparkles size={13} />
                      View recommendations
                    </Link>
                    <Link
                      href={`/scans/${latestScan.id}/findings`}
                      className="ml-1 text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary hover:text-text-primary"
                    >
                      All findings →
                    </Link>
                  </>
                ) : null}
              </div>

              <p className="mt-5 border-t border-border pt-4 text-[12px] leading-relaxed text-text-secondary">
                <span className="font-semibold uppercase tracking-[0.08em]">
                  Why:{" "}
                </span>
                {gradeResult.rationale}
              </p>

              {gradeResult.coverageWarning ? (
                <div className="mt-4 flex items-start gap-2 rounded border border-amber/35 bg-amber/8 p-3 text-[12px] leading-relaxed text-text-secondary">
                  <FileWarning
                    size={13}
                    className="mt-0.5 shrink-0 text-amber"
                  />
                  {gradeResult.coverageWarning}
                </div>
              ) : null}
            </Card>

            {/* Right: contributing findings — spans 5 columns */}
            <Card
              title="Contributing findings"
              className="lg:col-span-5"
              bodyClassName="px-4 py-3"
            >
              {gradeResult.contributingFindings.length === 0 ? (
                <p className="py-6 text-center text-[12px] text-text-secondary">
                  No contributing findings — this scan is clean.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {gradeResult.contributingFindings.map((f) => (
                    <li key={f.id}>
                      <Link
                        href={
                          latestScan
                            ? `/scans/${latestScan.id}/findings/${encodeURIComponent(f.id)}`
                            : "#"
                        }
                        className="flex items-center justify-between gap-3 rounded py-2.5 pl-1 pr-1 text-sm transition-colors hover:bg-elevated/60"
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
                          <div className="truncate font-mono text-[11px] text-text-secondary">
                            {f.sourcePath ?? f.library ?? "—"}
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
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
              <div className="mt-2 border-t border-border pt-3">
                <p className="text-[11px] text-text-secondary">
                  {gradeResult.counts.critical} critical ·{" "}
                  {gradeResult.counts.high} high ·{" "}
                  {gradeResult.counts.medium} medium ·{" "}
                  {gradeResult.counts.quantumBroken} quantum-vulnerable
                </p>
              </div>
            </Card>
          </div>

          {data.recentScans.length === 0 ? (
            <Card bodyClassName="px-6 py-10">
              <div className="flex flex-col items-center text-center">
                <ScanLine size={28} className="text-text-secondary" />
                <h3 className="mt-3 text-lg font-semibold tracking-[-0.015em] text-text-primary">
                  No completed scans yet
                </h3>
                <p className="mt-1 max-w-sm text-[13px] text-text-secondary">
                  Run your first scan to generate a cryptographic health grade.
                </p>
                <Link
                  href="/scans/new"
                  className={cn(buttonClasses("primary"), "mt-5")}
                >
                  <PlusCircle size={15} />
                  Start a scan
                </Link>
              </div>
            </Card>
          ) : null}

          {/* ───────── STAT BAND ───────── */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <StatCard
              label="Crypto assets"
              value={data.cryptoAssets}
              icon={KeyRound}
            />
            <StatCard label="Algorithms" value={data.algorithms} icon={Binary} />
            <StatCard
              label="Certificates"
              value={data.certificates}
              icon={BadgeCheck}
            />
            <StatCard label="Libraries" value={data.libraries} icon={Library} />
            <StatCard
              label="High risk"
              value={data.highRisk}
              icon={AlertTriangle}
              tone="crimson"
            />
            <StatCard
              label="Quantum risk"
              value={data.quantumRisk}
              icon={Atom}
              tone="amber"
            />
          </div>

          {/* ───────── RISK + COVERAGE ───────── */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card title="Risk distribution" className="lg:col-span-2">
              <RiskDistributionChart data={data.riskDistribution} />
            </Card>

            <Card title="Coverage summary">
              <dl className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-text-secondary">Scans completed</dt>
                  <dd className="font-mono-tabular text-base font-medium text-text-primary">
                    {data.coverageSummary.scansCompleted ?? 0}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-text-secondary">Files scanned</dt>
                  <dd className="font-mono-tabular text-base font-medium text-text-primary">
                    {data.coverageSummary.filesScanned ?? 0}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-text-secondary">Unsupported files</dt>
                  <dd className="font-mono-tabular text-base font-medium text-text-primary">
                    {data.coverageSummary.unsupportedFiles ?? 0}
                  </dd>
                </div>
              </dl>
              <div className="mt-4 flex items-start gap-2 rounded border border-border bg-elevated p-2.5 text-xs leading-relaxed text-text-secondary">
                <FileWarning
                  size={13}
                  className="mt-0.5 shrink-0 text-text-secondary"
                />
                A completed scan does not guarantee all cryptography was
                discovered. Unsupported and unparsed files are excluded from
                analysis.
              </div>
            </Card>
          </div>

          {/* ───────── TOP RISKY + RECENT ───────── */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card title="Top risky algorithms & components">
              {data.topRiskyComponents.length === 0 ? (
                <EmptyState
                  title="No components yet"
                  description="Run a scan to populate this list."
                />
              ) : (
                <ul className="divide-y divide-border">
                  {data.topRiskyComponents.map((c) => (
                    <li
                      key={c.name}
                      className="flex items-center justify-between py-2.5 text-sm"
                    >
                      <span className="truncate pr-3 text-text-primary">
                        {c.name}
                      </span>
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
                <EmptyState
                  title="No scans yet"
                  description="Start your first scan to see results here."
                />
              ) : (
                <ul className="divide-y divide-border">
                  {data.recentScans.map((scan) => (
                    <li key={scan.id}>
                      <Link
                        href={
                          scan.status === "COMPLETED"
                            ? `/scans/${scan.id}/findings`
                            : `/scans/${scan.id}/progress`
                        }
                        className="flex items-center justify-between gap-3 rounded py-2.5 pl-2 pr-1 text-sm transition-colors hover:bg-elevated/60"
                      >
                        <div className="min-w-0">
                          <div className="truncate font-medium text-text-primary">
                            {scan.name}
                          </div>
                          <div className="text-xs text-text-secondary">
                            {INPUT_TYPE_LABEL[scan.inputType]} ·{" "}
                            {formatDate(scan.createdAt)}
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