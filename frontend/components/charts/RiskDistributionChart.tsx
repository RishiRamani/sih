"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { RiskDistributionBucket } from "@/lib/types";
import { RISK_LABEL } from "@/lib/utils";

const COLORS: Record<string, string> = {
  LOW:      "#5E8C72",   // muted green
  MEDIUM:   "#C2943E",   // muted amber
  HIGH:     "#B76551",   // muted orange-red
  CRITICAL: "#913D3D",   // dark red
};

export function RiskDistributionChart({ data }: { data: RiskDistributionBucket[] }) {
  const chartData = data.map((d) => ({ name: RISK_LABEL[d.level], level: d.level, count: d.count }));
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#DCE1E4" vertical={false} />
<XAxis dataKey="name" tick={{ fill: "#64717D", fontSize: 12 }} axisLine={{ stroke: "#DCE1E4" }} tickLine={false} />
<YAxis allowDecimals={false} tick={{ fill: "#64717D", fontSize: 12 }} axisLine={false} tickLine={false} />
<Tooltip
  cursor={{ fill: "#E5F1F0", opacity: 0.6 }}
  contentStyle={{
    background: "#FFFFFF",
    border: "1px solid #DCE1E4",
    borderRadius: 4,
    fontSize: 12,
    color: "#18212A",
    boxShadow: "0 4px 12px rgb(0 0 0 / 0.08)"
  }}
  labelStyle={{ color: "#64717D", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}
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
