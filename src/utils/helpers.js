import { supabaseUrl } from "../supabaseClient.js";
import {
  defaultData,
  GALLERY_DISPLAY_NAME_STORAGE_KEY,
  WORKSPACE_INTRO_COLLAPSED_STORAGE_KEY,
  PREVIEW_VIEW_STORAGE_KEY,
  PREVIEW_ZOOM_STORAGE_KEY,
  PREVIEW_ZOOM_MIN,
  PREVIEW_ZOOM_MAX,
  SHARE_LINK_DURATION_MS,
} from "./constants.js";
import { defaultLanguage, defaultDocumentTitle, translations } from "./translations.js";
import { sanitizeMermaidCode, parseMermaidCode, buildTemplateSvg } from "./mermaidParser.js";

export const uid = () => crypto.randomUUID();

export function getSavedDiagramSortOptions(t) {
  return [
    { value: "updated_desc", label: t.sortOptions.updated_desc },
    { value: "opened_desc", label: t.sortOptions.opened_desc },
    { value: "title_asc", label: t.sortOptions.title_asc },
  ];
}

export function getSavedDiagramScopeOptions(t) {
  return [
    { value: "active", label: t.scopeOptions.active },
    { value: "all", label: t.scopeOptions.all },
    { value: "archived", label: t.scopeOptions.archived },
  ];
}

export function formatSavedDateTime(value, language = defaultLanguage) {
  return value ? new Date(value).toLocaleString(language === "en" ? "en-US" : "th-TH") : "-";
}

export function ensureDocumentMeta(selector, attributes) {
  if (typeof document === "undefined") return null;

  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement("meta");
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
    document.head.appendChild(element);
  }
  return element;
}

export function updateDocumentPresentation({ title, description }) {
  if (typeof document === "undefined") return;

  document.title = title;

  [
    ['meta[name="description"]', { name: "description" }, description],
    ['meta[property="og:title"]', { property: "og:title" }, title],
    ['meta[property="og:description"]', { property: "og:description" }, description],
    ['meta[name="twitter:title"]', { name: "twitter:title" }, title],
    ['meta[name="twitter:description"]', { name: "twitter:description" }, description],
  ].forEach(([selector, attrs, content]) => {
    const tag = ensureDocumentMeta(selector, attrs);
    if (tag) {
      tag.setAttribute("content", content);
    }
  });
}

export function isPreviewAuthLayoutEnabled() {
  if (typeof window === "undefined") return false;

  const params = new URLSearchParams(window.location.search);
  return params.get("previewAuth") === "1";
}

export function buildExportFilename(title, extension) {
  const base = String(title || defaultDocumentTitle)
    .trim()
    .replace(/[\\/:*?"<>|]+/g, " ")
    .replace(/\s+/g, " ")
    .slice(0, 80);

  return `${base || defaultDocumentTitle}.${extension}`;
}

export function getNextShareExpiry() {
  return new Date(Date.now() + SHARE_LINK_DURATION_MS).toISOString();
}

export function isExpiredTimestamp(value) {
  return Boolean(value) && new Date(value).getTime() <= Date.now();
}

export function hasActiveShareLink(item) {
  return Boolean(item?.share_id) && !item?.share_revoked_at && !isExpiredTimestamp(item?.share_expires_at);
}

export function getSharedDiagramFunctionUrl(shareId) {
  if (!supabaseUrl || !shareId) return "";
  return `${supabaseUrl}/functions/v1/shared-driver-diagram?share=${encodeURIComponent(shareId)}`;
}

export function getPublicGalleryFunctionUrl() {
  if (!supabaseUrl) return "";
  return `${supabaseUrl}/functions/v1/public-gallery`;
}

export function getAdminModerationFunctionUrl() {
  if (!supabaseUrl) return "";
  return `${supabaseUrl}/functions/v1/gallery-admin-moderation`;
}

export function getReportGalleryFunctionUrl() {
  if (!supabaseUrl) return "";
  return `${supabaseUrl}/functions/v1/report-gallery-item`;
}

export function readGalleryDisplayName() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(GALLERY_DISPLAY_NAME_STORAGE_KEY) || "";
}

export function readWorkspaceIntroCollapsed() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(WORKSPACE_INTRO_COLLAPSED_STORAGE_KEY) === "true";
}

export function readPreviewView() {
  if (typeof window === "undefined") return "preview";
  const saved = window.localStorage.getItem(PREVIEW_VIEW_STORAGE_KEY);
  return saved === "code" ? "code" : "preview";
}

export function readPreviewZoom() {
  if (typeof window === "undefined") return 1;
  const saved = Number(window.localStorage.getItem(PREVIEW_ZOOM_STORAGE_KEY));
  if (Number.isFinite(saved) && saved >= 0.5 && saved <= 2) {
    return saved;
  }
  return 1;
}

export function buildGalleryDisplayName(name, email = "") {
  const trimmed = String(name || "").trim();
  if (trimmed) return trimmed;

  const emailPrefix = String(email || "").split("@")[0].replace(/[._-]+/g, " ").trim();
  return emailPrefix;
}

