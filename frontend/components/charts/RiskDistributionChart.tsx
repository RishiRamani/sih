"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { RiskDistributionBucket } from "@/lib/types";
import { RISK_LABEL } from "@/lib/utils";

const COLORS: Record<string, string> = {
  LOW: "#4FB3B3",
  MEDIUM: "#D99B37",
  HIGH: "#E05A5E",
  CRITICAL: "#B23A3E"
};

export function RiskDistributionChart({ data }: { data: RiskDistributionBucket[] }) {
  const chartData = data.map((d) => ({ name: RISK_LABEL[d.level], level: d.level, count: d.count }));
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--color-border))" vertical={false} />
        <XAxis dataKey="name" tick={{ fill: "rgb(var(--color-text-secondary))", fontSize: 12 }} axisLine={{ stroke: "rgb(var(--color-border))" }} tickLine={false} />
        <YAxis allowDecimals={false} tick={{ fill: "rgb(var(--color-text-secondary))", fontSize: 12 }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{
            background: "rgb(var(--color-elevated))",
            border: "1px solid rgb(var(--color-border))",
            borderRadius: 6,
            fontSize: 12,
            color: "rgb(var(--color-text-primary))"
          }}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {chartData.map((entry) => (
            <Cell key={entry.level} fill={COLORS[entry.level]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
