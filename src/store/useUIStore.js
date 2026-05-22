import { create } from "zustand";
import {
  readAppLocation,
  readPreviewView,
  readPreviewZoom,
  readWorkspaceIntroCollapsed,
  replaceAppLocation,
} from "../utils/helpers.js";
import { defaultLanguage } from "../utils/translations.js";
import {
  PREVIEW_ZOOM_MIN,
  PREVIEW_ZOOM_MAX,
  PREVIEW_ZOOM_STEP,
  PREVIEW_ZOOM_STORAGE_KEY,
  WORKSPACE_INTRO_COLLAPSED_STORAGE_KEY,
  PREVIEW_VIEW_STORAGE_KEY,
} from "../utils/constants.js";

export const useUIStore = create((set) => ({
  language: defaultLanguage,
  routeState: readAppLocation(),
  view: readPreviewView(),
  previewZoom: readPreviewZoom(),
  previewModalOpen: false,
  savedDrawerOpen: false,
  savedSearch: "",
  savedSort: "updated_desc",
  savedScope: "active",
  workspaceIntroCollapsed: readWorkspaceIntroCollapsed(),

  setLanguage: (language) => set({ language }),
  setRouteState: (routeState) => set({ routeState }),
  
  setView: (view) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(PREVIEW_VIEW_STORAGE_KEY, view);
    }
    set({ view });
  },

  setPreviewZoom: (previewZoom) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(PREVIEW_ZOOM_STORAGE_KEY, String(previewZoom));
    }
    set({ previewZoom });
  },

  zoomIn: () =>
    set((state) => {
      const nextZoom = Math.min(PREVIEW_ZOOM_MAX, state.previewZoom + PREVIEW_ZOOM_STEP);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(PREVIEW_ZOOM_STORAGE_KEY, String(nextZoom));
      }
      return { previewZoom: nextZoom };
    }),

  zoomOut: () =>
    set((state) => {
      const nextZoom = Math.max(PREVIEW_ZOOM_MIN, state.previewZoom - PREVIEW_ZOOM_STEP);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(PREVIEW_ZOOM_STORAGE_KEY, String(nextZoom));
      }
      return { previewZoom: nextZoom };
    }),

  resetZoom: () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(PREVIEW_ZOOM_STORAGE_KEY, "1");
    }
    set({ previewZoom: 1 });
  },

  setPreviewModalOpen: (previewModalOpen) => set({ previewModalOpen }),
  setSavedDrawerOpen: (savedDrawerOpen) => set({ savedDrawerOpen }),
  setSavedSearch: (savedSearch) => set({ savedSearch }),
  setSavedSort: (savedSort) => set({ savedSort }),
  setSavedScope: (savedScope) => set({ savedScope }),

  setWorkspaceIntroCollapsed: (workspaceIntroCollapsed) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(WORKSPACE_INTRO_COLLAPSED_STORAGE_KEY, String(workspaceIntroCollapsed));
    }
    set({ workspaceIntroCollapsed });
  },

  openGalleryPage: () => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    params.delete("share");
    params.delete("admin");
    params.delete("token_hash");
    params.delete("type");
    params.set("gallery", "1");
    replaceAppLocation(params);
    set({ routeState: readAppLocation() });
  },

  openAdminPage: () => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    params.delete("share");
    params.delete("gallery");
    params.set("admin", "1");
    replaceAppLocation(params);
    set({ routeState: readAppLocation() });
  },

  exitGalleryPage: () => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    params.delete("gallery");
    params.delete("share");
    replaceAppLocation(params);
    set({ routeState: readAppLocation() });
  },

  exitAdminPage: () => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    params.delete("admin");
    params.delete("share");
    replaceAppLocation(params);
    set({ routeState: readAppLocation() });
  },

  exitSharedView: () => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    params.delete("share");
    replaceAppLocation(params);
    set({ routeState: readAppLocation() });
  }
}));
