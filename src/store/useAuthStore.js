import { create } from "zustand";
import { isSupabaseConfigured, supabase } from "../supabaseClient.js";
import {
  readGalleryDisplayName,
  buildGalleryDisplayName,
  readAppLocation,
  replaceAppLocation
} from "../utils/helpers.js";
import { GALLERY_DISPLAY_NAME_STORAGE_KEY } from "../utils/constants.js";
import { translations } from "../utils/translations.js";

let unsubscribeFn = null;

export const useAuthStore = create((set, get) => ({
  session: null,
  currentUser: null,
  authLoading: isSupabaseConfigured,
  authVerifyingLink: false,
  authEmail: "",
  authSubmitting: false,
  authMessage: "",
  authError: "",
  galleryDisplayName: readGalleryDisplayName(),
  editingGalleryDisplayName: false,
  galleryDisplayNameDraft: readGalleryDisplayName(),
  isGalleryAdmin: false,

  setAuthEmail: (authEmail) => set({ authEmail }),
  setAuthError: (authError) => set({ authError }),
  setAuthMessage: (authMessage) => set({ authMessage }),
  setAuthSubmitting: (authSubmitting) => set({ authSubmitting }),
  
  setGalleryDisplayName: (galleryDisplayName) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(GALLERY_DISPLAY_NAME_STORAGE_KEY, galleryDisplayName);
    }
    set({ galleryDisplayName, galleryDisplayNameDraft: galleryDisplayName });
  },

  setEditingGalleryDisplayName: (editingGalleryDisplayName) => {
    const state = { editingGalleryDisplayName };
    if (!editingGalleryDisplayName) {
      state.galleryDisplayNameDraft = get().galleryDisplayName;
    }
    set(state);
  },

  setGalleryDisplayNameDraft: (galleryDisplayNameDraft) => set({ galleryDisplayNameDraft }),

  loadAdminState: async (userId) => {
    if (!userId || !supabase) {
      set({ isGalleryAdmin: false });
      return;
    }
    try {
      const { data, error } = await supabase
        .from("gallery_admins")
        .select("user_id")
        .eq("user_id", userId)
        .maybeSingle();
      set({ isGalleryAdmin: Boolean(data?.user_id) && !error });
    } catch (err) {
      set({ isGalleryAdmin: false });
    }
  },

  initializeAuth: async (onUserChangeCallback) => {
    if (!isSupabaseConfigured || !supabase) {
      set({ authLoading: false });
      return () => {};
    }

    const syncAuthState = async (nextSession) => {
      try {
        const nextUser = nextSession?.user ?? null;
        const prevUser = get().currentUser;

        set({ session: nextSession, currentUser: nextUser });

        if (nextUser) {
          // Initialize default display name if empty
          const email = nextUser.email || "";
          const currentName = get().galleryDisplayName;
          if (!currentName || !currentName.trim()) {
            const nextName = buildGalleryDisplayName("", email);
            if (nextName) {
              get().setGalleryDisplayName(nextName);
            }
          }
          // Fetch admin state
          await get().loadAdminState(nextUser.id);
        } else {
          set({ isGalleryAdmin: false });
        }

        if (onUserChangeCallback && prevUser?.id !== nextUser?.id) {
          onUserChangeCallback(prevUser, nextUser);
        }
      } catch (syncErr) {
        console.error("Error inside syncAuthState:", syncErr);
      }
    };

    try {
      // Check URL for OTP verify token
      const params = new URLSearchParams(window.location.search);
      const tokenHash = params.get("token_hash");
      const type = params.get("type");

      if (tokenHash) {
        set({ authVerifyingLink: true });
        try {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type || "email",
          });

          if (error) {
            set({ authError: error.message || "Unable to verify your sign-in link." });
          } else {
            set({ authError: "", authMessage: "Signed in successfully." });
            const nextParams = new URLSearchParams(window.location.search);
            nextParams.delete("token_hash");
            nextParams.delete("type");
            replaceAppLocation(nextParams);
          }
        } catch (otpErr) {
          console.error("verifyOtp thrown error:", otpErr);
          set({ authError: otpErr.message || "Unable to verify your sign-in link." });
        } finally {
          set({ authVerifyingLink: false });
        }
      }

      const { data: authData, error } = await supabase.auth.getSession();
      if (error) {
        set({ authError: error.message || "Unable to restore your session." });
      } else {
        await syncAuthState(authData.session);
      }
    } catch (err) {
      console.error("Auth session initialization error:", err);
      set({ authError: err.message || "Error restoring session." });
    } finally {
      set({ authLoading: false });
    }

    // Clean up previous subscription if any
    if (unsubscribeFn) {
      unsubscribeFn();
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      try {
        await syncAuthState(nextSession);
        set({ authLoading: false, authVerifyingLink: false });

        if (event === "SIGNED_IN") {
          set({ authError: "", authMessage: "Signed in successfully." });
        }

        if (event === "SIGNED_OUT") {
          set({ authError: "", authMessage: "Signed out." });
        }
      } catch (changeErr) {
        console.error("onAuthStateChange error:", changeErr);
        set({ authLoading: false, authVerifyingLink: false });
      }
    });

    unsubscribeFn = () => subscription.unsubscribe();
    return unsubscribeFn;
  },

  requestMagicLink: async () => {
    if (!isSupabaseConfigured || !supabase) {
      set({ authError: "Add Supabase env vars before signing in." });
      return false;
    }

    const email = get().authEmail.trim();
    if (!email) {
      set({ authError: "Enter your email before requesting a sign-in link." });
      return false;
    }

    set({ authSubmitting: true, authError: "", authMessage: "" });

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}${window.location.pathname}`,
      },
    });

    if (error) {
      set({
        authError: error.message || "Unable to send the sign-in link.",
        authSubmitting: false
      });
      return false;
    } else {
      set({
        authMessage: `Check ${email} for the sign-in link.`,
        authSubmitting: false,
        authError: ""
      });
      return true;
    }
  },

  signOut: async () => {
    if (!supabase) return;

    set({ authSubmitting: true, authError: "", authMessage: "" });

    const { error } = await supabase.auth.signOut();
    if (error) {
      set({ authError: error.message || "Unable to sign out right now." });
    }

    set({ authSubmitting: false });
  },

  saveGalleryDisplayName: (lang = "en") => {
    const draft = get().galleryDisplayNameDraft;
    const user = get().currentUser;
    const email = user?.email || "";
    const nextName = draft.trim() || buildGalleryDisplayName("", email);
    get().setGalleryDisplayName(nextName);
    set({
      editingGalleryDisplayName: false,
      authError: "",
      authMessage: translations[lang]?.galleryDisplayNameSaved || "Profile display name updated."
    });
  }
}));
