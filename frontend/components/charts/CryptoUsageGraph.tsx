// components/charts/CryptoUsageGraph.tsx
"use client";

import { useMemo, useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import type { Finding, RiskLevel } from "@/lib/types";
import { buildCryptoGraph, type GraphNode } from "@/lib/graph";
import { cn, RISK_LABEL } from "@/lib/utils";
import { useRouter } from "next/navigation";

const RISK_COLOR: Record<RiskLevel, string> = {
  LOW: "text-teal",
  MEDIUM: "text-accent",
  HIGH: "text-crimson",
  CRITICAL: "text-crimson",
};

const RISK_DOT: Record<RiskLevel, string> = {
  LOW: "bg-teal",
  MEDIUM: "bg-accent",
  HIGH: "bg-crimson",
  CRITICAL: "bg-crimson",
};

interface Props {
  findings: Finding[];
  scanId: string;
  rootLabel: string;
  groupBy?: "sourcePath" | "library";
}

export function CryptoUsageGraph({
  findings,
  scanId,
  rootLabel,
  groupBy = "sourcePath",
}: Props) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const graph = useMemo(
    () => buildCryptoGraph(findings, { rootLabel, groupBy }),
    [findings, rootLabel, groupBy]
  );

  function toggle(id: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="font-mono text-[13px] leading-[1.9]">
      <TreeNode
        node={graph}
        collapsed={collapsed}
        onToggle={toggle}
        onSelectFinding={(id) => router.push(`/scans/${scanId}/findings/${id}`)}
        isRoot
      />
    </div>
  );
}

function TreeNode({
  node,
  collapsed,
  onToggle,
  onSelectFinding,
  isRoot = false,
}: {
  node: GraphNode;
  collapsed: Set<string>;
  onToggle: (id: string) => void;
  onSelectFinding: (id: string) => void;
  isRoot?: boolean;
}) {
  const isCollapsed = collapsed.has(node.id);
  const hasChildren = node.children.length > 0;

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-2 rounded px-1.5 py-0.5 transition-colors",
          hasChildren && "cursor-pointer hover:bg-elevated/60"
        )}
        onClick={() => hasChildren && onToggle(node.id)}
      >
        <span className="flex h-4 w-4 shrink-0 items-center justify-center text-text-secondary">
          {hasChildren ? (
            isCollapsed ? (
              <ChevronRight size={12} />
            ) : (
              <ChevronDown size={12} />
            )
          ) : (
            <span className="text-text-secondary/40">·</span>
          )}
        </span>

        {node.riskLevel ? (
          <span
            className={cn("h-1.5 w-1.5 shrink-0 rounded-full", RISK_DOT[node.riskLevel])}
            title={RISK_LABEL[node.riskLevel]}
          />
        ) : null}

        <span
          className={cn(
            "truncate",
            isRoot
              ? "font-semibold text-text-primary"
              : node.depth === 1
                ? "text-text-primary"
                : node.depth === 2
                  ? "text-text-primary/90"
                  : "text-text-secondary"
          )}
        >
          {node.label}
        </span>

        {node.sublabel ? (
          <span className="text-text-secondary/70"> {node.sublabel}</span>
        ) : null}

        {node.findingCount > 1 ? (
          <span className="ml-auto shrink-0 rounded-sm bg-elevated px-1.5 py-[1px] text-[10px] text-text-secondary">
            ×{node.findingCount}
          </span>
        ) : null}
      </div>

      {hasChildren && !isCollapsed ? (
        <div className="ml-[7px] border-l border-border/70 pl-3.5">
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              collapsed={collapsed}
              onToggle={onToggle}
              onSelectFinding={onSelectFinding}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}