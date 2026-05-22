import React from "react";

export function LanguageToggle({ language, onChange, t, exposeTestIds = false }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-2xl bg-slate-50 p-1 text-sm font-semibold ring-1 ring-slate-200">
      {["th", "en"].map((option) => (
        <button
          key={option}
          type="button"
          data-testid={exposeTestIds ? `language-toggle-${option}` : undefined}
          onClick={() => onChange(option)}
          className={`rounded-xl px-3 py-2 transition ${language === option ? "bg-white text-slate-950 shadow-sm ring-1 ring-slate-200" : "text-slate-500 hover:text-slate-800"}`}
          aria-pressed={language === option}
        >
          {option === "th" ? t.languageTh : t.languageEn}
        </button>
      ))}
    </div>
  );
}
