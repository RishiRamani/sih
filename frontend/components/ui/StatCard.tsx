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
  default: "text-accent",
  amber: "text-accent",
  crimson: "text-crimson",
  teal: "text-teal"
};

export function StatCard({ label, value, icon: Icon, tone = "default", hint }: StatCardProps) {
  return (
    <div className="relative rounded border border-border bg-surface px-4 py-3.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.11em] text-text-secondary">
          {label}
        </span>
        <Icon size={14} strokeWidth={2} className={cn(toneClasses[tone])} />
      </div>
      <div className="mt-2 font-mono text-[26px] font-medium leading-none tracking-[-0.02em] text-text-primary">
        {value}
      </div>
      {hint ? (
        <div className="mt-1.5 text-[11px] text-text-secondary">{hint}</div>
      ) : null}
    </div>
  );
}