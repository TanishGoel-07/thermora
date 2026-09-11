import { cn } from "@/lib/utils";

export function ReticleCorner({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none absolute inset-0", className)}>
      <span className="absolute left-1.5 top-1.5 w-2 h-2 border-l border-t border-ember-500/40" />
      <span className="absolute right-1.5 top-1.5 w-2 h-2 border-r border-t border-ember-500/40" />
      <span className="absolute left-1.5 bottom-1.5 w-2 h-2 border-l border-b border-ember-500/40" />
      <span className="absolute right-1.5 bottom-1.5 w-2 h-2 border-r border-b border-ember-500/40" />
    </div>
  );
}

export function IsothermContourSvg({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("pointer-events-none opacity-15", className)}
      aria-hidden="true"
    >
      <path
        d="M 10,60 Q 60,10 110,70 T 190,50"
        stroke="currentColor"
        strokeWidth="1"
        strokeDasharray="4 3"
      />
      <path
        d="M 10,80 Q 70,30 120,90 T 190,70"
        stroke="currentColor"
        strokeWidth="1"
      />
      <path
        d="M 10,100 Q 80,50 130,110 T 190,90"
        stroke="currentColor"
        strokeWidth="0.75"
        strokeDasharray="2 2"
      />
      <circle cx="110" cy="70" r="2.5" fill="currentColor" />
      <circle cx="60" cy="10" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function RadarScanBackdrop({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 bg-radar-grid opacity-30",
        className
      )}
    />
  );
}
