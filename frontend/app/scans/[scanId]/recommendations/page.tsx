"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { ScanTabs } from "@/components/layout/ScanTabs";
import { ErrorState, LoadingState, EmptyState } from "@/components/ui/States";
import { RiskBadge } from "@/components/ui/Badge";
import { api } from "@/lib/api";
import type { Recommendation } from "@/lib/types";
import { cn } from "@/lib/utils";

const DIRECTION_LABEL: Record<string, string> = {
  ML_KEM: "ML-KEM key establishment",
  HYBRID_KEM: "Hybrid KEM (classical + PQC)",
  ML_DSA: "ML-DSA signatures",
  SLH_DSA: "SLH-DSA signatures",
  STRONGER_SYMMETRIC: "Stronger symmetric cipher",
  APPROVED_HASH: "Approved hash / construction",
  VETTED_STANDARD_REVIEW: "Vetted standard + manual review",
  NO_ACTION: "No action required"
};

const STATUS_LABEL: Record<Recommendation["status"], string> = {
  NOT_STARTED: "Not started",
  IN_PROGRESS: "In progress",
  MITIGATED: "Mitigated",
  ACCEPTED_RISK: "Accepted risk"
};

const STATUS_STYLE: Record<Recommendation["status"], string> = {
  NOT_STARTED: "bg-text-secondary/10 text-text-secondary border-border",
  IN_PROGRESS: "bg-accent/10 text-accent border-accent/30",
  MITIGATED: "bg-teal/10 text-teal border-teal/30",
  ACCEPTED_RISK: "bg-amber/10 text-amber border-amber/30"
};

export default function RecommendationsPage({ params }: { params: { scanId: string } }) {
  const { scanId } = params;
  const [items, setItems] = useState<Recommendation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  function load() {
    setLoading(true);
    setError(null);
    api
      .getRecommendations(scanId)
      .then(setItems)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load recommendations."))
      .finally(() => setLoading(false));
  }

  useEffect(load, [scanId]);

  async function handleStatusChange(rec: Recommendation, status: Recommendation["status"]) {
    setUpdating(rec.id);
    try {
      const updated = await api.updateRecommendationStatus(scanId, rec.id, status);
      setItems((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    } finally {
      setUpdating(null);
    }
  }

  return (
    <AppShell title="Recommendations">
      <ScanTabs scanId={scanId} />

      {loading ? <LoadingState label="Loading recommendations" /> : null}
      {error ? <ErrorState description={error} onRetry={load} /> : null}

      {!loading && !error && items.length === 0 ? (
        <EmptyState title="No recommendations yet" description="Recommendations are generated once risk assessment completes." />
      ) : null}

      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((rec) => (
            <div key={rec.id} className="rounded-md border border-border bg-surface p-4 shadow-subtle">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-text-primary">{rec.currentTechnology}</h3>
                    <RiskBadge level={rec.priority} />
                    {rec.isExperimental ? (
                      <span className="rounded border border-amber/30 bg-amber/10 px-1.5 py-0.5 text-[10px] font-medium text-amber">
                        Experimental candidate
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-xs text-text-secondary">
                    Affects: {rec.affectedComponents.join(", ")}
                  </p>
                </div>
                <select
                  value={rec.status}
                  disabled={updating === rec.id}
                  onChange={(e) => handleStatusChange(rec, e.target.value as Recommendation["status"])}
                  className={cn(
                    "rounded border px-2 py-1 text-xs font-medium disabled:opacity-60",
                    STATUS_STYLE[rec.status]
                  )}
                >
                  {Object.entries(STATUS_LABEL).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <div className="text-xs font-medium text-text-secondary">Why migration is needed</div>
                  <p className="mt-0.5 text-sm text-text-primary">{rec.reason}</p>
                </div>
                <div>
                  <div className="text-xs font-medium text-text-secondary">Recommended direction</div>
                  <p className="mt-0.5 text-sm text-text-primary">
                    {DIRECTION_LABEL[rec.direction] ?? rec.direction} — <span className="text-text-secondary">{rec.candidateAlgorithm}</span>
                  </p>
                </div>
                <div>
                  <div className="text-xs font-medium text-text-secondary">Rationale</div>
                  <p className="mt-0.5 text-sm text-text-primary">{rec.rationale}</p>
                </div>
                <div>
                  <div className="text-xs font-medium text-text-secondary">Effort / trade-offs</div>
                  <p className="mt-0.5 text-sm text-text-primary">
                    {rec.effort ?? "Unknown"}
                    {rec.tradeOffs ? ` — ${rec.tradeOffs}` : ""}
                  </p>
                </div>
              </div>

              <Link
                href={`/scans/${scanId}/findings/${rec.findingId}`}
                className="mt-3 inline-block text-xs font-medium text-accent hover:underline"
              >
                View underlying finding →
              </Link>
            </div>
          ))}
        </div>
      ) : null}
    </AppShell>
  );
}
