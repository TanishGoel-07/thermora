import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function riskColor(category?: string | null): string {
  const c = category?.toLowerCase() ?? "";
  if (c.includes("extreme")) return "#DC2626"; // Deep Red
  if (c.includes("very high") || c.includes("critical")) return "#EF4444"; // Red
  if (c.includes("danger") || c.includes("high")) return "#F97316"; // Orange
  if (c.includes("caution") || c.includes("moderate") || c.includes("elevated")) return "#F59E0B"; // Amber
  return "#10B981"; // Emerald Green
}

export function riskTextClass(category?: string | null): string {
  const c = category?.toLowerCase() ?? "";
  if (c.includes("extreme")) return "text-risk-extreme";
  if (c.includes("very high") || c.includes("critical")) return "text-risk-veryhigh";
  if (c.includes("danger") || c.includes("high")) return "text-risk-high";
  if (c.includes("caution") || c.includes("moderate") || c.includes("elevated")) return "text-risk-moderate";
  return "text-risk-low";
}

export function riskBgClass(category?: string | null): string {
  const c = category?.toLowerCase() ?? "";
  if (c.includes("extreme")) return "bg-red-950/70 border-red-500/50 text-red-400";
  if (c.includes("very high") || c.includes("critical")) return "bg-rose-950/70 border-rose-500/50 text-rose-400";
  if (c.includes("danger") || c.includes("high")) return "bg-orange-950/70 border-orange-500/50 text-orange-400";
  if (c.includes("caution") || c.includes("moderate") || c.includes("elevated")) return "bg-amber-950/70 border-amber-500/50 text-amber-400";
  return "bg-emerald-950/70 border-emerald-500/50 text-emerald-400";
}

export function formatNumber(n: number | null | undefined, digits = 1): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return n.toFixed(digits);
}
