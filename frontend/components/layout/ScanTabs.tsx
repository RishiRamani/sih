"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import type { Scan } from "@/lib/types";
import { cn } from "@/lib/utils";
import { RescanButton } from "@/components/layout/RescanButton";

export function ScanTabs({ scanId }: { scanId: string }) {
  const pathname = usePathname();
  const [scan, setScan] = useState<Scan | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .getScan(scanId)
      .then((s) => {
        if (!cancelled) setScan(s);
      })
      .catch(() => {
        if (!cancelled) setScan(null);
      });
    return () => {
      cancelled = true;
    };
  }, [scanId]);

  const tabs = [
    { href: `/scans/${scanId}/progress`, label: "Progress" },
    { href: `/scans/${scanId}/findings`, label: "Findings" },
    { href: `/scans/${scanId}/cbom`, label: "Inventory / CBOM" },
    { href: `/scans/${scanId}/graph`, label: "Usage graph" },
    { href: `/scans/${scanId}/risk`, label: "Risk & readiness" },
    { href: `/scans/${scanId}/recommendations`, label: "Recommendations" },
  ];

  return (
    <div className="mb-5 flex items-center gap-1 overflow-x-auto border-b border-border">
      {tabs.map((tab) => {
        const active = pathname === tab.href || pathname.startsWith(tab.href + "/");
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "border-accent text-accent"
                : "border-transparent text-text-secondary hover:text-text-primary"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
      {scan && scan.status === "COMPLETED" ? (
        <div className="ml-auto pl-3">
          <RescanButton scan={scan} variant="ghost" label="Rescan & compare" />
        </div>
      ) : null}
    </div>
  );
}