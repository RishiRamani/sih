"use client";

import { AppNav } from "@/components/layout/AppNav";

export function AppShell({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-base">
      <AppNav />
      <main className="flex-1">
        <div className="mx-auto max-w-[1400px] px-6 py-8 md:px-8 md:py-10">
          {title ? (
            <div className="mb-8">
              <p className="eyebrow">{title}</p>
            </div>
          ) : null}
          {children}
        </div>
      </main>
      <footer className="border-t border-rule">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4 md:px-8">
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-text-dim">
            Qrypta · SIH26164
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-text-dim">
            build v1.2.6
          </span>
        </div>
      </footer>
    </div>
  );
}