import type { LucideIcon } from "lucide-react";
import { Inbox, AlertCircle, Loader2 } from "lucide-react";

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-border bg-surface px-6 py-16 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-elevated text-text-secondary">
        <Icon size={18} />
      </span>
      <h3 className="mt-3 text-sm font-semibold text-text-primary">{title}</h3>
      {description ? <p className="mt-1 max-w-sm text-sm text-text-secondary">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ title = "Something went wrong", description, onRetry }: { title?: string; description?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-md border border-crimson/30 bg-crimson/5 px-6 py-16 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-crimson/10 text-crimson">
        <AlertCircle size={18} />
      </span>
      <h3 className="mt-3 text-sm font-semibold text-text-primary">{title}</h3>
      {description ? <p className="mt-1 max-w-sm text-sm text-text-secondary">{description}</p> : null}
      {onRetry ? (
        <button
          onClick={onRetry}
          className="mt-4 rounded border border-border bg-elevated px-3 py-1.5 text-sm font-medium text-text-primary hover:border-accent/50"
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}

export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 rounded-md border border-border bg-surface px-6 py-16 text-sm text-text-secondary">
      <Loader2 size={16} className="animate-spin" />
      {label}…
    </div>
  );
}
