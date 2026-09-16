"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  CheckCircle2,
  AlertTriangle,
  PlusCircle,
  TrendingDown,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { RiskBadge } from "@/components/ui/Badge";
import { LoadingState, ErrorState } from "@/components/ui/States";
import { api } from "@/lib/api";
import type { Finding, Scan } from "@/lib/types";
import { computeGrade, type Grade } from "@/lib/grade";
import { GRADE_STYLE } from "@/lib/grade-style";
import { compareScans, comparisonVerdict, type FindingDelta } from "@/lib/compare";
import { recordComparison } from "@/lib/comparisons";
import { cn, INPUT_TYPE_LABEL } from "@/lib/utils";

/** Darker green for count improvements. Higher contrast on both themes. */
const GREEN = "#15803D";
/** Crimson for count regressions. Matches the theme's crimson. */
const RED = "#DC2626";

interface Counts {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

function countOf(findings: Finding[]): Counts {
  return {
    total: findings.length,
    critical: findings.filter((f) => f.riskLevel === "CRITICAL").length,
    high: findings.filter((f) => f.riskLevel === "HIGH").length,
    medium: findings.filter((f) => f.riskLevel === "MEDIUM").length,
    low: findings.filter((f) => f.riskLevel === "LOW").length,
  };
}

function normalize(s: string): string {
  return s
    .trim()
    .replace(/\\/g, "/")
    .replace(/\/+$/, "")
    .replace(/\.git$/, "")
    .toLowerCase();
}

export default function ComparePage({
  params,
}: {
  params: { scanId: string; otherScanId: string };
}) {
  const { scanId, otherScanId } = params;
  const newScanId = scanId;
  const oldScanId = otherScanId;

  const [oldScan, setOldScan] = useState<Scan | null>(null);
  const [newScan, setNewScan] = useState<Scan | null>(null);
  const [oldFindings, setOldFindings] = useState<Finding[]>([]);
  const [newFindings, setNewFindings] = useState<Finding[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      api.getScan(oldScanId),
      api.getScan(newScanId),
      api.getFindings(oldScanId, { pageSize: 10000 }),
      api.getFindings(newScanId, { pageSize: 10000 }),
    ])
      .then(([oldS, newS, oldF, newF]) => {
        if (normalize(oldS.sourceLabel) !== normalize(newS.sourceLabel)) {
          setError(
            `Cannot compare scans of different sources. Before: ${oldS.sourceLabel} · After: ${newS.sourceLabel}`
          );
          return;
        }

        setOldScan(oldS);
        setNewScan(newS);
        setOldFindings(oldF.items);
        setNewFindings(newF.items);

        const oldGradeRes = computeGrade(oldF.items, oldS);
        const newGradeRes = computeGrade(newF.items, newS);
        const diff = compareScans(oldF.items, newF.items);
        const verdict = comparisonVerdict(oldGradeRes.grade, newGradeRes.grade);

        recordComparison({
          oldScanId: oldS.id,
          oldScanName: oldS.name,
          oldGrade: oldGradeRes.grade,
          newScanId: newS.id,
          newScanName: newS.name,
          newGrade: newGradeRes.grade,
          verdict: verdict.verdict,
          removedCount: diff.counts.removedCount,
          addedCount: diff.counts.addedCount,
        });
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Failed to load comparison.")
      )
      .finally(() => setLoading(false));
  }, [oldScanId, newScanId]);

  if (loading) {
    return (
      <AppShell title="Compare scans">
        <LoadingState label="Loading comparison" />
      </AppShell>
    );
  }

  if (error || !oldScan || !newScan) {
    return (
      <AppShell title="Compare scans">
        <ErrorState
          description={error ?? "Could not load both scans."}
          onRetry={() => window.location.reload()}
        />
      </AppShell>
    );
  }

  const oldGradeResult = computeGrade(oldFindings, oldScan);
  const newGradeResult = computeGrade(newFindings, newScan);
  const oldGrade = oldGradeResult.grade;
  const newGrade = newGradeResult.grade;
  const verdict = comparisonVerdict(oldGrade, newGrade);
  const diff = compareScans(oldFindings, newFindings);

  const oldCounts = countOf(oldFindings);
  const newCounts = countOf(newFindings);

  const verdictColor =
    verdict.tone === "teal"
      ? "text-teal"
      : verdict.tone === "crimson"
        ? "text-crimson"
        : "text-accent";

  const sharedSource = newScan.sourceLabel;

  return (
    <AppShell title="Compare scans">
      <Link
        href={`/scans/${newScan.id}/findings`}
        className="mb-5 inline-flex items-center gap-1.5 text-[12px] font-medium uppercase tracking-[0.08em] text-text-secondary transition-colors hover:text-text-primary"
      >
        <ArrowLeft size={13} />
        Back to latest scan
      </Link>

      <div className="mb-6">
        <p className="eyebrow">Comparison</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-[-0.02em] text-text-primary">
          Rescan result
        </h2>
        <p className="mt-1 font-mono text-[12px] text-text-secondary break-all">
          {sharedSource}
        </p>
        <p className={cn("mt-3 text-[14px] font-semibold", verdictColor)}>
          {verdict.text}
        </p>
      </div>

      <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr]">
        <GradePanel
          label="Previous"
          scan={oldScan}
          grade={oldGrade}
          counts={oldCounts}
          otherCounts={newCounts}
        />
        <div className="flex items-center justify-center py-2 lg:py-0">
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface text-text-secondary">
            <ArrowRight size={16} />
          </div>
        </div>
        <GradePanel
          label="Latest"
          scan={newScan}
          grade={newGrade}
          counts={newCounts}
          otherCounts={oldCounts}
        />
      </div>

      <Card title="Summary of changes" className="mt-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Delta
            label="Fixed"
            value={diff.counts.removedCount}
            tone="teal"
            icon={<CheckCircle2 size={14} />}
            hint="Present before, gone now"
          />
          <Delta
            label="New"
            value={diff.counts.addedCount}
            tone="crimson"
            icon={<AlertTriangle size={14} />}
            hint="Appeared in latest scan"
          />
          <Delta
            label="Improved"
            value={diff.counts.improvedRiskCount}
            tone="teal"
            icon={<ArrowDownRight size={14} />}
            hint="Risk level decreased"
          />
          <Delta
            label="Regressed"
            value={diff.counts.regressedRiskCount}
            tone="crimson"
            icon={<ArrowUpRight size={14} />}
            hint="Risk level increased"
          />
        </div>
      </Card>

      <div className="mt-4 space-y-4">
        <FindingDiffList
          title="Fixed — no longer present"
          tone="teal"
          emptyMessage="No findings were removed between the two scans."
          items={diff.removed}
          side="old"
        />
        <FindingDiffList
          title="New — appeared in the latest scan"
          tone="crimson"
          emptyMessage="No new findings appeared."
          items={diff.added}
          side="new"
        />
        <FindingDiffList
          title="Changed severity"
          tone="accent"
          emptyMessage="No findings changed risk level."
          items={diff.changedRisk}
          side="both"
        />
        {diff.unchanged.length > 0 ? (
          <Card
            title={`Unchanged (${diff.unchanged.length})`}
            actions={<Minus size={14} className="text-text-secondary" />}
          >
            <p className="text-[12px] text-text-secondary">
              {diff.unchanged.length} findings are present in both scans with
              the same risk level.
            </p>
          </Card>
        ) : null}
      </div>
    </AppShell>
  );
}

