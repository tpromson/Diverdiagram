import { isSupabaseConfigured, supabase, supabasePublishableKey } from "../../supabaseClient.js";
import { defaultLanguage, translations } from "../../utils/translations.js";
import {
  getAdminModerationFunctionUrl,
} from "../../utils/helpers.js";
import { useAuthStore } from "../useAuthStore.js";
import { useUIStore } from "../useUIStore.js";

export const createAdminSlice = (set, get) => ({
  adminQueue: [],
  adminUsers: [],
  adminLoading: false,
  adminError: "",
  adminOffset: 0,
  adminHasMore: false,
  moderationActionToken: "",
  adminEmailDraft: "",
  adminUserAction: "",

  fetchAdminQueue: async () => {
    const currentUser = useAuthStore.getState().currentUser;
    const isGalleryAdmin = useAuthStore.getState().isGalleryAdmin;
    const routeState = useUIStore.getState().routeState;
    const lang = useUIStore.getState().language;
    const t = translations[lang] || translations[defaultLanguage];

    if (!isSupabaseConfigured || !supabase || !routeState.admin || routeState.shareId || !currentUser?.id || !isGalleryAdmin) {
      set({
        adminQueue: [],
        adminUsers: [],
        adminLoading: false,
        adminError: "",
        adminOffset: 0,
        adminHasMore: false
      });
      return;
    }

    set({ adminLoading: true, adminError: "", adminOffset: 0 });
    try {
      const { data: authData } = await supabase.auth.getSession();
      const accessToken = authData?.session?.access_token;
      const response = await fetch(`${getAdminModerationFunctionUrl()}?offset=0&limit=10`, {
        headers: {
          apikey: supabasePublishableKey,
          Authorization: `Bearer ${accessToken || ""}`,
        },
      });

      const payload = await response.json();
      if (!response.ok) {
        set({
          adminQueue: [],
          adminUsers: [],
          adminError: payload?.error || t.adminAccessDenied,
          adminHasMore: false
        });
      } else {
        set({
          adminQueue: Array.isArray(payload?.items) ? payload.items : [],
          adminUsers: Array.isArray(payload?.admins) ? payload.admins : [],
          adminHasMore: Boolean(payload?.hasMore)
        });
      }
    } catch (err) {
      set({
        adminQueue: [],
        adminUsers: [],
        adminError: t.adminAccessDenied,
        adminHasMore: false
      });
    } finally {
      set({ adminLoading: false });
    }
  },

  loadMoreAdminQueue: async () => {
    const { adminLoading, adminHasMore, adminQueue } = get();
    if (!supabase || adminLoading || !adminHasMore) return;

    const lang = useUIStore.getState().language;
    const t = translations[lang] || translations[defaultLanguage];
    set({ adminLoading: true });
    const nextOffset = adminQueue.length;

    try {
      const { data: authData } = await supabase.auth.getSession();
      const accessToken = authData?.session?.access_token;
      const response = await fetch(`${getAdminModerationFunctionUrl()}?offset=${nextOffset}&limit=10`, {
        headers: {
          apikey: supabasePublishableKey,
          Authorization: `Bearer ${accessToken || ""}`,
        },
      });
      const payload = await response.json();

      if (!response.ok) {
        set({ adminError: payload?.error || t.adminAccessDenied });
        return;
      }

      const nextItems = Array.isArray(payload?.items) ? payload.items : [];
      set({
        adminQueue: [...adminQueue, ...nextItems],
        adminOffset: nextOffset,
        adminHasMore: Boolean(payload?.hasMore)
      });
    } catch (err) {
      set({ adminError: t.adminAccessDenied });
    } finally {
      set({ adminLoading: false });
    }
  },

  runModerationAction: async (shareToken, action) => {
    if (!supabase || !shareToken || !action) return;

    const lang = useUIStore.getState().language;
    const t = translations[lang] || translations[defaultLanguage];

    if (typeof window === "undefined") return;

    const note = window.prompt(t.moderationReasonPrompt, "");
    if (note === null) {
      return;
    }

    set({ moderationActionToken: shareToken, adminError: "" });
    try {
      const { data: authData } = await supabase.auth.getSession();
      const accessToken = authData?.session?.access_token;
      const response = await fetch(getAdminModerationFunctionUrl(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabasePublishableKey,
          Authorization: `Bearer ${accessToken || ""}`,
        },
        body: JSON.stringify({
          action,
          shareToken,
          note: String(note || "").trim(),
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        set({ adminError: payload?.error || t.adminAccessDenied });
        return;
      }

      set((state) => ({
        storageMessage: t.moderationUpdated,
        adminQueue: state.adminQueue.map((item) => {
          if (item.share_token !== shareToken) return item;
          if (action === "hide") {
            return {
              ...item,
              is_public_gallery: false,
              gallery_hidden_at: new Date().toISOString(),
              gallery_hidden_reason: String(note || "").trim(),
              report_count: 0,
              recent_reports: [],
            };
          }
          if (action === "restore") {
            return {
              ...item,
              is_public_gallery: true,
              gallery_hidden_at: null,
              gallery_hidden_reason: "",
            };
          }
          if (action === "resolve_reports") {
            return {
              ...item,
              report_count: 0,
              recent_reports: [],
            };
          }
          return item;
        })
      }));
    } catch (err) {
      set({ adminError: t.adminAccessDenied });
    } finally {
      set({ moderationActionToken: "" });
    }
  },

  updateAdminUsers: async ({ action, email = "", userId = "" }) => {
    if (!supabase || !action) return;

    const currentUser = useAuthStore.getState().currentUser;
    const lang = useUIStore.getState().language;
    const t = translations[lang] || translations[defaultLanguage];

    if (action === "remove_admin" && userId === currentUser?.id) {
      set({ adminError: t.adminSelfRemoveBlocked });
      return;
    }

    set({ adminUserAction: action === "add_admin" ? "add" : userId, adminError: "" });
    try {
      const { data: authData } = await supabase.auth.getSession();
      const accessToken = authData?.session?.access_token;
      const response = await fetch(getAdminModerationFunctionUrl(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabasePublishableKey,
          Authorization: `Bearer ${accessToken || ""}`,
        },
        body: JSON.stringify({
          action,
          email: String(email || "").trim(),
          userId,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        set({ adminError: payload?.error || t.adminAccessDenied });
        return;
      }

      set({
        adminUsers: Array.isArray(payload?.admins) ? payload.admins : [],
        adminEmailDraft: action === "add_admin" ? "" : get().adminEmailDraft,
        storageMessage: action === "add_admin" ? t.adminAdded : t.adminRemoved
      });
    } catch (err) {
      set({ adminError: t.adminAccessDenied });
    } finally {
      set({ adminUserAction: "" });
    }
  },
});
