import React from "react";

export function TextAreaField({ label, value, onChange, icon, testId = "", inputRef = null }) {
  return (
    <label className="block space-y-2">
      <div className="flex items-center gap-2 text-sm font-semibold leading-5 text-slate-700">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-slate-50 text-slate-500 ring-1 ring-slate-200">
          {icon}
        </span>
        <span>{label}</span>
      </div>
      <textarea
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        data-testid={testId || undefined}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}
