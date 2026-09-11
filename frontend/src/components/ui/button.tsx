import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "xs" | "sm" | "md" | "lg";
  icon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", icon, children, disabled, ...props }, ref) => {
    const base =
      "relative inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember-500 disabled:opacity-50 disabled:pointer-events-none select-none active:scale-[0.98]";

    const variants: Record<string, string> = {
      primary:
        "bg-ember-gradient text-base-950 font-semibold shadow-glow hover:brightness-110 border border-ember-400/40",
      secondary:
        "bg-base-800 text-slate-200 hover:bg-base-750 hover:text-white border border-base-700/80 shadow-panel",
      outline:
        "bg-base-900/60 border border-base-700 text-slate-200 hover:border-ember-500/60 hover:text-ember-400 hover:bg-base-850/80",
      ghost:
        "text-slate-400 hover:text-slate-100 hover:bg-base-800/80",
      danger:
        "bg-red-950/80 text-red-300 border border-red-500/50 hover:bg-red-900/90 hover:text-white shadow-glow-danger",
    };

    const sizes: Record<string, string> = {
      xs: "text-[11px] px-2.5 py-1 rounded-md",
      sm: "text-xs px-3 py-1.5 rounded-md",
      md: "text-sm px-4 py-2",
      lg: "text-base px-5 py-2.5 rounded-xl",
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {icon && <span className="shrink-0 transition-transform group-hover:scale-110">{icon}</span>}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
