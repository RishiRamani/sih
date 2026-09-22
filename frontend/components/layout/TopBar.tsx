"use client";

import { Menu, Moon, Sun, FlaskConical } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";

export function TopBar({
  onMenuClick,
  title,
}: {
  onMenuClick: () => void;
  title?: string;
}) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-surface px-4 md:px-5">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="flex h-8 w-8 items-center justify-center rounded text-text-secondary hover:bg-elevated md:hidden"
          aria-label="Open navigation"
        >
          <Menu size={18} />
        </button>
        {title ? (
          <h1 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-text-secondary">
            {title}
          </h1>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
       

        <button
          type="button"
          onClick={toggleTheme}
          className="flex h-8 w-8 items-center justify-center rounded border border-border bg-elevated text-text-primary transition-colors hover:border-accent/50 hover:text-accent"
          aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
        >
          {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </div>
    </header>
  );
}