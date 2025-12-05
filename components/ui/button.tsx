'use client';

import clsx from "clsx";
import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "subtle" | "danger";
type ButtonSize = "sm" | "md" | "lg" | "full";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-emerald-500 text-white hover:bg-emerald-400 focus-visible:outline-emerald-500 shadow-lg shadow-emerald-500/25",
  secondary:
    "bg-slate-700 text-white hover:bg-slate-600 focus-visible:outline-slate-600",
  ghost:
    "border border-slate-600 text-slate-200 hover:bg-slate-800 hover:border-emerald-500/50 focus-visible:outline-slate-500",
  subtle: "bg-slate-800 text-slate-200 hover:bg-slate-700",
  danger:
    "bg-rose-600 text-white hover:bg-rose-500 focus-visible:outline-rose-600 shadow-lg shadow-rose-500/25",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-2 text-sm",
  md: "px-4 py-2.5 text-sm",
  lg: "px-5 py-3 text-base",
  full: "w-full px-4 py-2.5 text-sm",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export const Button = ({
  className,
  variant = "primary",
  size = "md",
  ...rest
}: Props) => (
  <button
    className={clsx(
      "inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]",
      variantClasses[variant],
      sizeClasses[size],
      className,
    )}
    {...rest}
  />
);
