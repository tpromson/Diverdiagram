import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Plus,
  Minus,
  Trash2,
  Copy,
  Printer,
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
  User,
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
  Users,
  UserPlus,
  ListCollapse,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { isSupabaseConfigured, supabase, supabasePublishableKey, supabaseUrl } from "./src/supabaseClient.js";
import { Tooltip, IconActionButton } from "./src/components/tooltip.jsx";
import { HeaderActionButton, surfaceButtonClass } from "./src/components/actions.jsx";
import { PrintReport } from "./src/components/PrintReport.jsx";


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
  focusNextInput,
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
import { TemplatesModal } from "./src/components/TemplatesModal.jsx";
import { useUIStore } from "./src/store/useUIStore.js";
import { useAuthStore } from "./src/store/useAuthStore.js";
import { useDiagramStore } from "./src/store/useDiagramStore.js";

const workbenchPanelClass = "rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm ring-1 ring-slate-200/80";
const workbenchMutedPanelClass = "rounded-[24px] border border-slate-200 bg-slate-50 p-4 ring-1 ring-slate-200/70";
const sectionHeadingClass = "text-[20px] font-bold leading-[1.3] text-slate-950";
const sectionBodyClass = "text-sm leading-6 text-slate-600";

function mergeDiagramData(base, local, external) {
  if (!base) return JSON.parse(JSON.stringify(external));
  
  const merged = JSON.parse(JSON.stringify(external)); // start with external structure

  // 1. Merge purpose
  if (local.purpose && base.purpose) {
    if (local.purpose.title !== base.purpose.title) {
      merged.purpose.title = local.purpose.title;
    }
    if (local.purpose.kpi !== base.purpose.kpi) {
      merged.purpose.kpi = local.purpose.kpi;
    }
  }

  // 2. Merge primary drivers
  if (local.primaryDrivers && base.primaryDrivers) {
    local.primaryDrivers.forEach((localPd) => {
      const extPd = merged.primaryDrivers.find(p => p.id === localPd.id);
      const basePd = base.primaryDrivers.find(p => p.id === localPd.id);
      const baseTitle = basePd ? basePd.title : "";
      const baseKpi = basePd ? basePd.kpi : "";

      if (extPd) {
        if (localPd.title !== baseTitle) {
          extPd.title = localPd.title;
        }
        if (localPd.kpi !== baseKpi) {
          extPd.kpi = localPd.kpi;
        }

        // Merge secondary drivers
        if (localPd.secondaryDrivers && basePd && basePd.secondaryDrivers) {
          localPd.secondaryDrivers.forEach((localSd) => {
            const extSd = extPd.secondaryDrivers.find(s => s.id === localSd.id);
            const baseSd = basePd.secondaryDrivers.find(s => s.id === localSd.id);
            const baseSdTitle = baseSd ? baseSd.title : "";
            const baseSdKpi = baseSd ? baseSd.kpi : "";

            if (extSd) {
              if (localSd.title !== baseSdTitle) {
                extSd.title = localSd.title;
              }
              if (localSd.kpi !== baseSdKpi) {
                extSd.kpi = localSd.kpi;
              }

              // Merge change ideas
              if (localSd.changeIdeas && baseSd && baseSd.changeIdeas) {
                localSd.changeIdeas.forEach((localCi) => {
                  const extCi = extSd.changeIdeas.find(c => c.id === localCi.id);
                  const baseCi = baseSd.changeIdeas.find(c => c.id === localCi.id);
                  const baseCiTitle = baseCi ? baseCi.title : "";
                  const baseCiKpi = baseCi ? baseCi.kpi : "";

                  if (extCi) {
                    if (localCi.title !== baseCiTitle) {
                      extCi.title = localCi.title;
                    }
                    if (localCi.kpi !== baseCiKpi) {
                      extCi.kpi = localCi.kpi;
                    }
                  }
                });
              }
            }
          });
        }
      }
    });
  }

  return merged;
}

