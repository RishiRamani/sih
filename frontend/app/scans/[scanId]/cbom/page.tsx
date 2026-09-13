"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Download } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ScanTabs } from "@/components/layout/ScanTabs";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { RiskBadge, ConfidenceBadge, UnknownValue } from "@/components/ui/Badge";
import { ErrorState, LoadingState } from "@/components/ui/States";
import { api } from "@/lib/api";
import type { CbomResponse } from "@/lib/api/client";
import type { Finding } from "@/lib/types";
import { INPUT_TYPE_LABEL, formatDate } from "@/lib/utils";
import { CryptoUsageGraph } from "@/components/charts/CryptoUsageGraph";

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
    {
      key: "algorithm",
      header: "Algorithm",
      render: (f) => <span className="font-medium text-text-primary">{f.algorithm}</span>
    },
    { key: "variant", header: "Variant", render: (f) => f.variant ?? "—" },
    {
      key: "primitiveType",
      header: "Primitive type",
      render: (f) => f.primitiveType.replace(/_/g, " ")
    },
    {
      key: "keySize",
      header: "Key size",
      render: (f) =>
        f.keySize && f.keySize !== "Unknown" ? (
          <span className="font-mono-tabular">{f.keySize} bit</span>
        ) : (
          <UnknownValue />
        )
    },
    { key: "mode", header: "Mode", render: (f) => f.mode ?? "—" },
    {
      key: "library",
      header: "Library / version",
      render: (f) => (
        <span>
          {f.library ?? "—"}{" "}
          {f.libraryVersion ? (
            <span className="font-mono text-xs text-text-secondary">{f.libraryVersion}</span>
          ) : null}
        </span>
      )
    },
    {
      key: "component",
      header: "Application / component",
      render: (f) =>
        data?.components.find((c) => c.library === f.library)?.application ?? "—"
    },
    {
      key: "assetType",
      header: "Asset type",
      render: (f) => INPUT_TYPE_LABEL[f.assetType] ?? f.assetType
    },
    {
      key: "detectionMethods",
      header: "Detection method",
      render: (f) => f.detectionMethods[0]?.replace(/_/g, " ") ?? "—"
    },
    {
      key: "confidence",
      header: "Confidence",
      render: (f) => <ConfidenceBadge level={f.confidence} />
    },
    {
      key: "riskLevel",
      header: "Risk",
      render: (f) => <RiskBadge level={f.riskLevel} />
    },
    {
      key: "sourcePath",
      header: "Source location",
      className: "max-w-[200px]",
      render: (f) => (
        <span
          className="block truncate font-mono text-xs text-text-secondary"
          title={f.sourcePath}
        >
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
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="eyebrow">Inventory</p>
              <h2 className="mt-1 text-xl font-semibold tracking-[-0.02em] text-text-primary">
                Cryptography Bill of Materials
              </h2>
              <p className="mt-1 text-[13px] text-text-secondary">
                {data.components.length} components · {data.findings.length} normalized artefacts ·
                generated {formatDate(data.generatedAt)}
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"}/scans/${scanId}/report?format=html`, "_blank", "noopener,noreferrer")}
            >
              <Download size={14} />
              Export report
            </Button>
          </div>

          <Card bodyClassName="p-0">
            <DataTable
              columns={columns}
              rows={pageItems}
              keyExtractor={(f) => f.id}
              onRowClick={(f) => router.push(`/scans/${scanId}/findings/${encodeURIComponent(f.id)}`)}
              page={page}
              pageSize={PAGE_SIZE}
              total={data.findings.length}
              onPageChange={setPage}
            />
          </Card>
          {data.findings.length > 0 ? (
  <Card title="Crypto usage graph (preview)" className="mt-4" bodyClassName="px-5 py-5">
    <CryptoUsageGraph
      findings={data.findings}
      scanId={scanId}
      rootLabel={data.findings.length + " findings"}
      groupBy="sourcePath"
    />
  </Card>
) : null}
        </>
      ) : null}
      
    </AppShell>
  );
}