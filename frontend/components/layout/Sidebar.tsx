"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ScanLine,
  PlusCircle,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/scans", label: "Scans", icon: ScanLine },
  { href: "/scans/new", label: "New scan", icon: PlusCircle }
];

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      {/* Folio header — logotype as the mark, no shield icon */}
      <div className="border-b border-border px-5 py-5">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-[15px] font-semibold tracking-[0.15em] text-accent">
            ECDAT
          </span>
        </div>
        <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.14em] text-text-secondary">
          Cryptographic Inventory
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2.5 py-3">
        <p className="px-2.5 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-text-secondary/70">
          Workspace
        </p>
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/scans"
                ? pathname.startsWith("/scans") && pathname !== "/scans/new"
                : pathname === item.href;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "relative flex items-center gap-2.5 rounded px-2.5 py-2 text-[13px] font-medium transition-colors",
                    isActive
                      ? "bg-accent/8 text-accent before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-[2px] before:rounded-full before:bg-accent"
                      : "text-text-secondary hover:bg-elevated/60 hover:text-text-primary"
                  )}
                >
                  <item.icon size={15} strokeWidth={2} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Colophon */}
      <div className="border-t border-border px-5 py-3">
        <p className="text-[10px] font-medium uppercase tracking-[0.11em] text-text-secondary/70">
          SIH26164
        </p>
        <p className="mt-0.5 text-[10px] text-text-secondary/60">
          Enterprise Cryptographic Discovery &amp; Analysis
        </p>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 border-r border-border bg-surface md:block">
      <SidebarContent />
    </aside>
  );
}

export function MobileSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 md:hidden">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-hidden
      />
      <div className="absolute inset-y-0 left-0 w-64 border-r border-border bg-surface shadow-panel">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded text-text-secondary hover:bg-elevated hover:text-text-primary"
          aria-label="Close navigation"
        >
          <X size={16} />
        </button>
        <SidebarContent onNavigate={onClose} />
      </div>
    </div>
  );
}