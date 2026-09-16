"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import type { Scan } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface RescanButtonProps {
  scan: Scan;
  size?: "sm" | "md";
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  label?: string;
}

export function RescanButton({
  scan,
  size = "sm",
  variant = "secondary",
  className,
  label = "Rescan",
}: RescanButtonProps) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (running) return;
    setRunning(true);
    setError(null);
    try {
      const next = await api.createScan({
        name: `${scan.name} (rescan)`,
        inputType: scan.inputType,
        sourceLabel: scan.sourceLabel,
      });

      // Guard: the new scan must target the same source. If the backend ever
      // normalizes the path or URL differently, fall back to the current scan
      // instead of creating a nonsense comparison.
      const sameSource =
        normalize(next.sourceLabel) === normalize(scan.sourceLabel);

      if (sameSource) {
        router.push(`/scans/${next.id}/compare/${scan.id}`);
      } else {
        // Show a message instead of navigating
        setError(
          "Rescan targets a different path. Comparison skipped."
        );
        setRunning(false);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Rescan failed.");
      setRunning(false);
    }
  }

  return (
    <div className={cn("inline-flex flex-col items-start gap-1", className)}>
      <Button
        variant={variant}
        size={size}
        onClick={handleClick}
        disabled={running || scan.status !== "COMPLETED"}
        title={
          scan.status !== "COMPLETED"
            ? "Only completed scans can be rescanned"
            : `Run ${scan.sourceLabel} again`
        }
      >
        {running ? (
          <Loader2 size={13} className="animate-spin" />
        ) : (
          <RefreshCw size={13} />
        )}
        {running ? "Rescanning…" : label}
      </Button>
      {error ? (
        <span className="text-[11px] text-crimson">{error}</span>
      ) : null}
    </div>
  );
}

function normalize(s: string): string {
  return s
    .trim()
    .replace(/\\/g, "/")
    .replace(/\/+$/, "")
    .replace(/\.git$/, "")
    .toLowerCase();
}