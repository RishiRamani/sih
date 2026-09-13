"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ScanLine,
  PlusCircle,
  Moon,
  Sun,
  FlaskConical,
  Activity,
} from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";
import { isMockApi } from "@/lib/api";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/scans", label: "Scans", icon: ScanLine },
  { href: "/scans/new", label: "New scan", icon: PlusCircle },
];

export function AppNav() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  const isItemActive = (href: string) =>
    href === "/scans"
      ? pathname.startsWith("/scans") && pathname !== "/scans/new"
      : pathname === href;

  return (
    <header className="sticky top-0 z-30 border-b border-rule bg-surface">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center px-6 md:px-8">
        {/* Brand */}
        <Link href="/dashboard" className="flex shrink-0 items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded border border-accent/40 bg-accent-soft">
            <span className="h-2 w-2 rounded-full bg-accent pulse-accent" />
          </span>
          <div className="flex flex-col leading-none">
            <span className="font-mono text-[15px] font-semibold tracking-[0.18em] text-text-primary">
              ECDAT
            </span>
            <span className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.2em] text-text-secondary">
              Cryptographic Inventory
            </span>
          </div>
        </Link>

        <nav className="ml-10 hidden items-center gap-1 md:flex">
  {NAV_ITEMS.map((item, i) => {
    const active = isItemActive(item.href);
    const isPrimaryCta = item.href === "/scans/new";
    return (
      <div key={item.href} className="flex items-center">
        {i === 1 ? (
          <span className="mx-2 h-5 w-px bg-border" aria-hidden />
        ) : null}
        <Link
          href={item.href}
          aria-current={active ? "page" : undefined}
          className={cn(
            "relative flex h-16 items-center gap-2 px-3.5 text-[13px] font-medium transition-colors",
            isPrimaryCta
              ? "my-auto h-9 rounded bg-accent px-3.5 text-on-accent hover:bg-accent-bright"
              : active
                ? "text-accent"
                : "text-text-secondary hover:text-accent"
          )}
        >
          <item.icon size={14} strokeWidth={2} />
          <span>{item.label}</span>
          {!isPrimaryCta && active ? (
            <span className="absolute inset-x-2 bottom-0 h-[2px] bg-accent" />
          ) : null}
        </Link>
      </div>
    );
  })}
</nav>

        {/* Right cluster */}
        <div className="ml-auto flex items-center gap-3">
          {isMockApi ? (
            <span className="hidden items-center gap-1.5 rounded border border-amber/40 bg-amber-soft px-2.5 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.15em] text-amber sm:inline-flex">
              <FlaskConical size={10} />
              Mock
            </span>
          ) : (
            <span className="hidden items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.15em] text-text-secondary sm:inline-flex">
              <Activity size={10} className="text-safe" />
              Live
            </span>
          )}

          <span className="hidden h-5 w-px bg-border sm:block" />

          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-8 w-8 items-center justify-center rounded border border-border bg-surface text-text-secondary transition-colors hover:border-accent/50 hover:bg-accent-soft hover:text-accent"
            aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            title={theme === "dark" ? "Light mode" : "Dark mode"}
          >
            {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>
      </div>

      {/* Mobile nav row */}
      <nav className="flex items-center gap-1 border-t border-border px-4 py-2 md:hidden">
        {NAV_ITEMS.map((item) => {
          const active = isItemActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap rounded px-2.5 py-1.5 text-[11px] font-medium",
                active ? "bg-accent-soft text-accent" : "text-text-secondary"
              )}
            >
              <item.icon size={12} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}