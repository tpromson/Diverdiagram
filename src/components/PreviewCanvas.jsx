import React from "react";
import { Eye } from "lucide-react";

export function PreviewCanvas({ svg, renderError, zoom, className = "", onWheel = undefined, labels, onClick = undefined }) {
  if (renderError) {
    return <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{renderError}</div>;
  }

  if (!svg.trim()) {
    return (
      <div
        onWheel={onWheel}
        className={`preview-surface flex min-h-[16rem] items-center justify-center overflow-hidden rounded-[24px] bg-slate-100 p-6 ring-1 ring-slate-200 ${className}`}
      >
        <div className="max-w-sm rounded-[28px] border border-dashed border-slate-300 bg-white/80 px-6 py-8 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
            <Eye size={20} />
          </div>
          <div className="mt-4 text-base font-semibold text-slate-900">{labels.previewEmptyTitle}</div>
          <p className="mt-2 text-sm leading-6 text-slate-500">{labels.previewEmptyBody}</p>
        </div>
      </div>
    );
  }

  const isZoomed = zoom > 1;

  return (
    <div
      onWheel={onWheel}
      onClick={onClick}
      className={`preview-surface flex ${isZoomed ? "items-start justify-start" : "items-center justify-center"} overflow-auto rounded-[24px] bg-slate-100 p-6 ring-1 ring-slate-200 transition-colors ${
        onClick ? "cursor-zoom-in hover:bg-slate-200/50" : ""
      } ${className}`}
    >
      <div
        className="diagram-preview"
        style={{ 
          transform: `scale(${zoom})`,
          transformOrigin: isZoomed ? "0 0" : "center center",
          width: "max-content",
          height: "max-content",
          padding: isZoomed ? "24px" : "0",
          transition: "transform 0.15s ease-out, padding 0.15s ease-out",
        }}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </div>
  );
}
