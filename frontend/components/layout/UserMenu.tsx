"use client";

import { useEffect, useRef, useState } from "react";
import { LogOut, User as UserIcon } from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import { cn } from "@/lib/utils";

export function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (!user) return null;

  const initials = user.email.slice(0, 2).toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-8 items-center gap-2 rounded border border-border bg-surface px-2 text-[12px] text-text-secondary transition-colors hover:border-accent/50 hover:bg-accent-soft hover:text-accent",
          open && "border-accent/50 bg-accent-soft text-accent"
        )}
        aria-label="Account menu"
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-sm bg-accent/15 font-mono text-[10px] font-semibold text-accent">
          {initials}
        </span>
        <span className="hidden max-w-[140px] truncate md:inline">
          {user.email}
        </span>
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-40 mt-1 w-64 overflow-hidden rounded border border-border bg-surface shadow-panel">
          <div className="border-b border-border px-3 py-3">
            <div className="flex items-center gap-2">
              <UserIcon size={14} className="text-text-secondary" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.11em] text-text-secondary">
                Signed in
              </span>
            </div>
            <p className="mt-1.5 truncate text-sm font-medium text-text-primary">
              {user.email}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              logout();
            }}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-text-secondary transition-colors hover:bg-crimson/8 hover:text-crimson"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}