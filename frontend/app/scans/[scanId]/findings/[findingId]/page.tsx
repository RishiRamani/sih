"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileCode2, ShieldQuestion } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { RiskBadge, ConfidenceBadge, ExposureBadge, UnknownValue, AssumptionTag } from "@/components/ui/Badge";
import { ErrorState, LoadingState } from "@/components/ui/States";
import { api } from "@/lib/api";
import type { Finding } from "@/lib/types";
import { INPUT_TYPE_LABEL } from "@/lib/utils";

const DETECTION_METHOD_LABEL: Record<string, string> = {
  STATIC_AST: "Static AST analysis",
  API_CALL_SIGNATURE: "API call signature match",
  CONFIG_FILE: "Configuration file",
  CERTIFICATE_PARSE: "Certificate parsing",
  DEPENDENCY_MANIFEST: "Dependency manifest",
  BINARY_SYMBOL: "Binary symbol reference",
  HEURISTIC_STRING_MATCH: "Heuristic string match",
  TLS_HANDSHAKE_METADATA: "TLS handshake metadata"
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-text-secondary">{label}</dt>
      <dd className="mt-0.5 text-sm text-text-primary">{children}</dd>
    </div>
  );
}

export default function FindingDetailPage({ params }: { params: { scanId: string; findingId: string } }) {
  const { scanId, findingId } = params;
  const [finding, setFinding] = useState<Finding | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    setError(null);
    api
      .getFinding(scanId, findingId)
      .then(setFinding)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load finding."))
      .finally(() => setLoading(false));
  }

  useEffect(load, [scanId, findingId]);

  return (
    <AppShell title="Finding detail">
      <Link href={`/scans/${scanId}/findings`} className="mb-4 inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary">
        <ArrowLeft size={14} />
        Back to findings
      </Link>

      {loading ? <LoadingState label="Loading finding" /> : null}
      {error ? <ErrorState description={error} onRetry={load} /> : null}

      {finding ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <div className="rounded-md border border-border bg-surface p-5 shadow-subtle">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-text-primary">
                  {finding.algorithm}
                  {finding.variant ? <span className="font-normal text-text-secondary"> · {finding.variant}</span> : null}
                </h2>
                <RiskBadge level={finding.riskLevel} />
                <ConfidenceBadge level={finding.confidence} />
              </div>
              <p className="mb-4 text-xs font-mono-tabular text-text-secondary">
                Finding {finding.id} · Scan {finding.scanId}
              </p>

              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
                <Field label="Primitive type">{finding.primitiveType.replace(/_/g, " ")}</Field>
                <Field label="Key size">{finding.keySize && finding.keySize !== "Unknown" ? `${finding.keySize} bit` : <UnknownValue />}</Field>
                <Field label="Mode">{finding.mode ?? "—"}</Field>
                <Field label="Parameter set">{finding.parameterSet ?? "—"}</Field>
                <Field label="Library">
                  {finding.library ?? "—"}
                  {finding.libraryVersion ? ` ${finding.libraryVersion}` : ""}
                </Field>
                <Field label="Asset / input type">{INPUT_TYPE_LABEL[finding.assetType] ?? finding.assetType}</Field>
              </dl>
            </div>

            <div className="rounded-md border border-border bg-surface p-5 shadow-subtle">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-text-primary">
                <FileCode2 size={15} />
                Where &amp; how it was detected
              </h3>
              <dl className="space-y-3">
                <Field label="Source location">
                  {finding.sourcePath ? (
                    <span className="font-mono text-xs">
                      {finding.sourcePath}
                      {finding.lineStart ? `:${finding.lineStart}${finding.lineEnd && finding.lineEnd !== finding.lineStart ? `-${finding.lineEnd}` : ""}` : ""}
                    </span>
                  ) : (
                    "—"
                  )}
                </Field>
                <Field label="Detection methods">
                  <div className="flex flex-wrap gap-1.5">
                    {finding.detectionMethods.map((m) => (
                      <span key={m} className="rounded border border-border bg-elevated px-2 py-0.5 text-xs text-text-secondary">
                        {DETECTION_METHOD_LABEL[m] ?? m}
                      </span>
                    ))}
                  </div>
                </Field>
                {finding.evidence ? (
                  <Field label="Evidence">
                    <pre className="mt-1 overflow-x-auto rounded border border-border bg-elevated px-3 py-2 font-mono text-xs text-text-primary">
                      {finding.evidence}
                    </pre>
                  </Field>
                ) : null}
              </dl>
            </div>

            <div className="rounded-md border border-border bg-surface p-5 shadow-subtle">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-text-primary">
                <ShieldQuestion size={15} />
                Why this is risky
              </h3>
              <div className="mb-4 flex flex-wrap gap-2">
                <ExposureBadge status={finding.classicalStatus} label="Classical" />
                <ExposureBadge status={finding.quantumStatus} label="Quantum" />
              </div>
              <p className="text-sm text-text-secondary">{finding.riskExplanation ?? "No explanation returned by the backend for this finding."}</p>

              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
                <Field label="Risk score">
                  <span className="font-mono-tabular">{finding.riskScore} / 100</span>
                </Field>
                <Field label="Data lifetime">
                  <span className="flex items-center gap-1.5">
                    {finding.dataLifetime && finding.dataLifetime !== "Unknown" ? finding.dataLifetime : <UnknownValue />}
                    {finding.isAssumption?.dataLifetime ? <AssumptionTag /> : null}
                  </span>
                </Field>
                <Field label="Business criticality">
                  <span className="flex items-center gap-1.5">
                    {finding.businessCriticality && finding.businessCriticality !== "Unknown" ? finding.businessCriticality : <UnknownValue />}
                    {finding.isAssumption?.businessCriticality ? <AssumptionTag /> : null}
                  </span>
                </Field>
                <Field label="Migration effort">{finding.migrationTime && finding.migrationTime !== "UNKNOWN" ? finding.migrationTime : <UnknownValue />}</Field>
              </dl>
            </div>
          </div>

          <div className="space-y-4">
            {finding.recommendation ? (
              <div className="rounded-md border border-accent/30 bg-accent/5 p-5">
                <h3 className="mb-3 text-sm font-semibold text-text-primary">Recommended migration</h3>
                <dl className="space-y-3">
                  <Field label="Direction">{finding.recommendation.direction.replace(/_/g, " ")}</Field>
                  <Field label="Candidate algorithm">{finding.recommendation.candidateAlgorithm}</Field>
                  <Field label="Priority">
                    <RiskBadge level={finding.recommendation.priority} />
                  </Field>
                  <Field label="Rationale">
                    <span className="text-sm text-text-secondary">{finding.recommendation.rationale}</span>
                  </Field>
                  {finding.recommendation.tradeOffs ? (
                    <Field label="Trade-offs">
                      <span className="text-sm text-text-secondary">{finding.recommendation.tradeOffs}</span>
                    </Field>
                  ) : null}
                  {finding.recommendation.isExperimental ? (
                    <p className="rounded border border-amber/30 bg-amber/10 px-2 py-1.5 text-xs text-amber">
                      Candidate algorithm is experimental — not yet a finalized standard.
                    </p>
                  ) : null}
                </dl>
                <Link
                  href={`/scans/${scanId}/recommendations`}
                  className="mt-4 inline-block text-xs font-medium text-accent hover:underline"
                >
                  View all recommendations →
                </Link>
              </div>
            ) : (
              <div className="rounded-md border border-border bg-surface p-5 text-sm text-text-secondary">
                No migration recommendation was returned for this finding.
              </div>
            )}
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
