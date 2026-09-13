"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { ScanTabs } from "@/components/layout/ScanTabs";
import { CryptoUsageGraph } from "@/components/charts/CryptoUsageGraph";
import { ErrorState, LoadingState, EmptyState } from "@/components/ui/States";
import { api } from "@/lib/api";
import type { CbomResponse } from "@/lib/api/client";

export default function GraphPage({ params }: { params: { scanId: string } }) {
  const { scanId } = params;
  const [data, setData] = useState<CbomResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [groupBy, setGroupBy] = useState<"sourcePath" | "library">("sourcePath");

  function load() {
    setLoading(true);
    setError(null);
    api
      .getCbom(scanId)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load graph."))
      .finally(() => setLoading(false));
  }

  useEffect(load, [scanId]);

  return (
    <AppShell title="Crypto usage graph">
      <ScanTabs scanId={scanId} />

      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Structure</p>
          <h2 className="mt-1 text-xl font-semibold tracking-[-0.02em] text-text-primary">
            Crypto usage graph
          </h2>
          <p className="mt-1 text-[13px] text-text-secondary">
            Where cryptography is used and what it's used for. Collapse branches to focus; click a leaf to open the finding.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-secondary">
            Group by
          </span>
          <div className="flex rounded border border-border">
            <button
              onClick={() => setGroupBy("sourcePath")}
              className={`px-3 py-1 text-[12px] font-medium ${
                groupBy === "sourcePath"
                  ? "bg-accent/10 text-accent"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              File
            </button>
            <button
              onClick={() => setGroupBy("library")}
              className={`border-l border-border px-3 py-1 text-[12px] font-medium ${
                groupBy === "library"
                  ? "bg-accent/10 text-accent"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Library
            </button>
          </div>
        </div>
      </div>

      {loading ? <LoadingState label="Building graph" /> : null}
      {error ? <ErrorState description={error} onRetry={load} /> : null}

      {!loading && !error && data && data.findings.length === 0 ? (
        <EmptyState
          title="No cryptographic artefacts"
          description="This scan hasn't produced any findings yet."
        />
      ) : null}

      {!loading && !error && data && data.findings.length > 0 ? (
        <Card title="Application structure" bodyClassName="px-5 py-5">
          <CryptoUsageGraph
            findings={data.findings}
            scanId={scanId}
            rootLabel={`${data.findings.length} findings`}
            groupBy={groupBy}
          />
        </Card>
      ) : null}
    </AppShell>
  );
}