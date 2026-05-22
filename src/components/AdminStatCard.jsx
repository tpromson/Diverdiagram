import React from "react";

export function AdminStatCard({ label, value, tone = "slate" }) {
  const toneClasses =
    tone === "amber"
      ? "bg-amber-50 text-amber-900 ring-amber-100"
      : tone === "rose"
        ? "bg-rose-50 text-rose-900 ring-rose-100"
        : tone === "blue"
          ? "bg-blue-50 text-blue-900 ring-blue-100"
          : "bg-slate-50 text-slate-900 ring-slate-200";

  return (
    <div className={`rounded-3xl p-4 ring-1 ${toneClasses}`}>
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="mt-2 text-3xl font-bold tracking-tight">{value}</div>
    </div>
  );
}
