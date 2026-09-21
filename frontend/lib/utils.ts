import { clsx, type ClassValue } from "clsx";
import type { RiskLevel, Confidence, ScanStatus } from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function formatDuration(startIso?: string, endIso?: string): string {
  if (!startIso || !endIso) return "—";
  const ms = new Date(endIso).getTime() - new Date(startIso).getTime();
  if (ms < 0) return "—";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}m ${rem}s`;
}

export const RISK_LABEL: Record<string, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
  SAFE: "Safe",
  WEAK: "Weak",
  BROKEN: "Broken",
  DEPRECATED: "Deprecated",
  UNKNOWN: "Unknown",
};

export const CONFIDENCE_LABEL: Record<Confidence, string> = {
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low"
};

export const SCAN_STATUS_LABEL: Record<ScanStatus, string> = {
  CREATED: "Created",
  QUEUED: "Queued",
  DISCOVERING: "Discovering",
  ANALYSING: "Analysing",
  NORMALIZING: "Normalizing",
  BUILDING_CBOM: "Building CBOM",
  ASSESSING_RISK: "Assessing risk",
  GENERATING_RECOMMENDATIONS: "Generating recommendations",
  COMPLETED: "Completed",
  FAILED: "Failed"
};

export const INPUT_TYPE_LABEL: Record<string, string> = {
  SOURCE_REPOSITORY: "Source repository",
  SOURCE_ARCHIVE: "Source archive",
  BINARY_LIBRARY: "Binary / library",
  CONTAINER_IMAGE: "Container image",
  CERTIFICATE: "Certificate",
  DEPENDENCY_MANIFEST: "Dependency manifest"
};

export function riskRank(level: RiskLevel): number {
  return { LOW: 0, MEDIUM: 1, HIGH: 2, CRITICAL: 3 }[level];
}