function GradePanel({
  label,
  scan,
  grade,
  counts,
  otherCounts,
}: {
  label: string;
  scan: Scan;
  grade: Grade;
  counts: Counts;
  otherCounts: Counts;
}) {
  const style = GRADE_STYLE[grade];

  return (
    <Card className={style.border} bodyClassName="px-5 py-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="eyebrow">{label}</p>
          <h3 className="mt-1 truncate text-base font-semibold tracking-[-0.01em] text-text-primary">
            {scan.name}
          </h3>
          <p className="mt-0.5 font-mono text-[11px] text-text-secondary">
            {INPUT_TYPE_LABEL[scan.inputType]}
          </p>

          <dl className="mt-4 space-y-1.5 text-[12px]">
            {/* Findings row is neutral — no comparison color */}
            <CountRow
              label="Findings"
              value={counts.total}
              otherValue={otherCounts.total}
              neutral
            />
            <CountRow
              label="Critical"
              value={counts.critical}
              otherValue={otherCounts.critical}
            />
            <CountRow
              label="High"
              value={counts.high}
              otherValue={otherCounts.high}
            />
            <CountRow
              label="Medium"
              value={counts.medium}
              otherValue={otherCounts.medium}
            />
            <CountRow
              label="Low"
              value={counts.low}
              otherValue={otherCounts.low}
            />
          </dl>
        </div>
        <div className="flex shrink-0 flex-col items-center gap-2">
          <div
            className="flex h-24 w-24 items-center justify-center rounded border-2 font-mono text-[52px] font-semibold leading-none"
            style={{
              color: style.hex,
              borderColor: `${style.hex}80`,
              backgroundColor: `${style.hex}1A`,
            }}
            aria-label={`${label} grade ${grade}`}
          >
            {grade}
          </div>
          <span
            className="text-[10px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: style.hex }}
          >
            {style.label}
          </span>
        </div>
      </div>
    </Card>
  );
}

