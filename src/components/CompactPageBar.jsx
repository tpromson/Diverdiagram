import React from "react";
import { MoreHorizontal } from "lucide-react";
import { surfaceButtonClass } from "./actions.jsx";

export function MobileOverflowMenu({ label, children }) {
  return (
    <details className="relative md:hidden">
      <summary
        data-testid="mobile-overflow-button"
        className={`inline-flex list-none items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold marker:content-none [&::-webkit-details-marker]:hidden ${surfaceButtonClass}`}
      >
        <MoreHorizontal size={16} /> {label}
      </summary>
      <div className="absolute right-0 z-30 mt-2 flex min-w-[240px] flex-col gap-2 rounded-[24px] border border-slate-200 bg-white p-3 shadow-lg ring-1 ring-slate-200/80">
        {children}
      </div>
    </details>
  );
}

export function CompactPageBar({
  eyebrow,
  title,
  titleSuffix = null,
  mobileOverflowLabel = "More",
  mobilePrimary = null,
  desktopPrimary = null,
  desktopSecondary = null,
  mobileOverflow = null,
  supportingContent = null,
}) {
  return (
    <header className="sticky top-3 z-40 rounded-[24px] border border-slate-200 bg-white/95 px-3 py-3 shadow-sm ring-1 ring-slate-200/80 backdrop-blur">
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{eyebrow}</div>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h1 className="truncate text-lg font-bold tracking-tight text-slate-950 sm:text-xl">{title}</h1>
              {titleSuffix}
            </div>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            {desktopSecondary ? (
              <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-2 py-2">
                {desktopSecondary}
              </div>
            ) : null}
            {desktopPrimary ? <div className="inline-flex items-center gap-2">{desktopPrimary}</div> : null}
          </div>
          {(mobilePrimary || mobileOverflow) ? (
            <div className="flex items-center gap-2 md:hidden">
              {mobilePrimary}
              {mobileOverflow ? <MobileOverflowMenu label={mobileOverflowLabel}>{mobileOverflow}</MobileOverflowMenu> : null}
            </div>
          ) : null}
        </div>
        {supportingContent}
      </div>
    </header>
  );
}
