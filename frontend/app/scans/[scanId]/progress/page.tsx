"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { ScanTabs } from "@/components/layout/ScanTabs";
import { ErrorState, LoadingState } from "@/components/ui/States";
import { ScanStatusBadge } from "@/components/ui/Badge";
import { api } from "@/lib/api";
import type { Scan } from "@/lib/types";

export default function ScanProgressPage({ params }: { params: { scanId: string } }) {
  const { scanId } = params;
  const [scan, setScan] = useState<Scan | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getScan(scanId).then(setScan).catch((reason) => {
      setError(reason instanceof Error ? reason.message : "Failed to load scan.");
    });
  }, [scanId]);

  return (
    <AppShell title="Scan overview">
      <ScanTabs scanId={scanId} />
      {error ? <ErrorState description={error} /> : null}
      {!scan && !error ? <LoadingState label="Loading scan" /> : null}
      {scan ? (
        <div className="space-y-4">
          <Card title={scan.name} subtitle={scan.sourceLabel}>
            <div className="flex flex-wrap items-center gap-3">
              <ScanStatusBadge status={scan.status} />
              <span className="text-sm text-text-secondary">{scan.findingCount ?? 0} findings</span>
              {scan.highRiskCount ? <span className="text-sm text-crimson">{scan.highRiskCount} high risk</span> : null}
            </div>
            {scan.errorMessage ? (
              <div className="mt-4 flex items-start gap-2 rounded border border-crimson/30 bg-crimson/8 p-3 text-sm text-crimson">
                <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                {scan.errorMessage}
              </div>
            ) : null}
          </Card>

          {scan.coverage ? (
            <Card title="Coverage">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                <div><div className="text-xs text-text-secondary">Files scanned</div><div className="font-mono-tabular text-lg text-text-primary">{scan.coverage.filesScanned} / {scan.coverage.filesTotal}</div></div>
                <div><div className="text-xs text-text-secondary">Unsupported</div><div className="font-mono-tabular text-lg text-amber">{scan.coverage.unsupportedFiles}</div></div>
                <div><div className="text-xs text-text-secondary">Skipped</div><div className="font-mono-tabular text-lg text-text-secondary">{scan.coverage.skippedFiles}</div></div>
                <div><div className="text-xs text-text-secondary">Parse errors</div><div className="font-mono-tabular text-lg text-crimson">{scan.coverage.parseErrors}</div></div>
                <div><div className="text-xs text-text-secondary">Warnings</div><div className="font-mono-tabular text-lg text-text-primary">{scan.coverage.warnings.length}</div></div>
              </div>
              {scan.coverage.warnings.length > 0 ? (
                <ul className="mt-3 space-y-1 border-t border-border pt-3 text-xs text-text-secondary">
                  {scan.coverage.warnings.map((warning, index) => <li key={`${warning.code}-${index}`}><span className="font-mono text-amber">{warning.code}</span>: {warning.message}</li>)}
                </ul>
              ) : null}
            </Card>
          ) : null}

          <Card title="Assessment context">
            <div className="flex flex-wrap gap-5 text-sm text-text-secondary">
              <span><strong className="text-text-primary">Criticality:</strong> {scan.businessCriticality ?? "MEDIUM"}</span>
              <span><strong className="text-text-primary">Data lifetime:</strong> {scan.dataLifetimeYears ?? 3} years</span>
            </div>
          </Card>

          {scan.status === "COMPLETED" ? (
            <Link href={`/scans/${scanId}/findings`} className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:underline">
              <CheckCircle2 size={15} /> View findings <ArrowRight size={14} />
            </Link>
          ) : null}
        </div>
      ) : null}
    </AppShell>
  );
}