/**
 * A single count row on the compare page.
 *
 * Rules (skipped entirely when `neutral` is set):
 *   - Both sides 0       → muted grey
 *   - Equal to other     → muted grey
 *   - Fewer than other   → dark green (better)
 *   - More than other    → crimson (worse)
 */
function CountRow({
  label,
  value,
  otherValue,
  neutral = false,
}: {
  label: string;
  value: number;
  otherValue: number;
  neutral?: boolean;
}) {
  if (neutral) {
    return (
      <div className="flex items-center justify-between">
        <dt className="text-text-secondary">{label}</dt>
        <dd className="font-mono-tabular font-semibold text-text-primary">
          {value}
        </dd>
      </div>
    );
  }

  const isNeutral = value === 0 && otherValue === 0;
  const isEqual = value === otherValue;
  const isBetter = value < otherValue;
  const isWorse = value > otherValue;

  let color: string | undefined = undefined;
  let className = "text-text-primary";

  if (isNeutral || isEqual) {
    className = "text-text-secondary";
  } else if (isBetter) {
    color = GREEN;
  } else if (isWorse) {
    color = RED;
  }

  return (
    <div className="flex items-center justify-between">
      <dt className="text-text-secondary">{label}</dt>
      <dd
        className={cn("font-mono-tabular font-semibold", className)}
        style={color ? { color } : undefined}
      >
        {value}
      </dd>
    </div>
  );
}

function Delta({
  label,
  value,
  tone,
  icon,
  hint,
}: {
  label: string;
  value: number;
  tone: "teal" | "crimson" | "accent";
  icon: React.ReactNode;
  hint: string;
}) {
  const isZero = value === 0;
  const color = isZero
    ? "text-text-secondary"
    : tone === "teal"
      ? "text-teal"
      : tone === "crimson"
        ? "text-crimson"
        : "text-accent";

  return (
    <div className="rounded border border-border bg-elevated/40 px-3 py-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.11em] text-text-secondary">
          {label}
        </span>
        <span className={color}>{icon}</span>
      </div>
      <div
        className={cn(
          "mt-1.5 font-mono text-2xl font-semibold leading-none",
          color
        )}
      >
        {value}
      </div>
      <p className="mt-1.5 text-[10px] text-text-secondary">{hint}</p>
    </div>
  );
}

function FindingDiffList({
  title,
  tone,
  emptyMessage,
  items,
  side,
}: {
  title: string;
  tone: "teal" | "crimson" | "accent";
  emptyMessage: string;
  items: FindingDelta[];
  side: "old" | "new" | "both";
}) {
  const Icon =
    tone === "teal"
      ? CheckCircle2
      : tone === "crimson"
        ? PlusCircle
        : TrendingDown;
  const iconColor =
    tone === "teal"
      ? "text-teal"
      : tone === "crimson"
        ? "text-crimson"
        : "text-accent";

  if (items.length === 0) {
    return (
      <Card title={title} actions={<Icon size={14} className={iconColor} />}>
        <p className="text-[12px] text-text-secondary">{emptyMessage}</p>
      </Card>
    );
  }

  return (
    <Card
      title={`${title} (${items.length})`}
      actions={<Icon size={14} className={iconColor} />}
      bodyClassName="p-0"
    >
      <ul className="divide-y divide-border">
        {items.map((item) => (
          <li key={item.key}>
            <div className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
              <div className="min-w-0">
                <div className="truncate font-medium text-text-primary">
                  {item.algorithm}
                </div>
                <div className="truncate font-mono text-[11px] text-text-secondary">
                  {item.sourcePath ?? item.library ?? "—"}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {side === "both" ? (
                  <>
                    {item.oldFinding ? (
                      <RiskBadge level={item.oldFinding.riskLevel} />
                    ) : null}
                    <ArrowRight size={11} className="text-text-secondary" />
                    {item.newFinding ? (
                      <RiskBadge level={item.newFinding.riskLevel} />
                    ) : null}
                  </>
                ) : side === "old" && item.oldFinding ? (
                  <RiskBadge level={item.oldFinding.riskLevel} />
                ) : item.newFinding ? (
                  <RiskBadge level={item.newFinding.riskLevel} />
                ) : null}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}