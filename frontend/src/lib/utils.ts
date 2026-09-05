import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function riskColor(category: string): string {
  const c = category?.toLowerCase() ?? "";
  if (c.includes("extreme")) return "#EB5757";
  if (c.includes("danger")) return "#F2994A";
  if (c.includes("caution")) return "#F2C94C";
  return "#3ADB8A";
}

export function riskTextClass(category: string): string {
  const c = category?.toLowerCase() ?? "";
  if (c.includes("extreme")) return "text-risk-extreme";
  if (c.includes("danger")) return "text-risk-danger";
  if (c.includes("caution")) return "text-risk-caution";
  return "text-risk-safe";
}

export function formatNumber(n: number | null | undefined, digits = 1): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return n.toFixed(digits);
}
