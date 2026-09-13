"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ScanLine, PlusCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", code: "01", icon: LayoutDashboard },
  { href: "/scans", label: "Scans", code: "02", icon: ScanLine },
  { href: "/scans/new", label: "New scan", code: "03", icon: PlusCircle },
];

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      {/* Mark */}
      <div className="border-b border-rule px-5 py-6">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-[17px] font-semibold tracking-[0.22em] text-accent">
            ECDAT
          </span>
        </div>
        <p className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.22em] text-text-dim">
          Cryptographic Inventory
        </p>
        <div className="mt-3 flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 pulse-accent rounded-full bg-accent" />
          <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-text-dim">
            system nominal
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5">
        <p className="px-2 pb-3 font-mono text-[9px] uppercase tracking-[0.2em] text-text-dim">
          ── workspace
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
                    "group flex items-center gap-3 border-l-2 px-3 py-2.5 font-mono text-[12px] transition-colors",
                    isActive
                      ? "border-accent bg-accent/8 text-accent"
                      : "border-transparent text-text-secondary hover:border-rule hover:bg-elevated/60 hover:text-text-primary"
                  )}
                >
                  <span className={cn(
                    "text-[9px] tracking-[0.1em]",
                    isActive ? "text-accent" : "text-text-dim"
                  )}>
                    {item.code}
                  </span>
                  <item.icon size={13} strokeWidth={2} />
                  <span className="uppercase tracking-[0.08em]">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Colophon */}
      <div className="border-t border-rule px-5 py-3">
        <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-text-dim">
          build v1.2.6
        </p>
        <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.15em] text-text-dim/70">
          SIH26164
        </p>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 border-r border-rule bg-surface md:block">
      <SidebarContent />
    </aside>
  );
}

export function MobileSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 md:hidden">
      <div className="absolute inset-0 bg-base/80 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="absolute inset-y-0 left-0 w-64 border-r border-rule bg-surface shadow-panel">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center text-text-secondary hover:text-text-primary"
          aria-label="Close navigation"
        >
          <X size={15} />
        </button>
        <SidebarContent onNavigate={onClose} />
      </div>
    </div>
  );
}