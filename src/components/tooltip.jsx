import React from "react";

export function Tooltip({ label, children }) {
  return (
    <span className="group/tooltip relative inline-flex">
      {children}
      <span className="pointer-events-none absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2 rounded-xl bg-slate-950 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition duration-150 group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100">
        {label}
      </span>
    </span>
  );
}

export function IconActionButton({ label, className = "", children, ...props }) {
  return (
    <Tooltip label={label}>
      <button
        type="button"
        aria-label={label}
        className={className}
        {...props}
      >
        {children}
      </button>
    </Tooltip>
  );
}
