'use client';

import clsx from "clsx";
import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement>;

export const Input = ({ className, ...rest }: Props) => (
  <input
    className={clsx(
      "w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-2.5 text-sm text-slate-100 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...rest}
  />
);
