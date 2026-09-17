import { cn, RISK_LABEL, CONFIDENCE_LABEL, SCAN_STATUS_LABEL } from "@/lib/utils";
import type { RiskLevel, Confidence, ScanStatus, ExposureStatus } from "@/lib/types";
import { AlertTriangle, AlertOctagon, Info, CheckCircle2, HelpCircle, Leaf } from "lucide-react";

const baseClasses =
  "inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.05em] whitespace-nowrap";

export function RiskBadge({ level }: { level: RiskLevel }) {
  const styles: Record<RiskLevel, string> = {
    LOW:      "bg-safe-soft text-safe border-safe/35",
    MEDIUM:   "bg-amber-soft text-amber border-amber/40",
    HIGH:     "bg-orange-soft text-orange border-orange/40",
    CRITICAL: "bg-danger-soft text-danger border-danger/45",
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
    HIGH:   "bg-accent-soft text-accent border-accent/35",
    MEDIUM: "bg-amber-soft text-amber border-amber/35",
    LOW:    "bg-elevated text-text-secondary border-border",
  };
  return <span className={cn(baseClasses, styles[level])}>{CONFIDENCE_LABEL[level]}</span>;
}

export function ExposureBadge({ status, label }: { status: ExposureStatus; label: string }) {
  const styles: Record<ExposureStatus, string> = {
    SAFE:       "bg-safe-soft text-safe border-safe/35",
    WEAK:       "bg-amber-soft text-amber border-amber/35",
    BROKEN:     "bg-danger-soft text-danger border-danger/45",
    DEPRECATED: "bg-orange-soft text-orange border-orange/40",
    UNKNOWN:    "bg-elevated text-text-secondary border-border",
  };
  const text: Record<ExposureStatus, string> = {
    SAFE: "Safe", WEAK: "Weak", BROKEN: "Broken",
    DEPRECATED: "Deprecated", UNKNOWN: "Unknown",
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
    ? "bg-safe-soft text-safe border-safe/35"
    : isFailed
      ? "bg-danger-soft text-danger border-danger/45"
      : "bg-accent-soft text-accent border-accent/35";
  const dot = isTerminalOk ? "bg-safe" : isFailed ? "bg-danger" : "bg-accent";
  return (
    <span className={cn(baseClasses, styles)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", dot)} aria-hidden />
      {SCAN_STATUS_LABEL[status]}
    </span>
  );
}

export function UnknownValue({ label = "—" }: { label?: string }) {
  return (
    <span className="">
      {/* <HelpCircle size={11} /> */}
      {label}
    </span>
  );
}

export function AssumptionTag() {
  return (
    <span className="inline-flex items-center gap-1 rounded border border-amber/35 bg-amber-soft px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-amber">
      <Info size={9} />
      Assumed
    </span>
  );
}