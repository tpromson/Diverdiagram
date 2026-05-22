import React from "react";
import { Minus, Plus, RotateCcw } from "lucide-react";
import { Tooltip, IconActionButton } from "./tooltip.jsx";

const PREVIEW_ZOOM_MIN = 0.5;
const PREVIEW_ZOOM_MAX = 2;

export function PreviewZoomControls({ zoom, onZoomOut, onZoomIn, onReset, labels }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-2xl border border-slate-200 bg-white/80 p-1 shadow-sm">
      <IconActionButton
        label={labels.zoomOut}
        onClick={onZoomOut}
        disabled={zoom <= PREVIEW_ZOOM_MIN}
        className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-35"
      >
        <Minus size={16} />
      </IconActionButton>
      <Tooltip label={labels.resetZoom}>
        <button
          type="button"
          aria-label={labels.resetZoom}
          onClick={onReset}
          className="inline-flex min-w-[70px] items-center justify-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200"
        >
          <RotateCcw size={14} /> {Math.round(zoom * 100)}%
        </button>
      </Tooltip>
      <IconActionButton
        label={labels.zoomIn}
        onClick={onZoomIn}
        disabled={zoom >= PREVIEW_ZOOM_MAX}
        className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-35"
      >
        <Plus size={16} />
      </IconActionButton>
    </div>
  );
}
