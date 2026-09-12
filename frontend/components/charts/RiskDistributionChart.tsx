"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { RiskDistributionBucket } from "@/lib/types";
import { RISK_LABEL } from "@/lib/utils";

const COLORS: Record<string, string> = {
  LOW:      "#7FA38A",   // sage
  MEDIUM:   "#D6A84F",   // antique gold
  HIGH:     "#B86B52",   // terracotta
  CRITICAL: "#8E3F35"    // deep terracotta
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
  cursor={{ fill: "rgb(var(--color-elevated))", opacity: 0.6 }}
  contentStyle={{
    background: "rgb(var(--color-elevated))",
    border: "1px solid rgb(var(--color-border))",
    borderRadius: 4,
    fontSize: 12,
    color: "rgb(var(--color-text-primary))",
    boxShadow: "0 4px 12px rgb(0 0 0 / 0.3)"
  }}
  labelStyle={{ color: "rgb(var(--color-text-secondary))", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}
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
