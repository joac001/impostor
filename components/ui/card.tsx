'use client';

import clsx from "clsx";
import type { PropsWithChildren } from "react";

type Props = PropsWithChildren<{
  title?: string;
  className?: string;
  footer?: React.ReactNode;
}>;

export const Card = ({ title, children, className, footer }: Props) => (
  <div className={clsx("rounded-2xl border border-slate-700/50 bg-slate-800/50 p-4 shadow-xl backdrop-blur-sm", className)}>
    {title ? <h3 className="mb-3 text-sm font-semibold text-emerald-400">{title}</h3> : null}
    <div className="space-y-3">{children}</div>
    {footer ? <div className="mt-4 border-t border-slate-700/50 pt-3 text-xs text-slate-400">{footer}</div> : null}
  </div>
);
