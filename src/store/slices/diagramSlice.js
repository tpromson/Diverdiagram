import { defaultData } from "../../utils/constants.js";
import { defaultDocumentTitle, defaultLanguage, translations } from "../../utils/translations.js";
import {
  uid,
  buildExportFilename,
  normalizeStoredDiagramData,
  buildDiagramSnapshot,
} from "../../utils/helpers.js";
import {
  buildMermaidCode,
  sanitizeMermaidCode,
  buildTemplateSvg,
  parseMermaidCode,
} from "../../utils/mermaidParser.js";

export const createDiagramSlice = (set, get) => ({
  data: normalizeStoredDiagramData(defaultData),
  documentTitle: defaultDocumentTitle,
  currentDiagramId: "",
  codeInput: buildMermaidCode(defaultData),
  codeSyncError: "",
  codeSyncMessage: "",
  svg: "",
  renderError: "",
  copied: false,
  exportingDocx: false,
  exportingPdf: false,
  exportError: "",
  codeSource: "form",
  svgLayoutMode: "auto",
  lastSavedSnapshot: buildDiagramSnapshot(defaultDocumentTitle, defaultData, buildMermaidCode(defaultData)),
  lastVersionSnapshot: buildDiagramSnapshot(defaultDocumentTitle, defaultData, buildMermaidCode(defaultData)),

  setData: (data) => set({ data }),
  setDocumentTitle: (documentTitle) => set({ documentTitle }),
  setCurrentDiagramId: (currentDiagramId) => set({ currentDiagramId }),
  setCodeInput: (codeInput) => set({ codeInput }),
  setSvg: (svg) => set({ svg }),
  setRenderError: (renderError) => set({ renderError }),
  setCodeSource: (codeSource) => set({ codeSource }),
  setCopied: (copied) => set({ copied }),
  setExportingDocx: (exportingDocx) => set({ exportingDocx }),
  setExportingPdf: (exportingPdf) => set({ exportingPdf }),
  setExportError: (exportError) => set({ exportError }),
  setSvgLayoutMode: (svgLayoutMode) => set({ svgLayoutMode }),

  copyMermaid: () => {
    const codeInput = get().codeInput;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(sanitizeMermaidCode(codeInput));
    }
    set({ copied: true });
    setTimeout(() => set({ copied: false }), 1200);
  },

  triggerBlobDownload: (blob, filename) => {
    if (typeof window === "undefined" || typeof document === "undefined") return;
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
    if (typeof window === "undefined" || typeof window.showSaveFilePicker !== "function") {
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
    const { data, codeInput, documentTitle, svgLayoutMode } = get();
    let exportData = data;
    try {
      exportData = parseMermaidCode(sanitizeMermaidCode(codeInput));
    } catch (_error) {
      exportData = data;
    }
    const blob = new Blob([buildTemplateSvg(exportData, { aspect: svgLayoutMode })], { type: "image/svg+xml;charset=utf-8" });
    get().triggerBlobDownload(blob, buildExportFilename(documentTitle, "svg"));
  },

  downloadPng: async () => {
    try {
      set({ exportError: "" });
      const { data, codeInput, documentTitle, svgLayoutMode } = get();
      let exportData = data;
      try {
        exportData = parseMermaidCode(sanitizeMermaidCode(codeInput));
      } catch (_error) {
        exportData = data;
      }

      const canvas = document.createElement("canvas");
      const { renderDiagramToCanvas } = await import("../../utils/canvasRenderer.js");
      await renderDiagramToCanvas(canvas, exportData, svgLayoutMode);

      canvas.toBlob((blob) => {
        if (blob) {
          get().triggerBlobDownload(blob, buildExportFilename(documentTitle, "png"));
        } else {
          set({ exportError: "Failed to export PNG. Please try again." });
        }
      }, "image/png");
    } catch (error) {
      console.error("PNG export error:", error);
      set({ exportError: "Failed to export PNG. Please try again." });
    }
  },

  downloadPdf: async () => {
    try {
      set({ exportError: "", exportingPdf: true });
      const { data, codeInput, documentTitle, svgLayoutMode } = get();
      let exportData = data;
      try {
        exportData = parseMermaidCode(sanitizeMermaidCode(codeInput));
      } catch (_error) {
        exportData = data;
      }

      const canvas = document.createElement("canvas");
      const { renderDiagramToCanvas } = await import("../../utils/canvasRenderer.js");
      await renderDiagramToCanvas(canvas, exportData, svgLayoutMode);

      const svgWidth = canvas.width / 2;
      const svgHeight = canvas.height / 2;

      const { jsPDF } = await import("jspdf");
      const orientation = svgWidth > svgHeight ? "landscape" : "portrait";
      const pdf = new jsPDF({ orientation, unit: "px", format: [svgWidth, svgHeight] });
      const imgData = canvas.toDataURL("image/png");
      pdf.addImage(imgData, "PNG", 0, 0, svgWidth, svgHeight);
      const pdfBlob = pdf.output("blob");
      
      get().triggerBlobDownload(pdfBlob, buildExportFilename(documentTitle, "pdf"));
      set({ exportingPdf: false });
    } catch (error) {
      console.error("PDF export error:", error);
      set({ exportError: "Failed to export PDF. Please try again.", exportingPdf: false });
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
      if (typeof document !== "undefined") {
        const el = document.querySelector(`[data-testid="primary-title-input-${newId}"]`);
        if (el) {
          el.focus();
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
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
      if (typeof document !== "undefined") {
        const el = document.querySelector(`[data-testid="secondary-title-input-${newId}"]`);
        if (el) {
          el.focus();
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
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
      if (typeof document !== "undefined") {
        const el = document.querySelector(`[data-testid="change-title-input-${newId}"]`);
        if (el) {
          el.focus();
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
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
});
