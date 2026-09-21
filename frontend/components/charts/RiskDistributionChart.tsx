"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { RiskDistributionBucket, ExposureBucket } from "@/lib/types";
import { RISK_LABEL } from "@/lib/utils";

type ChartBucket = RiskDistributionBucket | ExposureBucket;

function isExposureBucket(b: ChartBucket): b is ExposureBucket {
  return "status" in b;
}

function readVar(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return raw ? `rgb(${raw})` : fallback;
}

const FALLBACK = {
  safe:     "rgb(94 140 114)",
  amber:    "rgb(194 148 62)",
  orange:   "rgb(183 101 81)",
  danger:   "rgb(145 61 61)",
  border:   "rgb(220 225 228)",
  tick:     "rgb(100 113 125)",
  elevated: "rgb(255 255 255)",
  text:     "rgb(24 33 42)",
};

export function RiskDistributionChart({ data }: { data: ChartBucket[] }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const obs = new MutationObserver(() => setTick((t) => t + 1));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  const colors: Record<string, string> = {
    // RiskLevel keys
    LOW:      readVar("--color-safe",   FALLBACK.safe),
    MEDIUM:   readVar("--color-amber",  FALLBACK.amber),
    HIGH:     readVar("--color-orange", FALLBACK.orange),
    CRITICAL: readVar("--color-danger", FALLBACK.danger),
    // ExposureStatus keys
    SAFE:       readVar("--color-safe",   FALLBACK.safe),
    WEAK:       readVar("--color-amber",  FALLBACK.amber),
    BROKEN:     readVar("--color-danger", FALLBACK.danger),
    DEPRECATED: readVar("--color-orange", FALLBACK.orange),
    UNKNOWN:    readVar("--color-border", FALLBACK.border),
  };

  const chartData = data.map((bucket) => {
    const key = isExposureBucket(bucket) ? bucket.status : bucket.level;
    return {
      name: RISK_LABEL[key] ?? key,
      level: key,
      count: bucket.count,
    };
  });

  const GRID = readVar("--color-border",         FALLBACK.border);
  const TICK = readVar("--color-text-secondary", FALLBACK.tick);
  const BG   = readVar("--color-elevated",       FALLBACK.elevated);
  const FG   = readVar("--color-text-primary",   FALLBACK.text);

  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: TICK, fontSize: 12 }}
            axisLine={{ stroke: GRID }}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: TICK, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "transparent" }}
            contentStyle={{
              background: BG,
              border: `1px solid ${GRID}`,
              borderRadius: 4,
              fontSize: 12,
              color: FG,
            }}
            labelStyle={{
              color: TICK,
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          />
          <Bar
            dataKey="count"
            isAnimationActive={false}
            shape={(props: any) => {
              const { x, y, width, height, payload } = props;
              const fill = colors[payload?.level] ?? FALLBACK.safe;
              return (
                <rect
                  x={x}
                  y={y}
                  width={width}
                  height={height}
                  rx={4}
                  ry={4}
                  fill={fill}
                />
              );
            }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}