import type { LucideIcon } from "lucide-react";
import { Inbox, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function EmptyState({ icon: Icon = Inbox, title = "", description = "", action = "" }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-border bg-surface px-6 py-16 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-soft text-accent">
        <Icon size={19} />
      </span>
      <h3 className="mt-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-text-primary">
        {title}
      </h3>
      {description ? (
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-text-secondary">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ title = "Something went wrong", description = "", onRetry = ()=>{console.log("1")} }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-md border border-danger/30 bg-danger-soft px-6 py-16 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full border border-danger/30 bg-danger/10 text-danger">
        <AlertCircle size={18} />
      </span>
      <h3 className="mt-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-text-primary">
        {title}
      </h3>
      {description ? (
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-text-secondary">
          {description}
        </p>
      ) : null}
      {onRetry ? (
        <div className="mt-5">
          <Button variant="secondary" onClick={onRetry}>
            Retry
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 rounded border border-border bg-surface px-6 py-16 text-sm text-text-secondary">
      <Loader2 size={15} className="animate-spin" />
      {label}…
    </div>
  );
}