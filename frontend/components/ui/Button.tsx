import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

interface BaseProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
}

const base =
  "inline-flex items-center justify-center gap-2 rounded font-semibold tracking-[0.01em] " +
  "transition-colors focus-visible:outline-2 focus-visible:outline-accent " +
  "focus-visible:outline-offset-2 disabled:opacity-60 disabled:cursor-not-allowed";

const variants: Record<Variant, string> = {
  primary:
    "border border-accent bg-accent text-base hover:bg-accent/90",
  secondary:
    "border border-border bg-elevated text-text-primary hover:border-accent/50 hover:bg-elevated/80",
  ghost:
    "border border-transparent bg-transparent text-text-secondary hover:bg-elevated/60 hover:text-text-primary",
  danger:
    "border border-crimson bg-crimson text-base hover:bg-crimson/90"
};

const sizes: Record<Size, string> = {
  sm: "px-2.5 py-1.5 text-[12px]",
  md: "px-3.5 py-2 text-[13px]"
};

export function buttonClasses(
  variant: Variant = "primary",
  size: Size = "md",
  className?: string
) {
  return cn(base, variants[variant], sizes[size], className);
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: BaseProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={buttonClasses(variant, size, className)} {...rest}>
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: BaseProps & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a className={buttonClasses(variant, size, className)} {...rest}>
      {children}
    </a>
  );
}