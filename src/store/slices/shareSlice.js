import { isSupabaseConfigured, supabase, supabasePublishableKey, supabaseUrl } from "../../supabaseClient.js";
import { defaultDocumentTitle, defaultLanguage, translations } from "../../utils/translations.js";
import {
  hasActiveShareLink,
  getNextShareExpiry,
  getSharedDiagramFunctionUrl,
  isExpiredTimestamp,
  normalizeStoredDiagramData,
  getPublicGalleryFunctionUrl,
  getReportGalleryFunctionUrl,
  resolveDiagramDataForEditor,
  buildStoredThumbnailSvg,
  buildGalleryDisplayName,
} from "../../utils/helpers.js";
import { sanitizeMermaidCode, buildMermaidCode } from "../../utils/mermaidParser.js";
import { useAuthStore } from "../useAuthStore.js";
import { useUIStore } from "../useUIStore.js";

const savedDiagramSelectFields =
  "id, title, purpose_title, diagram_data, mermaid_code, thumbnail_svg, created_at, updated_at, last_opened_at, is_favorite, archived_at, share_id, shared_at, share_expires_at, share_revoked_at";

export const createShareSlice = (set, get) => ({
  sharedView: null,
  sharedViewLoading: false,
  sharedViewError: "",
  sharedOpenedAt: "",
  lastSharedUrl: "",
  galleryItems: [],
  galleryLoading: false,
  galleryError: "",
  gallerySearch: "",
  reportingGalleryToken: "",
  galleryOffset: 0,
  galleryHasMore: false,

  collaboratorInvites: [],
  collaboratorsLoading: false,
  collaboratorsError: "",
  invitingCollaborator: false,
  inviteError: "",
  inviteMessage: "",

  setLastSharedUrl: (lastSharedUrl) => set({ lastSharedUrl }),

  clearSharedView: () => set({
    sharedView: null,
    sharedViewLoading: false,
    sharedViewError: "",
    sharedOpenedAt: "",
  }),

  enrichSavedDiagramsWithGalleryState: async (rows) => {
    const currentUser = useAuthStore.getState().currentUser;
    if (!supabase || !currentUser?.id || !Array.isArray(rows) || !rows.length) {
      return rows || [];
    }

    try {
      const { data: sharedRows, error } = await supabase
        .from("shared_driver_diagrams")
        .select("diagram_id, is_public_gallery, gallery_submitted_at, gallery_submitter_name")
        .eq("user_id", currentUser.id);

      if (error || !sharedRows?.length) {
        return rows;
      }

      const galleryByDiagramId = new Map(sharedRows.map((item) => [item.diagram_id, item]));
      return rows.map((row) => ({
        ...row,
        ...(galleryByDiagramId.get(row.id) || {}),
      }));
    } catch (err) {
      return rows;
    }
  },

  syncSharedDiagramLink: async ({ diagramRow, diagramData, mermaidCode }) => {
    const currentUser = useAuthStore.getState().currentUser;
    if (!supabase || !currentUser?.id || !diagramRow?.id || !diagramRow?.share_id) return null;

    try {
      const normalizedData = resolveDiagramDataForEditor(
        diagramData || diagramRow.diagram_data,
        mermaidCode || diagramRow.mermaid_code
      );
      const normalizedCode = sanitizeMermaidCode(mermaidCode || diagramRow.mermaid_code || buildMermaidCode(normalizedData));
      const thumbnailSvg = buildStoredThumbnailSvg(normalizedData, normalizedCode);

      const { error } = await supabase.from("shared_driver_diagrams").upsert(
        {
          diagram_id: diagramRow.id,
          user_id: currentUser.id,
          share_token: diagramRow.share_id,
          title: diagramRow.title || defaultDocumentTitle,
          purpose_title: diagramRow.purpose_title || normalizedData.purpose.title || "",
          diagram_data: normalizedData,
          mermaid_code: normalizedCode,
          thumbnail_svg: thumbnailSvg,
          shared_at: diagramRow.shared_at || new Date().toISOString(),
          expires_at: diagramRow.share_expires_at || null,
          revoked_at: diagramRow.share_revoked_at || null,
        },
        { onConflict: "diagram_id" }
      );

      return error || null;
    } catch (err) {
      return err;
    }
  },

  shareDiagram: async (item, { regenerate = false } = {}) => {
    const currentUser = useAuthStore.getState().currentUser;
    if (!supabase || !currentUser?.id) {
      set({ storageError: "Sign in before sharing diagrams." });
      return;
    }

    set({ sharingDiagramId: item.id, storageError: "" });
    try {
      let row = item;
      const needsNewShareLink = regenerate || !hasActiveShareLink(item);

      if (needsNewShareLink) {
        const { data, error } = await supabase
          .from("driver_diagrams")
          .update({
            share_id: regenerate || !item.share_id ? crypto.randomUUID() : item.share_id,
            shared_at: new Date().toISOString(),
            share_expires_at: getNextShareExpiry(),
            share_revoked_at: null,
          })
          .eq("id", item.id)
          .select(savedDiagramSelectFields)
          .single();

        if (error || !data) {
          set({ sharingDiagramId: "", storageError: error?.message || "Unable to create a share link." });
          return;
        }

        row = data;
        get().upsertSavedDiagram(row);
      }

      const { data: sourceRow, error: sourceError } = await supabase
        .from("driver_diagrams")
        .select("*")
        .eq("id", item.id)
        .single();

      if (sourceError || !sourceRow) {
        set({ sharingDiagramId: "", storageError: sourceError?.message || "Unable to load the diagram for sharing." });
        return;
      }

      const sharedError = await get().syncSharedDiagramLink({
        diagramRow: sourceRow,
        diagramData: sourceRow.diagram_data,
        mermaidCode: sourceRow.mermaid_code,
      });

      if (sharedError) {
        set({ sharingDiagramId: "", storageError: "Unable to publish the shared snapshot." });
        return;
      }

      const shareUrl = `${window.location.origin}${window.location.pathname}?share=${row.share_id}`;
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(shareUrl);
        } catch (error) {
          set({ sharingDiagramId: "", storageError: error?.message || "Unable to copy the share link." });
          return;
        }
      }

      set({
        sharingDiagramId: "",
        lastSharedUrl: shareUrl,
        storageMessage: needsNewShareLink
          ? "Read-only share link copied. It will expire in 7 days."
          : "Read-only share link copied. Anyone with the link can preview and export this diagram."
      });
    } catch (err) {
      set({ sharingDiagramId: "", storageError: err.message || "Unable to share diagram." });
    }
  },

  revokeShareDiagram: async (item) => {
    const currentUser = useAuthStore.getState().currentUser;
    if (!supabase || !currentUser?.id) {
      set({ storageError: "Sign in before revoking share links." });
      return;
    }

    set({ sharingDiagramId: item.id, storageError: "" });
    try {
      const { data: row, error } = await supabase
        .from("driver_diagrams")
        .update({ share_revoked_at: new Date().toISOString() })
        .eq("id", item.id)
        .select(savedDiagramSelectFields)
        .single();

      if (error || !row) {
        set({ sharingDiagramId: "", storageError: error?.message || "Unable to revoke this share link." });
        return;
      }

      await supabase
        .from("shared_driver_diagrams")
        .update({ revoked_at: new Date().toISOString() })
        .eq("diagram_id", item.id);

      get().upsertSavedDiagram(row);
      set({
        sharingDiagramId: "",
        lastSharedUrl: "",
        storageMessage: "Share link revoked."
      });
    } catch (err) {
      set({ sharingDiagramId: "", storageError: err.message || "Unable to revoke share link." });
    }
  },

  toggleGallerySubmission: async (item, { publish }) => {
    const currentUser = useAuthStore.getState().currentUser;
    const galleryDisplayName = useAuthStore.getState().galleryDisplayName;
    if (!supabase || !currentUser?.id) {
      set({ storageError: "Sign in before sending diagrams to the gallery." });
      return;
    }

    set({ gallerySubmittingId: item.id, storageError: "" });
    try {
      let row = item;
      if (publish && !hasActiveShareLink(item)) {
        const { data, error } = await supabase
          .from("driver_diagrams")
          .update({
            share_id: item.share_id || crypto.randomUUID(),
            shared_at: new Date().toISOString(),
            share_expires_at: getNextShareExpiry(),
            share_revoked_at: null,
          })
          .eq("id", item.id)
          .select(savedDiagramSelectFields)
          .single();

        if (error || !data) {
          set({ gallerySubmittingId: "", storageError: error?.message || "Unable to prepare this diagram for the gallery." });
          return;
        }

        row = data;
        get().upsertSavedDiagram(row);
      }

      const { data: sourceRow, error: sourceError } = await supabase
        .from("driver_diagrams")
        .select("*")
        .eq("id", item.id)
        .single();

      if (sourceError || !sourceRow) {
        set({ gallerySubmittingId: "", storageError: sourceError?.message || "Unable to load the diagram for the gallery." });
        return;
      }

      const sharedError = await get().syncSharedDiagramLink({
        diagramRow: sourceRow,
        diagramData: sourceRow.diagram_data,
        mermaidCode: sourceRow.mermaid_code,
      });

      if (sharedError) {
        set({ gallerySubmittingId: "", storageError: "Unable to refresh the shared snapshot for the gallery." });
        return;
      }

      const nextSubmittedAt = publish ? new Date().toISOString() : null;
      const nextDisplayName = publish ? buildGalleryDisplayName(galleryDisplayName, currentUser.email || "") : "";
      const galleryPayload = {
        is_public_gallery: publish,
        gallery_submitted_at: nextSubmittedAt,
        gallery_submitter_name: nextDisplayName,
      };

      const { error: galleryError } = await supabase
        .from("shared_driver_diagrams")
        .update(galleryPayload)
        .eq("diagram_id", item.id);

      if (galleryError) {
        set({ gallerySubmittingId: "", storageError: galleryError.message || "Unable to update gallery status." });
        return;
      }

      get().upsertSavedDiagram({
        ...row,
        ...galleryPayload,
      });

      set({
        gallerySubmittingId: "",
        storageMessage: publish ? "Submitted this diagram to the gallery." : "Removed this diagram from the gallery."
      });
    } catch (err) {
      set({ gallerySubmittingId: "", storageError: err.message || "Unable to toggle gallery status." });
    }
  },

  fetchSharedDiagram: async (shareId) => {
    if (!isSupabaseConfigured || !supabase) return;

    set({ sharedViewLoading: true, sharedViewError: "" });
    try {
      const response = await fetch(getSharedDiagramFunctionUrl(shareId), {
        headers: {
          apikey: supabasePublishableKey,
        },
      });

      let row = null;
      let errorMessage = "";

      try {
        const payload = await response.json();
        if (!response.ok) {
          errorMessage = payload?.error || "This shared link is unavailable.";
        } else {
          row = payload;
        }
      } catch (_error) {
        errorMessage = response.ok ? "Unable to read the shared diagram response." : "This shared link is unavailable.";
      }

      if (!response.ok || !row) {
        set({
          sharedView: null,
          sharedViewError: errorMessage || "This shared link is unavailable.",
          sharedViewLoading: false
        });
        return;
      }

      if (isExpiredTimestamp(row.share_expires_at)) {
        set({
          sharedView: null,
          sharedViewError: "This shared link has expired.",
          sharedViewLoading: false
        });
        return;
      }

      const normalizedData = normalizeStoredDiagramData(row.diagram_data);
      const nextTitle = row.title || defaultDocumentTitle;
      const nextCode = buildMermaidCode(normalizedData);

      set({
        codeSource: "code",
        sharedView: row,
        currentDiagramId: "",
        documentTitle: nextTitle,
        data: normalizedData,
        codeInput: nextCode,
        autoSaveState: "idle",
        storageMessage: "",
        storageError: "",
        sharedOpenedAt: new Date().toISOString(),
        sharedViewLoading: false
      });
    } catch (err) {
      set({
        sharedView: null,
        sharedViewError: err.message || "This shared link is unavailable.",
        sharedViewLoading: false
      });
    }
  },

  fetchPublicGallery: async () => {
    const routeState = useUIStore.getState().routeState;
    if (!isSupabaseConfigured || !routeState.gallery || routeState.shareId || routeState.admin) {
      set({
        galleryItems: [],
        galleryLoading: false,
        galleryError: "",
        galleryOffset: 0,
        galleryHasMore: false
      });
      return;
    }

    set({ galleryLoading: true, galleryError: "", galleryOffset: 0 });
    try {
      const response = await fetch(`${getPublicGalleryFunctionUrl()}?offset=0&limit=12`, {
        headers: {
          apikey: supabasePublishableKey,
        },
      });

      const payload = await response.json();
      if (!response.ok) {
        set({
          galleryItems: [],
          galleryError: payload?.error || "Unable to load the gallery right now.",
          galleryHasMore: false
        });
      } else {
        set({
          galleryItems: Array.isArray(payload?.items) ? payload.items : [],
          galleryHasMore: Boolean(payload?.hasMore)
        });
      }
    } catch (err) {
      set({
        galleryItems: [],
        galleryError: "Unable to load the gallery right now.",
        galleryHasMore: false
      });
    } finally {
      set({ galleryLoading: false });
    }
  },

  loadMoreGalleryItems: async () => {
    const { galleryLoading, galleryHasMore, galleryItems } = get();
    if (galleryLoading || !galleryHasMore) return;

    const nextOffset = galleryItems.length;
    set({ galleryLoading: true });
    try {
      const response = await fetch(`${getPublicGalleryFunctionUrl()}?offset=${nextOffset}&limit=12`, {
        headers: {
          apikey: supabasePublishableKey,
        },
      });
      const payload = await response.json();

      if (!response.ok) {
        set({ galleryError: payload?.error || "Unable to load the gallery right now." });
        return;
      }

      const nextItems = Array.isArray(payload?.items) ? payload.items : [];
      set({
        galleryItems: [...galleryItems, ...nextItems],
        galleryOffset: nextOffset,
        galleryHasMore: Boolean(payload?.hasMore)
      });
    } catch (err) {
      set({ galleryError: "Unable to load the gallery right now." });
    } finally {
      set({ galleryLoading: false });
    }
  },

  reportGalleryItem: async (item) => {
    const currentUser = useAuthStore.getState().currentUser;
    const lang = useUIStore.getState().language;
    const t = translations[lang] || translations[defaultLanguage];

    if (!supabaseUrl || !item?.share_token) {
      set({ galleryError: t.reportGalleryFailed });
      return;
    }

    if (typeof window === "undefined") return;

    const reason = window.prompt(t.reportGalleryPrompt, "");
    if (reason === null) {
      return;
    }

    set({ reportingGalleryToken: item.share_token, galleryError: "" });
    try {
      const response = await fetch(getReportGalleryFunctionUrl(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabasePublishableKey,
        },
        body: JSON.stringify({
          shareToken: item.share_token,
          reason: String(reason || "").trim(),
          reporterEmail: currentUser?.email || "",
        }),
      });

      let payload = {};
      try {
        payload = await response.json();
      } catch (_error) {}

      if (!response.ok) {
        set({ galleryError: payload?.error || t.reportGalleryFailed });
        return;
      }

      set({ storageMessage: t.reportGallerySuccess });
    } catch (err) {
      set({ galleryError: t.reportGalleryFailed });
    } finally {
      set({ reportingGalleryToken: "" });
    }
  },

  fetchCollaborators: async (diagramId) => {
    if (!isSupabaseConfigured || !supabase || !diagramId) return;
    set({ collaboratorsLoading: true, collaboratorsError: "" });
    try {
      const { data, error } = await supabase
        .from("diagram_collaborators")
        .select("*")
        .eq("diagram_id", diagramId)
        .order("created_at", { ascending: true });
      if (error) {
        set({ collaboratorsError: error.message, collaboratorInvites: [] });
      } else {
        set({ collaboratorInvites: data || [] });
      }
    } catch (err) {
      set({ collaboratorsError: err.message || "Failed to load collaborators." });
    } finally {
      set({ collaboratorsLoading: false });
    }
  },

  inviteCollaborator: async (diagramId, email, role = "editor") => {
    if (!isSupabaseConfigured || !supabase || !diagramId || !email) return;
    const cleanEmail = String(email).trim().toLowerCase();
    if (!cleanEmail) {
      set({ inviteError: "Please enter a valid email address." });
      return;
    }

    set({ invitingCollaborator: true, inviteError: "", inviteMessage: "" });
    try {
      const { data, error } = await supabase
        .from("diagram_collaborators")
        .insert({
          diagram_id: diagramId,
          email: cleanEmail,
          role: role
        })
        .select("*")
        .single();

      if (error) {
        set({ inviteError: error.message });
      } else {
        set({
          inviteMessage: `Successfully invited ${cleanEmail} as ${role}!`,
          collaboratorInvites: [...get().collaboratorInvites, data]
        });
      }
    } catch (err) {
      set({ inviteError: err.message || "Failed to invite collaborator." });
    } finally {
      set({ invitingCollaborator: false });
    }
  },

  revokeCollaboratorAccess: async (inviteId) => {
    if (!isSupabaseConfigured || !supabase || !inviteId) return;
    set({ inviteError: "", inviteMessage: "" });
    try {
      const { error } = await supabase
        .from("diagram_collaborators")
        .delete()
        .eq("id", inviteId);

      if (error) {
        set({ inviteError: error.message });
      } else {
        set({
          inviteMessage: "Collaborator access revoked successfully.",
          collaboratorInvites: get().collaboratorInvites.filter((item) => item.id !== inviteId)
        });
      }
    } catch (err) {
      set({ inviteError: err.message || "Failed to revoke collaborator access." });
    }
  },
});
