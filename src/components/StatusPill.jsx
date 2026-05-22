import React from "react";

export function StatusPill({ tone = "neutral", icon, children }) {
  const toneClass =
    tone === "success"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
      : tone === "info"
        ? "bg-blue-50 text-blue-700 ring-blue-100"
        : tone === "warning"
          ? "bg-amber-100 text-amber-900 ring-amber-200"
          : "bg-slate-50 text-slate-600 ring-slate-200";

  return (
    <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ring-1 ${toneClass}`}>
      {icon}
      {children}
    </div>
  );
}