export function readAppLocation() {
  if (typeof window === "undefined") {
    return { shareId: "", gallery: false, admin: false };
  }

  const params = new URLSearchParams(window.location.search);
  return {
    shareId: params.get("share") || "",
    gallery: params.get("gallery") === "1",
    admin: params.get("admin") === "1",
  };
}

export function replaceAppLocation(nextParams) {
  if (typeof window === "undefined") return;

  const query = nextParams.toString();
  const nextUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
  window.history.replaceState({}, document.title, nextUrl);
}

export function sortSavedDiagrams(items, sortKey) {
  const list = [...items];

  const compareFavorite = (a, b) => Number(Boolean(b.is_favorite)) - Number(Boolean(a.is_favorite));

  if (sortKey === "title_asc") {
    return list.sort((a, b) => {
      const favoriteDelta = compareFavorite(a, b);
      if (favoriteDelta) return favoriteDelta;
      return String(a.title || a.purpose_title || "").localeCompare(String(b.title || b.purpose_title || ""), "th");
    });
  }

  if (sortKey === "opened_desc") {
    return list.sort((a, b) => {
      const favoriteDelta = compareFavorite(a, b);
      if (favoriteDelta) return favoriteDelta;
      return new Date(b.last_opened_at || 0).getTime() - new Date(a.last_opened_at || 0).getTime();
    });
  }

  return list.sort((a, b) => {
    const favoriteDelta = compareFavorite(a, b);
    if (favoriteDelta) return favoriteDelta;
    return new Date(b.updated_at || b.created_at || 0).getTime() - new Date(a.updated_at || a.created_at || 0).getTime();
  });
}

export function normalizeStoredDiagramData(input) {
  const source = input && typeof input === "object" ? input : defaultData;

  return {
    purpose: {
      title: String(source?.purpose?.title || ""),
      kpi: String(source?.purpose?.kpi || ""),
    },
    primaryDrivers: Array.isArray(source?.primaryDrivers)
      ? source.primaryDrivers.map((primary) => ({
          id: primary?.id || uid(),
          title: String(primary?.title || ""),
          kpi: String(primary?.kpi || ""),
          secondaryDrivers: Array.isArray(primary?.secondaryDrivers)
            ? primary.secondaryDrivers.map((secondary) => ({
                id: secondary?.id || uid(),
                title: String(secondary?.title || ""),
                kpi: String(secondary?.kpi || ""),
                changeIdeas: Array.isArray(secondary?.changeIdeas)
                  ? secondary.changeIdeas.map((change) => ({
                      id: change?.id || uid(),
                      title: String(change?.title || ""),
                      kpi: String(change?.kpi || ""),
                    }))
                  : [],
              }))
            : [],
        }))
      : [],
  };
}

export function hasRenderableDiagramData(diagramData) {
  if (!diagramData || typeof diagramData !== "object") return false;

  const purposeTitle = String(diagramData?.purpose?.title || "").trim();
  const purposeKpi = String(diagramData?.purpose?.kpi || "").trim();
  const primaryCount = Array.isArray(diagramData?.primaryDrivers) ? diagramData.primaryDrivers.length : 0;

  return Boolean(purposeTitle || purposeKpi || primaryCount > 0);
}

export function resolveDiagramDataForEditor(diagramData, mermaidCode) {
  if (hasRenderableDiagramData(diagramData)) {
    return normalizeStoredDiagramData(diagramData);
  }

  const normalizedCode = sanitizeMermaidCode(mermaidCode || "");
  if (normalizedCode) {
    try {
      return normalizeStoredDiagramData(parseMermaidCode(normalizedCode));
    } catch (_error) {
      // Older saved diagrams can still fall back to their stored payload/default scaffold.
    }
  }

  return normalizeStoredDiagramData(diagramData);
}

export function buildDiagramSnapshot(title, diagramData, mermaidCode) {
  return JSON.stringify({
    title: String(title || "").trim() || defaultDocumentTitle,
    diagramData: normalizeStoredDiagramData(diagramData),
    mermaidCode: sanitizeMermaidCode(mermaidCode || ""),
  });
}

export function getThumbnailMarkup(diagramData, mermaidCode) {
  const normalizedData = resolveDiagramDataForEditor(diagramData, mermaidCode);
  return buildTemplateSvg(normalizedData);
}

export function buildStoredThumbnailSvg(diagramData, mermaidCode) {
  // Return empty string to use theme image thumbnails instead of Mermaid SVG
  return "";
}

export function getStoredThumbnailMarkup(thumbnailSvg, diagramData, mermaidCode) {
  // Always use theme image - ignore stored thumbnail_svg
  return "";
}

const thumbnailMarkupCache = new Map();

export function getCachedThumbnailMarkup(diagramData, mermaidCode) {
  const key = buildDiagramSnapshot("thumbnail", diagramData, mermaidCode);
  if (thumbnailMarkupCache.has(key)) {
    return thumbnailMarkupCache.get(key);
  }

  const markup = getThumbnailMarkup(diagramData, mermaidCode);
  thumbnailMarkupCache.set(key, markup);

  if (thumbnailMarkupCache.size > 80) {
    const oldestKey = thumbnailMarkupCache.keys().next().value;
    thumbnailMarkupCache.delete(oldestKey);
  }

  return markup;
}
