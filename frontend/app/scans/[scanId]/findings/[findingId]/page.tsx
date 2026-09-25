"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  FileCode2,
  ShieldQuestion,
  Sparkles
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { RequireAuth } from "@/lib/auth/guard";
import { Card } from "@/components/ui/Card";
import {
  RiskBadge,
  ConfidenceBadge,
  ExposureBadge,
  UnknownValue,
  AssumptionTag
} from "@/components/ui/Badge";
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
      <dt className="text-[10px] font-semibold uppercase tracking-[0.11em] text-text-secondary">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-text-primary">{children}</dd>
    </div>
  );
}

export default function FindingDetailPage({
  params
}: {
  params: { scanId: string; findingId: string };
}) {
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
    <RequireAuth>
      <AppShell title="Finding detail">
        <Link
          href={`/scans/${scanId}/findings`}
          className="mb-5 inline-flex items-center gap-1.5 text-[12px] font-medium uppercase tracking-[0.08em] text-text-secondary transition-colors hover:text-text-primary"
        >
          <ArrowLeft size={13} />
          Back to findings
        </Link>

      {loading ? <LoadingState label="Loading finding" /> : null}
      {error ? <ErrorState description={error} onRetry={load} /> : null}

      {finding ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Left column */}
          <div className="space-y-4 lg:col-span-2">
            {/* Identification */}
            <Card bodyClassName="px-5 py-5">
              <div className="mb-1 flex flex-wrap items-center gap-2">
  <h2 className="text-xl font-semibold tracking-[-0.02em] text-text-primary">
    {finding.algorithm}
    {finding.variant ? <span className="font-normal text-text-secondary"> · {finding.variant}</span> : null}
  </h2>
  <div className="flex items-center gap-1.5">
    <span className="text-[10px] font-semibold uppercase tracking-[0.11em] text-text-secondary">Risk</span>
    <RiskBadge level={finding.riskLevel} />
  </div>
  <div className="flex items-center gap-1.5">
    <span className="text-[10px] font-semibold uppercase tracking-[0.11em] text-text-secondary">Confidence</span>
    <ConfidenceBadge level={finding.confidence} />
  </div>
</div>
              <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.06em] text-text-secondary">
                {finding.id} · scan {finding.scanId}
              </p>

              <dl className="grid grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-3">
                <Field label="Primitive type">
                  {finding.primitiveType.replace(/_/g, " ")}
                </Field>
                <Field label="Key size">
                  {finding.keySize && finding.keySize !== "Unknown" ? (
                    <span className="font-mono-tabular">{finding.keySize} bit</span>
                  ) : (
                    <UnknownValue />
                  )}
                </Field>
                <Field label="Mode">{finding.mode ?? "—"}</Field>
                <Field label="Parameter set">{finding.parameterSet ?? "—"}</Field>
                <Field label="Library">
                  {finding.library ?? "—"}
                  {finding.libraryVersion ? (
                    <span className="ml-1 font-mono text-xs text-text-secondary">
                      {finding.libraryVersion}
                    </span>
                  ) : null}
                </Field>
                <Field label="Asset type">
                  {INPUT_TYPE_LABEL[finding.assetType] ?? finding.assetType}
                </Field>
              </dl>
            </Card>

            {finding.certificate ? (
              <Card title="Certificate details" bodyClassName="px-5 py-5">
                <dl className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
                  <Field label="Subject">{finding.certificate.subject ?? "—"}</Field>
                  <Field label="Issuer">{finding.certificate.issuer ?? "—"}</Field>
                  <Field label="Signature algorithm">
                    {finding.certificate.signatureAlgorithm ?? "—"}
                  </Field>
                  <Field label="Signature OID">
                    {finding.certificate.signatureOid ?? "—"}
                  </Field>
                  <Field label="Curve">{finding.certificate.curve ?? "—"}</Field>
                  <Field label="SANs">{finding.certificate.san?.join(", ") || "—"}</Field>
                  <Field label="Valid from">
                    {finding.certificate.notValidBefore ?? "—"}
                  </Field>
                  <Field label="Valid until">
                    {finding.certificate.notValidAfter ?? "—"}
                  </Field>
                </dl>
              </Card>
            ) : null}

            {/* Risk reasoning */}
            <Card
              title="Why this is risky"
              actions={<ShieldQuestion size={14} className="text-text-secondary" />}
              bodyClassName="px-5 py-5"
            >
              <div className="mb-4 flex flex-wrap gap-2">
                <ExposureBadge status={finding.classicalStatus} label="Classical" />
                <ExposureBadge status={finding.quantumStatus} label="Quantum" />
              </div>
              <p className="text-sm leading-relaxed text-text-secondary">
                {finding.riskExplanation ??
                  "No explanation returned by the backend for this finding."}
              </p>

              <dl className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-3">
                <Field label="Risk score">
                  <span className="font-mono-tabular">{finding.riskScore} / 100</span>
                </Field>
                <Field label="Data lifetime">
                  <span className="flex items-center gap-1.5">
                    {finding.dataLifetime !== undefined && finding.dataLifetime !== "Unknown" ? (
                      typeof finding.dataLifetime === "number"
                        ? `${finding.dataLifetime} years`
                        : finding.dataLifetime
                    ) : (
                      <UnknownValue />
                    )}
                    {finding.isAssumption?.dataLifetime ? <AssumptionTag /> : null}
                  </span>
                </Field>
                <Field label="Business criticality">
                  <span className="flex items-center gap-1.5">
                    {finding.businessCriticality &&
                    finding.businessCriticality !== "Unknown" ? (
                      finding.businessCriticality
                    ) : (
                      <UnknownValue />
                    )}
                    {finding.isAssumption?.businessCriticality ? <AssumptionTag /> : null}
                  </span>
                </Field>
                <Field label="Migration effort">
                  {finding.migrationTime && finding.migrationTime !== "UNKNOWN" ? (
                    finding.migrationTime
                  ) : (
                    <UnknownValue />
                  )}
                </Field>
              </dl>
            </Card>

            {/* Detection */}
            <Card
              title="Where & how it was detected"
              actions={<FileCode2 size={14} className="text-text-secondary" />}
              bodyClassName="px-5 py-5"
            >
              <dl className="space-y-4">
                <Field label="Source location">
                  {finding.sourcePath ? (
                    <span className="font-mono text-xs">
                      {finding.sourcePath}
                      {finding.lineStart
                        ? `:${finding.lineStart}${
                            finding.lineEnd && finding.lineEnd !== finding.lineStart
                              ? `-${finding.lineEnd}`
                              : ""
                          }`
                        : ""}
                    </span>
                  ) : (
                    "—"
                  )}
                </Field>
                <Field label="Detection methods">
                  <div className="flex flex-wrap gap-1.5">
                    {finding.detectionMethods.map((m) => (
                      <span
                        key={m}
                        className="rounded-sm border border-border bg-elevated px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.06em] text-text-secondary"
                      >
                        {DETECTION_METHOD_LABEL[m] ?? m}
                      </span>
                    ))}
                  </div>
                </Field>
                {finding.evidence ? (
                  <Field label="Evidence">
                    <pre className="mt-1 overflow-x-auto rounded-sm border border-border bg-elevated px-3 py-2 font-mono text-xs leading-relaxed text-text-primary">
                      {finding.evidence}
                    </pre>
                  </Field>
                ) : null}
              </dl>
            </Card>

            
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {finding.recommendation ? (
              <Card
                title="Recommended migration"
                actions={<Sparkles size={14} className="text-accent" />}
                bodyClassName="px-5 py-5"
              >
                <dl className="space-y-4">
                  <Field label="Direction">
                    {finding.recommendation.direction.replace(/_/g, " ")}
                  </Field>
                  <Field label="Candidate algorithm">
                    <span className="font-mono text-xs">
                      {finding.recommendation.candidateAlgorithm}
                    </span>
                  </Field>
                  <Field label="Priority">
                    <RiskBadge level={finding.recommendation.priority} />
                  </Field>
                  <Field label="Rationale">
                    <span className="text-sm leading-relaxed text-text-secondary">
                      {finding.recommendation.rationale}
                    </span>
                  </Field>
                  {finding.recommendation.tradeOffs ? (
                    <Field label="Trade-offs">
                      <span className="text-sm leading-relaxed text-text-secondary">
                        {finding.recommendation.tradeOffs}
                      </span>
                    </Field>
                  ) : null}
                </dl>
                {finding.recommendation.isExperimental ? (
                  <p className="mt-4 rounded border border-amber/35 bg-amber/10 px-2.5 py-2 text-xs leading-relaxed text-amber">
                    Candidate algorithm is experimental — not yet a finalized standard.
                  </p>
                ) : null}
                <Link
                  href={`/scans/${scanId}/recommendations`}
                  className="mt-4 inline-block text-[11px] font-medium uppercase tracking-[0.08em] text-accent hover:text-accent/80"
                >
                  View all recommendations →
                </Link>
              </Card>
            ) : (
              <Card bodyClassName="px-5 py-5">
                <p className="text-sm text-text-secondary">
                  No migration recommendation was returned for this finding.
                </p>
              </Card>
            )}
          </div>
        </div>
        ) : null}
      </AppShell>
    </RequireAuth>
  );
}