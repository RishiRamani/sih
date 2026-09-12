import { cn, RISK_LABEL, CONFIDENCE_LABEL, SCAN_STATUS_LABEL } from "@/lib/utils";
import type { RiskLevel, Confidence, ScanStatus, ExposureStatus } from "@/lib/types";
import { AlertTriangle, AlertOctagon, Info, CheckCircle2, HelpCircle } from "lucide-react";

const baseClasses =
  "inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-medium border whitespace-nowrap";

export function RiskBadge({ level }: { level: RiskLevel }) {
  const styles: Record<RiskLevel, string> = {
    LOW: "bg-teal/10 text-teal border-teal/30",
    MEDIUM: "bg-amber/10 text-amber border-amber/30",
    HIGH: "bg-crimson/10 text-crimson border-crimson/30",
    CRITICAL: "bg-crimson/20 text-crimson border-crimson/50"
  };
  const Icon = level === "LOW" ? CheckCircle2 : level === "MEDIUM" ? AlertTriangle : AlertOctagon;
  return (
    <span className={cn(baseClasses, styles[level])}>
      <Icon size={12} strokeWidth={2.5} />
      {RISK_LABEL[level]}
    </span>
  );
}

export function ConfidenceBadge({ level }: { level: Confidence }) {
  const styles: Record<Confidence, string> = {
    HIGH: "bg-accent/10 text-accent border-accent/30",
    MEDIUM: "bg-text-secondary/10 text-text-secondary border-text-secondary/30",
    LOW: "bg-text-secondary/5 text-text-secondary border-border"
  };
  return <span className={cn(baseClasses, styles[level])}>{CONFIDENCE_LABEL[level]} confidence</span>;
}

export function ExposureBadge({ status, label }: { status: ExposureStatus; label: string }) {
  const styles: Record<ExposureStatus, string> = {
    SAFE: "bg-teal/10 text-teal border-teal/30",
    WEAK: "bg-amber/10 text-amber border-amber/30",
    BROKEN: "bg-crimson/10 text-crimson border-crimson/30",
    DEPRECATED: "bg-amber/10 text-amber border-amber/30",
    UNKNOWN: "bg-text-secondary/5 text-text-secondary border-border"
  };
  const text: Record<ExposureStatus, string> = {
    SAFE: "Safe",
    WEAK: "Weak",
    BROKEN: "Broken",
    DEPRECATED: "Deprecated",
    UNKNOWN: "Unknown"
  };
  return (
    <span className={cn(baseClasses, styles[status])}>
      {label}: {text[status]}
    </span>
  );
}

export function ScanStatusBadge({ status }: { status: ScanStatus }) {
  const isTerminalOk = status === "COMPLETED";
  const isFailed = status === "FAILED";
  const styles = isTerminalOk
    ? "bg-teal/10 text-teal border-teal/30"
    : isFailed
      ? "bg-crimson/10 text-crimson border-crimson/30"
      : "bg-accent/10 text-accent border-accent/30";
  return <span className={cn(baseClasses, styles)}>{SCAN_STATUS_LABEL[status]}</span>;
}

export function UnknownValue({ label = "Unknown" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-text-secondary italic">
      <HelpCircle size={12} />
      {label}
    </span>
  );
}

export function AssumptionTag() {
  return (
    <span className="inline-flex items-center gap-1 rounded border border-accent/30 bg-accent/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-accent">
      <Info size={10} />
      Assumed
    </span>
  );
}
