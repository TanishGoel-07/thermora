import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  safe: "bg-risk-safe/10 text-risk-safe border-risk-safe/30",
  caution: "bg-risk-caution/10 text-risk-caution border-risk-caution/30",
  danger: "bg-risk-danger/10 text-risk-danger border-risk-danger/30",
  extreme: "bg-risk-extreme/10 text-risk-extreme border-risk-extreme/30",
};

function severityKey(label: string): keyof typeof styles {
  const l = label?.toLowerCase() ?? "";
  if (l.includes("extreme")) return "extreme";
  if (l.includes("danger") || l.includes("high")) return "danger";
  if (l.includes("caution") || l.includes("moderate")) return "caution";
  return "safe";
}

export function SeverityBadge({ label, className }: { label: string; className?: string }) {
  const key = severityKey(label);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        styles[key],
        className
      )}
    >
      {label}
    </span>
  );
}
