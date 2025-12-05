'use client';

import clsx from "clsx";
import type { PropsWithChildren } from "react";

type Variant = "neutral" | "success" | "danger" | "warning";

const colors: Record<Variant, string> = {
  neutral: "bg-zinc-100 text-zinc-800",
  success: "bg-emerald-100 text-emerald-800",
  danger: "bg-rose-100 text-rose-800",
  warning: "bg-amber-100 text-amber-800",
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
