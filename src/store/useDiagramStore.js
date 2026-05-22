import { create } from "zustand";
import { isSupabaseConfigured, supabase, supabasePublishableKey, supabaseUrl } from "../supabaseClient.js";
import { defaultData, MAX_AUTOSAVE_VERSIONS, MAX_VERSION_HISTORY } from "../utils/constants.js";
import { defaultDocumentTitle, defaultLanguage, translations } from "../utils/translations.js";
import {
  uid,
  ensureDocumentMeta,
  updateDocumentPresentation,
  buildExportFilename,
  getNextShareExpiry,
  isExpiredTimestamp,
  hasActiveShareLink,
  getSharedDiagramFunctionUrl,
  getPublicGalleryFunctionUrl,
  getAdminModerationFunctionUrl,
  getReportGalleryFunctionUrl,
  sortSavedDiagrams,
  normalizeStoredDiagramData,
  resolveDiagramDataForEditor,
  buildDiagramSnapshot,
  buildStoredThumbnailSvg
} from "../utils/helpers.js";
import { buildMermaidCode, sanitizeMermaidCode, buildTemplateSvg, parseMermaidCode } from "../utils/mermaidParser.js";
import { useAuthStore } from "./useAuthStore.js";
import { useUIStore } from "./useUIStore.js";

// Check if defaultData is being mutated
console.log('defaultData at module load:', JSON.stringify(defaultData).substring(0, 200));

const savedDiagramSelectFields =
  "id, title, purpose_title, diagram_data, mermaid_code, thumbnail_svg, created_at, updated_at, last_opened_at, is_favorite, archived_at, share_id, shared_at, share_expires_at, share_revoked_at";

