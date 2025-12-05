'use client';

import clsx from "clsx";
import type { PropsWithChildren } from "react";

type Props = PropsWithChildren<{
  title?: string;
  className?: string;
  footer?: React.ReactNode;
}>;

export const Card = ({ title, children, className, footer }: Props) => (
  <div className={clsx("rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm", className)}>
    {title ? <h3 className="mb-3 text-sm font-semibold text-zinc-900">{title}</h3> : null}
    <div className="space-y-3">{children}</div>
    {footer ? <div className="mt-4 border-t border-zinc-100 pt-3 text-xs text-zinc-500">{footer}</div> : null}
  </div>
);
