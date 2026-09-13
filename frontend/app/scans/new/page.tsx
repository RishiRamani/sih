"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  GitBranch,
  FileArchive,
  Binary,
  Container,
  FileKey,
  FileText,
  Loader2
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import type { AssetInputType } from "@/lib/types";
import { cn } from "@/lib/utils";

const INPUT_TYPES: {
  value: AssetInputType;
  label: string;
  description: string;
  icon: typeof GitBranch;
}[] = [
  { value: "SOURCE_REPOSITORY", label: "Source repository", description: "Git URL or workspace path", icon: GitBranch },
  { value: "SOURCE_ARCHIVE", label: "Source archive", description: "Uploaded .zip or .tar.gz of source", icon: FileArchive },
  { value: "BINARY_LIBRARY", label: "Binary / library", description: "Compiled binary, .jar, .so, or .dll", icon: Binary },
  { value: "CONTAINER_IMAGE", label: "Container image", description: "Image reference or exported archive", icon: Container },
  { value: "CERTIFICATE", label: "Certificate(s)", description: "X.509 certs, keystores, PEM bundles", icon: FileKey },
  { value: "DEPENDENCY_MANIFEST", label: "Dependency manifest", description: "package.json, pom.xml, requirements.txt, etc.", icon: FileText }
];

export default function NewScanPage() {
  const router = useRouter();
  const [inputType, setInputType] = useState<AssetInputType>("SOURCE_REPOSITORY");
  const [name, setName] = useState("");
  const [sourceLabel, setSourceLabel] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = INPUT_TYPES.find((t) => t.value === inputType)!;

  async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  if (!name.trim() || !sourceLabel.trim()) {
    setError("Name and source are both required.");
    return;
  }
  setSubmitting(true);
  setError(null);
  try {
    const scan = await api.createScan({
      name: name.trim(),
      inputType,
      sourceLabel: sourceLabel.trim(),
    });
    // Backend runs the scan synchronously — no separate start call.
    router.push(`/scans/${scan.id}/findings`);
  } catch (err) {
    setError(err instanceof Error ? err.message : "Failed to start scan.");
    setSubmitting(false);
  }
}

  return (
    <AppShell title="New scan">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <p className="eyebrow">Discovery</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-[-0.02em] text-text-primary">
            Start a new scan
          </h2>
          <p className="mt-1 text-[13px] leading-relaxed text-text-secondary">
            ECDAT discovers cryptographic usage across the asset you provide, then normalizes findings
            into a CBOM and risk assessment. Analysis, detection, and risk scoring all happen on the
            backend.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Card title="Asset type">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {INPUT_TYPES.map((t) => (
                <button
                  type="button"
                  key={t.value}
                  onClick={() => setInputType(t.value)}
                  className={cn(
                    "flex flex-col items-start gap-1.5 rounded border p-3 text-left transition-colors",
                    inputType === t.value
                      ? "border-accent bg-accent/8"
                      : "border-border bg-elevated/40 hover:border-accent/40 hover:bg-elevated/70"
                  )}
                >
                  <t.icon
                    size={16}
                    className={inputType === t.value ? "text-accent" : "text-text-secondary"}
                  />
                  <span className="text-[12px] font-medium text-text-primary">{t.label}</span>
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-text-secondary">{selected.description}</p>
          </Card>

          <Card title="Scan details">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="scan-name"
                  className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.11em] text-text-secondary"
                >
                  Scan name
                </label>
                <input
                  id="scan-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. payments-service (main)"
                  className="w-full rounded border border-border bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/60 focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="scan-source"
                  className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.11em] text-text-secondary"
                >
                  {inputType === "SOURCE_REPOSITORY"
                    ? "Repository URL or path"
                    : inputType === "CONTAINER_IMAGE"
                      ? "Image reference"
                      : "Source"}
                </label>
                <input
                  id="scan-source"
                  value={sourceLabel}
                  onChange={(e) => setSourceLabel(e.target.value)}
                  placeholder={
                    inputType === "SOURCE_REPOSITORY"
                      ? "git@github.com:org/repo.git"
                      : inputType === "CONTAINER_IMAGE"
                        ? "registry.example.com/app:tag"
                        : "Path or reference to the asset"
                  }
                  className="w-full rounded border border-border bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/60 focus:border-accent focus:outline-none"
                />
                <p className="mt-2 text-xs text-text-secondary">
                  Uploaded binaries are never executed by the default scanner. Static analysis only.
                </p>
              </div>
            </div>
          </Card>

          {error ? (
            <div className="rounded border border-crimson/40 bg-crimson/8 px-3 py-2.5 text-sm text-crimson">
              {error}
            </div>
          ) : null}

          <div className="flex items-center gap-3 pt-1">
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 size={15} className="animate-spin" /> : null}
              {submitting ? "Starting scan…" : "Start scan"}
            </Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}