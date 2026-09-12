"use client";

import { Menu, Moon, Sun, FlaskConical } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";
import { isMockApi } from "@/lib/api";

export function TopBar({ onMenuClick, title }: { onMenuClick: () => void; title?: string }) {
  const { theme, toggleTheme } = useTheme();
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-surface px-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="flex h-8 w-8 items-center justify-center rounded text-text-secondary hover:bg-elevated md:hidden"
          aria-label="Open navigation"
        >
          <Menu size={18} />
        </button>
        {title ? <h1 className="text-sm font-semibold text-text-primary">{title}</h1> : null}
      </div>
      <div className="flex items-center gap-2">
        {isMockApi ? (
          <span className="hidden items-center gap-1.5 rounded border border-amber/30 bg-amber/10 px-2 py-1 text-xs font-medium text-amber sm:flex">
            <FlaskConical size={12} />
            Test API — mock data
          </span>
        ) : null}
        <button
          onClick={toggleTheme}
          className="flex h-8 w-8 items-center justify-center rounded border border-border text-text-secondary hover:bg-elevated"
          aria-label="Toggle color theme"
        >
          {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </div>
    </header>
  );
}
