import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Plus,
  Minus,
  Trash2,
  Copy,
  Download,
  Target,
  Layers,
  GitBranch,
  Lightbulb,
  BarChart3,
  Eye,
  Code2,
  Save,
  FolderOpen,
  RefreshCw,
  Database,
  FilePlus2,
  Mail,
  LogOut,
  Search,
  Pencil,
  Check,
  X,
  Star,
  Archive,
  ArchiveRestore,
  Link2,
  ExternalLink,
  History,
  RotateCcw,
  Maximize2,
  LayoutGrid,
  Upload,
  Flag,
  Shield,
  EyeOff,
  Undo2,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { isSupabaseConfigured, supabase, supabasePublishableKey, supabaseUrl } from "./src/supabaseClient.js";
import { Tooltip, IconActionButton } from "./src/components/tooltip.jsx";
import { HeaderActionButton, surfaceButtonClass } from "./src/components/actions.jsx";

import {
  SHARE_LINK_DURATION_MS,
  MAX_VERSION_HISTORY,
  MAX_AUTOSAVE_VERSIONS,
  PREVIEW_ZOOM_MIN,
  PREVIEW_ZOOM_MAX,
  PREVIEW_ZOOM_STEP,
  GALLERY_DISPLAY_NAME_STORAGE_KEY,
  WORKSPACE_INTRO_COLLAPSED_STORAGE_KEY,
  PREVIEW_VIEW_STORAGE_KEY,
  PREVIEW_ZOOM_STORAGE_KEY,
  defaultData,
} from "./src/utils/constants.js";

import {
  defaultDocumentTitle,
  defaultLanguage,
  translations,
} from "./src/utils/translations.js";

import {
  uid,
  getSavedDiagramSortOptions,
  getSavedDiagramScopeOptions,
  formatSavedDateTime,
  ensureDocumentMeta,
  updateDocumentPresentation,
  isPreviewAuthLayoutEnabled,
  buildExportFilename,
  getNextShareExpiry,
  isExpiredTimestamp,
  hasActiveShareLink,
  getSharedDiagramFunctionUrl,
  getPublicGalleryFunctionUrl,
  getAdminModerationFunctionUrl,
  getReportGalleryFunctionUrl,
  readGalleryDisplayName,
  readWorkspaceIntroCollapsed,
  readPreviewView,
  readPreviewZoom,
  buildGalleryDisplayName,
  readAppLocation,
  replaceAppLocation,
  sortSavedDiagrams,
  normalizeStoredDiagramData,
  hasRenderableDiagramData,
  resolveDiagramDataForEditor,
  buildDiagramSnapshot,
  getThumbnailMarkup,
  buildStoredThumbnailSvg,
  getStoredThumbnailMarkup,
  getCachedThumbnailMarkup,
} from "./src/utils/helpers.js";

import {
  buildMermaidCode,
  decodeMermaidText,
  normalizeNodeLabel,
  normalizeHeading,
  inferNodeType,
  escapeLooseXmlChars,
  sanitizeMermaidCode,
  parseNodeDefinitions,
  parseSubgraphMembership,
  parseEdges,
  findAssociatedKpis,
  parseMermaidCode,
  safeText,
  formatNodeLabel,
  escapeSvgText,
  wrapSvgText,
  buildTemplateSvg,
} from "./src/utils/mermaidParser.js";

import { StatusPill } from "./src/components/StatusPill.jsx";
import { TextAreaField } from "./src/components/TextAreaField.jsx";
import { LanguageToggle } from "./src/components/LanguageToggle.jsx";
import { CompactPageBar, MobileOverflowMenu } from "./src/components/CompactPageBar.jsx";
import { PreviewZoomControls } from "./src/components/PreviewZoomControls.jsx";
import { PreviewCanvas } from "./src/components/PreviewCanvas.jsx";
import { THEME_EMOJI, getThemeEmoji, DiagramThumbnail } from "./src/components/DiagramThumbnail.jsx";
import { AdminStatCard } from "./src/components/AdminStatCard.jsx";
import { AdminModerationCard } from "./src/components/AdminModerationCard.jsx";
import { PreviewModal } from "./src/components/PreviewModal.jsx";
import { WorkspaceMenubar } from "./src/components/WorkspaceMenubar.jsx";
import { SavedDiagramsDrawer } from "./src/components/SavedDiagramsDrawer.jsx";
import { useUIStore } from "./src/store/useUIStore.js";
import { useAuthStore } from "./src/store/useAuthStore.js";
import { useDiagramStore } from "./src/store/useDiagramStore.js";

const workbenchPanelClass = "rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm ring-1 ring-slate-200/80";
const workbenchMutedPanelClass = "rounded-[24px] border border-slate-200 bg-slate-50 p-4 ring-1 ring-slate-200/70";
const sectionHeadingClass = "text-[20px] font-bold leading-[1.3] text-slate-950";
const sectionBodyClass = "text-sm leading-6 text-slate-600";

