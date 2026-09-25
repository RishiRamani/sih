"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { buttonClasses } from "@/components/ui/Button";
import { LoadingState, EmptyState } from "@/components/ui/States";
import { RequireAuth } from "@/lib/auth/guard";
import {
  listComparisons,
  deleteComparison,
  type ComparisonRecord,
} from "@/lib/comparisons";
import { cn, formatDate } from "@/lib/utils";
import { GRADE_STYLE } from "@/lib/grade-style";
import type { Grade } from "@/lib/grade";

const VERDICT_STYLE: Record<
  ComparisonRecord["verdict"],
  {
    text: string;
    border: string;
    bg: string;
    icon: typeof ArrowRight;
    label: string;
  }
> = {
  improved: {
    text: "text-teal",
    border: "border-teal/35",
    bg: "bg-teal/6",
    icon: ArrowDownRight,
    label: "Improved",
  },
  regressed: {
    text: "text-crimson",
    border: "border-crimson/40",
    bg: "bg-crimson/6",
    icon: ArrowUpRight,
    label: "Regressed",
  },
  unchanged: {
    text: "text-accent",
    border: "border-accent/35",
    bg: "bg-accent/6",
    icon: Minus,
    label: "Unchanged",
  },
};

function asGrade(value: string): Grade {
  const upper = value.toUpperCase();
  if (
    upper === "A" ||
    upper === "B" ||
    upper === "C" ||
    upper === "D" ||
    upper === "E" ||
    upper === "F"
  ) {
    return upper as Grade;
  }
  return "C";
}

export default function ComparisonsPage() {
  const [records, setRecords] = useState<ComparisonRecord[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      try {
        const data = await listComparisons();
        if (!cancelled) setRecords(data);
      } catch {
        // Any failure (404, network, auth) is treated as "no comparisons".
        if (!cancelled) setRecords([]);
      }
    }

    void refresh();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleDelete(id: string) {
    try {
      await deleteComparison(id);
    } catch {
      /* ignore — optimistic UI below handles it */
    }
    setRecords((prev) => (prev ? prev.filter((r) => r.id !== id) : prev));
  }

  return (
    <RequireAuth>
      <AppShell title="Comparisons">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">History</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-[-0.02em] text-text-primary">
              Scan comparisons
            </h2>
            <p className="mt-1 max-w-xl text-[13px] text-text-secondary">
              Every time a repository is rescanned, the before/after comparison is
              recorded here.
            </p>
          </div>
          <Link href="/scans" className={buttonClasses("secondary")}>
            View scans
            <ArrowRight size={13} />
          </Link>
        </div>

        {records === null ? <LoadingState label="Loading comparisons" /> : null}

        {records !== null && records.length === 0 ? (
          <EmptyState
            title="No comparisons yet"
            description="Open a completed scan and click Rescan to generate your first before/after comparison."
            action={
              <Link href="/scans" className={buttonClasses("primary")}>
                Go to scans
              </Link>
            }
          />
        ) : null}

        {records && records.length > 0 ? (
          <div className="space-y-3">
            {records.map((r) => {
              const style = VERDICT_STYLE[r.verdict];
              const VerdictIcon = style.icon;

              const oldGrade = asGrade(r.oldGrade);
              const newGrade = asGrade(r.newGrade);
              const oldStyle = GRADE_STYLE[oldGrade];
              const newStyle = GRADE_STYLE[newGrade];

              return (
                <Card
                  key={r.id}
                  className={cn(style.border, style.bg)}
                  bodyClassName="px-5 py-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]",
                            style.border,
                            style.text
                          )}
                        >
                          <VerdictIcon size={10} />
                          {style.label}
                        </span>
                        <span className="text-[11px] text-text-secondary">
                          {formatDate(r.createdAt)}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded border-2 font-mono text-[22px] font-semibold leading-none"
                            style={{
                              color: oldStyle.hex,
                              borderColor: `${oldStyle.hex}80`,
                              backgroundColor: `${oldStyle.hex}1A`,
                            }}
                          >
                            {oldGrade}
                          </span>
                          <div className="min-w-0">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.11em] text-text-secondary">
                              Previous
                            </p>
                            <p className="truncate text-[13px] font-medium text-text-primary">
                              {r.oldScanName}
                            </p>
                            <p
                              className="text-[10px] font-semibold uppercase tracking-[0.14em]"
                              style={{ color: oldStyle.hex }}
                            >
                              {oldStyle.label}
                            </p>
                          </div>
                        </div>

                        <ArrowRight
                          size={14}
                          className="shrink-0 text-text-secondary"
                        />

                        <div className="flex items-center gap-2.5">
                          <span
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded border-2 font-mono text-[22px] font-semibold leading-none"
                            style={{
                              color: newStyle.hex,
                              borderColor: `${newStyle.hex}80`,
                              backgroundColor: `${newStyle.hex}1A`,
                            }}
                          >
                            {newGrade}
                          </span>
                          <div className="min-w-0">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.11em] text-text-secondary">
                              Latest
                            </p>
                            <p className="truncate text-[13px] font-medium text-text-primary">
                              {r.newScanName}
                            </p>
                            <p
                              className="text-[10px] font-semibold uppercase tracking-[0.14em]"
                              style={{ color: newStyle.hex }}
                            >
                              {newStyle.label}
                            </p>
                          </div>
                        </div>
                      </div>

                      <p className="mt-3 text-[11px] text-text-secondary">
                        {r.removedCount} fixed · {r.addedCount} new
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <Link
                        href={`/scans/${r.newScanId}/compare/${r.oldScanId}`}
                        className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-elevated px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-text-primary transition-colors hover:border-accent/50 hover:text-accent"
                      >
                        <ExternalLink size={11} />
                        Open
                      </Link>
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="inline-flex items-center justify-center rounded-sm border border-border bg-elevated p-1.5 text-text-secondary transition-colors hover:border-crimson/40 hover:text-crimson"
                        aria-label={`Delete comparison ${r.id}`}
                        title="Remove from history"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : null}
      </AppShell>
    </RequireAuth>
  );
}