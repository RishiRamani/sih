"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GitBranch, FileArchive, Binary, Container, FileKey, FileText, Loader2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { api } from "@/lib/api";
import type { AssetInputType } from "@/lib/types";
import { cn } from "@/lib/utils";

const INPUT_TYPES: { value: AssetInputType; label: string; description: string; icon: typeof GitBranch }[] = [
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
      const scan = await api.createScan({ name: name.trim(), inputType, sourceLabel: sourceLabel.trim() });
      await api.startScan(scan.id);
      router.push(`/scans/${scan.id}/progress`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start scan.");
      setSubmitting(false);
    }
  }

  return (
    <AppShell title="New scan">
      <div className="mx-auto max-w-2xl">
        <h2 className="text-lg font-semibold text-text-primary">Start a new scan</h2>
        <p className="mb-6 text-sm text-text-secondary">
          ECDAT discovers cryptographic usage across the asset you provide, then normalizes findings into a CBOM
          and risk assessment. Analysis, detection, and risk scoring all happen on the backend.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-text-primary">Asset type</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {INPUT_TYPES.map((t) => (
                <button
                  type="button"
                  key={t.value}
                  onClick={() => setInputType(t.value)}
                  className={cn(
                    "flex flex-col items-start gap-1.5 rounded-md border p-3 text-left transition-colors",
                    inputType === t.value
                      ? "border-accent bg-accent/10"
                      : "border-border bg-surface hover:border-accent/40"
                  )}
                >
                  <t.icon size={17} className={inputType === t.value ? "text-accent" : "text-text-secondary"} />
                  <span className="text-xs font-medium text-text-primary">{t.label}</span>
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-text-secondary">{selected.description}</p>
          </div>

          <div>
            <label htmlFor="scan-name" className="mb-1.5 block text-sm font-medium text-text-primary">
              Scan name
            </label>
            <input
              id="scan-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. payments-service (main)"
              className="w-full rounded border border-border bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/70 focus:border-accent"
            />
          </div>

          <div>
            <label htmlFor="scan-source" className="mb-1.5 block text-sm font-medium text-text-primary">
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
              className="w-full rounded border border-border bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/70 focus:border-accent"
            />
            <p className="mt-1.5 text-xs text-text-secondary">
              Uploaded binaries are never executed by the default scanner. Static analysis only.
            </p>
          </div>

          {error ? (
            <div className="rounded border border-crimson/30 bg-crimson/5 px-3 py-2 text-sm text-crimson">{error}</div>
          ) : null}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-60"
            >
              {submitting ? <Loader2 size={15} className="animate-spin" /> : null}
              {submitting ? "Starting scan…" : "Start scan"}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
