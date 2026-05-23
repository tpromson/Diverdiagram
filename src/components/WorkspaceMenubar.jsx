import React, { useState, useEffect, useRef } from "react";
import {
  GitBranch,
  Shield,
  LayoutGrid,
  FilePlus2,
  LogOut,
  Download,
  ChevronDown,
  Copy,
  FolderOpen,
} from "lucide-react";
import { HeaderActionButton } from "./actions.jsx";
import { LanguageToggle } from "./LanguageToggle.jsx";
import { MobileOverflowMenu } from "./CompactPageBar.jsx";
import { useUIStore } from "../store/useUIStore.js";
import { useAuthStore } from "../store/useAuthStore.js";
import { useDiagramStore } from "../store/useDiagramStore.js";
import { translations } from "../utils/translations.js";
import { isSupabaseConfigured } from "../supabaseClient.js";
import { isPreviewAuthLayoutEnabled } from "../utils/helpers.js";

const defaultDocumentTitle = "Driver Diagram ใหม่";

export function WorkspaceMenubar() {
  const language = useUIStore((state) => state.language);
  const setLanguage = useUIStore((state) => state.setLanguage);
  const setSavedDrawerOpen = useUIStore((state) => state.setSavedDrawerOpen);
  const exitAllViews = useUIStore((state) => state.exitAllViews);
  const setAutoSaveEnabled = useUIStore((state) => state.setAutoSaveEnabled);
  const autoSaveEnabled = useUIStore((state) => state.autoSaveEnabled);
  const openGalleryPage = useUIStore((state) => state.openGalleryPage);
  const openAdminPage = useUIStore((state) => state.openAdminPage);

  const currentUser = useAuthStore((state) => state.currentUser);
  const isAuthenticated = Boolean(currentUser);
  const isGalleryAdmin = useAuthStore((state) => state.isGalleryAdmin);
  const authSubmitting = useAuthStore((state) => state.authSubmitting);
  const signOut = useAuthStore((state) => state.signOut);

  const documentTitle = useDiagramStore((state) => state.documentTitle);
  const autoSaveState = useDiagramStore((state) => state.autoSaveState);
  const copied = useDiagramStore((state) => state.copied);
  const exportingDocx = useDiagramStore((state) => state.exportingDocx);
  const exportingPdf = useDiagramStore((state) => state.exportingPdf);
  const downloadPdf = useDiagramStore((state) => state.downloadPdf);
  const startNewDiagram = useDiagramStore((state) => state.startNewDiagram);
  const copyMermaid = useDiagramStore((state) => state.copyMermaid);
  const downloadMermaid = useDiagramStore((state) => state.downloadMermaid);
  const downloadSvg = useDiagramStore((state) => state.downloadSvg);
  const downloadPng = useDiagramStore((state) => state.downloadPng);
  const downloadDocx = useDiagramStore((state) => state.downloadDocx);

  const t = translations[language] || translations.th;
  const title = documentTitle.trim() || defaultDocumentTitle;
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const exportMenuRef = useRef(null);

  const previewAuthEnabled = React.useMemo(() => isPreviewAuthLayoutEnabled(), []);
  const authUiActive = isAuthenticated || previewAuthEnabled;

  const syncLabel =
    isSupabaseConfigured && isAuthenticated
      ? autoSaveState === "saving"
        ? t.autoSaving
        : autoSaveState === "dirty"
          ? t.unsavedChanges
          : t.allChangesSaved
      : t.newUnsavedDocument;

  const syncTone =
    autoSaveState === "saving"
        ? "text-blue-700 bg-blue-50 ring-blue-100"
        : autoSaveState === "dirty"
          ? "text-amber-900 bg-amber-100 ring-amber-200"
          : isSupabaseConfigured && isAuthenticated
            ? "text-emerald-700 bg-emerald-50 ring-emerald-100"
            : "text-slate-600 bg-slate-50 ring-slate-200";

  useEffect(() => {
    if (!exportMenuOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!exportMenuRef.current?.contains(event.target)) {
        setExportMenuOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setExportMenuOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [exportMenuOpen]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === "e") {
        event.preventDefault();
        setExportMenuOpen((open) => !open);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const runExportAction = (action) => {
    action();
    setExportMenuOpen(false);
  };

  return (
    <nav className="sticky top-3 z-40 rounded-[24px] border border-sky-200 bg-gradient-to-r from-sky-50 via-blue-50 to-indigo-50 px-3 py-3 shadow-sm ring-1 ring-sky-100 backdrop-blur">
      <div className="flex flex-col gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <button
                type="button"
                onClick={exitAllViews}
                className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white sm:inline-flex hover:bg-slate-800 transition cursor-pointer"
                title={t.backToWorkspace}
              >
                <GitBranch size={18} />
              </button>
          <div className="min-w-0 flex-1">
            <div className="max-w-[18rem] truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-sky-700/70 sm:max-w-[22rem] lg:max-w-[26rem] xl:max-w-[32rem]">
              {t.appEyebrow}
            </div>
            <div
              title={title}
              className="mt-1 max-w-[18rem] truncate text-lg font-bold leading-tight text-slate-950 sm:max-w-[22rem] lg:max-w-[26rem] xl:max-w-[32rem]"
            >
              {title}
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span className={`inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${syncTone}`}>
                {syncLabel}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 xl:justify-end">
          <div className="hidden items-center gap-2 rounded-2xl border border-white/70 bg-white/70 px-2 py-2 md:inline-flex">
            {isGalleryAdmin ? (
              <HeaderActionButton onClick={openAdminPage}>
                <Shield size={16} /> {t.openModeration}
              </HeaderActionButton>
            ) : null}
            <HeaderActionButton onClick={openGalleryPage}>
              <LayoutGrid size={16} /> {t.openGallery}
            </HeaderActionButton>
            <HeaderActionButton onClick={startNewDiagram} className="!text-pink-600">
              <FilePlus2 size={16} /> {t.newDiagram}
            </HeaderActionButton>
            {authUiActive ? (
              <HeaderActionButton onClick={signOut} disabled={authSubmitting || !isAuthenticated}>
                <LogOut size={16} /> {authSubmitting ? t.signingOut : t.signOut}
              </HeaderActionButton>
            ) : null}
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <LanguageToggle language={language} onChange={setLanguage} t={t} exposeTestIds />
            <div ref={exportMenuRef} className="relative">
              <button
                type="button"
                aria-expanded={exportMenuOpen}
                onClick={() => setExportMenuOpen((open) => !open)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold transition border border-violet-200 bg-violet-50 text-violet-700 shadow-sm hover:bg-violet-100"
              >
                <Download size={16} />
                <span className="md:hidden">Export</span>
                <span className="hidden md:inline">{t.exportAndCode}</span>
                <ChevronDown size={16} className={`transition-transform duration-200 ${exportMenuOpen ? "rotate-180" : ""}`} />
              </button>
              <div
                className={`absolute right-0 z-50 mt-2 grid min-w-[220px] gap-2 rounded-[24px] border border-slate-200 bg-white p-3 shadow-lg ring-1 ring-slate-200/80 transition-all duration-200 ease-out ${
                  exportMenuOpen ? "translate-y-0 scale-100 opacity-100" : "pointer-events-none -translate-y-1 scale-[0.98] opacity-0"
                }`}
              >
                <HeaderActionButton variant="accent" onClick={() => runExportAction(copyMermaid)}>
                  <Copy size={16} /> {copied ? t.copiedMermaid : t.copyMermaid}
                </HeaderActionButton>
                <HeaderActionButton onClick={() => runExportAction(downloadMermaid)}>
                  <Download size={16} /> {t.exportMmd}
                </HeaderActionButton>
                <HeaderActionButton variant="success" onClick={() => runExportAction(downloadSvg)}>
                  <Download size={16} /> {t.exportSvg}
                </HeaderActionButton>
                <HeaderActionButton variant="orange" onClick={() => runExportAction(downloadPng)}>
                  <Download size={16} /> {t.exportPng}
                </HeaderActionButton>
                <HeaderActionButton
                  variant="violet"
                  onClick={() => runExportAction(downloadPdf)}
                  disabled={exportingPdf}
                >
                  <Download size={16} /> {exportingPdf ? t.exporting : t.exportPdf}
                </HeaderActionButton>
                <HeaderActionButton
                  variant="violet"
                  onClick={() => runExportAction(downloadDocx)}
                  disabled={exportingDocx}
                >
                  <Download size={16} /> {exportingDocx ? t.exporting : t.exportDocx}
                </HeaderActionButton>
              </div>
            </div>
            <HeaderActionButton variant="accent" onClick={() => setSavedDrawerOpen(true)}>
              <FolderOpen size={16} /> {t.savedDiagrams}
            </HeaderActionButton>
          </div>
          <MobileOverflowMenu label={t.more}>
            <div className="px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{t.workspace}</div>
            <LanguageToggle language={language} onChange={setLanguage} t={t} exposeTestIds={false} />
            {isGalleryAdmin ? (
              <HeaderActionButton onClick={openAdminPage} className="w-full justify-start">
                <Shield size={16} /> {t.openModeration}
              </HeaderActionButton>
            ) : null}
            <HeaderActionButton onClick={() => setSavedDrawerOpen(true)} className="w-full justify-start">
              <FolderOpen size={16} /> {t.savedDiagrams}
            </HeaderActionButton>
            <HeaderActionButton onClick={openGalleryPage} className="w-full justify-start">
              <LayoutGrid size={16} /> {t.openGallery}
            </HeaderActionButton>
            <HeaderActionButton onClick={startNewDiagram} className="w-full justify-start !text-pink-600">
              <FilePlus2 size={16} /> {t.newDiagram}
            </HeaderActionButton>
            <div className="mt-1 px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{t.exportAndCode}</div>
            <HeaderActionButton variant="accent" onClick={copyMermaid} className="w-full justify-start">
              <Copy size={16} /> {copied ? t.copiedMermaid : t.copyMermaid}
            </HeaderActionButton>
            <HeaderActionButton onClick={downloadMermaid} className="w-full justify-start">
              <Download size={16} /> {t.exportMmd}
            </HeaderActionButton>
            <HeaderActionButton variant="success" className="w-full justify-start" onClick={downloadSvg}>
              <Download size={16} /> {t.exportSvg}
            </HeaderActionButton>
            <HeaderActionButton variant="orange" className="w-full justify-start" onClick={downloadPng}>
              <Download size={16} /> {t.exportPng}
            </HeaderActionButton>
            <HeaderActionButton
              variant="violet"
              className="w-full justify-start"
              onClick={downloadPdf}
              disabled={exportingPdf}
            >
              <Download size={16} /> {exportingPdf ? t.exporting : t.exportPdf}
            </HeaderActionButton>
            <HeaderActionButton
              variant="violet"
              className="w-full justify-start"
              onClick={downloadDocx}
              disabled={exportingDocx}
            >
              <Download size={16} /> {exportingDocx ? t.exporting : t.exportDocx}
            </HeaderActionButton>
            {authUiActive ? (
              <>
                <div className="mt-1 px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{t.session}</div>
                <HeaderActionButton onClick={signOut} disabled={authSubmitting || !isAuthenticated} className="w-full justify-start">
                  <LogOut size={16} /> {authSubmitting ? t.signingOut : t.signOut}
                </HeaderActionButton>
              </>
            ) : null}
          </MobileOverflowMenu>
        </div>
      </div>
    </nav>
  );
}
