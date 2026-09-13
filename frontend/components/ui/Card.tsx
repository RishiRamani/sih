import { cn } from "@/lib/utils";

interface CardProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  dense?: boolean;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}

export function Card({
  title,
  subtitle,
  actions,
  dense = false,
  className,
  bodyClassName,
  children,
}: CardProps) {
  return (
    <section
      className={cn(
        "rounded-md border border-border bg-surface shadow-subtle",
        className
      )}
    >
      {title ? (
        <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="min-w-0">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.11em] text-text-secondary">
              {title}
            </h3>
            {subtitle ? (
              <p className="mt-0.5 text-[11px] text-text-secondary/80">{subtitle}</p>
            ) : null}
          </div>
          {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </header>
      ) : null}
      <div className={cn(dense ? "p-3" : "px-4 py-4", bodyClassName)}>{children}</div>
    </section>
  );
}