function App() {
  // --- UI Store Hooks ---
  const language = useUIStore((state) => state.language);
  const setLanguage = useUIStore((state) => state.setLanguage);
  const routeState = useUIStore((state) => state.routeState);
  const setRouteState = useUIStore((state) => state.setRouteState);
  const view = useUIStore((state) => state.view);
  const setView = useUIStore((state) => state.setView);
  const previewZoom = useUIStore((state) => state.previewZoom);
  const setPreviewZoom = useUIStore((state) => state.setPreviewZoom);
  const zoomIn = useUIStore((state) => state.zoomIn);
  const zoomOut = useUIStore((state) => state.zoomOut);
  const resetZoom = useUIStore((state) => state.resetZoom);
  const previewModalOpen = useUIStore((state) => state.previewModalOpen);
  const setPreviewModalOpen = useUIStore((state) => state.setPreviewModalOpen);
  const savedDrawerOpen = useUIStore((state) => state.savedDrawerOpen);
  const setSavedDrawerOpen = useUIStore((state) => state.setSavedDrawerOpen);
  const savedSearch = useUIStore((state) => state.savedSearch);
  const setSavedSearch = useUIStore((state) => state.setSavedSearch);
  const savedSort = useUIStore((state) => state.savedSort);
  const setSavedSort = useUIStore((state) => state.setSavedSort);
  const savedScope = useUIStore((state) => state.savedScope);
  const setSavedScope = useUIStore((state) => state.setSavedScope);
  const workspaceIntroCollapsed = useUIStore((state) => state.workspaceIntroCollapsed);
  const setWorkspaceIntroCollapsed = useUIStore((state) => state.setWorkspaceIntroCollapsed);
  
  const openGalleryPage = useUIStore((state) => state.openGalleryPage);
  const openAdminPage = useUIStore((state) => state.openAdminPage);
  const exitGalleryPage = useUIStore((state) => state.exitGalleryPage);
  const exitAdminPage = useUIStore((state) => state.exitAdminPage);
  const exitSharedView = useUIStore((state) => state.exitSharedView);

  // --- Auth Store Hooks ---
  const session = useAuthStore((state) => state.session);
  const currentUser = useAuthStore((state) => state.currentUser);
  const authLoading = useAuthStore((state) => state.authLoading);
  const authVerifyingLink = useAuthStore((state) => state.authVerifyingLink);
  const authEmail = useAuthStore((state) => state.authEmail);
  const setAuthEmail = useAuthStore((state) => state.setAuthEmail);
  const authSubmitting = useAuthStore((state) => state.authSubmitting);
  const authMessage = useAuthStore((state) => state.authMessage);
  const setAuthMessage = useAuthStore((state) => state.setAuthMessage);
  const authError = useAuthStore((state) => state.authError);
  const setAuthError = useAuthStore((state) => state.setAuthError);
  const galleryDisplayName = useAuthStore((state) => state.galleryDisplayName);
  const galleryDisplayNameDraft = useAuthStore((state) => state.galleryDisplayNameDraft);
  const setGalleryDisplayNameDraft = useAuthStore((state) => state.setGalleryDisplayNameDraft);
  const editingGalleryDisplayName = useAuthStore((state) => state.editingGalleryDisplayName);
  const setEditingGalleryDisplayName = useAuthStore((state) => state.setEditingGalleryDisplayName);
  const isGalleryAdmin = useAuthStore((state) => state.isGalleryAdmin);
  
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const requestMagicLink = useAuthStore((state) => state.requestMagicLink);
  const signOut = useAuthStore((state) => state.signOut);
  const saveGalleryDisplayName = useAuthStore((state) => state.saveGalleryDisplayName);

  // --- Diagram Store Hooks ---
  const data = useDiagramStore((state) => state.data);
  const setData = useDiagramStore((state) => state.setData);
  const documentTitle = useDiagramStore((state) => state.documentTitle);
  const setDocumentTitle = useDiagramStore((state) => state.setDocumentTitle);
  const currentDiagramId = useDiagramStore((state) => state.currentDiagramId);
  const codeInput = useDiagramStore((state) => state.codeInput);
  const setCodeInput = useDiagramStore((state) => state.setCodeInput);
  const codeSyncError = useDiagramStore((state) => state.codeSyncError);
  const codeSyncMessage = useDiagramStore((state) => state.codeSyncMessage);
  const svg = useDiagramStore((state) => state.svg);
  const setSvg = useDiagramStore((state) => state.setSvg);
  const renderError = useDiagramStore((state) => state.renderError);
  const setRenderError = useDiagramStore((state) => state.setRenderError);
  
  const savedDiagrams = useDiagramStore((state) => state.savedDiagrams);
  const loadingSavedDiagrams = useDiagramStore((state) => state.loadingSavedDiagrams);
  const savingDiagram = useDiagramStore((state) => state.savingDiagram);
  const autoSaveState = useDiagramStore((state) => state.autoSaveState);
  
  const openingDiagramId = useDiagramStore((state) => state.openingDiagramId);
  const deletingDiagramId = useDiagramStore((state) => state.deletingDiagramId);
  const duplicatingDiagramId = useDiagramStore((state) => state.duplicatingDiagramId);
  const renamingDiagramId = useDiagramStore((state) => state.renamingDiagramId);
  const renameDraft = useDiagramStore((state) => state.renameDraft);
  const renamingDiagram = useDiagramStore((state) => state.renamingDiagram);
  const sharingDiagramId = useDiagramStore((state) => state.sharingDiagramId);
  const gallerySubmittingId = useDiagramStore((state) => state.gallerySubmittingId);
  const storageMessage = useDiagramStore((state) => state.storageMessage);
  const storageError = useDiagramStore((state) => state.storageError);
  const setStorageError = useDiagramStore((state) => state.setStorageError);
  const copied = useDiagramStore((state) => state.copied);
  const exportingDocx = useDiagramStore((state) => state.exportingDocx);
  const exportError = useDiagramStore((state) => state.exportError);

  const sharedView = useDiagramStore((state) => state.sharedView);
  const sharedViewLoading = useDiagramStore((state) => state.sharedViewLoading);
  const sharedViewError = useDiagramStore((state) => state.sharedViewError);
  const sharedOpenedAt = useDiagramStore((state) => state.sharedOpenedAt);
  const lastSharedUrl = useDiagramStore((state) => state.lastSharedUrl);

  const galleryItems = useDiagramStore((state) => state.galleryItems);
  const galleryLoading = useDiagramStore((state) => state.galleryLoading);
  const galleryError = useDiagramStore((state) => state.galleryError);
  const reportingGalleryToken = useDiagramStore((state) => state.reportingGalleryToken);
  const galleryHasMore = useDiagramStore((state) => state.galleryHasMore);

  const adminQueue = useDiagramStore((state) => state.adminQueue);
  const adminUsers = useDiagramStore((state) => state.adminUsers);
  const adminLoading = useDiagramStore((state) => state.adminLoading);
  const adminError = useDiagramStore((state) => state.adminError);
  const adminHasMore = useDiagramStore((state) => state.adminHasMore);
  const moderationActionToken = useDiagramStore((state) => state.moderationActionToken);
  const adminEmailDraft = useDiagramStore((state) => state.adminEmailDraft);
  const setAdminEmailDraft = useDiagramStore((state) => state.setAdminEmailDraft);
  const adminUserAction = useDiagramStore((state) => state.adminUserAction);

  const versionHistory = useDiagramStore((state) => state.versionHistory);
  const loadingVersionHistory = useDiagramStore((state) => state.loadingVersionHistory);
  const restoringVersionId = useDiagramStore((state) => state.restoringVersionId);
  const restoringAndSavingVersionId = useDiagramStore((state) => state.restoringAndSavingVersionId);

  // --- Diagram Store Actions ---
  const copyMermaid = useDiagramStore((state) => state.copyMermaid);
  const downloadMermaid = useDiagramStore((state) => state.downloadMermaid);
  const downloadSvg = useDiagramStore((state) => state.downloadSvg);
  const downloadPng = useDiagramStore((state) => state.downloadPng);
  const downloadDocx = useDiagramStore((state) => state.downloadDocx);
  const applyCodeToForm = useDiagramStore((state) => state.applyCodeToForm);
  const handleCodeInputChange = useDiagramStore((state) => state.handleCodeInputChange);
  
  const addPrimary = useDiagramStore((state) => state.addPrimary);
  const updatePrimary = useDiagramStore((state) => state.updatePrimary);
  const removePrimary = useDiagramStore((state) => state.removePrimary);
  const addSecondary = useDiagramStore((state) => state.addSecondary);
  const updateSecondary = useDiagramStore((state) => state.updateSecondary);
  const removeSecondary = useDiagramStore((state) => state.removeSecondary);
  const addChange = useDiagramStore((state) => state.addChange);
  const updateChange = useDiagramStore((state) => state.updateChange);
  const removeChange = useDiagramStore((state) => state.removeChange);
  
  const loadSavedDiagrams = useDiagramStore((state) => state.loadSavedDiagrams);
  const storeStartNewDiagram = useDiagramStore((state) => state.startNewDiagram);
  const cancelRenamingDiagram = useDiagramStore((state) => state.cancelRenamingDiagram);
  const startRenamingDiagram = useDiagramStore((state) => state.startRenamingDiagram);
  const renameDiagram = useDiagramStore((state) => state.renameDiagram);
  const duplicateDiagram = useDiagramStore((state) => state.duplicateDiagram);
  const toggleFavoriteDiagram = useDiagramStore((state) => state.toggleFavoriteDiagram);
  const toggleArchiveDiagram = useDiagramStore((state) => state.toggleArchiveDiagram);
  const openDiagram = useDiagramStore((state) => state.openDiagram);
  const deleteDiagram = useDiagramStore((state) => state.deleteDiagram);
  const refreshVersionHistory = useDiagramStore((state) => state.refreshVersionHistory);
  const restoreVersion = useDiagramStore((state) => state.restoreVersion);
  
  const shareDiagram = useDiagramStore((state) => state.shareDiagram);
  const revokeShareDiagram = useDiagramStore((state) => state.revokeShareDiagram);
  const toggleGallerySubmission = useDiagramStore((state) => state.toggleGallerySubmission);
  
  const fetchSharedDiagram = useDiagramStore((state) => state.fetchSharedDiagram);
  const fetchPublicGallery = useDiagramStore((state) => state.fetchPublicGallery);
  const loadMoreGalleryItems = useDiagramStore((state) => state.loadMoreGalleryItems);
  const reportGalleryItem = useDiagramStore((state) => state.reportGalleryItem);
  
  const fetchAdminQueue = useDiagramStore((state) => state.fetchAdminQueue);
  const loadMoreAdminQueue = useDiagramStore((state) => state.loadMoreAdminQueue);
  const runModerationAction = useDiagramStore((state) => state.runModerationAction);
  const updateAdminUsers = useDiagramStore((state) => state.updateAdminUsers);
  const saveDiagram = useDiagramStore((state) => state.saveDiagram);
  const resetStorageNotice = useDiagramStore((state) => state.resetStorageNotice);

  const lastSavedSnapshot = useDiagramStore((state) => state.lastSavedSnapshot);

  // --- Local Refs ---
  const renderId = useRef(0);
  const mermaidRef = useRef(null);
  const mermaidInitialized = useRef(false);
  const purposeTitleInputRef = useRef(null);

  // --- Local UI States ---
  const [gallerySearch, setGallerySearch] = useState("");

  // --- Derived Memos & Translations ---
  const t = translations[language] || translations[defaultLanguage];
  const isAuthenticated = Boolean(currentUser?.id);
  const previewAuthEnabled = useMemo(
    () => !isAuthenticated && isPreviewAuthLayoutEnabled(),
    [isAuthenticated]
  );
  const authUiActive = isAuthenticated || previewAuthEnabled;
  const authUiEmail = currentUser?.email || session?.user?.email || (previewAuthEnabled ? "preview.user@example.com" : t.signedInUser);
  const isReadOnlySharedView = Boolean(sharedView);
  const isGalleryView = routeState.gallery && !routeState.shareId;
  const isAdminView = routeState.admin && !routeState.shareId;
  const isWorkspaceView = !routeState.shareId && !routeState.gallery && !routeState.admin;
  
  const ownedGalleryByShareToken = useMemo(
    () =>
      new Map(
        savedDiagrams
          .filter((item) => item.share_id)
          .map((item) => [item.share_id, item])
      ),
    [savedDiagrams]
  );

  const currentSnapshot = useMemo(
    () => buildDiagramSnapshot(documentTitle, data, codeInput),
    [documentTitle, data, codeInput]
  );

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

  const filteredGalleryItems = useMemo(() => {
    const search = gallerySearch.trim().toLowerCase();
    const items = [...galleryItems].sort(
      (a, b) => new Date(b.gallery_submitted_at || b.shared_at || 0).getTime() - new Date(a.gallery_submitted_at || a.shared_at || 0).getTime()
    );

    if (!search) return items;

    return items.filter((item) =>
      `${item.title || ""}\n${item.purpose_title || ""}\n${item.gallery_submitter_name || ""}`.toLowerCase().includes(search)
    );
  }, [galleryItems, gallerySearch]);

  const visibleAdminQueue = useMemo(
    () => adminQueue.filter((item) => item.report_count > 0 || item.gallery_hidden_at),
    [adminQueue]
  );
  
  const adminReportedItems = useMemo(
    () => visibleAdminQueue.filter((item) => (item.report_count || 0) > 0 && !item.gallery_hidden_at),
    [visibleAdminQueue]
  );
  
  const adminHiddenItems = useMemo(
    () => visibleAdminQueue.filter((item) => Boolean(item.gallery_hidden_at)),
    [visibleAdminQueue]
  );
  
  const adminStats = useMemo(
    () => ({
      totalItems: visibleAdminQueue.length,
      reportedItems: adminReportedItems.length,
      hiddenItems: adminHiddenItems.length,
      openReports: visibleAdminQueue.reduce((total, item) => total + Number(item.report_count || 0), 0),
    }),
    [adminHiddenItems.length, adminReportedItems.length, visibleAdminQueue]
  );

  const diagramStats = useMemo(() => {
    const primaryCount = data.primaryDrivers.length;
    const secondaryCount = data.primaryDrivers.reduce((total, primary) => total + primary.secondaryDrivers.length, 0);
    const changeCount = data.primaryDrivers.reduce(
      (total, primary) =>
        total + primary.secondaryDrivers.reduce((branchTotal, secondary) => branchTotal + secondary.changeIdeas.length, 0),
      0
    );

    return { primaryCount, secondaryCount, changeCount };
  }, [data]);

  const mermaidCode = useMemo(() => buildMermaidCode(data), [data]);

  // --- Effects & Synchronizations ---

  // 1. Synchronize form data changes to Mermaid code (if using Form view)
  const codeSource = useDiagramStore((state) => state.codeSource);
  useEffect(() => {
    if (codeSource === "form") {
      setCodeInput(mermaidCode);
    }
  }, [mermaidCode, codeSource, setCodeInput]);

  // 2. Synchronize route drawer state with workspace view
  useEffect(() => {
    if (!isWorkspaceView) {
      setSavedDrawerOpen(false);
    }
  }, [isWorkspaceView, setSavedDrawerOpen]);

  // 3. Register pushstate route listener
  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const syncRoute = () => setRouteState(readAppLocation());
    window.addEventListener("popstate", syncRoute);
    return () => window.removeEventListener("popstate", syncRoute);
  }, [setRouteState]);

  // 4. Initialize Auth State Listener
  useEffect(() => {
    let unsub = null;
    const init = async () => {
      unsub = await initializeAuth((prevUser, nextUser) => {
        if (prevUser?.id !== nextUser?.id) {
          useDiagramStore.setState({
            currentDiagramId: "",
            savedDiagrams: [],
            autoSaveState: "idle",
            versionHistory: [],
            storageMessage: "",
            storageError: "",
          });
          cancelRenamingDiagram();
        }
      });
    };
    init();
    return () => {
      if (unsub) unsub();
    };
  }, [initializeAuth, cancelRenamingDiagram]);

  // 5. Load Saved Diagrams when User Logged In
  useEffect(() => {
    if (isAuthenticated) {
      loadSavedDiagrams();
    }
  }, [isAuthenticated, loadSavedDiagrams]);

  // 6. Auto-save Trigger Loop
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !isAuthenticated || !currentDiagramId) {
      return;
    }
    if (currentSnapshot === lastSavedSnapshot) {
      return;
    }
    if (savingDiagram || loadingSavedDiagrams || openingDiagramId || deletingDiagramId) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      saveDiagram({ isAuto: true });
    }, 1500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [currentSnapshot, lastSavedSnapshot, currentDiagramId, deletingDiagramId, isAuthenticated, loadingSavedDiagrams, openingDiagramId, savingDiagram, saveDiagram]);

  // 7. Mermaid Render Canvas Loop
  useEffect(() => {
    let cancelled = false;
    const id = ++renderId.current;

    async function renderDiagram() {
      try {
        const sanitizedCode = sanitizeMermaidCode(codeInput);
        if (!mermaidRef.current) {
          const { default: mermaid } = await import("mermaid/dist/mermaid.esm.min.mjs");
          mermaidRef.current = mermaid;
        }

        if (!mermaidInitialized.current) {
          mermaidRef.current.initialize({
            startOnLoad: false,
            securityLevel: "strict",
            theme: "base",
            themeVariables: {
              fontFamily: "Inter, ui-sans-serif, system-ui",
              primaryBorderColor: "#cbd5e1",
              lineColor: "#64748b",
            },
          });
          mermaidInitialized.current = true;
        }

        const result = await mermaidRef.current.render(`driver-diagram-${id}`, sanitizedCode);
        if (!cancelled) {
          setSvg(result.svg);
          setRenderError("");
        }
      } catch (error) {
        if (!cancelled) {
          setSvg("");
          setRenderError(error?.message || "Mermaid render error");
        }
      }
    }

    renderDiagram();
    return () => {
      cancelled = true;
    };
  }, [codeInput, setSvg, setRenderError]);

  // 8. Shared Diagram Loader
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    const shareId = routeState.shareId;
    if (shareId) {
      fetchSharedDiagram(shareId);
    }
  }, [routeState.shareId, fetchSharedDiagram]);

  // 9. Gallery Items Loader
  useEffect(() => {
    fetchPublicGallery();
  }, [routeState.gallery, routeState.shareId, routeState.admin, fetchPublicGallery]);

  // 10. Admin Moderation Queue Loader
  useEffect(() => {
    fetchAdminQueue();
  }, [isAuthenticated, routeState.admin, routeState.shareId, fetchAdminQueue]);

  // 11. Version History Loader
  useEffect(() => {
    if (currentDiagramId && isAuthenticated) {
      refreshVersionHistory();
    }
  }, [currentDiagramId, isAuthenticated, refreshVersionHistory]);

  // 12. Dynamic Page Title Updates
  useEffect(() => {
    const sharedTitle = documentTitle || sharedView?.title || defaultDocumentTitle;

    if (sharedViewLoading) {
      updateDocumentPresentation({
        title: t.metaLoadingSharedTitle,
        description: t.metaLoadingSharedDescription,
      });
      return;
    }

    if (sharedViewError) {
      updateDocumentPresentation({
        title: t.metaUnavailableTitle,
        description: t.metaUnavailableDescription,
      });
      return;
    }

    if (isReadOnlySharedView) {
      updateDocumentPresentation({
        title: `${sharedTitle} | ${t.metaSharedTitleSuffix}`,
        description: t.metaSharedDescription,
      });
      return;
    }

    if (isGalleryView) {
      updateDocumentPresentation({
        title: t.galleryTitle,
        description: t.galleryDescription,
      });
      return;
    }

    if (isAdminView) {
      updateDocumentPresentation({
        title: t.adminModerationTitle,
        description: t.adminModerationDescription,
      });
      return;
    }

    updateDocumentPresentation({
      title: t.appTitle,
      description: t.metaAppDescription,
    });
  }, [documentTitle, isAdminView, isGalleryView, isReadOnlySharedView, sharedView, sharedViewError, sharedViewLoading, t]);

  // 13. Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isMod = e.metaKey || e.ctrlKey;
      
      // Ctrl/Cmd + S = Save
      if (isMod && e.key === 's') {
        e.preventDefault();
        saveDiagram();
      }
      
      // Ctrl/Cmd + N = New Diagram
      if (isMod && e.key === 'n') {
        e.preventDefault();
        useDiagramStore.getState().startNewDiagram();
      }
      
      // Ctrl/Cmd + Shift + E = Export Menu (if exists)
      if (isMod && e.shiftKey && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        const exportBtn = document.querySelector('[data-testid="export-menu-button"]');
        if (exportBtn) exportBtn.click();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveDiagram]);

  // --- Local Event Handlers ---
  const updatePurpose = (field, value) => {
    useDiagramStore.setState((state) => ({
      codeSource: "form",
      data: {
        ...state.data,
        purpose: {
          ...state.data.purpose,
          [field]: value
        }
      }
    }));
  };

  const zoomPreviewIn = () => zoomIn();
  const zoomPreviewOut = () => zoomOut();
  const resetPreviewZoom = () => resetZoom();

  const handlePreviewWheel = (event) => {
    if (!event.ctrlKey && !event.metaKey) return;

    event.preventDefault();
    const delta = -event.deltaY * 0.0015;
    setPreviewZoom(
      Math.min(PREVIEW_ZOOM_MAX, Math.max(PREVIEW_ZOOM_MIN, Number((previewZoom * Math.exp(delta)).toFixed(2))))
    );
  };

  const openPreviewModal = () => setPreviewModalOpen(true);
  const closePreviewModal = () => setPreviewModalOpen(false);

  const startEditingGalleryDisplayName = () => {
    setEditingGalleryDisplayName(true);
  };

  const cancelEditingGalleryDisplayName = () => {
    setEditingGalleryDisplayName(false);
  };

  const startNewDiagram = () => {
    storeStartNewDiagram();
    window.setTimeout(() => {
      purposeTitleInputRef.current?.focus();
    }, 0);
  };

  const handleSignIn = async (event) => {
    event.preventDefault();
    await requestMagicLink();
  };

  // --- Render Layouts ---

  if (sharedViewLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 text-slate-900">
        <div className="mx-auto max-w-5xl rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <div className="mb-4 flex justify-end">
            <LanguageToggle language={language} onChange={setLanguage} t={t} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{t.sharedViewTitle}</h1>
          <p className="mt-3 text-sm text-slate-500">{t.loadingSharedDiagram}</p>
        </div>
      </div>
    );
  }

  if (sharedViewError) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 text-slate-900">
        <div className="mx-auto max-w-5xl rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <div className="mb-4 flex justify-end">
            <LanguageToggle language={language} onChange={setLanguage} t={t} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{t.sharedViewTitle}</h1>
          <div className="mt-4 rounded-2xl bg-red-50 p-4 text-sm text-red-700">{sharedViewError}</div>
          {isAuthenticated ? (
            <Tooltip label={t.backToWorkspace}>
              <button
                onClick={exitSharedView}
                className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <ExternalLink size={16} /> {t.backToWorkspace}
              </button>
            </Tooltip>
          ) : null}
        </div>
      </div>
    );
  }

  if (isReadOnlySharedView) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 text-slate-900">
        <div className="mx-auto max-w-6xl space-y-4">
          <CompactPageBar
            eyebrow={t.sharedViewTitle}
            title={documentTitle}
            titleSuffix={<span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">{t.readOnlySharedLink}</span>}
            mobileOverflowLabel={t.more}
            desktopSecondary={<LanguageToggle language={language} onChange={setLanguage} t={t} />}
            desktopPrimary={isAuthenticated ? (
              <HeaderActionButton onClick={exitSharedView}>
                <ExternalLink size={16} /> {t.backToWorkspace}
              </HeaderActionButton>
            ) : null}
            mobileOverflow={
              <>
                <LanguageToggle language={language} onChange={setLanguage} t={t} exposeTestIds={false} />
                {isAuthenticated ? (
                  <HeaderActionButton onClick={exitSharedView} className="w-full justify-start">
                    <ExternalLink size={16} /> {t.backToWorkspace}
                  </HeaderActionButton>
                ) : null}
              </>
            }
            supportingContent={
              <>
                <p className="text-sm text-slate-500">{t.sharedReadOnlyDescription}</p>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  {sharedView?.shared_at ? <div className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-600">{t.shared}: {formatSavedDateTime(sharedView.shared_at, language)}</div> : null}
                  {sharedView?.share_expires_at ? <div className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-600">{t.expires}: {formatSavedDateTime(sharedView.share_expires_at, language)}</div> : null}
                  {sharedOpenedAt ? <div className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-600">{t.opened}: {formatSavedDateTime(sharedOpenedAt, language)}</div> : null}
                </div>
                {renderError ? <div className="rounded-2xl bg-red-50 p-3 text-sm text-red-700">{renderError}</div> : null}
                {exportError ? <div className="rounded-2xl bg-red-50 p-3 text-sm text-red-700">{exportError}</div> : null}
              </>
            }
          />

          <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{t.exportAndCode}</div>
                <p className="mt-1 text-sm text-slate-500">{t.exportHint}</p>
              </div>
              <div className="space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{t.copyMermaid}</div>
                  <Tooltip label={t.copyMermaid}>
                    <button onClick={copyMermaid} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 w-full sm:w-auto">
                      <Copy size={16} /> {copied ? t.copied : t.copyMermaid}
                    </button>
                  </Tooltip>
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{t.exportDiagram || 'Download'}</div>
                  <div className="flex flex-wrap gap-2">
                    <Tooltip label={t.exportMmd}>
                      <button onClick={downloadMermaid} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800">
                        <Download size={16} /> .mmd
                      </button>
                    </Tooltip>
                    <Tooltip label={t.exportSvg}>
                      <button onClick={downloadSvg} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700">
                        <Download size={16} /> .svg
                      </button>
                    </Tooltip>
                    <Tooltip label={t.exportPng}>
                      <button onClick={downloadPng} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-orange-700">
                        <Download size={16} /> .png
                      </button>
                    </Tooltip>
                    <Tooltip label={t.exportDocx}>
                      <button
                        onClick={downloadDocx}
                        disabled={exportingDocx}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-wait disabled:opacity-70"
                      >
                        <Download size={16} /> {exportingDocx ? t.exporting : ".docx"}
                      </button>
                    </Tooltip>
                  </div>
                </div>
            </div>
          </section>

          <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-bold">{t.output}</h2>
                <p className="mt-1 text-sm text-slate-500">{t.sharedOutputDescription}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {view === "preview" ? (
                  <PreviewZoomControls
                    zoom={previewZoom}
                    onZoomOut={zoomPreviewOut}
                    onZoomIn={zoomPreviewIn}
                    onReset={resetPreviewZoom}
                    labels={t}
                  />
                ) : null}
                {view === "preview" ? (
                  <Tooltip label={t.expand}>
                    <button
                      onClick={openPreviewModal}
                      className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                    >
                      <Maximize2 size={16} /> {t.expand}
                    </button>
                  </Tooltip>
                ) : null}
                <div className="inline-flex rounded-2xl bg-slate-100 p-1">
                <button
                  onClick={() => setView("preview")}
                  className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ${view === "preview" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
                >
                  <Eye size={16} /> {t.preview}
                </button>
                <button
                  onClick={() => setView("code")}
                  className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ${view === "code" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
                >
                  <Code2 size={16} /> {t.code}
                </button>
                </div>
              </div>
            </div>
            <div className="relative mt-4 min-h-[420px] rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div
                className={`absolute inset-4 transition-all duration-200 ease-out ${
                  view === "preview" ? "translate-y-0 scale-100 opacity-100" : "pointer-events-none translate-y-2 scale-[0.985] opacity-0"
                }`}
              >
                <PreviewCanvas svg={svg} renderError={renderError} zoom={previewZoom} onWheel={handlePreviewWheel} className="h-full" labels={t} />
              </div>
              <div
                className={`absolute inset-4 transition-all duration-200 ease-out ${
                  view === "code" ? "translate-y-0 scale-100 opacity-100" : "pointer-events-none translate-y-2 scale-[0.985] opacity-0"
                }`}
              >
                <textarea
                  value={codeInput}
                  readOnly
                  className="h-full min-h-[388px] w-full resize-none rounded-2xl border border-slate-200 bg-white p-4 font-mono text-sm text-slate-800 outline-none"
                />
              </div>
            </div>
          </section>
          <PreviewModal />
        </div>
      </div>
    );
  }

  if (isGalleryView) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 text-slate-900">
        <div className="mx-auto max-w-6xl space-y-4">
          <CompactPageBar
            eyebrow={t.openGallery}
            title={t.galleryTitle}
            mobileOverflowLabel={t.more}
            desktopSecondary={<LanguageToggle language={language} onChange={setLanguage} t={t} />}
            desktopPrimary={
              <HeaderActionButton onClick={exitGalleryPage}>
                <ExternalLink size={16} /> {t.backToWorkspace}
              </HeaderActionButton>
            }
            mobileOverflow={
              <>
                <HeaderActionButton onClick={exitGalleryPage} className="w-full justify-start">
                  <ExternalLink size={16} /> {t.backToWorkspace}
                </HeaderActionButton>
                <LanguageToggle language={language} onChange={setLanguage} t={t} exposeTestIds={false} />
              </>
            }
            supportingContent={
              <>
                <p className="text-sm text-slate-500">{t.galleryDescription}</p>
                <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <Search size={16} className="text-slate-400" />
                  <input
                    value={gallerySearch}
                    onChange={(e) => setGallerySearch(e.target.value)}
                    placeholder={t.gallerySearchPlaceholder}
                    data-testid="gallery-search-input"
                    className="min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none"
                  />
                </label>
              </>
            }
          />

          {galleryError ? <div className="rounded-3xl bg-red-50 p-4 text-sm text-red-700">{galleryError}</div> : null}

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {galleryLoading ? (
              <div className="rounded-3xl bg-white p-4 text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">{t.galleryLoading}</div>
            ) : filteredGalleryItems.length ? (
              filteredGalleryItems.map((item) => (
                <article key={item.share_token} className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                  <DiagramThumbnail
                    title={item.title || item.purpose_title || t.untitledDiagram}
                    thumbnailSvg={item.thumbnail_svg}
                    diagramData={item.diagram_data}
                    mermaidCode={item.mermaid_code}
                    className="mb-4"
                  />
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-semibold text-slate-900">{item.title || t.untitledDiagram}</h2>
                      <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-500">
                        {item.gallery_submitted_at ? (
                          <span className="rounded-full bg-slate-100 px-2.5 py-1">{t.gallerySubmitted}: {formatSavedDateTime(item.gallery_submitted_at, language)}</span>
                        ) : null}
                        {item.gallery_submitter_name ? (
                          <span className="rounded-full bg-slate-100 px-2.5 py-1">{t.galleryOwnerLabel}: {item.gallery_submitter_name}</span>
                        ) : null}
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">{t.inGallery}</span>
                  </div>
                  <p className="mt-3 line-clamp-4 text-sm leading-6 text-slate-600">{item.purpose_title || item.title || t.untitledDiagram}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Tooltip label={t.galleryOpenReadOnly}>
                      <a
                        href={`${window.location.pathname}?share=${item.share_token}`}
                        className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                      >
                        <ExternalLink size={16} /> {t.galleryOpenReadOnly}
                      </a>
                    </Tooltip>
                    {ownedGalleryByShareToken.get(item.share_token) ? (
                      <Tooltip label={t.removeFromGallery}>
                        <button
                          onClick={() =>
                            toggleGallerySubmission(ownedGalleryByShareToken.get(item.share_token), { publish: false })
                          }
                          disabled={gallerySubmittingId === ownedGalleryByShareToken.get(item.share_token)?.id}
                          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                        >
                          <Upload size={16} /> {t.removeFromGallery}
                        </button>
                      </Tooltip>
                    ) : null}
                    <Tooltip label={t.reportGallery}>
                      <button
                        onClick={() => reportGalleryItem(item)}
                        disabled={reportingGalleryToken === item.share_token}
                        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                      >
                        <Flag size={16} /> {reportingGalleryToken === item.share_token ? t.reporting : t.reportGallery}
                      </button>
                    </Tooltip>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-3xl bg-white p-4 text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">{t.galleryEmpty}</div>
            )}
          </section>
          {galleryHasMore ? (
            <div className="flex justify-center">
              <Tooltip label={t.loadMore}>
                <button
                  onClick={loadMoreGalleryItems}
                  disabled={galleryLoading}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  <RefreshCw size={16} className={galleryLoading ? "animate-spin" : ""} /> {t.loadMore}
                </button>
              </Tooltip>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  if (isAdminView) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 text-slate-900">
        <div className="mx-auto max-w-6xl space-y-4">
          <CompactPageBar
            eyebrow={t.openModeration}
            title={t.adminModerationTitle}
            mobileOverflowLabel={t.more}
            desktopSecondary={<LanguageToggle language={language} onChange={setLanguage} t={t} />}
            desktopPrimary={
              <HeaderActionButton onClick={exitAdminPage}>
                <ExternalLink size={16} /> {t.backToWorkspace}
              </HeaderActionButton>
            }
            mobileOverflow={
              <>
                <HeaderActionButton onClick={exitAdminPage} className="w-full justify-start">
                  <ExternalLink size={16} /> {t.backToWorkspace}
                </HeaderActionButton>
                <LanguageToggle language={language} onChange={setLanguage} t={t} exposeTestIds={false} />
              </>
            }
            supportingContent={<p className="text-sm text-slate-500">{t.adminModerationDescription}</p>}
          />

          {adminError ? <div className="rounded-3xl bg-red-50 p-4 text-sm text-red-700">{adminError}</div> : null}

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <AdminStatCard label={t.adminTotalItems} value={adminStats.totalItems} />
            <AdminStatCard label={t.adminReportedItems} value={adminStats.reportedItems} tone="rose" />
            <AdminStatCard label={t.adminHiddenItems} value={adminStats.hiddenItems} tone="amber" />
            <AdminStatCard label={t.adminOpenReports} value={adminStats.openReports} tone="blue" />
          </section>

          <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{t.adminUsersTitle}</h2>
                <p className="mt-1 text-sm text-slate-500">{t.adminUsersDescription}</p>
              </div>
              <div className="w-full max-w-xl">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="email"
                    value={adminEmailDraft}
                    onChange={(e) => setAdminEmailDraft(e.target.value)}
                    placeholder={t.adminEmailPlaceholder}
                    className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  />
                  <button
                    onClick={() => updateAdminUsers({ action: "add_admin", email: adminEmailDraft })}
                    disabled={!adminEmailDraft.trim() || adminUserAction === "add"}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                  >
                    <Shield size={16} /> {adminUserAction === "add" ? t.addingAdmin : t.addAdmin}
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {adminUsers.length ? (
                adminUsers.map((admin) => (
                  <div key={admin.user_id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-slate-900">{admin.email || admin.user_id}</div>
                        <div className="mt-1 text-xs text-slate-500">
                          {admin.created_at ? formatSavedDateTime(admin.created_at, language) : admin.user_id}
                        </div>
                      </div>
                      <Tooltip label={admin.user_id === currentUser?.id ? t.adminSelfRemoveBlocked : t.removeAdmin}>
                        <button
                          type="button"
                          aria-label={admin.user_id === currentUser?.id ? t.adminSelfRemoveBlocked : t.removeAdmin}
                          onClick={() => updateAdminUsers({ action: "remove_admin", userId: admin.user_id })}
                          disabled={adminUserAction === admin.user_id || admin.user_id === currentUser?.id}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                          <Trash2 size={14} /> {adminUserAction === admin.user_id ? t.removingAdmin : t.removeAdmin}
                        </button>
                      </Tooltip>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                  {t.adminUsersEmpty}
                </div>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{t.adminNeedsReview}</h2>
                <p className="mt-1 text-sm text-slate-500">{t.adminModerationDescription}</p>
              </div>
              <div className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-500 ring-1 ring-slate-200">
                {adminReportedItems.length} {t.shown}
              </div>
            </div>
            {adminLoading && !adminQueue.length ? (
              <div className="rounded-3xl bg-white p-4 text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">{t.adminQueueLoading}</div>
            ) : adminReportedItems.length ? (
              adminReportedItems.map((item) => (
                <AdminModerationCard
                  key={`reported-${item.share_token}`}
                  item={item}
                  t={t}
                  language={language}
                  moderationActionToken={moderationActionToken}
                  onModerate={runModerationAction}
                />
              ))
            ) : visibleAdminQueue.length ? (
              <div className="rounded-3xl bg-white p-4 text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">{t.adminNoReportedItems}</div>
            ) : (
              <div className="rounded-3xl bg-white p-4 text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">{t.adminQueueEmpty}</div>
            )}
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{t.adminHiddenSection}</h2>
                <p className="mt-1 text-sm text-slate-500">{t.hiddenFromGallery}</p>
              </div>
              <div className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-500 ring-1 ring-slate-200">
                {adminHiddenItems.length} {t.shown}
              </div>
            </div>
            {adminHiddenItems.length ? (
              adminHiddenItems.map((item) => (
                <AdminModerationCard
                  key={`hidden-${item.share_token}`}
                  item={item}
                  t={t}
                  language={language}
                  moderationActionToken={moderationActionToken}
                  onModerate={runModerationAction}
                />
              ))
            ) : (
              <div className="rounded-3xl bg-white p-4 text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">{t.adminNoHiddenItems}</div>
            )}
          </section>

          {adminHasMore ? (
            <div className="flex justify-center">
              <Tooltip label={t.loadMore}>
                <button
                  onClick={loadMoreAdminQueue}
                  disabled={adminLoading}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  <RefreshCw size={16} className={adminLoading ? "animate-spin" : ""} /> {t.loadMore}
                </button>
              </Tooltip>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-4">
        <WorkspaceMenubar />
        <header className="rounded-[28px] bg-gradient-to-br from-blue-50 via-sky-50 to-white p-4 shadow-sm ring-1 ring-blue-100 backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{t.workspaceOverview}</div>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">{t.appTitle}</h1>
            </div>
            <HeaderActionButton onClick={() => setWorkspaceIntroCollapsed(!workspaceIntroCollapsed)}>
              {workspaceIntroCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
              {workspaceIntroCollapsed ? t.expand : t.collapse}
            </HeaderActionButton>
          </div>

          <div
            className={`grid overflow-hidden transition-all duration-300 ease-out ${
              workspaceIntroCollapsed ? "mt-3 max-h-64 opacity-100" : "max-h-0 opacity-0 pointer-events-none"
            }`}
          >
            <div className="grid gap-2.5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <div className="min-w-0">
                <div className="truncate text-base font-semibold text-slate-900">{documentTitle.trim() || defaultDocumentTitle}</div>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  <StatusPill tone={isSupabaseConfigured ? "success" : "warning"} icon={<Database size={15} />}>
                    {isSupabaseConfigured ? t.supabaseConnected : t.supabaseEnvMissing}
                  </StatusPill>
                  <StatusPill tone={authUiActive ? "info" : "neutral"}>
                    {authUiActive
                      ? t.privateWorkspaceActive
                      : authVerifyingLink
                        ? t.verifyingLink
                        : authLoading
                          ? t.checkingSessionShort
                          : t.signInForCloudSave}
                  </StatusPill>
                  {isSupabaseConfigured && currentDiagramId ? (
                    <StatusPill tone={autoSaveState === "saving" ? "info" : autoSaveState === "dirty" ? "warning" : "neutral"}>
                      {autoSaveState === "saving"
                        ? t.autoSaving
                        : autoSaveState === "dirty"
                          ? t.unsavedChanges
                          : t.allChangesSaved}
                    </StatusPill>
                  ) : null}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm lg:min-w-[300px]">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{t.documentTitle}</div>
                <div className="mt-1.5 truncate text-sm font-semibold text-slate-900 sm:text-base">{documentTitle.trim() || defaultDocumentTitle}</div>
              </div>
            </div>
          </div>
          <div
            className={`grid overflow-hidden transition-all duration-300 ease-out ${
              workspaceIntroCollapsed ? "max-h-0 opacity-0 pointer-events-none" : "mt-3 max-h-[1600px] opacity-100"
            }`}
          >
            <div className="grid gap-3 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
              <div className="space-y-3">
                <div className="grid gap-2.5 md:grid-cols-3">
                  <div className="rounded-3xl border border-slate-200 bg-white p-3.5 shadow-sm">
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{t.document}</div>
                    <div className="mt-1.5 text-sm font-semibold text-slate-900 sm:text-base">{documentTitle.trim() || defaultDocumentTitle}</div>
                    <div className="mt-1.5 flex flex-wrap gap-1.5 text-xs text-slate-500">
                      <span className="rounded-full bg-white px-2.5 py-1 ring-1 ring-slate-200">{diagramStats.primaryCount} {t.primary}</span>
                      <span className="rounded-full bg-white px-2.5 py-1 ring-1 ring-slate-200">{diagramStats.secondaryCount} {t.secondary}</span>
                      <span className="rounded-full bg-white px-2.5 py-1 ring-1 ring-slate-200">{diagramStats.changeCount} {t.changeIdeas}</span>
                    </div>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-white p-3.5 shadow-sm">
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{t.workspace}</div>
                    <div className="mt-1.5 text-sm font-semibold text-slate-900 sm:text-base">
                      {authUiActive ? authUiEmail : t.privateCloudSave}
                    </div>
                    <p className="mt-1.5 text-sm leading-5 text-slate-500">
                      {authUiActive
                        ? t.privateCloudSaveSummaryActive
                        : t.privateCloudSaveSummaryInactive}
                    </p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-white p-3.5 shadow-sm">
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{t.session}</div>
                    <div className="mt-1.5 flex flex-wrap gap-2">
                      <StatusPill
                        tone={isSupabaseConfigured ? "success" : "warning"}
                        icon={<Database size={15} />}
                      >
                        {isSupabaseConfigured ? t.supabaseConnected : t.supabaseEnvMissing}
                      </StatusPill>
                      <StatusPill tone={authUiActive ? "info" : "neutral"}>
                        {authUiActive
                          ? t.privateWorkspaceActive
                          : authVerifyingLink
                            ? t.verifyingLink
                            : authLoading
                              ? t.checkingSessionShort
                              : t.signInForCloudSave}
                      </StatusPill>
                      {isSupabaseConfigured && currentDiagramId ? (
                        <StatusPill
                          tone={autoSaveState === "saving" ? "info" : autoSaveState === "dirty" ? "warning" : "neutral"}
                        >
                          {autoSaveState === "saving"
                            ? t.autoSaving
                            : autoSaveState === "dirty"
                              ? t.unsavedChanges
                              : t.allChangesSaved}
                        </StatusPill>
                      ) : null}
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                      {currentDiagramId ? `${t.currentId}: ${currentDiagramId.slice(0, 8)}` : t.newUnsavedDocument}
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-3.5 shadow-sm">
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{t.privateCloudSaveTitle}</div>
                        <p className="mt-1 max-w-3xl text-sm leading-5 text-slate-500">
                          {authUiActive
                            ? t.privateCloudSaveActive
                            : t.privateCloudSaveInactive}
                        </p>
                      </div>
                      {authUiActive ? (
                        <button
                          onClick={signOut}
                          disabled={authSubmitting || !isAuthenticated}
                          className="inline-flex items-center justify-center gap-2 self-start rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-100 disabled:cursor-wait disabled:opacity-70"
                        >
                          <LogOut size={16} /> {authSubmitting ? t.signingOut : t.signOut}
                        </button>
                      ) : null}
                    </div>

                    {authUiActive ? (
                      <div className="grid gap-2.5 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
                        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5">
                          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{t.signedInAs}</div>
                          <div className="mt-1.5 truncate text-sm font-semibold text-slate-900 sm:text-base">{authUiEmail}</div>
                          <div className="mt-1 text-xs text-slate-500">
                            {isAuthenticated ? t.privateWorkspaceActive : t.previewAuthOnly}
                          </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{t.galleryDisplayName}</div>
                              <div className="mt-1.5 truncate text-sm font-semibold text-slate-900 sm:text-base">
                                {galleryDisplayName || t.galleryDisplayNamePlaceholder}
                              </div>
                              <div className="mt-1 text-xs text-slate-500">{t.galleryDisplayNameHint}</div>
                            </div>
                            {!editingGalleryDisplayName ? (
                              <button
                                onClick={startEditingGalleryDisplayName}
                                className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                              >
                                <Pencil size={14} /> {t.changeDisplayName}
                              </button>
                            ) : null}
                          </div>
                          {editingGalleryDisplayName ? (
                            <div className="mt-2.5 space-y-2">
                              <input
                                value={galleryDisplayNameDraft}
                                onChange={(e) => setGalleryDisplayNameDraft(e.target.value)}
                                placeholder={t.galleryDisplayNamePlaceholder}
                                className="w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 placeholder:text-slate-400"
                              />
                              <div className="flex flex-wrap gap-2">
                                <button
                                  onClick={saveGalleryDisplayName}
                                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                                >
                                  <Check size={14} /> {t.save}
                                </button>
                                <button
                                  onClick={cancelEditingGalleryDisplayName}
                                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                  <X size={14} /> {t.cancel}
                                </button>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ) : (
                      <form className="space-y-2.5" onSubmit={handleSignIn}>
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <input
                            type="email"
                            value={authEmail}
                            onChange={(e) => {
                              setAuthEmail(e.target.value);
                              if (authError) {
                                setAuthError("");
                              }
                            }}
                            placeholder="you@example.com"
                            className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                          />
                          <button
                            type="submit"
                            disabled={authSubmitting || authLoading}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:cursor-wait disabled:opacity-70"
                          >
                            <Mail size={16} /> {authSubmitting ? t.sending : t.emailSignInLink}
                          </button>
                        </div>
                      </form>
                    )}

                    <div className="flex flex-col gap-2">
                      {authVerifyingLink ? (
                        <div className="rounded-2xl bg-blue-50 px-3 py-2.5 text-sm text-blue-700">{t.verifyingSignInLink}</div>
                      ) : authLoading ? (
                        <div className="rounded-2xl bg-slate-100 px-3 py-2.5 text-sm text-slate-600">{t.checkingSession}</div>
                      ) : null}

                      {!authUiActive && authMessage ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={requestMagicLink}
                            disabled={authSubmitting}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-100 disabled:cursor-wait disabled:opacity-70"
                          >
                            <RefreshCw size={16} className={authSubmitting ? "animate-spin" : ""} /> {t.resendLink}
                          </button>
                          <span className="text-xs text-slate-400">{t.resendHint}</span>
                        </div>
                      ) : null}

                      {!authUiActive ? <p className="text-xs text-slate-400">{t.redirectHint}</p> : null}
                      {previewAuthEnabled && !authUiActive ? (
                        <div className="rounded-2xl bg-amber-50 px-3 py-2.5 text-sm text-amber-700">
                          {t.previewAuthOnly}
                        </div>
                      ) : null}
                    </div>
                  </div>
                  {authError ? <div className="mt-3 rounded-2xl bg-red-50 px-3 py-2.5 text-sm text-red-700">{authError}</div> : null}
                  {!authError && authMessage ? (
                    <div className={`mt-3 rounded-2xl px-3 py-2.5 text-sm ${authUiActive ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"}`}>
                      {authMessage}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{t.documentTitle}</div>
                  <label className="mt-2 block space-y-2">
                    <span className="sr-only">{t.documentTitle}</span>
                  <input
                    value={documentTitle}
                    onChange={(e) => {
                      setDocumentTitle(e.target.value);
                      resetStorageNotice();
                    }}
                    data-testid="document-title-input"
                    placeholder={t.documentTitlePlaceholder}
                    tabIndex={1}
                    onFocus={(e) => e.target.select()}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  />
                  </label>
                  <p className="mt-2 text-xs leading-5 text-slate-500">{t.documentTitleHint}</p>
                </div>
              </div>
            </div>
          </div>
          {storageError ? <div className="mt-3 rounded-2xl bg-red-50 p-3 text-sm text-red-700">{storageError}</div> : null}
          {!storageError && storageMessage ? (
            <div className="mt-3 rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-700">
              <div>{storageMessage}</div>
              {lastSharedUrl ? (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <a
                    href={lastSharedUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                  >
                    <ExternalLink size={14} /> {t.openSharedView}
                  </a>
                  <span className="truncate text-xs text-emerald-800">{lastSharedUrl}</span>
                </div>
              ) : null}
            </div>
          ) : null}
          {exportError ? <div className="mt-3 rounded-2xl bg-red-50 p-3 text-sm text-red-700">{exportError}</div> : null}
        </header>

        <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="min-w-0 space-y-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="rounded-[24px] border border-pink-100 bg-pink-50 p-4 shadow-sm ring-1 ring-pink-100/70">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h2 className="text-base font-bold text-pink-950">{t.purposeOutcomeKpi}</h2>
                  <p className="mt-1 text-sm text-pink-800/75">{t.purposeDescription}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-white/80 px-3 py-1.5 text-xs font-semibold text-pink-700 ring-1 ring-pink-100">
                    {t.topLevelGoal}
                  </div>
                  <HeaderActionButton
                    variant="primary"
                    onClick={saveDiagram}
                    disabled={savingDiagram || !isAuthenticated}
                    data-testid="save-diagram-button"
                  >
                    <Save size={16} /> {savingDiagram ? t.saving : t.saveDiagram}
                  </HeaderActionButton>
                </div>
              </div>
              <TextAreaField label={t.purpose} value={data.purpose.title} onChange={(v) => updatePurpose("title", v)} icon={<Target size={16} />} testId="purpose-title-input" inputRef={purposeTitleInputRef} tabIndex={2} />
              <div className="mt-3">
                <TextAreaField label={t.purposeKpi} value={data.purpose.kpi} onChange={(v) => updatePurpose("kpi", v)} icon={<BarChart3 size={16} />} testId="purpose-kpi-input" tabIndex={3} />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className={sectionHeadingClass}>{t.primaryDrivers}</h2>
                <p className={sectionBodyClass}>{t.primaryDriversDescription}</p>
              </div>
              <HeaderActionButton variant="success" onClick={addPrimary} data-testid="add-primary-button">
                <Plus size={16} /> {t.addPrimary}
              </HeaderActionButton>
            </div>

            {data.primaryDrivers.map((pd, pi) => (
              <div key={pd.id} className="space-y-3 rounded-[24px] border border-blue-100 bg-blue-50 p-4 shadow-sm ring-1 ring-blue-100/70">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="font-bold text-blue-900">{t.primaryDriver} {pi + 1}</div>
                    <div className="text-xs text-blue-800/70">{t.primaryDriverHelp}</div>
                  </div>
                  <IconActionButton label={t.deletePermanently} onClick={() => removePrimary(pi)} className="rounded-xl p-2 text-red-600 hover:bg-red-50">
                    <Trash2 size={16} />
                  </IconActionButton>
                </div>
                <TextAreaField label={t.primaryDriverName} value={pd.title} onChange={(v) => updatePrimary(pi, "title", v)} icon={<Layers size={16} />} testId={pi === 0 ? "primary-title-input-0" : `primary-title-input-${pd.id}`} tabIndex={4 + pi * 6} />
                <TextAreaField label={t.primaryKpi} value={pd.kpi} onChange={(v) => updatePrimary(pi, "kpi", v)} icon={<BarChart3 size={16} />} tabIndex={5 + pi * 6} />

                <HeaderActionButton variant="accent" onClick={() => addSecondary(pi)}>
                  <Plus size={16} /> {t.addSecondary}
                </HeaderActionButton>

                {pd.secondaryDrivers.map((sd, si) => (
                  <div key={sd.id} className="ml-0 space-y-3 rounded-[24px] border border-amber-100 bg-amber-50 p-4 shadow-sm ring-1 ring-amber-100/70 md:ml-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-amber-900">{t.secondaryDriver} {si + 1}</div>
                        <div className="text-xs text-amber-800/70">{t.secondaryDriverHelp}</div>
                      </div>
                      <IconActionButton label={t.deletePermanently} onClick={() => removeSecondary(pi, si)} className="rounded-xl p-2 text-red-600 hover:bg-red-50">
                        <Trash2 size={16} />
                      </IconActionButton>
                    </div>
                    <TextAreaField label={t.secondaryDriverName} value={sd.title} onChange={(v) => updateSecondary(pi, si, "title", v)} icon={<GitBranch size={16} />} testId={`secondary-title-input-${sd.id}`} tabIndex={6 + pi * 6 + si * 4} />
                    <TextAreaField label={t.secondaryKpi} value={sd.kpi} onChange={(v) => updateSecondary(pi, si, "kpi", v)} icon={<BarChart3 size={16} />} tabIndex={7 + pi * 6 + si * 4} />

                    <button onClick={() => addChange(pi, si)} className="inline-flex items-center gap-2 rounded-2xl bg-orange-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-700">
                      <Plus size={16} /> {t.addChangeIdea}
                    </button>

                    {sd.changeIdeas.map((ci, cii) => (
                      <div key={ci.id} className="ml-0 space-y-3 rounded-[24px] border border-orange-100 bg-orange-50/40 p-4 shadow-sm ring-1 ring-orange-100/80 md:ml-5">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-bold text-orange-900">{t.changeIdea} {cii + 1}</div>
                            <div className="text-xs text-orange-800/70">{t.changeIdeaHelp}</div>
                          </div>
                          <IconActionButton label={t.deletePermanently} onClick={() => removeChange(pi, si, cii)} className="rounded-xl p-2 text-red-600 hover:bg-red-50">
                            <Trash2 size={16} />
                          </IconActionButton>
                        </div>
                        <TextAreaField label={t.changeIdeaName} value={ci.title} onChange={(v) => updateChange(pi, si, cii, "title", v)} icon={<Lightbulb size={16} />} testId={`change-title-input-${ci.id}`} tabIndex={8 + pi * 6 + si * 4 + cii * 2} />
                        <TextAreaField label={t.changeKpi} value={ci.kpi} onChange={(v) => updateChange(pi, si, cii, "kpi", v)} icon={<BarChart3 size={16} />} tabIndex={9 + pi * 6 + si * 4 + cii * 2} />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </section>

          <section className={`min-w-0 lg:h-[74vh] xl:h-[70vh] ${workbenchPanelClass}`}>
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className={sectionHeadingClass}>{t.output}</h2>
                <p className={`mt-1 ${sectionBodyClass}`}>{t.outputDescription}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                <div className="flex rounded-2xl bg-slate-50 p-1 ring-1 ring-slate-200">
                <button
                  onClick={() => setView("preview")}
                  data-testid="preview-tab-button"
                  className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ${view === "preview" ? "bg-white text-slate-950 shadow-sm ring-1 ring-slate-200" : "text-slate-500"}`}
                >
                  <Eye size={16} /> {t.preview}
                </button>
                <button
                  onClick={() => setView("code")}
                  data-testid="code-tab-button"
                  className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ${view === "code" ? "bg-white text-slate-950 shadow-sm ring-1 ring-slate-200" : "text-slate-500"}`}
                >
                  <Code2 size={16} /> {t.code}
                </button>
                </div>
                {view === "preview" ? (
                  <PreviewZoomControls
                    zoom={previewZoom}
                    onZoomOut={zoomPreviewOut}
                    onZoomIn={zoomPreviewIn}
                    onReset={resetPreviewZoom}
                    labels={t}
                  />
                ) : null}
                {view === "preview" ? (
                  <button
                    onClick={openPreviewModal}
                    data-testid="open-preview-modal-button"
                    className={`inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold ${surfaceButtonClass}`}
                  >
                    <Maximize2 size={16} /> {t.expand}
                  </button>
                ) : null}
              </div>
            </div>

            <div className="relative min-h-[20rem] lg:h-[61vh] xl:h-[57vh]">
              <div
                data-testid="preview-panel"
                className={`absolute inset-0 overflow-auto rounded-[24px] border border-slate-200 bg-slate-50 p-4 ring-1 ring-slate-200/70 transition-all duration-200 ease-out ${
                  view === "preview" ? "translate-y-0 scale-100 opacity-100" : "pointer-events-none translate-y-2 scale-[0.985] opacity-0"
                }`}
              >
                <PreviewCanvas svg={svg} renderError={renderError} zoom={previewZoom} onWheel={handlePreviewWheel} className="h-full" labels={t} />
              </div>
              <div
                className={`absolute inset-0 flex flex-col gap-3 transition-all duration-200 ease-out ${
                  view === "code" ? "translate-y-0 scale-100 opacity-100" : "pointer-events-none translate-y-2 scale-[0.985] opacity-0"
                }`}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className={sectionBodyClass}>{t.editMermaidHint}</p>
                  <button
                    onClick={applyCodeToForm}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
                  >
                    {t.applyToForm}
                  </button>
                </div>
                {codeSyncError ? <div className="rounded-2xl bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-100">{codeSyncError}</div> : null}
                {!codeSyncError && codeSyncMessage ? <div className="rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-700 ring-1 ring-emerald-100">{codeSyncMessage}</div> : null}
                <textarea
                  value={codeInput}
                  onChange={(e) => handleCodeInputChange(e.target.value)}
                  spellCheck={false}
                  data-testid="mermaid-code-input"
                  className="min-h-0 w-full flex-1 overflow-auto rounded-3xl bg-slate-950 p-4 font-mono text-xs leading-relaxed text-slate-100 outline-none ring-1 ring-slate-800"
                />
              </div>
            </div>

            <div className={`mt-4 ${workbenchMutedPanelClass}`}>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-slate-900">{t.versionHistory}</h2>
                  <p className="mt-0.5 line-clamp-2 text-sm leading-6 text-slate-500">{t.versionHistoryDescription}</p>
                </div>
                <div className="inline-flex w-fit max-w-full shrink-0 items-center rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-500 ring-1 ring-slate-200">
                  {currentDiagramId ? `${versionHistory.length} ${t.versions}` : t.openSavedDiagram}
                </div>
              </div>
              <div className="mt-3 space-y-2">
                {!isAuthenticated ? (
                  <div className="rounded-2xl bg-white p-3 text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
                    {t.signInForVersionHistory}
                  </div>
                ) : !currentDiagramId ? (
                  <div className="rounded-2xl bg-white p-3 text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
                    {t.openSavedFirst}
                  </div>
                ) : loadingVersionHistory ? (
                  <div className="rounded-2xl bg-white p-3 text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
                    {t.loadingVersionHistory}
                  </div>
                ) : versionHistory.length ? (
                  versionHistory.map((version) => (
                    <div key={version.id} className="flex flex-col gap-2 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <History size={14} className="text-slate-400" />
                          <div className="truncate font-semibold text-slate-900">{version.title || documentTitle || defaultDocumentTitle}</div>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium uppercase text-slate-600">
                            {version.save_source}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {t.saved}: {formatSavedDateTime(version.created_at, language)}
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <button
                          onClick={() => restoreVersion(version)}
                          disabled={restoringVersionId === version.id || restoringAndSavingVersionId === version.id}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
                        >
                          <History size={14} /> {restoringVersionId === version.id ? t.restoring : t.loadToEditor}
                        </button>
                        <button
                          onClick={() => restoreVersion(version, { saveImmediately: true })}
                          disabled={restoringVersionId === version.id || restoringAndSavingVersionId === version.id}
                          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:cursor-wait disabled:opacity-60"
                        >
                          <RefreshCw size={14} /> {restoringAndSavingVersionId === version.id ? t.saving : t.restoreAndSave}
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl bg-white p-3 text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
                    {t.noVersions}
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
        <SavedDiagramsDrawer />
        <PreviewModal />
        <footer className="border-t border-slate-200 px-2 pt-2 pb-6 text-xs text-slate-500">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>© 2026 tpromsom@gmail.com</div>
            <a
              href="mailto:tpromsom@gmail.com?subject=Driver%20Diagram%20Support"
              className="inline-flex w-fit items-center gap-2 font-medium text-slate-600 transition hover:text-slate-900"
            >
              แจ้งปัญหาการใช้งาน
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
