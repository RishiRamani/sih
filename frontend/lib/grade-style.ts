import type { Grade } from "@/lib/grade";

export interface GradeStyle {
  /** Hex used for the grade letter and the border */
  hex: string;
  /** Tailwind text class (uses CSS vars where possible for theme support) */
  text: string;
  /** Tailwind border class */
  border: string;
  /** Tailwind background tint class */
  bg: string;
  /** Human label */
  label: string;
}

/**
 * Six-tier grade palette.
 * Colors are hardcoded hexes so they match the SIH spec sheet exactly.
 * Inline style is used for the letter so the hex is preserved regardless
 * of the Tailwind theme.
 */
export const GRADE_STYLE: Record<Grade, GradeStyle> = {
  A: {
    hex: "#22C55E",
    text: "text-[#22C55E]",
    border: "border-[#22C55E]/50",
    bg: "bg-[#22C55E]/8",
    label: "Safe",
  },
  B: {
    hex: "#3B82F6",
    text: "text-[#3B82F6]",
    border: "border-[#3B82F6]/50",
    bg: "bg-[#3B82F6]/8",
    label: "Low risk",
  },
  C: {
    hex: "#EAB308",
    text: "text-[#EAB308]",
    border: "border-[#EAB308]/50",
    bg: "bg-[#EAB308]/8",
    label: "Moderate",
  },
  D: {
    hex: "#F97316",
    text: "text-[#F97316]",
    border: "border-[#F97316]/55",
    bg: "bg-[#F97316]/10",
    label: "Elevated",
  },
  E: {
    hex: "#EF4444",
    text: "text-[#EF4444]",
    border: "border-[#EF4444]/60",
    bg: "bg-[#EF4444]/12",
    label: "High risk",
  },
  F: {
    hex: "#B91C1C",
    text: "text-[#B91C1C]",
    border: "border-[#B91C1C]/70",
    bg: "bg-[#B91C1C]/15",
    label: "Critical",
  },
};

/** Ordered list, worst to best, for range checks */
export const GRADE_ORDER: Grade[] = ["F", "E", "D", "C", "B", "A"];

/** Rank: higher = better */
export const GRADE_RANK: Record<Grade, number> = {
  F: 0,
  E: 1,
  D: 2,
  C: 3,
  B: 4,
  A: 5,
};