"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { ScanTabs } from "@/components/layout/ScanTabs";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { RiskBadge, ConfidenceBadge, UnknownValue } from "@/components/ui/Badge";
import { ErrorState, LoadingState } from "@/components/ui/States";
import { api } from "@/lib/api";
import type { Finding } from "@/lib/types";
import { INPUT_TYPE_LABEL } from "@/lib/utils";

const PAGE_SIZE = 15;

export default function FindingsPage({ params }: { params: { scanId: string } }) {
  const { scanId } = params;
  const router = useRouter();

  const [items, setItems] = useState<Finding[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("riskScore");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [search, setSearch] = useState("");
  const [riskLevel, setRiskLevel] = useState("");
  const [confidence, setConfidence] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    api
      .getFindings(scanId, {
        page,
        pageSize: PAGE_SIZE,
        sortBy,
        sortDir,
        search: search || undefined,
        riskLevel: riskLevel || undefined,
        confidence: confidence || undefined
      })
      .then((res) => {
        setItems(res.items);
        setTotal(res.total);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load findings."))
      .finally(() => setLoading(false));
  }, [scanId, page, sortBy, sortDir, search, riskLevel, confidence]);

  useEffect(load, [load]);

  function handleSortChange(key: string) {
    if (sortBy === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDir("desc");
    }
    setPage(1);
  }

  const columns: Column<Finding>[] = [
    {
      key: "algorithm",
      header: "Algorithm",
      sortable: true,
      render: (f) => (
        <div>
          <div className="font-medium text-text-primary">{f.algorithm}</div>
          {f.variant ? (
            <div className="text-xs text-text-secondary">{f.variant}</div>
          ) : null}
        </div>
      )
    },
    {
      key: "primitiveType",
      header: "Primitive",
      render: (f) => (
        <span className="text-text-secondary">{f.primitiveType.replace(/_/g, " ")}</span>
      )
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
      header: "Library",
      render: (f) => (
        <div>
          <div className="text-text-primary">{f.library ?? "—"}</div>
          {f.libraryVersion ? (
            <div className="font-mono text-xs text-text-secondary">{f.libraryVersion}</div>
          ) : null}
        </div>
      )
    },
    {
      key: "inputType",
      header: "Asset type",
      render: (f) => INPUT_TYPE_LABEL[f.inputType] ?? f.inputType
    },
    {
      key: "confidence",
      header: "Confidence",
      sortable: true,
      render: (f) => <ConfidenceBadge level={f.confidence} />
    },
    {
      key: "riskScore",
      header: "Risk",
      sortable: true,
      render: (f) => <RiskBadge level={f.riskLevel} />
    },
    {
      key: "sourcePath",
      header: "Source location",
      className: "max-w-[220px]",
      render: (f) =>
        f.sourcePath ? (
          <span
            className="block truncate font-mono text-xs text-text-secondary"
            title={f.sourcePath}
          >
            {f.sourcePath}
            {f.lineStart
              ? `:${f.lineStart}${
                  f.lineEnd && f.lineEnd !== f.lineStart ? `-${f.lineEnd}` : ""
                }`
              : ""}
          </span>
        ) : (
          "—"
        )
    }
  ];

  return (
    <AppShell title="Scan results">
      <ScanTabs scanId={scanId} />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search
            size={13}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-text-secondary"
          />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search algorithm, library, path…"
            className="w-64 rounded border border-border bg-elevated py-1.5 pl-8 pr-2 text-sm text-text-primary placeholder:text-text-secondary/60 focus:border-accent focus:outline-none"
          />
        </div>
        <select
          value={riskLevel}
          onChange={(e) => {
            setRiskLevel(e.target.value);
            setPage(1);
          }}
          className="rounded border border-border bg-elevated px-2 py-1.5 text-[12px] text-text-primary focus:border-accent focus:outline-none"
        >
          <option value="">All risk levels</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
        <select
          value={confidence}
          onChange={(e) => {
            setConfidence(e.target.value);
            setPage(1);
          }}
          className="rounded border border-border bg-elevated px-2 py-1.5 text-[12px] text-text-primary focus:border-accent focus:outline-none"
        >
          <option value="">All confidence</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
      </div>

      {loading && items.length === 0 ? <LoadingState label="Loading findings" /> : null}
      {error ? <ErrorState description={error} onRetry={load} /> : null}

      {!error ? (
        <Card bodyClassName="p-0">
          <DataTable
            columns={columns}
            rows={items}
            keyExtractor={(f) => f.id}
            onRowClick={(f) => router.push(`/scans/${scanId}/findings/${f.id}`)}
            sortBy={sortBy}
            sortDir={sortDir}
            onSortChange={handleSortChange}
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            onPageChange={setPage}
          />
        </Card>
      ) : null}
    </AppShell>
  );
}