import React from "react";

export const surfaceButtonClass = "border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50";

export function HeaderActionButton({
  children,
  variant = "secondary",
  className = "",
  ...props
}) {
  const variantClass =
    variant === "primary"
      ? "bg-slate-900 text-white shadow-sm hover:bg-slate-800"
      : variant === "accent"
        ? "bg-blue-600 text-white shadow-sm hover:bg-blue-700"
        : variant === "success"
          ? "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
          : variant === "violet"
            ? "bg-violet-600 text-white shadow-sm hover:bg-violet-700"
            : variant === "orange"
              ? "bg-orange-600 text-white shadow-sm hover:bg-orange-700"
              : surfaceButtonClass;

  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold leading-5 transition disabled:cursor-wait disabled:opacity-70 ${variantClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
