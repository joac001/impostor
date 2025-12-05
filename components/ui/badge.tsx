'use client';

import clsx from "clsx";
import type { PropsWithChildren } from "react";

type Variant = "neutral" | "success" | "danger" | "warning" | "primary";

const colors: Record<Variant, string> = {
  neutral: "bg-slate-700 text-slate-200",
  success: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
  danger: "bg-rose-500/20 text-rose-400 border border-rose-500/30",
  warning: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
  primary: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
};

type Props = PropsWithChildren<{ variant?: Variant; className?: string }>;

export const Badge = ({ children, variant = "neutral", className }: Props) => (
  <span
    className={clsx(
      "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold",
      colors[variant],
      className,
    )}
  >
    {children}
  </span>
);
