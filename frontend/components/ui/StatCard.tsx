import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: "default" | "amber" | "crimson" | "teal";
  hint?: string;
}

const toneClasses = {
  default: "text-accent bg-accent/10",
  amber: "text-amber bg-amber/10",
  crimson: "text-crimson bg-crimson/10",
  teal: "text-teal bg-teal/10"
};

export function StatCard({ label, value, icon: Icon, tone = "default", hint }: StatCardProps) {
  return (
    <div className="rounded-md border border-border bg-surface p-4 shadow-subtle">
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium text-text-secondary">{label}</span>
        <span className={cn("flex h-7 w-7 items-center justify-center rounded", toneClasses[tone])}>
          <Icon size={15} strokeWidth={2} />
        </span>
      </div>
      <div className="mt-2 font-mono-tabular text-2xl font-semibold text-text-primary">{value}</div>
      {hint ? <div className="mt-1 text-xs text-text-secondary">{hint}</div> : null}
    </div>
  );
}
