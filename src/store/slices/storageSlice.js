import { isSupabaseConfigured, supabase } from "../../supabaseClient.js";
import { defaultData, MAX_AUTOSAVE_VERSIONS, MAX_VERSION_HISTORY } from "../../utils/constants.js";
import { defaultDocumentTitle, defaultLanguage, translations } from "../../utils/translations.js";
import {
  ensureDocumentMeta,
  updateDocumentPresentation,
  buildDiagramSnapshot,
  normalizeStoredDiagramData,
  resolveDiagramDataForEditor,
  buildStoredThumbnailSvg,
  hasActiveShareLink,
  sortSavedDiagrams,
} from "../../utils/helpers.js";
import { buildMermaidCode, sanitizeMermaidCode } from "../../utils/mermaidParser.js";
import { useAuthStore } from "../useAuthStore.js";
import { useUIStore } from "../useUIStore.js";

const savedDiagramSelectFields =
  "id, title, purpose_title, diagram_data, mermaid_code, thumbnail_svg, created_at, updated_at, last_opened_at, is_favorite, archived_at, share_id, shared_at, share_expires_at, share_revoked_at";

const SAVED_DIAGRAMS_PAGE_SIZE = 20;

export const createStorageSlice = (set, get) => ({
  savedDiagrams: [],
  loadingSavedDiagrams: false,
  savingDiagram: false,
  savedDiagramsOffset: 0,
  savedDiagramsHasMore: false,
  savedDiagramsTotal: 0,
  savedDiagramsSearch: "",
  savedDiagramsScope: "active",
  savedDiagramsSort: "updated_desc",
  autoSaveState: "idle",
  openingDiagramId: "",
  deletingDiagramId: "",
  duplicatingDiagramId: "",
  renamingDiagramId: "",
  renameDraft: "",
  renamingDiagram: false,
  storageMessage: "",
  storageError: "",
  versionHistory: [],
  loadingVersionHistory: false,
  restoringVersionId: "",
  restoringAndSavingVersionId: "",
  userRole: null,

  setStorageError: (storageError) => set({ storageError }),
  setStorageMessage: (storageMessage) => set({ storageMessage }),
  setAdminEmailDraft: (adminEmailDraft) => set({ adminEmailDraft }),

  resetStorageNotice: () => set({
    storageError: "",
    storageMessage: "",
    lastSharedUrl: ""
  }),

  loadSavedDiagrams: async (params = {}) => {
    const currentUser = useAuthStore.getState().currentUser;
    const { search = "", scope = "active", sort = "updated_desc", offset = 0 } = params;
    if (!isSupabaseConfigured || !supabase || !currentUser?.id) {
      set({ savedDiagrams: [], loadingSavedDiagrams: false, savedDiagramsHasMore: false, savedDiagramsTotal: 0 });
      return;
    }

    set({ loadingSavedDiagrams: true, storageError: "" });
    try {
      let query = supabase
        .from("driver_diagrams")
        .select(savedDiagramSelectFields, { count: "exact" });

      if (search.trim()) {
        query = query.or(`title.ilike.%${search}%,purpose_title.ilike.%${search}%`);
      }

      if (scope === "archived") {
        query = query.not("archived_at", "is", null);
      } else if (scope === "active") {
        query = query.or("archived_at.is.null,archived_at.not.is.null").is("archived_at", null);
      }

      const sortColumn = sort === "opened_desc" ? "last_opened_at" : sort === "title_asc" ? "title" : "updated_at";
      query = query.order(sortColumn, { ascending: false });

      query = query.range(offset, offset + SAVED_DIAGRAMS_PAGE_SIZE - 1);

      const { data: rows, error, count } = await query;

      if (error) {
        set({ storageError: error.message || "Unable to load saved diagrams." });
      } else {
        const enriched = await get().enrichSavedDiagramsWithGalleryState(rows || []);
        set({
          savedDiagrams: offset === 0 ? enriched : [...get().savedDiagrams, ...enriched],
          savedDiagramsOffset: offset,
          savedDiagramsHasMore: (rows || []).length === SAVED_DIAGRAMS_PAGE_SIZE,
          savedDiagramsTotal: count || 0,
          savedDiagramsSearch: search,
          savedDiagramsScope: scope,
          savedDiagramsSort: sort,
        });
      }
    } catch (err) {
      set({ storageError: err.message || "Unable to load saved diagrams." });
    } finally {
      set({ loadingSavedDiagrams: false });
    }
  },

  loadMoreSavedDiagrams: async () => {
    const { savedDiagramsHasMore, savedDiagramsOffset, savedDiagramsSearch, savedDiagramsScope, savedDiagramsSort } = get();
    if (!savedDiagramsHasMore) return;
    await get().loadSavedDiagrams({
      search: savedDiagramsSearch,
      scope: savedDiagramsScope,
      sort: savedDiagramsSort,
      offset: savedDiagramsOffset + SAVED_DIAGRAMS_PAGE_SIZE,
    });
  },

  refreshSavedDiagrams: async () => {
    const { savedDiagramsSearch, savedDiagramsScope, savedDiagramsSort } = get();
    await get().loadSavedDiagrams({ search: savedDiagramsSearch, scope: savedDiagramsScope, sort: savedDiagramsSort, offset: 0 });
  },

  upsertSavedDiagram: (row) => {
    if (!row) return;

    set((state) => {
      const existing = state.savedDiagrams.find((item) => item.id === row.id) || {};
      const next = [{ ...existing, ...row }, ...state.savedDiagrams.filter((item) => item.id !== row.id)];
      return { savedDiagrams: sortSavedDiagrams(next, "updated_desc") };
    });
  },

  startNewDiagram: () => {
    const emptySnap = buildDiagramSnapshot(defaultDocumentTitle, defaultData, buildMermaidCode(defaultData));
    set({
      codeSource: "form",
      lastSavedSnapshot: emptySnap,
      lastVersionSnapshot: emptySnap,
      currentDiagramId: "",
      documentTitle: defaultDocumentTitle,
      data: normalizeStoredDiagramData(defaultData),
      codeInput: buildMermaidCode(defaultData),
      autoSaveState: "idle",
      versionHistory: [],
      renamingDiagramId: "",
      renameDraft: "",
      renamingDiagram: false,
      storageError: "",
      storageMessage: "",
      lastSharedUrl: "",
      codeSyncError: "",
      codeSyncMessage: "",
      userRole: "owner"
    });
    setTimeout(() => {
      if (typeof document !== "undefined") {
        const el = document.querySelector('[data-testid="document-title-input"]');
        if (el) {
          el.focus();
          el.select();
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    }, 100);
  },

  cancelRenamingDiagram: () => set({
    renamingDiagramId: "",
    renameDraft: "",
    renamingDiagram: false
  }),

  startRenamingDiagram: (item) => set({
    renamingDiagramId: item.id,
    renameDraft: item.title || item.purpose_title || defaultDocumentTitle,
    storageError: "",
    storageMessage: ""
  }),

  renameDiagram: async (diagramId) => {
    const currentUser = useAuthStore.getState().currentUser;
    if (!supabase || !currentUser?.id) {
      set({ storageError: "Sign in before renaming saved diagrams." });
      return;
    }

    const title = get().renameDraft.trim();
    if (!title) {
      set({ storageError: "Document title cannot be empty." });
      return;
    }

    set({ renamingDiagram: true, storageError: "" });
    try {
      const { data: row, error } = await supabase
        .from("driver_diagrams")
        .update({ title })
        .eq("id", diagramId)
        .select(savedDiagramSelectFields)
        .single();

      if (error || !row) {
        set({ storageError: error?.message || "Unable to rename this diagram.", renamingDiagram: false });
        return;
      }

      get().upsertSavedDiagram(row);

      if (get().currentDiagramId === diagramId) {
        set({
          documentTitle: row.title,
          lastSavedSnapshot: buildDiagramSnapshot(row.title, get().data, get().codeInput)
        });
      }

      if (hasActiveShareLink(row)) {
        await supabase
          .from("shared_driver_diagrams")
          .update({ title: row.title })
          .eq("diagram_id", diagramId);
      }

      set({
        renamingDiagramId: "",
        renameDraft: "",
        renamingDiagram: false,
        storageMessage: "Renamed diagram."
      });
    } catch (err) {
      set({ storageError: err.message || "Unable to rename this diagram.", renamingDiagram: false });
    }
  },

  duplicateDiagram: async (diagramId) => {
    const currentUser = useAuthStore.getState().currentUser;
    if (!supabase || !currentUser?.id) {
      set({ storageError: "Sign in before duplicating saved diagrams." });
      return;
    }

    set({ duplicatingDiagramId: diagramId, storageError: "" });
    try {
      const { data: sourceRow, error: sourceError } = await supabase
        .from("driver_diagrams")
        .select("*")
        .eq("id", diagramId)
        .single();

      if (sourceError || !sourceRow) {
        set({ duplicatingDiagramId: "", storageError: sourceError?.message || "Unable to load the diagram to duplicate." });
        return;
      }

      const duplicateTitle = `${sourceRow.title || sourceRow.purpose_title || defaultDocumentTitle} (Copy)`;
      const normData = normalizeStoredDiagramData(sourceRow.diagram_data);
      const normCode = sanitizeMermaidCode(sourceRow.mermaid_code || buildMermaidCode(sourceRow.diagram_data || defaultData));
      const thumbnailSvg = buildStoredThumbnailSvg(normData, normCode);

      const { data: row, error } = await supabase
        .from("driver_diagrams")
        .insert({
          user_id: currentUser.id,
          title: duplicateTitle,
          purpose_title: sourceRow.purpose_title || "",
          purpose_kpi: sourceRow.purpose_kpi || "",
          diagram_data: normData,
          mermaid_code: normCode,
          thumbnail_svg: thumbnailSvg,
          is_favorite: false,
          archived_at: null,
        })
        .select(savedDiagramSelectFields)
        .single();

      if (error || !row) {
        let displayError = error?.message || "Unable to duplicate this diagram.";
        if (displayError.includes("row-level security policy")) {
          displayError = "เซสชันการเข้าสู่ระบบหมดอายุหรือสิทธิ์ไม่ถูกต้อง โปรดลงชื่อออกแล้วเข้าใช้งานใหม่อีกครั้งเพื่อทำสำเนา";
        }
        set({ duplicatingDiagramId: "", storageError: displayError });
        return;
      }

      get().upsertSavedDiagram(row);

      await get().createDiagramVersion({
        diagramId: row.id,
        title: row.title,
        diagramData: normData,
        mermaidCode: normCode,
        saveSource: "duplicate",
      });

      set({ duplicatingDiagramId: "", storageMessage: "Created a duplicate." });
    } catch (err) {
      let displayError = err.message || "Unable to duplicate this diagram.";
      if (displayError.includes("row-level security policy")) {
        displayError = "เซสชันการเข้าสู่ระบบหมดอายุหรือสิทธิ์ไม่ถูกต้อง โปรดลงชื่อออกแล้วเข้าใช้งานใหม่อีกครั้งเพื่อทำสำเนา";
      }
      set({ duplicatingDiagramId: "", storageError: displayError });
    }
  },

  toggleFavoriteDiagram: async (item) => {
    const currentUser = useAuthStore.getState().currentUser;
    if (!supabase || !currentUser?.id) {
      set({ storageError: "Sign in before updating favorites." });
      return;
    }

    set({ storageError: "" });
    try {
      const { data: row, error } = await supabase
        .from("driver_diagrams")
        .update({ is_favorite: !item.is_favorite })
        .eq("id", item.id)
        .select(savedDiagramSelectFields)
        .single();

      if (error || !row) {
        set({ storageError: error?.message || "Unable to update favorite status." });
        return;
      }

      get().upsertSavedDiagram(row);
      set({ storageMessage: row.is_favorite ? "Pinned to favorites." : "Removed from favorites." });
    } catch (err) {
      set({ storageError: err.message || "Unable to update favorite status." });
    }
  },

  toggleArchiveDiagram: async (item) => {
    const currentUser = useAuthStore.getState().currentUser;
    if (!supabase || !currentUser?.id) {
      set({ storageError: "Sign in before archiving diagrams." });
      return;
    }

    const nextArchivedAt = item.archived_at ? null : new Date().toISOString();
    set({ storageError: "" });
    try {
      const { data: row, error } = await supabase
        .from("driver_diagrams")
        .update({ archived_at: nextArchivedAt })
        .eq("id", item.id)
        .select(savedDiagramSelectFields)
        .single();

      if (error || !row) {
        set({ storageError: error?.message || "Unable to update archive status." });
        return;
      }

      get().upsertSavedDiagram(row);

      if (get().currentDiagramId === item.id && row.archived_at) {
        get().startNewDiagram();
      }

      set({ storageMessage: row.archived_at ? "Archived diagram." : "Restored diagram." });
    } catch (err) {
      set({ storageError: err.message || "Unable to update archive status." });
    }
  },

  applyDiagramToEditor: ({ title, diagramData, mermaidCode }) => {
    const normalizedData = resolveDiagramDataForEditor(diagramData, mermaidCode);
    const nextTitle = title || defaultDocumentTitle;
    const nextCode = buildMermaidCode(normalizedData);

    set({
      codeSource: "code",
      documentTitle: nextTitle,
      data: normalizedData,
      codeInput: nextCode,
      codeSyncError: "",
      codeSyncMessage: ""
    });

    return { normalizedData, nextTitle, nextCode };
  },

  openDiagram: async (diagramId) => {
    const currentUser = useAuthStore.getState().currentUser;
    if (!isSupabaseConfigured || !supabase) {
      set({ storageError: "Add Supabase env vars before opening saved diagrams." });
      return;
    }
    if (!currentUser?.id) {
      set({ storageError: "Sign in before opening saved diagrams." });
      return;
    }

    set({ openingDiagramId: diagramId, storageError: "", storageMessage: "" });
    try {
      // 1. Fetch diagram first using select to determine ownership & roles
      const { data: row, error: selectError } = await supabase
        .from("driver_diagrams")
        .select("*")
        .eq("id", diagramId)
        .single();

      if (selectError || !row) {
        set({ storageError: selectError?.message || "Unable to open this diagram.", openingDiagramId: "" });
        return;
      }

      // Determine owner vs collaborator role
      let userRole = "owner";
      if (row.user_id !== currentUser.id) {
        const { data: collabRow } = await supabase
          .from("diagram_collaborators")
          .select("role")
          .eq("diagram_id", diagramId)
          .eq("email", currentUser.email || "")
          .maybeSingle();

        if (collabRow) {
          userRole = collabRow.role || "viewer";
        } else {
          // If no collaborator row exists but select worked, fall back to viewer (e.g. read-only shared fallback)
          userRole = "viewer";
        }
      }

      // Only touch last_opened_at if the user is owner or editor
      if (userRole === "owner" || userRole === "editor") {
        const openedAt = new Date().toISOString();
        await supabase
          .from("driver_diagrams")
          .update({ last_opened_at: openedAt })
          .eq("id", diagramId);
      }

      const { normalizedData, nextTitle, nextCode } = get().applyDiagramToEditor({
        title: row.title,
        diagramData: row.diagram_data,
        mermaidCode: row.mermaid_code,
      });

      const snap = buildDiagramSnapshot(nextTitle, normalizedData, nextCode);
      set({
        currentDiagramId: row.id,
        userRole,
        lastSavedSnapshot: snap,
        lastVersionSnapshot: snap,
        autoSaveState: "saved",
        storageMessage: userRole === "viewer" ? "Loaded diagram (Read-only)." : "Loaded diagram.",
        openingDiagramId: ""
      });

      get().upsertSavedDiagram(row);
      await get().refreshVersionHistory(row.id);

      useUIStore.getState().setSavedDrawerOpen(false);
    } catch (err) {
      set({ storageError: err.message || "Unable to open this diagram.", openingDiagramId: "" });
    }
  },

  deleteDiagram: async (diagramId) => {
    const currentUser = useAuthStore.getState().currentUser;
    if (!isSupabaseConfigured || !supabase) {
      set({ storageError: "Add Supabase env vars before deleting saved diagrams." });
      return;
    }
    if (!currentUser?.id) {
      set({ storageError: "Sign in before deleting saved diagrams." });
      return;
    }

    if (typeof window !== "undefined" && !window.confirm("Delete this saved diagram?")) {
      return;
    }

    set({ deletingDiagramId: diagramId, storageError: "", storageMessage: "" });
    try {
      const { error } = await supabase.from("driver_diagrams").delete().eq("id", diagramId);

      if (error) {
        set({ storageError: error.message || "Unable to delete this diagram.", deletingDiagramId: "" });
        return;
      }

      set((state) => ({
        savedDiagrams: state.savedDiagrams.filter((item) => item.id !== diagramId),
        deletingDiagramId: ""
      }));

      if (get().currentDiagramId === diagramId) {
        get().startNewDiagram();
      }

      set({ storageMessage: "Deleted diagram from database." });
    } catch (err) {
      set({ storageError: err.message || "Unable to delete this diagram.", deletingDiagramId: "" });
    }
  },

  refreshVersionHistory: async (diagramId = get().currentDiagramId) => {
    const currentUser = useAuthStore.getState().currentUser;
    if (!supabase || !currentUser?.id || !diagramId) {
      set({ versionHistory: [] });
      return;
    }

    set({ loadingVersionHistory: true });
    try {
      const { data: rows, error } = await supabase
        .from("driver_diagram_versions")
        .select("id, diagram_id, title, mermaid_code, diagram_data, save_source, created_at")
        .eq("diagram_id", diagramId)
        .order("created_at", { ascending: false })
        .limit(12);

      if (error) {
        set({ storageError: error.message || "Unable to refresh version history." });
      } else {
        set({ versionHistory: rows || [] });
      }
    } catch (err) {
      set({ storageError: err.message || "Unable to refresh version history." });
    } finally {
      set({ loadingVersionHistory: false });
    }
  },

  pruneDiagramVersions: async (diagramId) => {
    const currentUser = useAuthStore.getState().currentUser;
    if (!supabase || !currentUser?.id || !diagramId) return null;

    try {
      const { data: extraAutosaves, error: autosaveError } = await supabase
        .from("driver_diagram_versions")
        .select("id")
        .eq("diagram_id", diagramId)
        .eq("save_source", "autosave")
        .order("created_at", { ascending: false })
        .range(MAX_AUTOSAVE_VERSIONS, MAX_AUTOSAVE_VERSIONS + 99);

      if (autosaveError) return autosaveError;

      if (extraAutosaves?.length) {
        const { error } = await supabase
          .from("driver_diagram_versions")
          .delete()
          .in("id", extraAutosaves.map((item) => item.id));

        if (error) return error;
      }

      const { data: extraVersions, error: totalError } = await supabase
        .from("driver_diagram_versions")
        .select("id")
        .eq("diagram_id", diagramId)
        .order("created_at", { ascending: false })
        .range(MAX_VERSION_HISTORY, MAX_VERSION_HISTORY + 199);

      if (totalError) return totalError;

      if (extraVersions?.length) {
        const { error } = await supabase
          .from("driver_diagram_versions")
          .delete()
          .in("id", extraVersions.map((item) => item.id));

        if (error) return error;
      }

      return null;
    } catch (err) {
      return err;
    }
  },

  createDiagramVersion: async ({ diagramId, title, diagramData, mermaidCode, saveSource }) => {
    const currentUser = useAuthStore.getState().currentUser;
    if (!supabase || !currentUser?.id || !diagramId) return null;

    try {
      const { error } = await supabase.from("driver_diagram_versions").insert({
        diagram_id: diagramId,
        user_id: currentUser.id,
        title,
        diagram_data: normalizeStoredDiagramData(diagramData),
        mermaid_code: sanitizeMermaidCode(mermaidCode),
        save_source: saveSource,
      });

      if (error) return error;

      return get().pruneDiagramVersions(diagramId);
    } catch (err) {
      return err;
    }
  },

  restoreVersion: async (version, { saveImmediately = false } = {}) => {
    const currentUser = useAuthStore.getState().currentUser;
    set({ restoringVersionId: version.id, storageError: "" });
    try {
      const { normalizedData, nextTitle, nextCode } = get().applyDiagramToEditor({
        title: version.title,
        diagramData: version.diagram_data,
        mermaidCode: version.mermaid_code,
      });

      const diagramId = get().currentDiagramId;

      if (saveImmediately && diagramId && supabase && currentUser?.id) {
        set({ restoringAndSavingVersionId: version.id });
        const payload = {
          title: nextTitle,
          purpose_title: normalizedData.purpose.title,
          purpose_kpi: normalizedData.purpose.kpi,
          diagram_data: normalizedData,
          mermaid_code: nextCode,
        };

        const { data: row, error } = await supabase
          .from("driver_diagrams")
          .update(payload)
          .eq("id", diagramId)
          .select(savedDiagramSelectFields)
          .single();

        if (error || !row) {
          set({ storageError: error?.message || "Unable to restore this version to the database." });
          return;
        }

        const snap = buildDiagramSnapshot(nextTitle, normalizedData, nextCode);
        set({
          lastSavedSnapshot: snap,
          lastVersionSnapshot: snap,
          autoSaveState: "saved",
          storageMessage: "Restored version and saved to cloud.",
        });

        get().upsertSavedDiagram(row);
      } else {
        set({
          storageMessage: "Restored version to editor.",
        });
      }
    } catch (err) {
      set({ storageError: err.message || "Unable to restore this version." });
    } finally {
      set({ restoringVersionId: "", restoringAndSavingVersionId: "" });
    }
  },

  checkAndRestoreOfflineDraft: () => {
    if (typeof window === "undefined" || !window.localStorage) return false;
    try {
      const saved = window.localStorage.getItem("diverdiagram_offline_draft");
      if (!saved) return false;
      const draft = JSON.parse(saved);
      if (!draft || !draft.diagram_data) return false;

      const { normalizedData, nextTitle, nextCode } = get().applyDiagramToEditor({
        title: draft.title,
        diagramData: draft.diagram_data,
        mermaidCode: draft.mermaid_code,
      });

      const snap = buildDiagramSnapshot(nextTitle, normalizedData, nextCode);
      set({
        currentDiagramId: draft.id || "",
        lastSavedSnapshot: snap,
        lastVersionSnapshot: snap,
        autoSaveState: "dirty",
        storageMessage: "พบแบบร่างที่ยังไม่ได้บันทึกบนเครื่อง ได้กู้คืนงานล่าสุดให้คุณแล้ว (Restored offline draft)",
      });
      return true;
    } catch (e) {
      console.error("Failed to restore offline draft:", e);
      return false;
    }
  },

  importTemplateDiagram: (preparedData, docTitle, importSuccessMessage) => {
    const nextCode = buildMermaidCode(preparedData);
    const snap = buildDiagramSnapshot(docTitle, preparedData, nextCode);
    set({
      currentDiagramId: "",
      data: preparedData,
      codeInput: nextCode,
      documentTitle: docTitle,
      codeSource: "form",
      storageMessage: importSuccessMessage,
      storageError: "",
      autoSaveState: "dirty",
      lastSavedSnapshot: snap,
      lastVersionSnapshot: snap,
      versionHistory: [],
      lastSharedUrl: "",
      sharedView: null,
      userRole: "owner"
    });
  },

  saveDiagram: async ({ isAuto = false } = {}) => {
    const userRole = get().userRole;
    if (userRole === "viewer") {
      set({ storageError: "คุณมีสิทธิ์เข้าชมอย่างเดียว (Read-only access) ไม่สามารถแก้ไขได้" });
      return;
    }

    const { codeInput, data, documentTitle, currentDiagramId, lastSavedSnapshot, lastVersionSnapshot } = get();
    const normalizedCode = sanitizeMermaidCode(codeInput);
    const normalizedData = normalizeStoredDiagramData(data);
    const title = documentTitle.trim() || normalizedData.purpose.title || defaultDocumentTitle;
    const snapshot = buildDiagramSnapshot(title, normalizedData, normalizedCode);

    if (isAuto && snapshot === lastSavedSnapshot) {
      return;
    }

    const backupToOfflineCache = () => {
      if (typeof window !== "undefined" && window.localStorage) {
        try {
          window.localStorage.setItem(
            "diverdiagram_offline_draft",
            JSON.stringify({
              id: currentDiagramId,
              title,
              diagram_data: normalizedData,
              mermaid_code: normalizedCode,
              updated_at: new Date().toISOString(),
            })
          );
        } catch (e) {
          console.error("Local draft backup failed", e);
        }
      }
    };

    if (!isSupabaseConfigured || !supabase) {
      backupToOfflineCache();
      set({ 
        storageError: "Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY before saving. (สำรองข้อมูลแบบร่างลงเครื่องแล้ว)",
        autoSaveState: "dirty"
      });
      return;
    }
    const currentUser = useAuthStore.getState().currentUser;
    if (!currentUser?.id) {
      backupToOfflineCache();
      set({ 
        storageError: "Sign in before saving to the database. (สำรองข้อมูลแบบร่างลงเครื่องแล้ว)",
        autoSaveState: "dirty"
      });
      return;
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      backupToOfflineCache();
      set({
        storageError: "คุณกำลังทำงานแบบออฟไลน์ ระบบสำรองข้อมูลล่าสุดไว้ในบราวเซอร์ของคุณแล้ว",
        autoSaveState: "dirty",
        savingDiagram: false
      });
      return;
    }

    const isNew = !currentDiagramId;
    const payload = {
      title,
      purpose_title: normalizedData.purpose.title,
      purpose_kpi: normalizedData.purpose.kpi,
      diagram_data: normalizedData,
      mermaid_code: normalizedCode,
      thumbnail_svg: buildStoredThumbnailSvg(normalizedData, normalizedCode),
    };
    if (isNew) {
      payload.user_id = currentUser.id;
    }

    set({ savingDiagram: true, storageError: "" });
    if (isAuto) {
      set({ autoSaveState: "saving" });
    } else {
      set({ storageMessage: "" });
    }

    try {
      const query = currentDiagramId
        ? supabase
            .from("driver_diagrams")
            .update(payload)
            .eq("id", currentDiagramId)
            .select(savedDiagramSelectFields)
            .single()
        : supabase
            .from("driver_diagrams")
            .insert(payload)
            .select(savedDiagramSelectFields)
            .single();

      let { data: row, error } = await query;

      if (currentDiagramId && error && String(error.message || "").includes("row-level security policy")) {
        console.warn("Update failed due to RLS. Retrying as a new INSERT...", error);
        
        const insertPayload = {
          ...payload,
          user_id: currentUser.id
        };

        const insertQuery = supabase
          .from("driver_diagrams")
          .insert(insertPayload)
          .select(savedDiagramSelectFields)
          .single();

        const insertResult = await insertQuery;
        row = insertResult.data;
        error = insertResult.error;

        if (!error && row) {
          set({ 
            currentDiagramId: row.id,
            userRole: "owner",
            versionHistory: [],
            lastSharedUrl: ""
          });
        }
      }

      if (error) {
        backupToOfflineCache();
        let displayError = error.message || "Unable to save this diagram.";
        if (displayError.includes("row-level security policy")) {
          displayError = "เซสชันการเข้าสู่ระบบของคุณหมดอายุ หรือสิทธิ์เข้าถึงไม่ถูกต้อง โปรดลองลงชื่อออก (Sign Out) แล้วลงชื่อเข้าใช้งานใหม่อีกครั้ง";
        }
        set({
          storageError: displayError + " (สำรองข้อมูลแบบร่างลงเครื่องแล้ว)",
          autoSaveState: isAuto ? "dirty" : "idle",
          savingDiagram: false
        });
        return;
      }

      if (row) {
        set({ currentDiagramId: row.id, lastSavedSnapshot: snapshot });
        
        if (typeof window !== "undefined" && window.localStorage) {
          try {
            window.localStorage.removeItem("diverdiagram_offline_draft");
          } catch (e) {
            console.error("Failed to clear offline cache", e);
          }
        }

        if (!currentDiagramId || snapshot !== lastVersionSnapshot) {
          const versionError = await get().createDiagramVersion({
            diagramId: row.id,
            title: row.title,
            diagramData: normalizedData,
            mermaidCode: normalizedCode,
            saveSource: isAuto ? "autosave" : currentDiagramId ? "manual" : "create",
          });
          if (versionError) {
            set({ 
              storageError: "Saved the diagram, but could not record version history.",
              autoSaveState: "dirty",
              savingDiagram: false
            });
            return;
          } else {
            set({ lastVersionSnapshot: snapshot });
            await get().refreshVersionHistory(row.id);
          }
        }
        if (hasActiveShareLink(row)) {
          const sharedError = await get().syncSharedDiagramLink({
            diagramRow: {
              ...row,
              shared_at: row.shared_at || new Date().toISOString(),
            },
            diagramData: normalizedData,
            mermaidCode: normalizedCode,
          });
          if (sharedError) {
            set({ storageError: "Saved the diagram, but could not refresh the shared link snapshot." });
          }
        }
        set({ documentTitle: row.title });
        get().upsertSavedDiagram(row);
      }

      set({
        autoSaveState: "saved",
        storageMessage: isAuto ? "Draft auto-saved." : currentDiagramId ? "Saved changes to database." : "Saved to database."
      });
    } catch (err) {
      backupToOfflineCache();
      let displayError = err.message || "Unable to save this diagram.";
      if (displayError.includes("row-level security policy")) {
        displayError = "เซสชันการเข้าสู่ระบบของคุณหมดอายุ หรือสิทธิ์เข้าถึงไม่ถูกต้อง โปรดลองลงชื่อออก (Sign Out) แล้วลงชื่อเข้าใช้งานใหม่อีกครั้ง";
      }
      set({
        storageError: displayError + " (สำรองข้อมูลแบบร่างลงเครื่องแล้ว)",
        autoSaveState: "dirty"
      });
    } finally {
      set({ savingDiagram: false });
    }
  },
});