export const useDiagramStore = create((set, get) => ({
  data: normalizeStoredDiagramData(defaultData),
  documentTitle: defaultDocumentTitle,
  currentDiagramId: "",
  codeInput: buildMermaidCode(defaultData),
  codeSyncError: "",
  codeSyncMessage: "",
  svg: "",
  renderError: "",
  savedDiagrams: [],
  loadingSavedDiagrams: false,
  savingDiagram: false,
  autoSaveState: "idle",
  openingDiagramId: "",
  deletingDiagramId: "",
  duplicatingDiagramId: "",
  renamingDiagramId: "",
  renameDraft: "",
  renamingDiagram: false,
  sharingDiagramId: "",
  gallerySubmittingId: "",
  storageMessage: "",
  storageError: "",
  copied: false,
  exportingDocx: false,
  exportError: "",

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

  adminQueue: [],
  adminUsers: [],
  adminLoading: false,
  adminError: "",
  adminOffset: 0,
  adminHasMore: false,
  moderationActionToken: "",
  adminEmailDraft: "",
  adminUserAction: "",

  versionHistory: [],
  loadingVersionHistory: false,
  restoringVersionId: "",
  restoringAndSavingVersionId: "",

  codeSource: "form",
  lastSavedSnapshot: buildDiagramSnapshot(defaultDocumentTitle, defaultData, buildMermaidCode(defaultData)),
  lastVersionSnapshot: buildDiagramSnapshot(defaultDocumentTitle, defaultData, buildMermaidCode(defaultData)),

  setData: (data) => set({ data }),
  setDocumentTitle: (documentTitle) => set({ documentTitle }),
  setCurrentDiagramId: (currentDiagramId) => set({ currentDiagramId }),
  setCodeInput: (codeInput) => set({ codeInput }),
  setSvg: (svg) => set({ svg }),
  setRenderError: (renderError) => set({ renderError }),
  setStorageError: (storageError) => set({ storageError }),
  setStorageMessage: (storageMessage) => set({ storageMessage }),
  setLastSharedUrl: (lastSharedUrl) => set({ lastSharedUrl }),
  setCodeSource: (codeSource) => set({ codeSource }),
  setCopied: (copied) => set({ copied }),
  setExportingDocx: (exportingDocx) => set({ exportingDocx }),
  setExportError: (exportError) => set({ exportError }),

  copyMermaid: () => {
    const codeInput = get().codeInput;
    navigator.clipboard.writeText(sanitizeMermaidCode(codeInput));
    set({ copied: true });
    setTimeout(() => set({ copied: false }), 1200);
  },

  triggerBlobDownload: (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  },

  saveBlobWithPicker: async (blob, filename, options = {}) => {
    if (typeof window.showSaveFilePicker !== "function") {
      get().triggerBlobDownload(blob, filename);
      return;
    }
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: filename,
        types: [
          {
            description: options.description || "File",
            accept: {
              [blob.type || "application/octet-stream"]: options.extensions || [`.${filename.split(".").pop()}`],
            },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Save file picker failed:", err);
        get().triggerBlobDownload(blob, filename);
      }
    }
  },

  downloadMermaid: () => {
    const { codeInput, documentTitle } = get();
    const blob = new Blob([sanitizeMermaidCode(codeInput)], { type: "text/plain;charset=utf-8" });
    get().triggerBlobDownload(blob, buildExportFilename(documentTitle, "mmd"));
  },

  downloadSvg: () => {
    const { data, codeInput, documentTitle } = get();
    let exportData = data;
    try {
      exportData = parseMermaidCode(sanitizeMermaidCode(codeInput));
    } catch (_error) {
      exportData = data;
    }
    const blob = new Blob([buildTemplateSvg(exportData)], { type: "image/svg+xml;charset=utf-8" });
    get().triggerBlobDownload(blob, buildExportFilename(documentTitle, "svg"));
  },

  downloadPng: async () => {
    try {
      const { data, codeInput, documentTitle } = get();
      let exportData = data;
      try {
        exportData = parseMermaidCode(sanitizeMermaidCode(codeInput));
      } catch (_error) {
        exportData = data;
      }
      const svgString = buildTemplateSvg(exportData);
      const svgHeight = parseInt(svgString.match(/height="(\d+)"/)?.[1] || "600", 10);
      const canvas = document.createElement("canvas");
      canvas.width = 1980;
      canvas.height = Math.max(svgHeight, 600);
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const img = new Image();
      const svgBlob = new Blob([svgString], { type: "image/svg+xml" });
      const url = URL.createObjectURL(svgBlob);
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        canvas.toBlob((blob) => {
          if (blob) {
            get().triggerBlobDownload(blob, buildExportFilename(documentTitle, "png"));
          }
        }, "image/png");
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        console.error("Failed to load SVG");
        alert("Failed to export PNG. Please try again.");
      };
      img.src = url;
    } catch (error) {
      console.error("PNG export error:", error);
      alert("Failed to export PNG. Please try again.");
    }
  },

  downloadDocx: async () => {
    try {
      set({ exportError: "", exportingDocx: true });
      const { data, documentTitle } = get();
      const {
        AlignmentType,
        BorderStyle,
        Document,
        Packer,
        Paragraph,
        Table,
        TableCell,
        TableRow,
        TextRun,
        VerticalAlign,
        WidthType,
      } = await import("docx");

      const bodyFont = "TH SarabunPSK";
      const sizeBody = 32;
      const sizeHeading = 36;
      const purposeKpiLines = String(data.purpose.kpi || "")
        .split("\n")
        .filter((line) => line.trim());
      const borderAll = {
        top: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
        bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
        left: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
        right: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
      };

      const makeKpiRuns = (kpiText) => {
        const [first, ...rest] = String(kpiText || "").split("\n").filter((line) => line.trim());
        const lines = [first, ...rest].filter(Boolean);
        return lines.flatMap((line, index) => [
          new TextRun({
            text: index === 0 ? `KPI: ${line}` : line,
            italics: true,
            color: "666666",
            font: bodyFont,
            size: 28,
          }),
          ...(index < lines.length - 1 ? [new TextRun({ break: 1, font: bodyFont, size: 28 })] : []),
        ]);
      };

      const makeContentCell = (title, kpi, rowSpan = 1) =>
        new TableCell({
          rowSpan,
          verticalAlign: VerticalAlign.CENTER,
          width: { size: 33, type: WidthType.PERCENTAGE },
          margins: { top: 120, bottom: 120, left: 120, right: 120 },
          borders: borderAll,
          children: [
            new Paragraph({
              spacing: { after: 300 },
              children: [
                new TextRun({
                  text: title,
                  bold: true,
                  font: bodyFont,
                  size: sizeBody,
                }),
              ],
            }),
            new Paragraph({
              spacing: { after: 300 },
              children: makeKpiRuns(kpi),
            }),
          ],
        });

      const tableRows = [
        new TableRow({
          tableHeader: true,
          children: [
            "Primary Drivers & KPIs",
            "Secondary Drivers & KPIs",
            "Change Ideas & KPIs",
          ].map(
            (heading) =>
              new TableCell({
                width: { size: 33, type: WidthType.PERCENTAGE },
                borders: borderAll,
                shading: { fill: "F0F0F0" },
                margins: { top: 120, bottom: 120, left: 120, right: 120 },
                verticalAlign: VerticalAlign.CENTER,
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 300 },
                    children: [
                      new TextRun({
                        text: heading,
                        bold: true,
                        font: bodyFont,
                        size: sizeBody,
                      }),
                    ],
                  }),
                ],
              })
          ),
        }),
      ];

      data.primaryDrivers.forEach((primary) => {
        const secondaryGroups = primary.secondaryDrivers.length
          ? primary.secondaryDrivers
          : [{ title: "", kpi: "", changeIdeas: [{ title: "", kpi: "" }] }];
        const primarySpan = secondaryGroups.reduce(
          (sum, secondary) => sum + Math.max(secondary.changeIdeas.length, 1),
          0
        );
        let primaryPlaced = false;

        secondaryGroups.forEach((secondary) => {
          const changes = secondary.changeIdeas.length
            ? secondary.changeIdeas
            : [{ title: "", kpi: "" }];
          let secondaryPlaced = false;

          changes.forEach((change) => {
            const cells = [];

            if (!primaryPlaced) {
              cells.push(makeContentCell(primary.title, primary.kpi, primarySpan));
              primaryPlaced = true;
            }

            if (!secondaryPlaced) {
              cells.push(makeContentCell(secondary.title, secondary.kpi, changes.length));
              secondaryPlaced = true;
            }

            cells.push(makeContentCell(change.title, change.kpi));
            tableRows.push(new TableRow({ children: cells }));
          });
        });
      });

      const doc = new Document({
        sections: [
          {
            children: [
              new Paragraph({
                spacing: { after: 100 },
                children: [
                  new TextRun({
                    text: `เป้าหมาย: ${data.purpose.title}`,
                    bold: true,
                    font: bodyFont,
                    size: sizeHeading,
                  }),
                ],
              }),
              new Paragraph({
                spacing: { after: 120 },
                children: [
                  new TextRun({
                    text: "PURPOSE KPI:",
                    bold: true,
                    font: bodyFont,
                    size: sizeBody,
                  }),
                  ...purposeKpiLines.flatMap((line, index) => [
                    new TextRun({
                      text: index === 0 ? ` ${line}` : line,
                      font: bodyFont,
                      size: sizeBody,
                    }),
                    ...(index < purposeKpiLines.length - 1
                      ? [new TextRun({ break: 1, font: bodyFont, size: sizeBody })]
                      : []),
                  ]),
                ],
              }),
              new Paragraph({
                spacing: { after: 150 },
                children: [
                  new TextRun({
                    text: "1. Driver Diagram",
                    bold: true,
                    color: "333333",
                    font: bodyFont,
                    size: sizeHeading,
                  }),
                ],
              }),
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                columnWidths: [3259, 3062, 3023],
                rows: tableRows,
                margins: { top: 15, bottom: 15, left: 15, right: 15 },
                layout: "fixed",
              }),
              new Paragraph({
                spacing: { after: 150 },
                shading: { fill: "F0F0F0" },
                children: [new TextRun({ text: " ", font: bodyFont, size: 28, color: "777777" })],
              }),
            ],
          },
        ],
      });

      const docBlob = await Packer.toBlob(doc);
      const blob =
        docBlob.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          ? docBlob
          : new Blob([docBlob], {
              type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            });
      await get().saveBlobWithPicker(blob, buildExportFilename(documentTitle, "docx"), {
        description: "Word Document",
        extensions: [".docx"],
      });
    } catch (error) {
      if (error?.name !== "AbortError") {
        set({ exportError: error?.message || "Unable to export .docx right now." });
      }
    } finally {
      set({ exportingDocx: false });
    }
  },

  resetStorageNotice: () => set({
    storageError: "",
    storageMessage: "",
    lastSharedUrl: ""
  }),

  applyCodeToForm: () => {
    try {
      const { codeInput } = get();
      const normalizedCode = sanitizeMermaidCode(codeInput);
      const parsed = parseMermaidCode(normalizedCode);
      set({
        codeSource: "code",
        data: parsed,
        codeInput: normalizedCode,
        codeSyncError: "",
        codeSyncMessage: "Form updated from Mermaid code."
      });
    } catch (error) {
      set({
        codeSyncMessage: "",
        codeSyncError: error?.message || "Unable to parse Mermaid code into the form."
      });
    }
  },

  handleCodeInputChange: (value) => {
    set({
      codeSource: "code",
      codeInput: sanitizeMermaidCode(value),
      codeSyncMessage: "",
      codeSyncError: ""
    });
  },

  // Form helpers
  addPrimary: () => {
    const newId = uid();
    set((state) => ({
      codeSource: "form",
      data: {
        ...state.data,
        primaryDrivers: [
          ...state.data.primaryDrivers,
          { id: newId, title: "Primary Driver ใหม่", kpi: "ระบุ KPI", secondaryDrivers: [] },
        ]
      }
    }));
    setTimeout(() => {
      const el = document.querySelector(`[data-testid="primary-title-input-${newId}"]`);
      if (el) {
        el.focus();
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 200);
  },

  updatePrimary: (pi, field, value) => {
    set((state) => ({
      codeSource: "form",
      data: {
        ...state.data,
        primaryDrivers: state.data.primaryDrivers.map((p, i) => (i === pi ? { ...p, [field]: value } : p))
      }
    }));
  },

  removePrimary: (pi) => {
    set((state) => ({
      codeSource: "form",
      data: {
        ...state.data,
        primaryDrivers: state.data.primaryDrivers.filter((_, i) => i !== pi)
      }
    }));
  },

  addSecondary: (pi) => {
    const newId = uid();
    set((state) => ({
      codeSource: "form",
      data: {
        ...state.data,
        primaryDrivers: state.data.primaryDrivers.map((p, i) =>
          i === pi
            ? {
                ...p,
                secondaryDrivers: [
                  ...p.secondaryDrivers,
                  { id: newId, title: "Secondary Driver ใหม่", kpi: "ระบุ KPI", changeIdeas: [] },
                ],
              }
            : p
        )
      }
    }));
    setTimeout(() => {
      const el = document.querySelector(`[data-testid="secondary-title-input-${newId}"]`);
      if (el) {
        el.focus();
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 200);
  },

  updateSecondary: (pi, si, field, value) => {
    set((state) => ({
      codeSource: "form",
      data: {
        ...state.data,
        primaryDrivers: state.data.primaryDrivers.map((p, i) =>
          i === pi
            ? {
                ...p,
                secondaryDrivers: p.secondaryDrivers.map((s, j) =>
                  j === si ? { ...s, [field]: value } : s
                ),
              }
            : p
        )
      }
    }));
  },

  removeSecondary: (pi, si) => {
    set((state) => ({
      codeSource: "form",
      data: {
        ...state.data,
        primaryDrivers: state.data.primaryDrivers.map((p, i) =>
          i === pi
            ? { ...p, secondaryDrivers: p.secondaryDrivers.filter((_, j) => j !== si) }
            : p
        )
      }
    }));
  },

  addChange: (pi, si) => {
    const newId = uid();
    set((state) => ({
      codeSource: "form",
      data: {
        ...state.data,
        primaryDrivers: state.data.primaryDrivers.map((p, i) =>
          i === pi
            ? {
                ...p,
                secondaryDrivers: p.secondaryDrivers.map((s, j) =>
                  j === si
                    ? {
                        ...s,
                        changeIdeas: [
                          ...s.changeIdeas,
                          { id: newId, title: "Change Idea ใหม่", kpi: "ระบุ KPI" },
                        ],
                      }
                    : s
                ),
              }
            : p
        )
      }
    }));
    setTimeout(() => {
      const el = document.querySelector(`[data-testid="change-title-input-${newId}"]`);
      if (el) {
        el.focus();
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 200);
  },

  updateChange: (pi, si, ci, field, value) => {
    set((state) => ({
      codeSource: "form",
      data: {
        ...state.data,
        primaryDrivers: state.data.primaryDrivers.map((p, i) =>
          i === pi
            ? {
                ...p,
                secondaryDrivers: p.secondaryDrivers.map((s, j) =>
                  j === si
                    ? {
                        ...s,
                        changeIdeas: s.changeIdeas.map((c, k) =>
                          k === ci ? { ...c, [field]: value } : c
                        ),
                      }
                    : s
                ),
              }
            : p
        )
      }
    }));
  },

  removeChange: (pi, si, ci) => {
    set((state) => ({
      codeSource: "form",
      data: {
        ...state.data,
        primaryDrivers: state.data.primaryDrivers.map((p, i) =>
          i === pi
            ? {
                ...p,
                secondaryDrivers: p.secondaryDrivers.map((s, j) =>
                  j === si
                    ? { ...s, changeIdeas: s.changeIdeas.filter((_, k) => k !== ci) }
                    : s
                ),
              }
            : p
        )
      }
    }));
  },

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

  loadSavedDiagrams: async () => {
    const currentUser = useAuthStore.getState().currentUser;
    if (!isSupabaseConfigured || !supabase || !currentUser?.id) {
      set({ savedDiagrams: [], loadingSavedDiagrams: false });
      return;
    }

    set({ loadingSavedDiagrams: true, storageError: "" });
    try {
      const { data: rows, error } = await supabase
        .from("driver_diagrams")
        .select(savedDiagramSelectFields)
        .order("updated_at", { ascending: false });

      if (error) {
        set({ storageError: error.message || "Unable to load saved diagrams." });
      } else {
        const enriched = await get().enrichSavedDiagramsWithGalleryState(rows || []);
        set({ savedDiagrams: enriched });
      }
    } catch (err) {
      set({ storageError: err.message || "Unable to load saved diagrams." });
    } finally {
      set({ loadingSavedDiagrams: false });
    }
  },

  refreshSavedDiagrams: async () => {
    await get().loadSavedDiagrams();
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
    console.log('startNewDiagram called');
    const emptySnap = buildDiagramSnapshot(defaultDocumentTitle, defaultData, buildMermaidCode(defaultData));
    console.log('Setting store state...');
    console.log('defaultData:', JSON.stringify(defaultData).substring(0, 100));
    const newData = normalizeStoredDiagramData(defaultData);
    console.log('newData:', JSON.stringify(newData).substring(0, 100));
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
      codeSyncMessage: ""
    });
    console.log('Store state set complete, documentTitle:', get().documentTitle, 'data.title:', get().data?.purpose?.title);
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
        set({ duplicatingDiagramId: "", storageError: error?.message || "Unable to duplicate this diagram." });
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
      set({ duplicatingDiagramId: "", storageError: err.message || "Unable to duplicate this diagram." });
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
      const openedAt = new Date().toISOString();
      const { data: row, error } = await supabase
        .from("driver_diagrams")
        .update({ last_opened_at: openedAt })
        .eq("id", diagramId)
        .select("*")
        .single();

      if (error || !row) {
        set({ storageError: error?.message || "Unable to open this diagram.", openingDiagramId: "" });
        return;
      }

      const { normalizedData, nextTitle, nextCode } = get().applyDiagramToEditor({
        title: row.title,
        diagramData: row.diagram_data,
        mermaidCode: row.mermaid_code,
      });

      const snap = buildDiagramSnapshot(nextTitle, normalizedData, nextCode);
      set({
        currentDiagramId: row.id,
        lastSavedSnapshot: snap,
        lastVersionSnapshot: snap,
        autoSaveState: "saved",
        storageMessage: "Loaded diagram from database.",
        openingDiagramId: ""
      });

      get().upsertSavedDiagram(row);
      await get().refreshVersionHistory(row.id);
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

    if (!window.confirm("Delete this saved diagram?")) {
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

  // Version Control
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
          autoSaveState: "saved",
          storageMessage: "Version restored and saved to the database."
        });

        const versionError = await get().createDiagramVersion({
          diagramId: row.id,
          title: row.title,
          diagramData: normalizedData,
          mermaidCode: nextCode,
          saveSource: "restore",
        });

        if (versionError) {
          set({ storageError: "Restored the diagram, but could not record the restore in version history." });
        } else {
          set({ lastVersionSnapshot: snap });
          await get().refreshVersionHistory(row.id);
        }

        get().upsertSavedDiagram(row);
        return;
      }

      set({ storageMessage: "Version restored to the editor only. Save or wait for auto-save to make it the latest version." });
    } catch (err) {
      set({ storageError: err.message || "Unable to restore version." });
    } finally {
      set({ restoringVersionId: "", restoringAndSavingVersionId: "" });
    }
  },

  // Sharing links
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
      try {
        await navigator.clipboard.writeText(shareUrl);
      } catch (error) {
        set({ sharingDiagramId: "", storageError: error?.message || "Unable to copy the share link." });
        return;
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

  // Public/shared view loaders
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

  // Admin moderation operations
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

  setAdminEmailDraft: (adminEmailDraft) => set({ adminEmailDraft }),

  // Main saving/autosave logic
  saveDiagram: async ({ isAuto = false } = {}) => {
    if (!isSupabaseConfigured || !supabase) {
      set({ storageError: "Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY before saving." });
      return;
    }
    const currentUser = useAuthStore.getState().currentUser;
    if (!currentUser?.id) {
      set({ storageError: "Sign in before saving to the database." });
      return;
    }

    const { codeInput, data, documentTitle, currentDiagramId, lastSavedSnapshot, lastVersionSnapshot } = get();

    const normalizedCode = sanitizeMermaidCode(codeInput);
    const normalizedData = normalizeStoredDiagramData(data);
    const title = documentTitle.trim() || normalizedData.purpose.title || defaultDocumentTitle;
    const snapshot = buildDiagramSnapshot(title, normalizedData, normalizedCode);
    const thumbnailSvg = buildStoredThumbnailSvg(normalizedData, normalizedCode);

    if (isAuto && (snapshot === lastSavedSnapshot || !currentDiagramId)) {
      return;
    }

    const payload = {
      user_id: currentUser.id,
      title,
      purpose_title: normalizedData.purpose.title,
      purpose_kpi: normalizedData.purpose.kpi,
      diagram_data: normalizedData,
      mermaid_code: normalizedCode,
      thumbnail_svg: thumbnailSvg,
    };

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

      const { data: row, error } = await query;

      if (error) {
        set({
          storageError: error.message || "Unable to save this diagram.",
          autoSaveState: "dirty",
          savingDiagram: false
        });
        return;
      }

      if (row) {
        set({ currentDiagramId: row.id, lastSavedSnapshot: snapshot });
        if (!currentDiagramId || snapshot !== lastVersionSnapshot) {
          const versionError = await get().createDiagramVersion({
            diagramId: row.id,
            title: row.title,
            diagramData: normalizedData,
            mermaidCode: normalizedCode,
            saveSource: isAuto ? "autosave" : currentDiagramId ? "manual" : "create",
          });
          if (versionError) {
            set({ storageError: "Saved the diagram, but could not record version history." });
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
      set({
        storageError: err.message || "Unable to save this diagram.",
        autoSaveState: "dirty"
      });
    } finally {
      set({ savingDiagram: false });
    }
  }
}));
