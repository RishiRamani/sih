"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ScanLine, PlusCircle, ShieldCheck, X } from "lucide-react";
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
      <div className="flex items-center gap-2 border-b border-border px-4 py-4">
        <span className="flex h-8 w-8 items-center justify-center rounded bg-accent/15 text-accent">
          <ShieldCheck size={18} strokeWidth={2.2} />
        </span>
        <div className="leading-tight">
          <div className="text-sm font-semibold text-text-primary">ECDAT</div>
          <div className="text-[11px] text-text-secondary">Crypto Discovery &amp; Analysis</div>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 px-2 py-3">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/scans"
              ? pathname.startsWith("/scans") && pathname !== "/scans/new"
              : pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2.5 rounded px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent/10 text-accent"
                  : "text-text-secondary hover:bg-elevated hover:text-text-primary"
              )}
            >
              <item.icon size={16} strokeWidth={2} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border px-4 py-3 text-[11px] text-text-secondary">
        SIH26164 · Enterprise Cryptographic Discovery &amp; Analysis Tool
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
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute inset-y-0 left-0 w-64 bg-surface shadow-panel">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded text-text-secondary hover:bg-elevated"
          aria-label="Close navigation"
        >
          <X size={16} />
        </button>
        <SidebarContent onNavigate={onClose} />
      </div>
    </div>
  );
}
