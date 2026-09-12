"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Download } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ScanTabs } from "@/components/layout/ScanTabs";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { RiskBadge, ConfidenceBadge, UnknownValue } from "@/components/ui/Badge";
import { ErrorState, LoadingState } from "@/components/ui/States";
import { api } from "@/lib/api";
import type { CbomResponse } from "@/lib/api/client";
import type { Finding } from "@/lib/types";
import { INPUT_TYPE_LABEL, formatDate } from "@/lib/utils";

const PAGE_SIZE = 20;

export default function CbomPage({ params }: { params: { scanId: string } }) {
  const { scanId } = params;
  const router = useRouter();
  const [data, setData] = useState<CbomResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  function load() {
    setLoading(true);
    setError(null);
    api
      .getCbom(scanId)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load CBOM."))
      .finally(() => setLoading(false));
  }

  useEffect(load, [scanId]);

  const pageItems = useMemo(() => {
    if (!data) return [];
    const start = (page - 1) * PAGE_SIZE;
    return data.findings.slice(start, start + PAGE_SIZE);
  }, [data, page]);

  const columns: Column<Finding>[] = [
    { key: "algorithm", header: "Algorithm", render: (f) => <span className="font-medium text-text-primary">{f.algorithm}</span> },
    { key: "variant", header: "Variant", render: (f) => f.variant ?? "—" },
    { key: "primitiveType", header: "Primitive type", render: (f) => f.primitiveType.replace(/_/g, " ") },
    { key: "keySize", header: "Key size", render: (f) => (f.keySize && f.keySize !== "Unknown" ? `${f.keySize} bit` : <UnknownValue />) },
    { key: "mode", header: "Mode", render: (f) => f.mode ?? "—" },
    {
      key: "library",
      header: "Library / version",
      render: (f) => (
        <span>
          {f.library ?? "—"} {f.libraryVersion ? <span className="text-text-secondary">{f.libraryVersion}</span> : null}
        </span>
      )
    },
    { key: "component", header: "Application / component", render: (f) => data?.components.find((c) => c.library === f.library)?.application ?? "—" },
    { key: "assetType", header: "Asset type", render: (f) => INPUT_TYPE_LABEL[f.assetType] ?? f.assetType },
    { key: "detectionMethods", header: "Detection method", render: (f) => f.detectionMethods[0]?.replace(/_/g, " ") ?? "—" },
    { key: "confidence", header: "Confidence", render: (f) => <ConfidenceBadge level={f.confidence} /> },
    { key: "riskLevel", header: "Risk", render: (f) => <RiskBadge level={f.riskLevel} /> },
    {
      key: "sourcePath",
      header: "Source location",
      className: "max-w-[200px]",
      render: (f) => (
        <span className="block truncate font-mono text-xs text-text-secondary" title={f.sourcePath}>
          {f.sourcePath ?? "—"}
        </span>
      )
    }
  ];

  return (
    <AppShell title="Cryptographic inventory">
      <ScanTabs scanId={scanId} />

      {loading ? <LoadingState label="Loading CBOM" /> : null}
      {error ? <ErrorState description={error} onRetry={load} /> : null}

      {data ? (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Cryptography Bill of Materials</h2>
              <p className="text-sm text-text-secondary">
                {data.components.length} components · {data.findings.length} normalized artefacts · generated {formatDate(data.generatedAt)}
              </p>
            </div>
            <button
              onClick={() => router.push(`/scans/${scanId}/recommendations`)}
              className="flex items-center gap-2 rounded border border-border bg-elevated px-3 py-2 text-sm font-medium text-text-primary hover:border-accent/50"
            >
              <Download size={14} />
              Export report
            </button>
          </div>

          <DataTable
            columns={columns}
            rows={pageItems}
            keyExtractor={(f) => f.id}
            onRowClick={(f) => router.push(`/scans/${scanId}/findings/${f.id}`)}
            page={page}
            pageSize={PAGE_SIZE}
            total={data.findings.length}
            onPageChange={setPage}
          />
        </>
      ) : null}
    </AppShell>
  );
}
