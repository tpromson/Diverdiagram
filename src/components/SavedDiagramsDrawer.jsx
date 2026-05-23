import React, { useEffect, useMemo } from "react";
import {
  X,
  RefreshCw,
  Search,
  FolderOpen,
  Link2,
  ExternalLink,
  Upload,
  Star,
  Pencil,
  Copy,
  ArchiveRestore,
  Archive,
  Trash2,
  Check,
} from "lucide-react";
import { IconActionButton } from "./tooltip.jsx";
import { DiagramThumbnail } from "./DiagramThumbnail.jsx";
import { isSupabaseConfigured } from "../supabaseClient.js";
import { useUIStore } from "../store/useUIStore.js";
import { useAuthStore } from "../store/useAuthStore.js";
import { useDiagramStore } from "../store/useDiagramStore.js";
import { translations, defaultLanguage } from "../utils/translations.js";
import {
  formatSavedDateTime,
  getSavedDiagramSortOptions,
  getSavedDiagramScopeOptions,
  hasActiveShareLink,
  sortSavedDiagrams,
} from "../utils/helpers.js";

export function SavedDiagramsDrawer() {
  const open = useUIStore((state) => state.savedDrawerOpen);
  const setSavedDrawerOpen = useUIStore((state) => state.setSavedDrawerOpen);
  const onClose = () => setSavedDrawerOpen(false);
  const language = useUIStore((state) => state.language);

  const savedSearch = useUIStore((state) => state.savedSearch);
  const setSavedSearch = useUIStore((state) => state.setSavedSearch);
  const savedScope = useUIStore((state) => state.savedScope);
  const setSavedScope = useUIStore((state) => state.setSavedScope);
  const savedSort = useUIStore((state) => state.savedSort);
  const setSavedSort = useUIStore((state) => state.setSavedSort);

  const currentUser = useAuthStore((state) => state.currentUser);
  const isAuthenticated = Boolean(currentUser?.id);

  const savedDiagrams = useDiagramStore((state) => state.savedDiagrams);
  const loadingSavedDiagrams = useDiagramStore((state) => state.loadingSavedDiagrams);
  const refreshSavedDiagrams = useDiagramStore((state) => state.refreshSavedDiagrams);

  const renamingDiagramId = useDiagramStore((state) => state.renamingDiagramId);
  const renameDraft = useDiagramStore((state) => state.renameDraft);
  const setRenameDraft = (draft) => useDiagramStore.setState({ renameDraft: draft });
  const renameDiagram = useDiagramStore((state) => state.renameDiagram);
  const renamingDiagram = useDiagramStore((state) => state.renamingDiagram);
  const cancelRenamingDiagram = useDiagramStore((state) => state.cancelRenamingDiagram);
  const startRenamingDiagram = useDiagramStore((state) => state.startRenamingDiagram);

  const openDiagram = useDiagramStore((state) => state.openDiagram);
  const openingDiagramId = useDiagramStore((state) => state.openingDiagramId);

  const sharingDiagramId = useDiagramStore((state) => state.sharingDiagramId);
  const shareDiagram = useDiagramStore((state) => state.shareDiagram);
  const revokeShareDiagram = useDiagramStore((state) => state.revokeShareDiagram);

  const gallerySubmittingId = useDiagramStore((state) => state.gallerySubmittingId);
  const toggleGallerySubmission = useDiagramStore((state) => state.toggleGallerySubmission);
  const toggleFavoriteDiagram = useDiagramStore((state) => state.toggleFavoriteDiagram);

  const duplicatingDiagramId = useDiagramStore((state) => state.duplicatingDiagramId);
  const duplicateDiagram = useDiagramStore((state) => state.duplicateDiagram);
  const toggleArchiveDiagram = useDiagramStore((state) => state.toggleArchiveDiagram);

  const deletingDiagramId = useDiagramStore((state) => state.deletingDiagramId);
  const deleteDiagram = useDiagramStore((state) => state.deleteDiagram);

  const saveDiagram = useDiagramStore((state) => state.saveDiagram);
  const savingDiagram = useDiagramStore((state) => state.savingDiagram);

  const t = translations[language] || translations[defaultLanguage];
  const savedDiagramScopeOptions = useMemo(() => getSavedDiagramScopeOptions(t), [t]);
  const savedDiagramSortOptions = useMemo(() => getSavedDiagramSortOptions(t), [t]);

  const filteredSavedDiagrams = useMemo(() => {
    const search = savedSearch.trim().toLowerCase();
    const scoped = savedDiagrams.filter((item) => {
      if (savedScope === "archived") return Boolean(item.archived_at);
      if (savedScope === "all") return true;
      return !item.archived_at;
    });
    const filtered = search
      ? scoped.filter((item) =>
          `${item.title || ""}\n${item.purpose_title || ""}`.toLowerCase().includes(search)
        )
      : scoped;

    return sortSavedDiagrams(filtered, savedSort);
  }, [savedDiagrams, savedScope, savedSearch, savedSort]);

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const defaultDocumentTitle = "Driver Diagram ใหม่";

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label={t.close}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/25 backdrop-blur-[2px]"
      />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-[560px] flex-col border-l border-slate-200 bg-slate-50 shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-4">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{t.workspace}</div>
            <h2 className="mt-1 text-xl font-bold text-slate-950">{t.savedDiagrams}</h2>
            <p className="mt-1 text-sm text-slate-500">{t.savedDiagramsDescription}</p>
          </div>
          <IconActionButton
            label={t.close}
            onClick={onClose}
            className="rounded-xl p-2 text-slate-500 hover:bg-white"
          >
            <X size={18} />
          </IconActionButton>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-500 ring-1 ring-slate-200">
                {filteredSavedDiagrams.length} {t.shown}
              </div>
              <button
                onClick={refreshSavedDiagrams}
                disabled={!isSupabaseConfigured || !isAuthenticated || loadingSavedDiagrams}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw size={16} className={loadingSavedDiagrams ? "animate-spin" : ""} /> {t.refresh}
              </button>
            </div>

            {isAuthenticated ? (
              <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_140px_140px]">
                <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2">
                  <Search size={16} className="text-slate-400" />
                  <input
                    value={savedSearch}
                    onChange={(e) => setSavedSearch(e.target.value)}
                    placeholder={t.searchPlaceholder}
                    className="min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none"
                  />
                </label>
                <select
                  value={savedScope}
                  onChange={(e) => setSavedScope(e.target.value)}
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                >
                  {savedDiagramScopeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  value={savedSort}
                  onChange={(e) => setSavedSort(e.target.value)}
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                >
                  {savedDiagramSortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div className="mt-3 space-y-2">
              {!isSupabaseConfigured ? (
                <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                  {t.envMissingHelp}
                </div>
              ) : !isAuthenticated ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-3 text-sm text-slate-600">
                  {t.signInFirstSaved}
                </div>
              ) : loadingSavedDiagrams ? (
                <div className="rounded-2xl bg-white p-3 text-sm text-slate-500">{t.loadingSavedDiagrams}</div>
              ) : filteredSavedDiagrams.length ? (
                filteredSavedDiagrams.map((item) => (
                  <div key={item.id} data-testid={`saved-diagram-card-${item.id}`} className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200 transition hover:ring-slate-300">
                    <DiagramThumbnail
                      title={item.title || item.purpose_title || t.untitledDiagram}
                      purposeTitle={item.purpose_title}
                      thumbnailSvg={item.thumbnail_svg}
                      diagramData={item.diagram_data}
                      mermaidCode={item.mermaid_code}
                      className="mb-3"
                    />
                    <div className="flex flex-col gap-3">
                      <div className="min-w-0 flex-1">
                        {renamingDiagramId === item.id ? (
                          <div className="space-y-2">
                            <input
                              value={renameDraft}
                              onChange={(e) => setRenameDraft(e.target.value)}
                              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                            />
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => renameDiagram(item.id)}
                                disabled={renamingDiagram}
                                className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-wait disabled:opacity-70"
                              >
                                <Check size={15} /> {renamingDiagram ? t.saving : t.save}
                              </button>
                              <button
                                onClick={cancelRenamingDiagram}
                                disabled={renamingDiagram}
                                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-70"
                              >
                                <X size={15} /> {t.cancel}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => openDiagram(item.id)}
                            className="min-w-0 w-full text-left"
                          >
                            <div className="flex min-w-0 items-center gap-2">
                              {item.is_favorite ? <Star size={14} className="fill-amber-400 text-amber-500" /> : null}
                              <div className="truncate font-semibold text-slate-900">{item.title || item.purpose_title || t.untitledDiagram}</div>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-medium">
                              {item.archived_at ? <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">{t.archived}</span> : null}
                              {hasActiveShareLink(item) ? <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-600">{t.shared}</span> : null}
                              {item.is_public_gallery ? <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">{t.inGallery}</span> : null}
                              {item.share_id && !hasActiveShareLink(item) && !item.share_revoked_at ? (
                                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">{t.shareExpired}</span>
                              ) : null}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-500">
                              <span className="rounded-full bg-slate-100 px-2.5 py-1">{t.updated}: {formatSavedDateTime(item.updated_at || item.created_at, language)}</span>
                              <span className="rounded-full bg-slate-100 px-2.5 py-1">
                                {t.lastOpened}: {item.last_opened_at ? formatSavedDateTime(item.last_opened_at, language) : t.notOpenedYet}
                              </span>
                              {hasActiveShareLink(item) ? (
                                <span className="rounded-full bg-slate-100 px-2.5 py-1">{t.sharedUntil}: {formatSavedDateTime(item.share_expires_at, language)}</span>
                              ) : null}
                              {item.gallery_submitted_at ? (
                                <span className="rounded-full bg-slate-100 px-2.5 py-1">{t.gallerySubmitted}: {formatSavedDateTime(item.gallery_submitted_at, language)}</span>
                              ) : null}
                            </div>
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center justify-end gap-1">
                        <IconActionButton
                          label={t.open}
                          onClick={() => openDiagram(item.id)}
                          disabled={openingDiagramId === item.id}
                          className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                        >
                          <FolderOpen size={16} />
                        </IconActionButton>
                        <IconActionButton
                          label={hasActiveShareLink(item) ? t.copyShareLink : t.createShareLink}
                          onClick={() => shareDiagram(item)}
                          data-testid={`share-diagram-button-${item.id}`}
                          disabled={sharingDiagramId === item.id}
                          className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                        >
                          <Link2 size={16} />
                        </IconActionButton>
                        <IconActionButton
                          label={t.regenerateShareLink}
                          onClick={() => shareDiagram(item, { regenerate: true })}
                          disabled={sharingDiagramId === item.id}
                          className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                        >
                          <RefreshCw size={16} />
                        </IconActionButton>
                        <IconActionButton
                          label={t.openSharedView}
                          onClick={() => {
                            const shareUrl = `${window.location.origin}${window.location.pathname}?share=${item.share_id}`;
                            window.open(shareUrl, "_blank", "noopener,noreferrer");
                          }}
                          disabled={!hasActiveShareLink(item)}
                          className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                        >
                          <ExternalLink size={16} />
                        </IconActionButton>
                        <IconActionButton
                          label={t.revokeShareLink}
                          onClick={() => revokeShareDiagram(item)}
                          disabled={sharingDiagramId === item.id || !item.share_id || Boolean(item.share_revoked_at)}
                          className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                        >
                          <X size={16} />
                        </IconActionButton>
                        <IconActionButton
                          label={item.is_public_gallery ? t.removeFromGallery : t.submitToGallery}
                          onClick={() => toggleGallerySubmission(item, { publish: !item.is_public_gallery })}
                          data-testid={`toggle-gallery-button-${item.id}`}
                          disabled={gallerySubmittingId === item.id || sharingDiagramId === item.id}
                          className={`rounded-xl p-2 hover:bg-slate-100 disabled:opacity-50 ${item.is_public_gallery ? "text-emerald-600" : "text-slate-600"}`}
                        >
                          <Upload size={16} />
                        </IconActionButton>
                        <IconActionButton
                          label={item.is_favorite ? t.unfavorite : t.favorite}
                          onClick={() => toggleFavoriteDiagram(item)}
                          className={`rounded-xl p-2 hover:bg-slate-100 ${item.is_favorite ? "text-amber-500" : "text-slate-600"}`}
                        >
                          <Star size={16} className={item.is_favorite ? "fill-amber-400" : ""} />
                        </IconActionButton>
                        <IconActionButton
                          label={t.rename}
                          onClick={() => startRenamingDiagram(item)}
                          disabled={renamingDiagramId === item.id || duplicatingDiagramId === item.id}
                          className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                        >
                          <Pencil size={16} />
                        </IconActionButton>
                        <IconActionButton
                          label={t.duplicate}
                          onClick={() => duplicateDiagram(item.id)}
                          disabled={duplicatingDiagramId === item.id}
                          className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                        >
                          <Copy size={16} />
                        </IconActionButton>
                        <IconActionButton
                          label={item.archived_at ? t.restore : t.archive}
                          onClick={() => toggleArchiveDiagram(item)}
                          disabled={duplicatingDiagramId === item.id}
                          className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                        >
                          {item.archived_at ? <ArchiveRestore size={16} /> : <Archive size={16} />}
                        </IconActionButton>
                        <IconActionButton
                          label={t.deletePermanently}
                          onClick={() => deleteDiagram(item.id)}
                          disabled={deletingDiagramId === item.id || duplicatingDiagramId === item.id}
                          className="rounded-xl p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          <Trash2 size={16} />
                        </IconActionButton>
                      </div>
                    </div>
                  </div>
                ))
              ) : savedSearch.trim() ? (
                <div className="rounded-2xl bg-white p-4 text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
                  <div className="font-semibold text-slate-900">{t.noSearchResultsTitle}</div>
                  <p className="mt-1">{t.noSearchResultsBody}</p>
                </div>
              ) : (
                <div className="rounded-2xl bg-white p-4 text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
                  <div className="font-semibold text-slate-900">
                    {savedScope === "archived" ? t.noArchivedTitle : t.noSavedTitle}
                  </div>
                  <p className="mt-1">
                    {savedScope === "archived" ? t.noArchivedBody : t.noSavedBody}
                  </p>
                  <button
                    onClick={() => saveDiagram()}
                    disabled={savingDiagram}
                    className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-wait disabled:opacity-70"
                  >
                    <Upload size={16} /> {savingDiagram ? t.saving : t.save}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
