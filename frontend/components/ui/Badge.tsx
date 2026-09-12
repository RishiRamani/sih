import { cn, RISK_LABEL, CONFIDENCE_LABEL, SCAN_STATUS_LABEL } from "@/lib/utils";
import type { RiskLevel, Confidence, ScanStatus, ExposureStatus } from "@/lib/types";
import { AlertTriangle, AlertOctagon, Info, CheckCircle2, HelpCircle, Leaf } from "lucide-react";

const baseClasses =
  "inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.05em] whitespace-nowrap";

export function RiskBadge({ level }: { level: RiskLevel }) {
  const styles: Record<RiskLevel, string> = {
    LOW:      "bg-teal/10 text-teal border-teal/35",
    MEDIUM:   "bg-accent/10 text-accent border-accent/35",
    HIGH:     "bg-crimson/12 text-crimson border-crimson/40",
    CRITICAL: "bg-crimson/20 text-crimson border-crimson/55"
  };
  const Icon = level === "LOW" ? Leaf : level === "MEDIUM" ? Info : level === "HIGH" ? AlertTriangle : AlertOctagon;
  return (
    <span className={cn(baseClasses, styles[level])}>
      <Icon size={11} strokeWidth={2.5} />
      {RISK_LABEL[level]}
    </span>
  );
}

export function ConfidenceBadge({ level }: { level: Confidence }) {
  const styles: Record<Confidence, string> = {
    HIGH:   "bg-accent/10 text-accent border-accent/35",
    MEDIUM: "bg-highlight/10 text-highlight border-highlight/30",
    LOW:    "bg-text-secondary/8 text-text-secondary border-border"
  };
  return <span className={cn(baseClasses, styles[level])}>{CONFIDENCE_LABEL[level]}</span>;
}

export function ExposureBadge({ status, label }: { status: ExposureStatus; label: string }) {
  const styles: Record<ExposureStatus, string> = {
    SAFE:       "bg-teal/10 text-teal border-teal/35",
    WEAK:       "bg-accent/10 text-accent border-accent/35",
    BROKEN:     "bg-crimson/15 text-crimson border-crimson/45",
    DEPRECATED: "bg-accent/10 text-accent border-accent/35",
    UNKNOWN:    "bg-text-secondary/8 text-text-secondary border-border"
  };
  const text: Record<ExposureStatus, string> = {
    SAFE: "Safe", WEAK: "Weak", BROKEN: "Broken",
    DEPRECATED: "Deprecated", UNKNOWN: "Unknown"
  };
  return (
    <span className={cn(baseClasses, styles[status])}>
      {label} · {text[status]}
    </span>
  );
}

export function ScanStatusBadge({ status }: { status: ScanStatus }) {
  const isTerminalOk = status === "COMPLETED";
  const isFailed = status === "FAILED";
  const styles = isTerminalOk
    ? "bg-teal/10 text-teal border-teal/35"
    : isFailed
      ? "bg-crimson/15 text-crimson border-crimson/45"
      : "bg-accent/10 text-accent border-accent/35";
  const dot = isTerminalOk ? "bg-teal" : isFailed ? "bg-crimson" : "bg-accent";
  return (
    <span className={cn(baseClasses, styles)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", dot)} aria-hidden />
      {SCAN_STATUS_LABEL[status]}
    </span>
  );
}

export function UnknownValue({ label = "Unknown" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.05em] text-text-secondary">
      <HelpCircle size={11} />
      {label}
    </span>
  );
}

export function AssumptionTag() {
  return (
    <span className="inline-flex items-center gap-1 rounded-sm border border-highlight/35 bg-highlight/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-highlight">
      <Info size={9} />
      Assumed
    </span>
  );
}