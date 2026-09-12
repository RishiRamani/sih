"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function ScanTabs({ scanId }: { scanId: string }) {
  const pathname = usePathname();
  const tabs = [
    { href: `/scans/${scanId}/progress`, label: "Progress" },
    { href: `/scans/${scanId}/findings`, label: "Findings" },
    { href: `/scans/${scanId}/cbom`, label: "Inventory / CBOM" },
    { href: `/scans/${scanId}/risk`, label: "Risk & readiness" },
    { href: `/scans/${scanId}/recommendations`, label: "Recommendations" }
  ];
  return (
    <div className="mb-5 flex gap-1 overflow-x-auto border-b border-border">
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
    </div>
  );
}
