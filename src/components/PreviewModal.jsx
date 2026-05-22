import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { PreviewZoomControls } from "./PreviewZoomControls.jsx";
import { PreviewCanvas } from "./PreviewCanvas.jsx";
import { useUIStore } from "../store/useUIStore.js";
import { useDiagramStore } from "../store/useDiagramStore.js";
import { translations, defaultLanguage } from "../utils/translations.js";

export function PreviewModal() {
  const open = useUIStore((state) => state.previewModalOpen);
  const zoom = useUIStore((state) => state.previewZoom);
  const onClose = useUIStore((state) => state.setPreviewModalOpen);
  const onZoomOut = useUIStore((state) => state.zoomOut);
  const onZoomIn = useUIStore((state) => state.zoomIn);
  const onReset = useUIStore((state) => state.resetZoom);
  const language = useUIStore((state) => state.language);

  const title = useDiagramStore((state) => state.documentTitle);
  const svg = useDiagramStore((state) => state.svg);
  const renderError = useDiagramStore((state) => state.renderError);

  const t = translations[language] || translations[defaultLanguage];
  const [shouldRender, setShouldRender] = useState(open);
  const [isVisible, setIsVisible] = useState(false);
  const defaultDocumentTitle = "Driver Diagram ใหม่";

  useEffect(() => {
    if (open) {
      setShouldRender(true);
      const frameId = window.requestAnimationFrame(() => setIsVisible(true));
      return () => window.cancelAnimationFrame(frameId);
    }

    setIsVisible(false);
    const timeoutId = window.setTimeout(() => setShouldRender(false), 220);
    return () => window.clearTimeout(timeoutId);
  }, [open]);

  if (!shouldRender) return null;

  return (
    <div
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose(false);
        }
      }}
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 transition-all duration-200 ease-out sm:p-6 ${
        isVisible ? "bg-slate-950/55 opacity-100" : "bg-slate-950/0 opacity-0"
      }`}
    >
      <div
        className={`flex h-[92vh] w-full max-w-[96rem] flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl ring-1 ring-slate-200 transition-all duration-200 ease-out ${
          isVisible ? "translate-y-0 scale-100 opacity-100" : "translate-y-4 scale-[0.985] opacity-0"
        }`}
      >
        <div className="flex flex-col gap-3 border-b border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <h2 className="text-lg font-bold text-slate-950">{title || defaultDocumentTitle}</h2>
            <p className="mt-1 text-sm text-slate-500">{t.modalDescription}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <PreviewZoomControls zoom={zoom} onZoomOut={onZoomOut} onZoomIn={onZoomIn} onReset={onReset} labels={t} />
            <button
              onClick={() => onClose(false)}
              data-testid="close-preview-modal-button"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <X size={16} /> {t.close}
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 bg-slate-100 p-4">
          <PreviewCanvas svg={svg} renderError={renderError} zoom={zoom} className="h-full" labels={t} />
        </div>
      </div>
    </div>
  );
}
