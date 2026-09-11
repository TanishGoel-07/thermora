import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ReticleCorner } from "./DoodleAccents";

export function Panel({
  title,
  subtitle,
  eyebrow,
  action,
  icon,
  ticks = false,
  className,
  bodyClassName,
  children,
  hoverLift = true,
}: {
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  action?: ReactNode;
  icon?: ReactNode;
  ticks?: boolean;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
  hoverLift?: boolean;
}) {
  return (
    <div
      className={cn(
        "panel relative flex flex-col group",
        hoverLift && "hover:border-base-700 hover:shadow-glow/10 transition-all duration-300",
        className
      )}
    >
      {ticks && <ReticleCorner />}
      {(title || action || eyebrow) && (
        <div className="panel-header items-center">
          <div className="flex items-center gap-2.5 min-w-0">
            {icon && (
              <span className="grid w-7 h-7 shrink-0 place-items-center rounded-md bg-base-800/80 text-ember-400 border border-base-700/60 shadow-sm">
                {icon}
              </span>
            )}
            <div className="min-w-0">
              {eyebrow && <p className="mono-label mb-0.5 text-ember-400/90">{eyebrow}</p>}
              {title && (
                <h3 className="text-sm font-semibold text-slate-100 tracking-tight flex items-center gap-2">
                  {title}
                </h3>
              )}
              {subtitle && <p className="text-xs text-slate-400/80 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {action && <div className="shrink-0 ml-3">{action}</div>}
        </div>
      )}
      <div className={cn("flex-1 min-h-0", bodyClassName)}>{children}</div>
    </div>
  );
}

export function SectionHeading({
  index,
  label,
  hint,
}: {
  index: string;
  label: string;
  hint?: string;
}) {
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="mono-label px-2 py-0.5 rounded bg-ember-500/10 border border-ember-500/30 text-ember-400 font-bold">
        {index}
      </span>
      <h2 className="font-display text-sm uppercase tracking-wider font-semibold text-slate-200">
        {label}
      </h2>
      <span className="h-px flex-1 bg-gradient-to-r from-base-700/80 to-transparent" />
      {hint && (
        <span className="mono-label hidden text-slate-400/70 sm:block">
          {hint}
        </span>
      )}
    </div>
  );
}
