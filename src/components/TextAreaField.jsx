import React from "react";

const themeClasses = {
  default: {
    label: "text-slate-700",
    iconBg: "bg-slate-50 text-slate-500 ring-slate-200",
    focusRing: "focus:border-blue-500 focus:ring-blue-100",
  },
  orange: {
    label: "text-orange-900",
    iconBg: "bg-orange-100 text-orange-700 ring-orange-200",
    focusRing: "focus:border-orange-600 focus:ring-orange-100",
  },
  amber: {
    label: "text-amber-900",
    iconBg: "bg-amber-100 text-amber-700 ring-amber-200",
    focusRing: "focus:border-amber-600 focus:ring-amber-100",
  },
  blue: {
    label: "text-blue-900",
    iconBg: "bg-blue-100 text-blue-700 ring-blue-200",
    focusRing: "focus:border-blue-600 focus:ring-blue-100",
  },
  pink: {
    label: "text-pink-900",
    iconBg: "bg-pink-100 text-pink-700 ring-pink-200",
    focusRing: "focus:border-pink-600 focus:ring-pink-100",
  },
};

export function TextAreaField({
  label,
  value,
  onChange,
  icon,
  testId = "",
  inputRef = null,
  tabIndex,
  disabled = false,
  onFocus = null,
  onBlur = null,
  lockOwner = "",
  theme = "default",
}) {
  const handleFocus = (e) => {
    e.target.select();
    if (onFocus) onFocus(e);
  };
  
  const tStyles = themeClasses[theme] || themeClasses.default;
  
  return (
    <label className="block space-y-2">
      <div className={`flex items-center gap-2 text-sm font-semibold leading-5 ${tStyles.label}`}>
        <span className={`inline-flex h-8 w-8 items-center justify-center rounded-2xl ring-1 ${tStyles.iconBg}`}>
          {icon}
        </span>
        <span>{label}</span>
      </div>
      <textarea
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={handleFocus}
        onBlur={onBlur}
        disabled={disabled}
        rows={2}
        data-testid={testId || undefined}
        tabIndex={tabIndex}
        className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 ${tStyles.focusRing} ${
          disabled ? "bg-slate-100 cursor-not-allowed opacity-75 border-slate-300" : ""
        }`}
      />
      {lockOwner && (
        <div className="mt-1 text-[11px] font-semibold text-rose-600 animate-pulse flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-600 animate-ping" />
          <span>{lockOwner} กำลังพิมพ์แก้ไข...</span>
        </div>
      )}
    </label>
  );
}
