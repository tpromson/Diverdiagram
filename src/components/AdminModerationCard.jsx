import React from "react";
import { ExternalLink, Undo2, EyeOff, Shield } from "lucide-react";
import { Tooltip } from "./tooltip.jsx";
import { DiagramThumbnail } from "./DiagramThumbnail.jsx";
import { formatSavedDateTime } from "../utils/helpers.js";

export function AdminModerationCard({
  item,
  t,
  language,
  moderationActionToken,
  onModerate,
}) {
  const latestReport = Array.isArray(item.recent_reports) && item.recent_reports.length ? item.recent_reports[0] : null;

  return (
    <article className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        <DiagramThumbnail
          title={item.title || item.purpose_title || t.untitledDiagram}
          thumbnailSvg={item.thumbnail_svg}
          diagramData={item.diagram_data}
          mermaidCode={item.mermaid_code}
        />
        <div className="min-w-0 space-y-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold text-slate-900">{item.title || t.untitledDiagram}</h2>
              <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-500">
                <span className="rounded-full bg-slate-100 px-2.5 py-1">{t.reportCount}: {item.report_count || 0}</span>
                {item.gallery_hidden_at ? (
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 font-medium text-amber-700">{t.hiddenFromGallery}</span>
                ) : null}
                {item.gallery_submitter_name ? (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1">{t.galleryOwnerLabel}: {item.gallery_submitter_name}</span>
                ) : null}
                {latestReport?.reported_at ? (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1">{t.adminNewestReport}: {formatSavedDateTime(latestReport.reported_at, language)}</span>
                ) : null}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Tooltip label={t.adminOpenReadOnly}>
                <a
                  href={`${window.location.pathname}?share=${item.share_token}`}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <ExternalLink size={16} /> {t.adminOpenReadOnly}
                </a>
              </Tooltip>
              <Tooltip label={item.gallery_hidden_at ? t.restoreToGallery : t.hideFromGallery}>
                <button
                  onClick={() => onModerate(item.share_token, item.gallery_hidden_at ? "restore" : "hide")}
                  disabled={moderationActionToken === item.share_token}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  {item.gallery_hidden_at ? <Undo2 size={16} /> : <EyeOff size={16} />}
                  {item.gallery_hidden_at ? t.restoreToGallery : t.hideFromGallery}
                </button>
              </Tooltip>
              <Tooltip label={t.resolveReports}>
                <button
                  onClick={() => onModerate(item.share_token, "resolve_reports")}
                  disabled={moderationActionToken === item.share_token || !item.report_count}
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                >
                  <Shield size={16} /> {t.resolveReports}
                </button>
              </Tooltip>
            </div>
          </div>
          {item.purpose_title ? (
            <p className="line-clamp-3 text-sm leading-6 text-slate-600">{item.purpose_title}</p>
          ) : null}
          {item.gallery_hidden_reason ? (
            <div className="rounded-2xl bg-amber-50 px-3 py-2 text-sm text-amber-800">{item.gallery_hidden_reason}</div>
          ) : null}
          {Array.isArray(item.recent_reports) && item.recent_reports.length ? (
            <div className="grid gap-2 lg:grid-cols-2">
              {item.recent_reports.map((report) => (
                <div key={report.id} className="rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-700 ring-1 ring-slate-200">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span>{formatSavedDateTime(report.reported_at, language)}</span>
                    {report.reporter_email ? <span>{report.reporter_email}</span> : null}
                  </div>
                  <div className="mt-1">{report.reason || "-"}</div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
