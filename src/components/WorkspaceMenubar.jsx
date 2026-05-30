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
  Sparkles,
  Printer,
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
  const setTemplatesModalOpen = useUIStore((state) => state.setTemplatesModalOpen);
  const exitAllViews = useUIStore((state) => state.exitAllViews);
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
  const exportMenuRef2 = useRef(null);

  // Track scroll position for smooth collapse
  const [isScrolled, setIsScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 100);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
    const handlePointerDown = (e) => {
      if (!exportMenuOpen) return;
      const clickedInside =
        exportMenuRef.current?.contains(e.target) ||
        exportMenuRef2.current?.contains(e.target);
      if (!clickedInside) {
        setExportMenuOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (exportMenuOpen && e.key === "Escape") {
        setExportMenuOpen(false);
      }
    };
    window.addEventListener("click", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("click", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [exportMenuOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "e") {
        e.preventDefault();
        setExportMenuOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const runExportAction = (action) => { action(); setExportMenuOpen(false); };

  const ExportDropdownItems = () => (
    <>
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
      <HeaderActionButton variant="violet" onClick={() => runExportAction(downloadPdf)} disabled={exportingPdf}>
        <Download size={16} /> {exportingPdf ? t.exporting : t.exportPdf}
      </HeaderActionButton>
      <HeaderActionButton variant="violet" onClick={() => runExportAction(downloadDocx)} disabled={exportingDocx}>
        <Download size={16} /> {exportingDocx ? t.exporting : t.exportDocx}
      </HeaderActionButton>
      <HeaderActionButton variant="primary" onClick={() => runExportAction(() => window.print())}>
        <Printer size={16} /> {t.printDiagram}
      </HeaderActionButton>
    </>
  );

  return (
    <nav
      className={`sticky top-3 z-40 rounded-[24px] border transition-all duration-300 ease-in-out backdrop-blur-md ${
        exportMenuOpen ? "" : "overflow-hidden"
      } ${
        isScrolled 
          ? "px-3 py-1.5 border-white/60 bg-white/70 shadow-md ring-1 ring-slate-200/20" 
          : "px-3 py-3 border-sky-200/60 bg-gradient-to-r from-sky-50/90 via-blue-50/90 to-indigo-50/90 shadow-sm ring-1 ring-sky-100/50"
      }`}
    >
      {/* ── Row 1: Always visible ── */}
      <div className="flex min-w-0 items-center justify-between gap-3">
        {/* Left: icon + title + sync */}
        <div className="flex min-w-0 items-center gap-2.5">
          <button
            type="button"
            onClick={exitAllViews}
            className={`hidden shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white sm:inline-flex hover:bg-slate-800 transition-all duration-300 cursor-pointer ${
              isScrolled ? "h-7 w-7" : "h-8 w-8"
            }`}
            title={t.backToWorkspace}
          >
            <GitBranch size={isScrolled ? 14 : 16} />
          </button>

          <div className="min-w-0 flex-1">
            {/* Eyebrow — collapses out when scrolled */}
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                isScrolled ? "max-h-0 opacity-0" : "max-h-6 opacity-100"
              }`}
            >
              <div className="max-w-[18rem] truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-sky-700/70 sm:max-w-[22rem] lg:max-w-[26rem] xl:max-w-[32rem]">
                {t.appEyebrow}
              </div>
            </div>

            {/* Title — shrinks font size smoothly */}
            <div
              title={title}
              className={`truncate font-bold leading-tight text-slate-950 max-w-[14rem] sm:max-w-[22rem] lg:max-w-[26rem] xl:max-w-[32rem] transition-all duration-300 ease-in-out ${
                isScrolled ? "text-sm" : "text-lg mt-0.5"
              }`}
            >
              {title}
            </div>

            {/* Sync pill */}
            <span
              className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 transition-all duration-300 ${syncTone} ${
                isScrolled ? "mt-0.5" : "mt-1.5"
              }`}
            >
              {syncLabel}
            </span>
          </div>
        </div>

        {/* Right: compact strip (md+ scrolled) + mobile menu */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Compact export/saved strip — fades in when scrolled on md+ */}
          <div
            className={`hidden md:flex items-center gap-1.5 transition-all duration-300 ease-in-out ${
              exportMenuOpen ? "" : "overflow-hidden"
            } ${
              isScrolled ? "max-w-[120px] opacity-100 pointer-events-auto" : "max-w-0 opacity-0 pointer-events-none"
            }`}
          >
            <HeaderActionButton onClick={() => setSavedDrawerOpen(true)}>
              <FolderOpen size={14} />
            </HeaderActionButton>
            <div ref={exportMenuRef} className="relative">
              <button
                type="button"
                aria-expanded={exportMenuOpen}
                onClick={() => setExportMenuOpen((o) => !o)}
                className="inline-flex items-center justify-center gap-1 rounded-2xl px-2.5 py-1.5 text-xs font-semibold border border-violet-200 bg-violet-50 text-violet-700 shadow-sm hover:bg-violet-100 transition"
              >
                <Download size={13} />
                <ChevronDown size={11} className={`transition-transform duration-200 ${exportMenuOpen ? "rotate-180" : ""}`} />
              </button>
              <div
                className={`absolute right-0 z-50 mt-2 grid min-w-[220px] gap-2 rounded-[24px] border border-slate-200 bg-white p-3 shadow-lg ring-1 ring-slate-200/80 transition-all duration-200 ease-out ${
                  exportMenuOpen ? "translate-y-0 scale-100 opacity-100" : "pointer-events-none -translate-y-1 scale-[0.98] opacity-0"
                }`}
              >
                <ExportDropdownItems />
              </div>
            </div>
          </div>

          {/* Mobile overflow menu */}
          <div className="md:hidden shrink-0">
            <MobileOverflowMenu label={t.more}>
              <div className="px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{t.workspace}</div>
              <LanguageToggle language={language} onChange={setLanguage} t={t} exposeTestIds={false} />
              {isGalleryAdmin && (
                <HeaderActionButton onClick={openAdminPage} className="w-full justify-start">
                  <Shield size={16} /> {t.openModeration}
                </HeaderActionButton>
              )}
              <HeaderActionButton onClick={() => setSavedDrawerOpen(true)} className="w-full justify-start">
                <FolderOpen size={16} /> {t.savedDiagrams}
              </HeaderActionButton>
              <HeaderActionButton onClick={openGalleryPage} className="w-full justify-start">
                <LayoutGrid size={16} /> {t.openGallery}
              </HeaderActionButton>
              <HeaderActionButton onClick={startNewDiagram} className="w-full justify-start !text-pink-600">
                <FilePlus2 size={16} /> {t.newDiagram}
              </HeaderActionButton>
              <HeaderActionButton onClick={() => setTemplatesModalOpen(true)} className="w-full justify-start !text-blue-600">
                <Sparkles size={16} /> {t.templates}
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
              <HeaderActionButton variant="violet" className="w-full justify-start" onClick={downloadPdf} disabled={exportingPdf}>
                <Download size={16} /> {exportingPdf ? t.exporting : t.exportPdf}
              </HeaderActionButton>
              <HeaderActionButton variant="violet" className="w-full justify-start" onClick={downloadDocx} disabled={exportingDocx}>
                <Download size={16} /> {exportingDocx ? t.exporting : t.exportDocx}
              </HeaderActionButton>
              <HeaderActionButton variant="primary" className="w-full justify-start" onClick={() => window.print()}>
                <Printer size={16} /> {t.printDiagram}
              </HeaderActionButton>
              {authUiActive && (
                <>
                  <div className="mt-1 px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{t.session}</div>
                  <HeaderActionButton onClick={signOut} disabled={authSubmitting || !isAuthenticated} className="w-full justify-start">
                    <LogOut size={16} /> {authSubmitting ? t.signingOut : t.signOut}
                  </HeaderActionButton>
                </>
              )}
            </MobileOverflowMenu>
          </div>
        </div>
      </div>

      {/* ── Row 2: Full action buttons — smooth collapse via max-height ── */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          isScrolled 
            ? "max-h-0 opacity-0 mt-0 overflow-hidden" 
            : `max-h-24 opacity-100 mt-3 ${exportMenuOpen ? "" : "overflow-hidden"}`
        }`}
      >
        <div className="hidden md:flex flex-wrap items-center gap-2 xl:justify-end">
          {/* Workspace actions */}
          <div className="inline-flex items-center gap-2 rounded-2xl border border-white/70 bg-white/70 px-2 py-2">
            {isGalleryAdmin && (
              <HeaderActionButton onClick={openAdminPage}>
                <Shield size={16} /> {t.openModeration}
              </HeaderActionButton>
            )}
            <HeaderActionButton onClick={openGalleryPage}>
              <LayoutGrid size={16} /> {t.openGallery}
            </HeaderActionButton>
            <HeaderActionButton onClick={startNewDiagram} className="!text-pink-600">
              <FilePlus2 size={16} /> {t.newDiagram}
            </HeaderActionButton>
            <HeaderActionButton onClick={() => setTemplatesModalOpen(true)} className="!text-blue-600">
              <Sparkles size={16} /> {t.templates}
            </HeaderActionButton>
            {authUiActive && (
              <HeaderActionButton onClick={signOut} disabled={authSubmitting || !isAuthenticated}>
                <LogOut size={16} /> {authSubmitting ? t.signingOut : t.signOut}
              </HeaderActionButton>
            )}
          </div>

          {/* Export + language + saved */}
          <div className="flex items-center gap-2">
            <LanguageToggle language={language} onChange={setLanguage} t={t} exposeTestIds />
            <div ref={exportMenuRef2} className="relative">
              <button
                type="button"
                aria-expanded={exportMenuOpen}
                onClick={() => setExportMenuOpen((o) => !o)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold border border-violet-200 bg-violet-50 text-violet-700 shadow-sm hover:bg-violet-100 transition"
              >
                <Download size={16} />
                <span className="hidden md:inline">{t.exportAndCode}</span>
                <ChevronDown size={16} className={`transition-transform duration-200 ${exportMenuOpen ? "rotate-180" : ""}`} />
              </button>
              <div
                className={`absolute right-0 z-50 mt-2 grid min-w-[220px] gap-2 rounded-[24px] border border-slate-200 bg-white p-3 shadow-lg ring-1 ring-slate-200/80 transition-all duration-200 ease-out ${
                  exportMenuOpen ? "translate-y-0 scale-100 opacity-100" : "pointer-events-none -translate-y-1 scale-[0.98] opacity-0"
                }`}
              >
                <ExportDropdownItems />
              </div>
            </div>
            <HeaderActionButton variant="accent" onClick={() => setSavedDrawerOpen(true)}>
              <FolderOpen size={16} /> {t.savedDiagrams}
            </HeaderActionButton>
          </div>
        </div>
      </div>
    </nav>
  );
}
