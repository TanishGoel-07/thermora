import { cn, riskColor } from "@/lib/utils";

const styles: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  safe: {
    bg: "bg-emerald-950/60",
    text: "text-emerald-400",
    border: "border-emerald-500/40",
    glow: "rgba(16, 185, 129, 0.4)",
  },
  caution: {
    bg: "bg-amber-950/60",
    text: "text-amber-400",
    border: "border-amber-500/40",
    glow: "rgba(245, 158, 11, 0.4)",
  },
  danger: {
    bg: "bg-orange-950/60",
    text: "text-orange-400",
    border: "border-orange-500/40",
    glow: "rgba(249, 115, 22, 0.4)",
  },
  veryhigh: {
    bg: "bg-rose-950/70",
    text: "text-rose-400",
    border: "border-rose-500/50",
    glow: "rgba(239, 68, 68, 0.5)",
  },
  extreme: {
    bg: "bg-red-950/80",
    text: "text-red-400",
    border: "border-red-500/60",
    glow: "rgba(220, 38, 38, 0.6)",
  },
};

function normalizeSeverity(label: string): keyof typeof styles {
  const l = (label ?? "").toLowerCase();
  if (l.includes("extreme")) return "extreme";
  if (l.includes("very high") || l.includes("critical")) return "veryhigh";
  if (l.includes("danger") || l.includes("high")) return "danger";
  if (l.includes("caution") || l.includes("moderate") || l.includes("elevated")) return "caution";
  return "safe";
}

export function SeverityBadge({
  label,
  className,
  withDot = true,
}: {
  label: string;
  className?: string;
  withDot?: boolean;
}) {
  const key = normalizeSeverity(label);
  const cfg = styles[key];
  const isHighSeverity = key === "extreme" || key === "veryhigh" || key === "danger";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-mono font-medium tracking-wide uppercase shadow-sm transition-all",
        cfg.bg,
        cfg.text,
        cfg.border,
        className
      )}
    >
      {withDot && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full shrink-0",
            isHighSeverity ? "animate-pulse" : ""
          )}
          style={{
            backgroundColor: "currentColor",
            boxShadow: isHighSeverity ? `0 0 6px ${cfg.glow}` : undefined,
          }}
        />
      )}
      <span>{label}</span>
    </span>
  );
}