function App() {
  if (typeof window !== "undefined") {
    window.useDiagramStore = useDiagramStore;
    window.useUIStore = useUIStore;
  }
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
  const autoSaveEnabled = useUIStore((state) => state.autoSaveEnabled);
  const previewStyle = useUIStore((state) => state.previewStyle);
  const setPreviewStyle = useUIStore((state) => state.setPreviewStyle);
  
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
  const svgLayoutMode = useDiagramStore((state) => state.svgLayoutMode);
  const setSvgLayoutMode = useDiagramStore((state) => state.setSvgLayoutMode);

  const sharedView = useDiagramStore((state) => state.sharedView);
  const sharedViewLoading = useDiagramStore((state) => state.sharedViewLoading);
  const sharedViewError = useDiagramStore((state) => state.sharedViewError);
  const sharedOpenedAt = useDiagramStore((state) => state.sharedOpenedAt);
  const lastSharedUrl = useDiagramStore((state) => state.lastSharedUrl);

  const userRole = useDiagramStore((state) => state.userRole);
  const collaboratorInvites = useDiagramStore((state) => state.collaboratorInvites);
  const collaboratorsLoading = useDiagramStore((state) => state.collaboratorsLoading);
  const collaboratorsError = useDiagramStore((state) => state.collaboratorsError);
  const invitingCollaborator = useDiagramStore((state) => state.invitingCollaborator);
  const inviteError = useDiagramStore((state) => state.inviteError);
  const inviteMessage = useDiagramStore((state) => state.inviteMessage);
  const fetchCollaborators = useDiagramStore((state) => state.fetchCollaborators);
  const inviteCollaborator = useDiagramStore((state) => state.inviteCollaborator);
  const revokeCollaboratorAccess = useDiagramStore((state) => state.revokeCollaboratorAccess);

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
  const downloadPdf = useDiagramStore((state) => state.downloadPdf);
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
  const autoOpenAttempted = useRef(false);

  // --- Local UI States ---
  const [gallerySearch, setGallerySearch] = useState("");
  const [collaborators, setCollaborators] = useState([]);
  const [collaboratorLocks, setCollaboratorLocks] = useState({});
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("editor");

  // --- Form Outline & ScrollSpy States ---
  const [isHovered, setIsHovered] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState("");
  const [editorCollapsed, setEditorCollapsed] = useState(false);

  // Scroll window directly to the TOP of a form section, then focus its first textarea
  const scrollToSection = useCallback((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const targetScrollY = window.scrollY + rect.top - 80; // 80px offset from top of viewport
    window.scrollTo({ top: targetScrollY, behavior: "smooth" });
    setTimeout(() => {
      const textarea = el.querySelector("textarea");
      if (textarea) textarea.focus({ preventScroll: true });
    }, 400);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const intersecting = entries.filter((e) => e.isIntersecting);
        if (intersecting.length > 0) {
          intersecting.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
          setActiveSectionId(intersecting[0].target.id);
        }
      },
      {
        root: null, // viewport
        rootMargin: "-15% 0px -55% 0px", // active in middle of viewport
        threshold: 0,
      }
    );

    const targets = document.querySelectorAll("[id^='form-section-']");
    targets.forEach((el) => observer.observe(el));

    return () => {
      targets.forEach((el) => observer.unobserve(el));
    };
  }, [data]);

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

  const filteredSavedDiagrams = savedDiagrams;

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

  const outlineItems = useMemo(() => {
    const items = [];
    
    // 1. Goal / Purpose
    items.push({
      id: "form-section-purpose",
      level: 0,
      label: t.purpose ? t.purpose.charAt(0).toUpperCase() + t.purpose.slice(1) : "Purpose",
      color: "pink",
    });

    // 2. Drivers
    data.primaryDrivers.forEach((pd, pi) => {
      const pdId = `form-section-pd-${pd.id}`;
      items.push({
        id: pdId,
        level: 0,
        label: `${t.primaryDriver ? t.primaryDriver.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : "Primary Driver"} ${pi + 1}`,
        color: "blue",
      });

      pd.secondaryDrivers.forEach((sd, si) => {
        const sdId = `form-section-sd-${sd.id}`;
        items.push({
          id: sdId,
          level: 1,
          label: `${t.secondaryDriver ? t.secondaryDriver.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : "Secondary Driver"} ${pi + 1}.${si + 1}`,
          color: "amber",
        });

        sd.changeIdeas.forEach((ci, cii) => {
          const ciId = `form-section-ci-${ci.id}`;
          items.push({
            id: ciId,
            level: 2,
            label: `${t.changeIdea ? t.changeIdea.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : "Change Idea"} ${pi + 1}.${si + 1}.${cii + 1}`,
            color: "orange",
          });
        });
      });
    });

    return items;
  }, [data, t]);

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

  // 5.5 Auto-open Most Recently Updated Diagram on Startup
  useEffect(() => {
    if (
      isAuthenticated &&
      !autoOpenAttempted.current &&
      savedDiagrams.length > 0 &&
      !currentDiagramId &&
      !routeState.shareId &&
      !routeState.gallery &&
      !routeState.admin
    ) {
      const hasOfflineDraft = typeof window !== "undefined" && window.localStorage && window.localStorage.getItem("diverdiagram_offline_draft");
      if (!hasOfflineDraft) {
        autoOpenAttempted.current = true;
        const latest = savedDiagrams[0];
        if (latest && latest.id) {
          openDiagram(latest.id);
        }
      }
    }
  }, [isAuthenticated, savedDiagrams, currentDiagramId, routeState, openDiagram]);

  // Reset auto-open flag on logout
  useEffect(() => {
    if (!currentUser?.id) {
      autoOpenAttempted.current = false;
    }
  }, [currentUser?.id]);

  // 6. Auto-save Trigger Loop
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !isAuthenticated || !currentDiagramId) {
      return;
    }
    if (!autoSaveEnabled) {
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
    }, 3000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [currentSnapshot, lastSavedSnapshot, currentDiagramId, deletingDiagramId, isAuthenticated, loadingSavedDiagrams, openingDiagramId, savingDiagram, saveDiagram, autoSaveEnabled]);

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

  // 11. Version History & Collaborators Loader
  useEffect(() => {
    if (currentDiagramId && isAuthenticated) {
      refreshVersionHistory();
      fetchCollaborators(currentDiagramId);
    }
  }, [currentDiagramId, isAuthenticated, refreshVersionHistory, fetchCollaborators]);

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

  // 14. Restore Unsaved Offline Draft on Mount
  useEffect(() => {
    useDiagramStore.getState().checkAndRestoreOfflineDraft();
  }, []);

  // 15. Reconnect Sync Listener
  useEffect(() => {
    const handleOnline = () => {
      if (typeof window !== "undefined" && window.localStorage) {
        const hasOfflineDraft = window.localStorage.getItem("diverdiagram_offline_draft");
        if (hasOfflineDraft && isAuthenticated) {
          saveDiagram({ isAuto: true });
        }
      }
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [isAuthenticated, saveDiagram]);

  // 16. Real-time Multiplayer Collaboration & Active Card Locking
  const broadcastLock = (cardId, isLocked) => {
    if (!isSupabaseConfigured || !supabase || !currentDiagramId || !isAuthenticated) return;
    const channelName = `diagram_collab_${currentDiagramId}`;
    const channel = supabase.channel(channelName);
    channel.send({
      type: "broadcast",
      event: isLocked ? "card-lock" : "card-unlock",
      payload: {
        cardId,
        userName: currentUser.email?.split("@")[0] || "Doctor/Collaborator",
      },
    });
  };

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !isAuthenticated || !currentDiagramId) {
      setCollaborators([]);
      setCollaboratorLocks({});
      return undefined;
    }

    const channelName = `diagram_collab_${currentDiagramId}`;
    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: currentUser.id,
        },
      },
    });

    // Listen to Presence (active collaborators)
    channel.on("presence", { event: "sync" }, () => {
      const presenceState = channel.presenceState();
      const activeUsers = [];
      Object.keys(presenceState).forEach((key) => {
        const presences = presenceState[key];
        presences.forEach((p) => {
          // Skip ourselves
          if (p.userId !== currentUser.id) {
            activeUsers.push(p);
          }
        });
      });
      setCollaborators(activeUsers);
    });

    // Listen to Broadcast lock/unlock events
    channel.on("broadcast", { event: "card-lock" }, ({ payload }) => {
      setCollaboratorLocks((prev) => ({
        ...prev,
        [payload.cardId]: payload.userName,
      }));
    });

    channel.on("broadcast", { event: "card-unlock" }, ({ payload }) => {
      setCollaboratorLocks((prev) => {
        const next = { ...prev };
        delete next[payload.cardId];
        return next;
      });
    });

    // Listen to PostgreSQL DbChanges on driver_diagrams row updates
    const dbChannel = supabase.channel(`db-changes-${currentDiagramId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "driver_diagrams",
          filter: `id=eq.${currentDiagramId}`,
        },
        (payload) => {
          if (payload.new) {
            const store = useDiagramStore.getState();
            const localSnapshot = buildDiagramSnapshot(store.documentTitle, store.data, store.codeInput);
            const externalSnapshot = buildDiagramSnapshot(
              payload.new.title,
              payload.new.diagram_data,
              payload.new.mermaid_code
            );
            
            const lastSavedSnapshot = store.lastSavedSnapshot;

            // Only trigger sync if the database state is different from our last saved baseline,
            // and our current local snapshot doesn't match the new database state.
            if (externalSnapshot !== lastSavedSnapshot && localSnapshot !== externalSnapshot) {
              // --- Multiplayer 3-Way Semantic Merge ---
              let baseTitle = "";
              let baseData = null;
              try {
                const baseObj = JSON.parse(lastSavedSnapshot);
                baseTitle = baseObj.title;
                baseData = baseObj.diagramData;
              } catch (e) {
                console.error("Failed to parse lastSavedSnapshot:", e);
              }

              let mergedTitle = payload.new.title;
              if (baseTitle && store.documentTitle !== baseTitle) {
                mergedTitle = store.documentTitle;
              }

              const mergedData = mergeDiagramData(baseData, store.data, payload.new.diagram_data);
              const mergedCode = buildMermaidCode(mergedData);

              const { normalizedData, nextTitle, nextCode } = store.applyDiagramToEditor({
                title: mergedTitle,
                diagramData: mergedData,
                mermaidCode: mergedCode,
              });

              // --- Multiplayer Typing Conflict Resolution (Focused Card Preservation) ---
              // Capture active keyboard focused element to prevent overwriting active typing
              const activeEl = typeof document !== "undefined" ? document.activeElement : null;
              const testId = activeEl?.getAttribute("data-testid");
              const preservedValue = activeEl ? (activeEl.value ?? null) : null;

              if (testId && preservedValue !== null) {
                let didMerge = false;
                if (testId === "document-title-input") {
                  useDiagramStore.setState({ documentTitle: preservedValue });
                  didMerge = true;
                } else if (testId === "mermaid-code-input") {
                  useDiagramStore.setState({ codeInput: preservedValue });
                  didMerge = true;
                } else if (testId === "purpose-title-input") {
                  normalizedData.purpose.title = preservedValue;
                  didMerge = true;
                } else if (testId === "purpose-kpi-input") {
                  normalizedData.purpose.kpi = preservedValue;
                  didMerge = true;
                } else if (testId.startsWith("primary-title-input-")) {
                  const suffix = testId.replace("primary-title-input-", "");
                  const pd = normalizedData.primaryDrivers.find((p, index) => String(p.id) === suffix || (index === 0 && suffix === "0"));
                  if (pd) {
                    pd.title = preservedValue;
                    didMerge = true;
                  }
                } else if (testId.startsWith("primary-kpi-input-")) {
                  const suffix = testId.replace("primary-kpi-input-", "");
                  const pd = normalizedData.primaryDrivers.find((p, index) => String(p.id) === suffix || (index === 0 && suffix === "0"));
                  if (pd) {
                    pd.kpi = preservedValue;
                    didMerge = true;
                  }
                } else if (testId.startsWith("secondary-title-input-")) {
                  const suffix = testId.replace("secondary-title-input-", "");
                  for (const pd of normalizedData.primaryDrivers) {
                    const sd = pd.secondaryDrivers.find((s) => String(s.id) === suffix);
                    if (sd) {
                      sd.title = preservedValue;
                      didMerge = true;
                      break;
                    }
                  }
                } else if (testId.startsWith("secondary-kpi-input-")) {
                  const suffix = testId.replace("secondary-kpi-input-", "");
                  for (const pd of normalizedData.primaryDrivers) {
                    const sd = pd.secondaryDrivers.find((s) => String(s.id) === suffix);
                    if (sd) {
                      sd.kpi = preservedValue;
                      didMerge = true;
                      break;
                    }
                  }
                } else if (testId.startsWith("change-title-input-")) {
                  const suffix = testId.replace("change-title-input-", "");
                  let found = false;
                  for (const pd of normalizedData.primaryDrivers) {
                    for (const sd of pd.secondaryDrivers) {
                      const ci = sd.changeIdeas.find((c) => String(c.id) === suffix);
                      if (ci) {
                        ci.title = preservedValue;
                        didMerge = true;
                        found = true;
                        break;
                      }
                    }
                    if (found) break;
                  }
                } else if (testId.startsWith("change-kpi-input-")) {
                  const suffix = testId.replace("change-kpi-input-", "");
                  let found = false;
                  for (const pd of normalizedData.primaryDrivers) {
                    for (const sd of pd.secondaryDrivers) {
                      const ci = sd.changeIdeas.find((c) => String(c.id) === suffix);
                      if (ci) {
                        ci.kpi = preservedValue;
                        didMerge = true;
                        found = true;
                        break;
                      }
                    }
                    if (found) break;
                  }
                }

                if (didMerge) {
                  // Re-build mermaid code and sync the state
                  const nextCodeMerged = buildMermaidCode(normalizedData);
                  useDiagramStore.setState({
                    data: { ...normalizedData },
                    codeInput: nextCodeMerged,
                  });
                }
              }

              const currentStore = useDiagramStore.getState();
              const snap = buildDiagramSnapshot(currentStore.documentTitle, currentStore.data, currentStore.codeInput);
              useDiagramStore.setState({
                lastSavedSnapshot: snap,
                lastVersionSnapshot: snap,
                autoSaveState: "saved",
                storageMessage: "ซิงก์ข้อมูลแก้ไขจากเพื่อนร่วมงานแบบเรียลไทม์ (Synced collaborator changes)",
              });
            }
          }
        }
      )
      .subscribe();

    // Subscribe & Track ourselves in Presence
    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({
          userId: currentUser.id,
          userName: currentUser.email || "Doctor/Collaborator",
          onlineAt: new Date().toISOString(),
        });
      }
    });

    return () => {
      channel.unsubscribe();
      dbChannel.unsubscribe();
    };
  }, [currentDiagramId, isAuthenticated, currentUser, setCollaborators, setCollaboratorLocks]);

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

  const handleZoomFit = useCallback(() => {
    const container = document.querySelector(".preview-surface");
    if (!container) return;
    
    const svgEl = container.querySelector("svg");
    if (!svgEl) return;
    
    let svgWidth = 0;
    let svgHeight = 0;
    
    const viewBox = svgEl.getAttribute("viewBox");
    if (viewBox) {
      const parts = viewBox.split(/\s+/).map(Number);
      if (parts.length === 4) {
        svgWidth = parts[2];
        svgHeight = parts[3];
      }
    }
    
    if (!svgWidth || !svgHeight) {
      svgWidth = svgEl.clientWidth || Number(svgEl.getAttribute("width")?.replace("px", "")) || 800;
      svgHeight = svgEl.clientHeight || Number(svgEl.getAttribute("height")?.replace("px", "")) || 600;
    }
    
    const containerWidth = container.clientWidth - 48; // p-6 = 24px padding on both sides
    const containerHeight = container.clientHeight - 48;
    
    if (svgWidth > 0 && svgHeight > 0 && containerWidth > 0 && containerHeight > 0) {
      const fitZoom = Math.min(containerWidth / svgWidth, containerHeight / svgHeight);
      const clampedZoom = Math.max(PREVIEW_ZOOM_MIN, Math.min(PREVIEW_ZOOM_MAX, Number(fitZoom.toFixed(2))));
      setPreviewZoom(clampedZoom);
      
      // Reset scrollbars to let margin: auto center correctly
      setTimeout(() => {
        container.scrollLeft = 0;
        container.scrollTop = 0;
      }, 50);
    }
  }, [setPreviewZoom]);

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
    if (workspaceIntroCollapsed) {
      setWorkspaceIntroCollapsed(false);
    }
    window.setTimeout(() => {
      purposeTitleInputRef.current?.focus();
    }, 0);
  };

  const handleSignIn = async (event) => {
    event.preventDefault();
    await requestMagicLink();
  };

  // --- Active SVG Selection (Mermaid vs Custom Export WYSIWYG) ---
  let activeSvg = svg;
  let activeError = renderError;

  if (previewStyle === "export") {
    try {
      const exportData = parseMermaidCode(sanitizeMermaidCode(codeInput));
      activeSvg = buildTemplateSvg(exportData, { aspect: svgLayoutMode });
      activeError = "";
    } catch (_err) {
      activeSvg = buildTemplateSvg(data, { aspect: svgLayoutMode });
      activeError = "";
    }
  }

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
            desktopPrimary={
              <HeaderActionButton onClick={exitSharedView}>
                <ExternalLink size={16} /> {t.backToWorkspace}
              </HeaderActionButton>
            }
            mobileOverflow={
              <>
                <LanguageToggle language={language} onChange={setLanguage} t={t} exposeTestIds={false} />
                <HeaderActionButton onClick={exitSharedView} className="w-full justify-start">
                  <ExternalLink size={16} /> {t.backToWorkspace}
                </HeaderActionButton>
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

          <section data-tour="shared-export-panel" className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
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
                <div className="space-y-2 mb-4" data-testid="svg-layout-mode-picker">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{t.svgLayoutMode}</div>
                  <div className="relative">
                    <select
                      value={svgLayoutMode}
                      onChange={(e) => setSvgLayoutMode(e.target.value)}
                      className="w-full sm:w-72 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none"
                    >
                      <option value="auto">{t.layoutAuto}</option>
                      <option value="landscape_a4">{t.layoutLandscapeA4}</option>
                      <option value="widescreen">{t.layoutWidescreen}</option>
                    </select>
                  </div>
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
                    <Tooltip label={t.exportPdf}>
                      <button onClick={downloadPdf} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-rose-700">
                        <Download size={16} /> .pdf
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
                    <Tooltip label={t.printDiagram}>
                      <button
                        onClick={() => window.print()}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                      >
                        <Printer size={16} /> {t.printDiagramShort}
                      </button>
                    </Tooltip>
                  </div>
                </div>
            </div>
          </section>

          <section data-tour="shared-output-panel" className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
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
                    onZoomFit={handleZoomFit}
                    labels={t}
                  />
                ) : null}
                {view === "preview" ? (
                  <div className="inline-flex rounded-2xl bg-slate-100 p-1" data-testid="preview-style-toggle">
                    <button
                      onClick={() => setPreviewStyle("mermaid")}
                      className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${previewStyle === "mermaid" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                    >
                      {t.previewMermaid}
                    </button>
                    <button
                      onClick={() => setPreviewStyle("export")}
                      className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${previewStyle === "export" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                    >
                      {t.previewExport}
                    </button>
                  </div>
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
                <PreviewCanvas svg={activeSvg} renderError={activeError} zoom={previewZoom} onWheel={handlePreviewWheel} className="h-full" labels={t} onClick={openPreviewModal} />
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
          <PrintReport />
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
                    purposeTitle={item.purpose_title}
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
    <>
      <div className="min-h-screen bg-slate-50 p-4 text-slate-900 no-print">
      {/* Notion-style Hover-Expand Floating Outline Navigator */}
      <div 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        data-tour="outline-navigator"
        className={`fixed left-4 top-1/2 -translate-y-1/2 z-40 transition-all duration-300 ease-in-out flex flex-col ${
          editorCollapsed 
            ? "pointer-events-none opacity-0 scale-95 invisible hidden" 
            : "hidden lg:flex"
        } ${
          isHovered 
            ? "w-64 max-h-[75vh] p-4 rounded-[24px] bg-white/85 backdrop-blur-lg border border-slate-200 shadow-xl ring-1 ring-slate-200/50 hover:scale-[1.01]" 
            : "w-10 py-3 bg-white/75 backdrop-blur-md border border-slate-200 shadow-md ring-1 ring-slate-200/40 items-center rounded-2xl hover:scale-105 hover:bg-white/95 hover:shadow-lg"
        }`}
      >
        {!isHovered ? (
          <div className="flex flex-col items-center gap-2.5 w-full select-none">
            {outlineItems.map((item) => {
              const isActive = activeSectionId === item.id;
              
              let sizeClass = "w-4 h-1";
              if (item.level === 1) sizeClass = "w-2.5 h-1";
              if (item.level === 2) sizeClass = "w-1.5 h-1";

              let dashColorClass = "bg-slate-350 hover:bg-slate-500";
              if (isActive) {
                if (item.color === "pink") dashColorClass = "bg-pink-500 shadow-sm shadow-pink-500/50";
                if (item.color === "blue") dashColorClass = "bg-blue-500 shadow-sm shadow-blue-500/50";
                if (item.color === "amber") dashColorClass = "bg-amber-500 shadow-sm shadow-amber-500/50";
                if (item.color === "orange") dashColorClass = "bg-orange-500 shadow-sm shadow-orange-500/50";
                
                sizeClass = item.level === 0 ? "w-5 h-1.5 scale-x-110" : item.level === 1 ? "w-3.5 h-1.5 scale-x-110" : "w-2.5 h-1.5 scale-x-110";
              }

              return (
                <button
                  key={`dash-${item.id}`}
                  onClick={() => scrollToSection(item.id)}
                  title={item.label}
                  className={`rounded-full transition-all duration-300 cursor-pointer ${sizeClass} ${dashColorClass} hover:scale-125`}
                />
              );
            })}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2 shrink-0 select-none">
              <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider pl-1">
                {t.formOutline}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto flex flex-col gap-1 pr-1 pb-1 scroll-smooth">
              {outlineItems.map((item) => {
                const isActive = activeSectionId === item.id;
                
                // Determine style based on level and active state
                let levelClass = "";
                if (item.level === 1) levelClass = "ml-3 pl-2.5 border-l border-slate-100";
                if (item.level === 2) levelClass = "ml-6 pl-2.5 border-l border-slate-100";

                let activeClass = "text-slate-500 hover:bg-slate-50 hover:text-slate-900";
                if (isActive) {
                  if (item.color === "pink") activeClass = "bg-pink-50 text-pink-800 border-l-2 border-pink-500 pl-2 rounded-l-none";
                  if (item.color === "blue") activeClass = "bg-blue-50 text-blue-800 border-l-2 border-blue-500 pl-2 rounded-l-none";
                  if (item.color === "amber") activeClass = "bg-amber-50 text-amber-800 border-l-2 border-amber-500 pl-2 rounded-l-none";
                  if (item.color === "orange") activeClass = "bg-orange-50 text-orange-800 border-l-2 border-orange-500 pl-2 rounded-l-none";
                }

                return (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className={`flex items-center gap-1.5 text-left rounded-xl py-1.5 px-2 transition-all duration-200 text-xs cursor-pointer ${levelClass} ${activeClass} hover:scale-[1.02] hover:translate-x-0.5 active:scale-98`}
                  >
                    {item.color === "pink" && <Target size={12} className={`shrink-0 ${isActive ? "text-pink-600" : "text-slate-400"}`} />}
                    {item.color === "blue" && <Layers size={12} className={`shrink-0 ${isActive ? "text-blue-600" : "text-slate-400"}`} />}
                    {item.color === "amber" && <GitBranch size={12} className={`shrink-0 ${isActive ? "text-amber-600" : "text-slate-400"}`} />}
                    {item.color === "orange" && <Lightbulb size={12} className={`shrink-0 ${isActive ? "text-orange-600" : "text-slate-400"}`} />}
                    <span className="truncate w-full">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      <div className="mx-auto max-w-7xl space-y-4">
        <WorkspaceMenubar />
        <header data-tour="document-header" className="rounded-[28px] bg-gradient-to-br from-blue-50 via-sky-50 to-white p-4 shadow-sm ring-1 ring-blue-100 backdrop-blur">
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
                  {collaborators.map((c) => (
                    <StatusPill key={c.userId} tone="violet" icon={<User size={14} className="animate-pulse" />}>
                      {c.userName.split("@")[0]} (ออนไลน์อยู่)
                    </StatusPill>
                  ))}
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
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        focusNextInput(e.target);
                      }
                    }}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  />
                  </label>
                  <p className="mt-2 text-xs leading-5 text-slate-500">{t.documentTitleHint}</p>
                </div>

                {isSupabaseConfigured && currentDiagramId && isAuthenticated ? (
                  <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      <Users size={14} className="text-slate-400" />
                      <span>{t.inviteCollaborators}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{t.inviteCollaboratorsDescription}</p>

                    {/* Invite Form */}
                    {userRole === "owner" ? (
                      <div className="mt-3 space-y-3">
                        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_110px]">
                          <input
                            type="email"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            placeholder={t.emailPlaceholder}
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                          />
                          <select
                            value={inviteRole}
                            onChange={(e) => setInviteRole(e.target.value)}
                            className="rounded-2xl border border-slate-200 bg-white px-2 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-blue-400"
                          >
                            <option value="editor">Editor</option>
                            <option value="viewer">Viewer</option>
                          </select>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!inviteEmail.trim()) return;
                            await inviteCollaborator(currentDiagramId, inviteEmail, inviteRole);
                            setInviteEmail("");
                          }}
                          disabled={invitingCollaborator || !inviteEmail.trim()}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition"
                        >
                          {invitingCollaborator ? t.inviting : (
                            <>
                              <UserPlus size={14} /> {t.inviteButton}
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="mt-3 rounded-2xl bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-700">
                        {t.collaboratorOnlyOwnerCanInvite}
                      </div>
                    )}

                    {/* Feedback Messages */}
                    {inviteError ? (
                      <div className="mt-2 rounded-xl bg-red-50 p-2 text-[11px] font-medium text-red-700">
                        {inviteError}
                      </div>
                    ) : null}
                    {inviteMessage ? (
                      <div className="mt-2 rounded-xl bg-emerald-50 p-2 text-[11px] font-medium text-emerald-700">
                        {inviteMessage}
                      </div>
                    ) : null}

                    {/* Active Collaborators List */}
                    <div className="mt-4 border-t border-slate-100 pt-3">
                      <div className="text-[11px] font-bold text-slate-700">{t.invitedCollaborators}</div>
                      <div className="mt-2 space-y-2 max-h-[160px] overflow-y-auto pr-1">
                        {collaboratorsLoading ? (
                          <div className="text-[11px] text-slate-400 animate-pulse">Loading list...</div>
                        ) : (
                          <>
                            {/* Owner */}
                            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-2 text-[11px]">
                              <span className="font-semibold text-slate-800 truncate">Diagram Owner</span>
                              <span className="shrink-0 rounded-full bg-slate-200 px-2 py-0.5 font-bold text-slate-600 text-[10px] uppercase">
                                {t.owner}
                              </span>
                            </div>

                            {/* Invited Collaborators */}
                            {collaboratorInvites.map((collab) => (
                              <div key={collab.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-2 text-[11px]">
                                <span className="text-slate-700 truncate">{collab.email}</span>
                                <div className="flex items-center gap-2">
                                  <span className={`shrink-0 rounded-full px-2 py-0.5 font-bold text-[9px] uppercase ${
                                    collab.role === "editor" ? "bg-purple-50 text-purple-700" : "bg-slate-100 text-slate-600"
                                  }`}>
                                    {collab.role}
                                  </span>
                                  {userRole === "owner" ? (
                                    <button
                                      type="button"
                                      onClick={() => revokeCollaboratorAccess(collab.id)}
                                      className="text-red-500 hover:text-red-700 transition"
                                      title={t.revokeAccess}
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  ) : null}
                                </div>
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}
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

        <div className={`grid gap-4 transition-all duration-500 ease-in-out ${editorCollapsed ? "lg:grid-cols-1" : "lg:grid-cols-[0.95fr_1.05fr]"}`}>
          <section
            data-tour="editor-form"
            className={`min-w-0 space-y-4 rounded-3xl bg-white shadow-sm ring-1 ring-slate-200 transition-all duration-500 ease-in-out ${
              editorCollapsed
                ? "w-0 h-0 opacity-0 p-0 border-0 ring-0 overflow-hidden pointer-events-none"
                : "w-full p-5 opacity-100"
            }`}
          >
            {/* Editor Top Bar Toolbar */}
            <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-1.5">
                  <Target size={18} className="text-pink-600" />
                  <span>{t.editDiagramForm}</span>
                </h2>
                <button
                  type="button"
                  onClick={() => useUIStore.getState().setAutoSaveEnabled(!autoSaveEnabled)}
                  title={autoSaveEnabled ? "Auto-save ON" : "Auto-save OFF"}
                  className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold tracking-wider transition cursor-pointer ${
                    autoSaveEnabled 
                      ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200 hover:bg-emerald-200" 
                      : "bg-slate-100 text-slate-500 ring-1 ring-slate-200 hover:bg-slate-200"
                  }`}
                >
                  {autoSaveEnabled ? "AUTO ON" : "AUTO OFF"}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <HeaderActionButton
                  variant="primary"
                  onClick={saveDiagram}
                  disabled={savingDiagram || !isAuthenticated || userRole === "viewer"}
                  data-testid="save-diagram-button"
                  tabIndex={100}
                >
                  <Save size={16} /> {savingDiagram ? t.saving : t.saveDiagram}
                </HeaderActionButton>

                <Tooltip label={t.collapseEditor}>
                  <button
                    type="button"
                    onClick={() => setEditorCollapsed(true)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 hover:scale-105 active:scale-95 transition-all shadow-sm cursor-pointer"
                  >
                    <ChevronLeft size={16} />
                  </button>
                </Tooltip>
              </div>
            </div>
            {/* Keyboard shortcuts hint */}
            <div className="mb-2 rounded-2xl bg-slate-50 px-4 py-2.5 text-xs text-slate-500 border border-slate-100/70 flex items-center gap-2 select-none">
              <span>{t.navigationHint}</span>
            </div>

            {/* Form Container (No inner scrollbar) */}
            <div className="space-y-4 scroll-smooth pb-8">
              {/* 1. Goal / Purpose Card */}
              <div 
                id="form-section-purpose" 
                className={`scroll-mt-4 rounded-[24px] border p-4 shadow-sm transition-all duration-300 hover:-translate-y-[1px] hover:shadow-md ${
                  activeSectionId === "form-section-purpose"
                    ? "border-pink-300 bg-pink-50 ring-2 ring-pink-500 shadow-md"
                    : "border-pink-100 bg-pink-50/50 ring-1 ring-pink-100/70"
                }`}
              >
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-pink-100 text-pink-700">
                    <Target size={14} />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-pink-800">
                    {t.topLevelGoal}
                  </span>
                </div>
                <TextAreaField label={t.purpose} value={data.purpose.title} onChange={(v) => updatePurpose("title", v)} icon={<Target size={16} />} testId="purpose-title-input" inputRef={purposeTitleInputRef} tabIndex={2} onFocus={() => { broadcastLock("purpose-title", true); setActiveSectionId("form-section-purpose"); }} onBlur={() => broadcastLock("purpose-title", false)} disabled={userRole === "viewer" || Boolean(collaboratorLocks["purpose-title"])} lockOwner={collaboratorLocks["purpose-title"]} theme="pink" />
                <div className="mt-3">
                  <TextAreaField label={t.purposeKpi} value={data.purpose.kpi} onChange={(v) => updatePurpose("kpi", v)} icon={<BarChart3 size={16} />} testId="purpose-kpi-input" tabIndex={3} onFocus={() => { broadcastLock("purpose-kpi", true); setActiveSectionId("form-section-purpose"); }} onBlur={() => broadcastLock("purpose-kpi", false)} disabled={userRole === "viewer" || Boolean(collaboratorLocks["purpose-kpi"])} lockOwner={collaboratorLocks["purpose-kpi"]} theme="pink" />
                </div>
              </div>

              {/* 2. Drivers Header */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <div>
                  <h2 className={sectionHeadingClass}>{t.primaryDrivers}</h2>
                  <p className={sectionBodyClass}>{t.primaryDriversDescription}</p>
                </div>
                {userRole !== "viewer" && (
                  <HeaderActionButton variant="success" onClick={addPrimary} data-testid="add-primary-button">
                    <Plus size={16} /> {t.addPrimary}
                  </HeaderActionButton>
                )}
              </div>

              {/* 3. Primary Drivers List */}
              {data.primaryDrivers.map((pd, pi) => (
                <div 
                  id={`form-section-pd-${pd.id}`} 
                  key={pd.id} 
                  className={`scroll-mt-4 space-y-3 rounded-[24px] border p-4 shadow-sm transition-all duration-300 hover:-translate-y-[1px] hover:shadow-md ${
                    activeSectionId === `form-section-pd-${pd.id}`
                      ? "border-blue-300 bg-blue-50 ring-2 ring-blue-500 shadow-md"
                      : "border-blue-100 bg-blue-50/50 ring-1 ring-blue-100/70"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="font-bold text-blue-900">{t.primaryDriver} {pi + 1}</div>
                      <div className="text-xs text-blue-800/70">{t.primaryDriverHelp}</div>
                    </div>
                    {userRole !== "viewer" && (
                      <IconActionButton label={t.deletePermanently} onClick={() => removePrimary(pi)} className="rounded-xl p-2 text-red-600 hover:bg-red-50">
                        <Trash2 size={16} />
                      </IconActionButton>
                    )}
                  </div>
                  <TextAreaField label={t.primaryDriverName} value={pd.title} onChange={(v) => updatePrimary(pi, "title", v)} icon={<Layers size={16} />} testId={pi === 0 ? "primary-title-input-0" : `primary-title-input-${pd.id}`} tabIndex={4 + pi * 6} onFocus={() => { broadcastLock(`primary-title-${pd.id}`, true); setActiveSectionId(`form-section-pd-${pd.id}`); }} onBlur={() => broadcastLock(`primary-title-${pd.id}`, false)} disabled={userRole === "viewer" || Boolean(collaboratorLocks[`primary-title-${pd.id}`])} lockOwner={collaboratorLocks[`primary-title-${pd.id}`]} theme="blue" />
                  <TextAreaField label={t.primaryKpi} value={pd.kpi} onChange={(v) => updatePrimary(pi, "kpi", v)} icon={<BarChart3 size={16} />} testId={pi === 0 ? "primary-kpi-input-0" : `primary-kpi-input-${pd.id}`} tabIndex={5 + pi * 6} onFocus={() => { broadcastLock(`primary-kpi-${pd.id}`, true); setActiveSectionId(`form-section-pd-${pd.id}`); }} onBlur={() => broadcastLock(`primary-kpi-${pd.id}`, false)} disabled={userRole === "viewer" || Boolean(collaboratorLocks[`primary-kpi-${pd.id}`])} lockOwner={collaboratorLocks[`primary-kpi-${pd.id}`]} theme="blue" />

                  {userRole !== "viewer" && (
                    <HeaderActionButton variant="accent" onClick={() => addSecondary(pi)}>
                      <Plus size={16} /> {t.addSecondary}
                    </HeaderActionButton>
                  )}

                  {pd.secondaryDrivers.map((sd, si) => (
                    <div 
                      id={`form-section-sd-${sd.id}`} 
                      key={sd.id} 
                      className={`scroll-mt-4 ml-0 space-y-3 rounded-[24px] border p-4 shadow-sm transition-all duration-300 md:ml-5 hover:-translate-y-[1px] hover:shadow-md ${
                        activeSectionId === `form-section-sd-${sd.id}`
                          ? "border-amber-300 bg-amber-50 ring-2 ring-amber-500 shadow-md"
                          : "border-amber-100 bg-amber-50/50 ring-1 ring-amber-100/70"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold text-amber-900">{t.secondaryDriver} {si + 1}</div>
                          <div className="text-xs text-amber-800/70">{t.secondaryDriverHelp}</div>
                        </div>
                        {userRole !== "viewer" && (
                          <IconActionButton label={t.deletePermanently} onClick={() => removeSecondary(pi, si)} className="rounded-xl p-2 text-red-600 hover:bg-red-50">
                            <Trash2 size={16} />
                          </IconActionButton>
                        )}
                      </div>
                      <TextAreaField label={t.secondaryDriverName} value={sd.title} onChange={(v) => updateSecondary(pi, si, "title", v)} icon={<GitBranch size={16} />} testId={`secondary-title-input-${sd.id}`} tabIndex={6 + pi * 6 + si * 4} onFocus={() => { broadcastLock(`secondary-title-${sd.id}`, true); setActiveSectionId(`form-section-sd-${sd.id}`); }} onBlur={() => broadcastLock(`secondary-title-${sd.id}`, false)} disabled={userRole === "viewer" || Boolean(collaboratorLocks[`secondary-title-${sd.id}`])} lockOwner={collaboratorLocks[`secondary-title-${sd.id}`]} theme="amber" />
                      <TextAreaField label={t.secondaryKpi} value={sd.kpi} onChange={(v) => updateSecondary(pi, si, "kpi", v)} icon={<BarChart3 size={16} />} testId={`secondary-kpi-input-${sd.id}`} tabIndex={7 + pi * 6 + si * 4} onFocus={() => { broadcastLock(`secondary-kpi-${sd.id}`, true); setActiveSectionId(`form-section-sd-${sd.id}`); }} onBlur={() => broadcastLock(`secondary-kpi-${sd.id}`, false)} disabled={userRole === "viewer" || Boolean(collaboratorLocks[`secondary-kpi-${sd.id}`])} lockOwner={collaboratorLocks[`secondary-kpi-${sd.id}`]} theme="amber" />

                      {sd.changeIdeas.map((ci, cii) => (
                        <div 
                          id={`form-section-ci-${ci.id}`} 
                          key={ci.id} 
                          className={`scroll-mt-4 ml-0 space-y-3 rounded-[24px] border p-4 shadow-sm transition-all duration-300 md:ml-5 hover:-translate-y-[1px] hover:shadow-md ${
                            activeSectionId === `form-section-ci-${ci.id}`
                              ? "border-orange-300 bg-orange-100/80 ring-2 ring-orange-500 shadow-md"
                              : "border-orange-200 bg-orange-100/30 ring-1 ring-orange-200/40"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-bold text-orange-900">{t.changeIdea} {cii + 1}</div>
                              <div className="text-xs text-orange-800/70">{t.changeIdeaHelp}</div>
                            </div>
                            {userRole !== "viewer" && (
                              <IconActionButton label={t.deletePermanently} onClick={() => removeChange(pi, si, cii)} className="rounded-xl p-2 text-red-600 hover:bg-red-50">
                                <Trash2 size={16} />
                              </IconActionButton>
                            )}
                          </div>
                          <TextAreaField label={t.changeIdeaName} value={ci.title} onChange={(v) => updateChange(pi, si, cii, "title", v)} icon={<Lightbulb size={16} />} testId={`change-title-input-${ci.id}`} tabIndex={8 + pi * 6 + si * 4 + cii * 2} onFocus={() => { broadcastLock(`change-title-${ci.id}`, true); setActiveSectionId(`form-section-ci-${ci.id}`); }} onBlur={() => broadcastLock(`change-title-${ci.id}`, false)} disabled={userRole === "viewer" || Boolean(collaboratorLocks[`change-title-${ci.id}`])} lockOwner={collaboratorLocks[`change-title-${ci.id}`]} theme="orange" />
                          <TextAreaField label={t.changeKpi} value={ci.kpi} onChange={(v) => updateChange(pi, si, cii, "kpi", v)} icon={<BarChart3 size={16} />} testId={`change-kpi-input-${ci.id}`} tabIndex={99} onFocus={() => { broadcastLock(`change-kpi-${ci.id}`, true); setActiveSectionId(`form-section-ci-${ci.id}`); }} onBlur={() => broadcastLock(`change-kpi-${ci.id}`, false)} disabled={userRole === "viewer" || Boolean(collaboratorLocks[`change-kpi-${ci.id}`])} lockOwner={collaboratorLocks[`change-kpi-${ci.id}`]} theme="orange" />
                        </div>
                      ))}

                      {userRole !== "viewer" && (
                        <div className="flex justify-start ml-0 md:ml-5">
                          <button
                            onClick={() => addChange(pi, si)}
                            className="inline-flex items-center gap-2 rounded-2xl bg-orange-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-700 transition cursor-pointer"
                          >
                            <Plus size={16} /> {t.addChangeIdea}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </section>

          <section data-tour="output-panel" className={`min-w-0 lg:sticky lg:top-4 lg:h-[74vh] xl:h-[70vh] ${workbenchPanelClass}`}>
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-3">
                {editorCollapsed && (
                  <Tooltip label={t.expandEditor}>
                    <button
                      type="button"
                      onClick={() => setEditorCollapsed(false)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 hover:scale-105 active:scale-95 transition-all shadow-sm cursor-pointer shrink-0 mt-0.5"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </Tooltip>
                )}
                <div>
                  <h2 className={sectionHeadingClass}>{t.output}</h2>
                  <p className={`mt-1 ${sectionBodyClass}`}>{t.outputDescription}</p>
                </div>
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
                    onZoomFit={handleZoomFit}
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
                <PreviewCanvas svg={activeSvg} renderError={activeError} zoom={previewZoom} onWheel={handlePreviewWheel} className="h-full" labels={t} onClick={openPreviewModal} />
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

          </section>
        </div>

        {!isReadOnlySharedView && (
          <div data-tour="version-history" className={workbenchMutedPanelClass}>
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
        )}
        <SavedDiagramsDrawer />
        <PreviewModal />
        <TemplatesModal />
        <footer className="border-t border-slate-200 px-2 pt-2 pb-6 text-xs text-slate-500">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>© 2026 tpromson@gmail.com</div>
            <a
              href="mailto:tpromson@gmail.com?subject=Driver%20Diagram%20Support"
              className="inline-flex w-fit items-center gap-2 font-medium text-slate-600 transition hover:text-slate-900"
            >
              แจ้งปัญหาการใช้งาน
            </a>
          </div>
        </footer>
      </div>
    </div>
    <PrintReport />
  </>
  );
}

export default App;
