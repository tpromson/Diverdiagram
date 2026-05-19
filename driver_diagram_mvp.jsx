import React, { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Trash2, Copy, Download, Target, Layers, GitBranch, Lightbulb, BarChart3, Eye, Code2 } from "lucide-react";

const uid = () => Math.random().toString(36).slice(2, 9);

const defaultData = {
  purpose: {
    title: "ลดเวลารอผู้ป่วยนอก OPD wait time ให้ไม่เกิน X นาที",
    kpi: "Average OPD wait time ≤ X นาที\nPatient satisfaction ≥ 90%",
  },
  primaryDrivers: [
    {
      id: uid(),
      title: "การนัดหมายและจัดสรรเวลานัดที่เหมาะสม",
      kpi: "No-show rate < 10%\nAppointment utilization ≥ 85%",
      secondaryDrivers: [
        {
          id: uid(),
          title: "ระบบจองนัด/เวลานัดแบบออนไลน์",
          kpi: "% ผู้ป่วยจองออนไลน์ ≥ 70%",
          changeIdeas: [
            {
              id: uid(),
              title: "พัฒนา UX ระบบจองผ่านแอป/เว็บ",
              kpi: "ผู้ป่วยใช้งานสำเร็จ ≥ 90%",
            },
          ],
        },
      ],
    },
  ],
};

function buildMermaidCode(data) {
  const lines = [
    "flowchart LR",
    "",
    "    subgraph P0[\" \"]",
    "        direction TB",
    `        Purpose[${formatNodeLabel("Purpose", data.purpose.title)}]`,
    `        PKPI[${formatNodeLabel("Outcome KPI", data.purpose.kpi)}]`,
    "    end",
    "",
  ];

  data.primaryDrivers.forEach((pd, i) => {
    const p = `PD${i + 1}`;
    const pk = `PDKPI${i + 1}`;
    lines.push(`    Purpose --> ${p}`);
    lines.push(`    subgraph ${p}G[\" \"]`);
    lines.push("        direction TB");
    lines.push(`        ${p}[${formatNodeLabel(`Primary Driver ${i + 1}`, pd.title)}]`);
    lines.push(`        ${pk}[${formatNodeLabel("KPI", pd.kpi)}]`);
    lines.push("    end", "");

    pd.secondaryDrivers.forEach((sd, j) => {
      const s = `S${i + 1}_${j + 1}`;
      const sk = `SKPI${i + 1}_${j + 1}`;
      lines.push(`    ${p} --> ${s}`);
      lines.push(`    subgraph ${s}G[\" \"]`);
      lines.push("        direction TB");
      lines.push(`        ${s}[${formatNodeLabel("Secondary Driver", sd.title)}]`);
      lines.push(`        ${sk}[${formatNodeLabel("KPI", sd.kpi)}]`);
      lines.push("    end", "");

      sd.changeIdeas.forEach((ci, k) => {
        const c = `C${i + 1}_${j + 1}_${k + 1}`;
        const ck = `CKPI${i + 1}_${j + 1}_${k + 1}`;
        lines.push(`    ${s} --> ${c}`);
        lines.push(`    subgraph ${c}G[\" \"]`);
        lines.push("        direction TB");
        lines.push(`        ${c}[${formatNodeLabel("Change Idea", ci.title)}]`);
        lines.push(`        ${ck}[${formatNodeLabel("KPI Change", ci.kpi)}]`);
        lines.push("    end", "");
      });
    });
  });

  lines.push(
    "    classDef purpose fill:#FCE4EC,stroke:#D81B60,color:#880E4F;",
    "    classDef kpi fill:#E8F5E9,stroke:#43A047,color:#1B5E20;",
    "    classDef primary fill:#E3F2FD,stroke:#1565C0,color:#0D47A1;",
    "    classDef secondary fill:#FFF8E1,stroke:#F9A825,color:#5D4037;",
    "    classDef change fill:#FFF3E0,stroke:#FB8C00,color:#E65100;",
    "",
    "    class Purpose purpose;",
    "    class PKPI kpi;"
  );

  data.primaryDrivers.forEach((pd, i) => {
    lines.push(`    class PD${i + 1} primary;`);
    lines.push(`    class PDKPI${i + 1} kpi;`);
    pd.secondaryDrivers.forEach((sd, j) => {
      lines.push(`    class S${i + 1}_${j + 1} secondary;`);
      lines.push(`    class SKPI${i + 1}_${j + 1} kpi;`);
      sd.changeIdeas.forEach((_, k) => {
        lines.push(`    class C${i + 1}_${j + 1}_${k + 1} change;`);
        lines.push(`    class CKPI${i + 1}_${j + 1}_${k + 1} kpi;`);
      });
    });
  });

  return lines.join("\n");
}

function decodeMermaidText(text = "") {
  return String(text)
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function normalizeNodeLabel(rawLabel = "") {
  return decodeMermaidText(rawLabel)
    .replace(/^`|`$/g, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/\r\n/g, "\n")
    .trim();
}

function normalizeHeading(heading = "") {
  return String(heading)
    .replace(/^[^\p{L}\p{N}]+/gu, "")
    .trim()
    .toLowerCase();
}

function inferNodeType(heading = "", value = "") {
  const normalizedHeading = normalizeHeading(heading);
  const normalizedValue = String(value || "").trim().toLowerCase();
  const combined = `${normalizedHeading}\n${normalizedValue}`;

  if (
    normalizedHeading.includes("primary driver") ||
    normalizedHeading.includes("secondary driver") ||
    normalizedHeading.includes("change idea") ||
    normalizedHeading === "purpose" ||
    normalizedHeading === "outcome kpi"
  ) {
    if (normalizedHeading.includes("primary driver")) return "primary";
    if (normalizedHeading.includes("secondary driver")) return "secondary";
    if (normalizedHeading.includes("change idea")) return "change";
    if (normalizedHeading === "purpose") return "purpose";
    return "kpi";
  }

  if (combined.includes("เป้าหมาย") || combined.includes("goal")) return "purpose";
  if (normalizedHeading.startsWith("kpi") || combined.includes("purpose kpi") || combined.includes("outcome kpi")) {
    return "kpi";
  }
  if (combined.includes("primary driver")) return "primary";
  if (combined.includes("secondary driver")) return "secondary";
  if (combined.includes("change idea")) return "change";

  return "unknown";
}

function parseNodeDefinitions(code) {
  const nodeMap = new Map();
  const nodePattern = /([A-Za-z0-9_]+)\["([\s\S]*?)"\]/g;
  let match;

  while ((match = nodePattern.exec(code))) {
    const [, id, rawLabel] = match;
    const normalizedLabel = normalizeNodeLabel(rawLabel);
    const [heading, ...rest] = normalizedLabel.split("\n");
    nodeMap.set(id, {
      id,
      heading: (heading || "").trim(),
      value: rest.join("\n").trim(),
      type: inferNodeType(heading || "", rest.join("\n")),
    });
  }

  return nodeMap;
}

function parseSubgraphMembership(code) {
  const nodeGroups = new Map();
  const subgraphPattern = /subgraph\s+[A-Za-z0-9_]+\[[\s\S]*?\]([\s\S]*?)end/g;
  let match;

  while ((match = subgraphPattern.exec(code))) {
    const body = match[1];
    const nodeIds = Array.from(body.matchAll(/([A-Za-z0-9_]+)\["[\s\S]*?"\]/g)).map((parts) => parts[1]);
    if (nodeIds.length > 1) {
      nodeIds.forEach((nodeId) => {
        nodeGroups.set(nodeId, nodeIds.filter((id) => id !== nodeId));
      });
    }
  }

  return nodeGroups;
}

function parseEdges(code) {
  const adjacency = new Map();
  const extractNodeId = (segment, pick = "first") => {
    const matches = Array.from(String(segment || "").matchAll(/([A-Za-z0-9_]+)(?=\s*(?:\[|$))/g));
    if (!matches.length) return "";
    return pick === "last" ? matches[matches.length - 1][1] : matches[0][1];
  };

  const addEdge = (from, to) => {
    if (!from || !to) return;
    const existing = adjacency.get(from) || [];
    if (!existing.includes(to)) {
      adjacency.set(from, [...existing, to]);
    }
  };

  String(code || "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.includes("-->") && !line.startsWith("class ") && !line.startsWith("classDef "))
    .forEach((line) => {
      const edgeLine = line.replace(/;.*/, "");
      const parts = edgeLine.split("-->");
      if (parts.length < 2) return;
      const from = extractNodeId(parts[0], "last");
      if (!from) return;
      const rightSide = parts.slice(1).join("-->");
      const targets = rightSide
        .split("&")
        .map((segment) => extractNodeId(segment, "first"))
        .filter(Boolean);

      targets.forEach((to) => addEdge(from, to));
    });

  return adjacency;
}

function findAssociatedKpis(nodeMap, nodeGroups) {
  const kpiByNodeId = new Map();
  const fallbackPairs = [
    ["Purpose", "PKPI"],
  ];

  nodeMap.forEach((node) => {
    const groupedNodes = (nodeGroups.get(node.id) || [])
      .map((id) => nodeMap.get(id))
      .filter(Boolean);
    const groupedKpis = groupedNodes.filter((groupedNode) => groupedNode.type === "kpi");

    if (node.type !== "kpi" && groupedKpis.length) {
      kpiByNodeId.set(node.id, groupedKpis.map((groupedNode) => groupedNode.value).filter(Boolean).join("\n"));
    }
  });

  fallbackPairs.forEach(([nodeId, kpiId]) => {
    if (!kpiByNodeId.has(nodeId) && nodeMap.has(kpiId)) {
      kpiByNodeId.set(nodeId, nodeMap.get(kpiId)?.value || "");
    }
  });

  nodeMap.forEach((node) => {
    if (kpiByNodeId.has(node.id)) return;
    if (node.type === "primary") {
      const match = node.id.match(/^PD(\d+)$/);
      if (match && nodeMap.has(`PDKPI${match[1]}`)) {
        kpiByNodeId.set(node.id, nodeMap.get(`PDKPI${match[1]}`)?.value || "");
      }
    }
    if (node.type === "secondary") {
      const match = node.id.match(/^S(\d+)_(\d+)$/);
      if (match && nodeMap.has(`SKPI${match[1]}_${match[2]}`)) {
        kpiByNodeId.set(node.id, nodeMap.get(`SKPI${match[1]}_${match[2]}`)?.value || "");
      }
    }
    if (node.type === "change") {
      const match = node.id.match(/^C(\d+)_(\d+)_(\d+)$/);
      if (match && nodeMap.has(`CKPI${match[1]}_${match[2]}_${match[3]}`)) {
        kpiByNodeId.set(node.id, nodeMap.get(`CKPI${match[1]}_${match[2]}_${match[3]}`)?.value || "");
      }
    }
  });

  return kpiByNodeId;
}

function parseMermaidCode(code) {
  const normalized = String(code || "").trim();
  if (!normalized.startsWith("flowchart")) {
    throw new Error("Mermaid code must start with a flowchart declaration.");
  }

  const nodeMap = parseNodeDefinitions(normalized);
  const nodeGroups = parseSubgraphMembership(normalized);
  const adjacency = parseEdges(normalized);
  const kpiByNodeId = findAssociatedKpis(nodeMap, nodeGroups);

  if (!nodeMap.size) {
    throw new Error("No Mermaid nodes were found.");
  }

  const purposeNode =
    nodeMap.get("Purpose") ||
    Array.from(nodeMap.values()).find((node) => node.type === "purpose") ||
    Array.from(nodeMap.values()).find((node) => (adjacency.get(node.id) || []).some((targetId) => nodeMap.get(targetId)?.type === "primary"));

  if (!purposeNode) {
    throw new Error("A Purpose/Goal node is required.");
  }

  const primaryIds = (adjacency.get(purposeNode.id) || []).filter((nodeId) => {
    const node = nodeMap.get(nodeId);
    return node && node.type !== "kpi";
  });

  if (!primaryIds.length) {
    throw new Error("At least one Primary Driver connected from the Purpose node is required.");
  }

  return {
    purpose: {
      title: purposeNode.value || purposeNode.heading || "",
      kpi: kpiByNodeId.get(purposeNode.id) || "",
    },
    primaryDrivers: primaryIds.map((primaryId) => {
      const primaryNode = nodeMap.get(primaryId);
      const secondaryIds = (adjacency.get(primaryId) || []).filter((nodeId) => {
        const node = nodeMap.get(nodeId);
        return node && node.type !== "kpi";
      });

      return {
        id: uid(),
        title: primaryNode?.value || primaryNode?.heading || "",
        kpi: kpiByNodeId.get(primaryId) || "",
        secondaryDrivers: secondaryIds.map((secondaryId) => {
          const secondaryNode = nodeMap.get(secondaryId);
          const changeIds = (adjacency.get(secondaryId) || []).filter((nodeId) => {
            const node = nodeMap.get(nodeId);
            return node && node.type !== "kpi";
          });

          return {
            id: uid(),
            title: secondaryNode?.value || secondaryNode?.heading || "",
            kpi: kpiByNodeId.get(secondaryId) || "",
            changeIdeas: changeIds.map((changeId) => {
              const changeNode = nodeMap.get(changeId);
              return {
                id: uid(),
                title: changeNode?.value || changeNode?.heading || "",
                kpi: kpiByNodeId.get(changeId) || "",
              };
            }),
          };
        }),
      };
    }),
  };
}

function safeText(text = "") {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/`/g, "'")
    .replace(/"/g, "'")
    .replace(/[\[\]{}]/g, "")
    .replace(/\\/g, "\\\\");
}

function formatNodeLabel(heading, value) {
  return `"\`${heading}\n${safeText(value)}\`"`;
}

function TextAreaField({ label, value, onChange, icon }) {
  return (
    <label className="block space-y-2">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        {icon}
        {label}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}

function App() {
  const [data, setData] = useState(defaultData);
  const [copied, setCopied] = useState(false);
  const [codeInput, setCodeInput] = useState(() => buildMermaidCode(defaultData));
  const [codeSyncError, setCodeSyncError] = useState("");
  const [codeSyncMessage, setCodeSyncMessage] = useState("");
  const [exportingDocx, setExportingDocx] = useState(false);
  const [exportError, setExportError] = useState("");
  const [view, setView] = useState("preview");
  const [svg, setSvg] = useState("");
  const [renderError, setRenderError] = useState("");
  const renderId = useRef(0);
  const mermaidRef = useRef(null);
  const mermaidInitialized = useRef(false);
  const codeSourceRef = useRef("form");
  const mermaidCode = useMemo(() => buildMermaidCode(data), [data]);

  useEffect(() => {
    if (codeSourceRef.current === "form") {
      setCodeInput(mermaidCode);
    }
  }, [mermaidCode]);

  useEffect(() => {
    let cancelled = false;
    const id = ++renderId.current;

    async function renderDiagram() {
      try {
        if (!mermaidRef.current) {
          const { default: mermaid } = await import("mermaid");
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

        const result = await mermaidRef.current.render(`driver-diagram-${id}`, codeInput);
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
  }, [codeInput]);

  const updatePurpose = (field, value) => {
    codeSourceRef.current = "form";
    setData((d) => ({ ...d, purpose: { ...d.purpose, [field]: value } }));
  };

  const addPrimary = () => {
    codeSourceRef.current = "form";
    setData((d) => ({
      ...d,
      primaryDrivers: [
        ...d.primaryDrivers,
        { id: uid(), title: "Primary Driver ใหม่", kpi: "ระบุ KPI", secondaryDrivers: [] },
      ],
    }));
  };

  const updatePrimary = (pi, field, value) => {
    codeSourceRef.current = "form";
    setData((d) => ({
      ...d,
      primaryDrivers: d.primaryDrivers.map((p, i) => (i === pi ? { ...p, [field]: value } : p)),
    }));
  };

  const removePrimary = (pi) => {
    codeSourceRef.current = "form";
    setData((d) => ({ ...d, primaryDrivers: d.primaryDrivers.filter((_, i) => i !== pi) }));
  };

  const addSecondary = (pi) => {
    codeSourceRef.current = "form";
    setData((d) => ({
      ...d,
      primaryDrivers: d.primaryDrivers.map((p, i) =>
        i === pi
          ? {
              ...p,
              secondaryDrivers: [
                ...p.secondaryDrivers,
                { id: uid(), title: "Secondary Driver ใหม่", kpi: "ระบุ KPI", changeIdeas: [] },
              ],
            }
          : p
      ),
    }));
  };

  const updateSecondary = (pi, si, field, value) => {
    codeSourceRef.current = "form";
    setData((d) => ({
      ...d,
      primaryDrivers: d.primaryDrivers.map((p, i) =>
        i === pi
          ? {
              ...p,
              secondaryDrivers: p.secondaryDrivers.map((s, j) =>
                j === si ? { ...s, [field]: value } : s
              ),
            }
          : p
      ),
    }));
  };

  const removeSecondary = (pi, si) => {
    codeSourceRef.current = "form";
    setData((d) => ({
      ...d,
      primaryDrivers: d.primaryDrivers.map((p, i) =>
        i === pi
          ? { ...p, secondaryDrivers: p.secondaryDrivers.filter((_, j) => j !== si) }
          : p
      ),
    }));
  };

  const addChange = (pi, si) => {
    codeSourceRef.current = "form";
    setData((d) => ({
      ...d,
      primaryDrivers: d.primaryDrivers.map((p, i) =>
        i === pi
          ? {
              ...p,
              secondaryDrivers: p.secondaryDrivers.map((s, j) =>
                j === si
                  ? {
                      ...s,
                      changeIdeas: [
                        ...s.changeIdeas,
                        { id: uid(), title: "Change Idea ใหม่", kpi: "ระบุ KPI" },
                      ],
                    }
                  : s
              ),
            }
          : p
      ),
    }));
  };

  const updateChange = (pi, si, ci, field, value) => {
    codeSourceRef.current = "form";
    setData((d) => ({
      ...d,
      primaryDrivers: d.primaryDrivers.map((p, i) =>
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
      ),
    }));
  };

  const removeChange = (pi, si, ci) => {
    codeSourceRef.current = "form";
    setData((d) => ({
      ...d,
      primaryDrivers: d.primaryDrivers.map((p, i) =>
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
      ),
    }));
  };

  const copyMermaid = async () => {
    await navigator.clipboard.writeText("```mermaid\n" + codeInput + "\n```");
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const triggerBlobDownload = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const saveBlobWithPicker = async (blob, filename, options = {}) => {
    if (typeof window.showSaveFilePicker !== "function") {
      triggerBlobDownload(blob, filename);
      return;
    }

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
  };

  const getExportableSvgMarkup = (svgMarkup) =>
    String(svgMarkup || "")
      .replace(/<br(\s[^>]*)?>/gi, (_match, attrs = "") => `<br${attrs.trim() ? attrs : ""}/>`); 

  const downloadMermaid = () => {
    const blob = new Blob([codeInput], { type: "text/plain;charset=utf-8" });
    triggerBlobDownload(blob, "driver-diagram.mmd");
  };

  const downloadSvg = () => {
    const blob = new Blob([getExportableSvgMarkup(svg)], { type: "image/svg+xml;charset=utf-8" });
    triggerBlobDownload(blob, "driver-diagram.svg");
  };

  const downloadDocx = async () => {
    try {
      setExportError("");
      setExportingDocx(true);
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
      await saveBlobWithPicker(blob, "driver-diagram.docx", {
        description: "Word Document",
        extensions: [".docx"],
      });
    } catch (error) {
      if (error?.name !== "AbortError") {
        setExportError(error?.message || "Unable to export .docx right now.");
      }
    } finally {
      setExportingDocx(false);
    }
  };

  const applyCodeToForm = () => {
    try {
      const parsed = parseMermaidCode(codeInput);
      codeSourceRef.current = "code";
      setData(parsed);
      setCodeSyncError("");
      setCodeSyncMessage("Form updated from Mermaid code.");
    } catch (error) {
      setCodeSyncMessage("");
      setCodeSyncError(error?.message || "Unable to parse Mermaid code into the form.");
    }
  };

  const handleCodeInputChange = (value) => {
    codeSourceRef.current = "code";
    setCodeInput(value);
    setCodeSyncMessage("");
    if (codeSyncError) {
      setCodeSyncError("");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-4">
        <header className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Driver Diagram MVP</h1>
              <p className="text-sm text-slate-500">สร้าง Driver Diagram พร้อม KPI ทุกระดับ พร้อม Live Preview และ Export</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={copyMermaid} className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
                <Copy size={16} /> {copied ? "Copied" : "Copy Mermaid"}
              </button>
              <button onClick={downloadMermaid} className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800">
                <Download size={16} /> .mmd
              </button>
              <button onClick={downloadSvg} className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700">
                <Download size={16} /> .svg
              </button>
              <button
                onClick={downloadDocx}
                disabled={exportingDocx}
                className="inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-wait disabled:opacity-70"
              >
                <Download size={16} /> {exportingDocx ? "Exporting..." : ".docx"}
              </button>
            </div>
          </div>
          {exportError ? <div className="mt-3 rounded-2xl bg-red-50 p-3 text-sm text-red-700">{exportError}</div> : null}
        </header>

        <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="space-y-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 lg:h-[82vh] lg:overflow-auto">
            <div className="rounded-3xl border border-pink-100 bg-pink-50 p-4">
              <TextAreaField label="Purpose" value={data.purpose.title} onChange={(v) => updatePurpose("title", v)} icon={<Target size={16} />} />
              <div className="mt-3">
                <TextAreaField label="Purpose KPI" value={data.purpose.kpi} onChange={(v) => updatePurpose("kpi", v)} icon={<BarChart3 size={16} />} />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Primary Drivers</h2>
              <button onClick={addPrimary} className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                <Plus size={16} /> Add Primary
              </button>
            </div>

            {data.primaryDrivers.map((pd, pi) => (
              <div key={pd.id} className="space-y-3 rounded-3xl border border-blue-100 bg-blue-50 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-bold text-blue-900">Primary Driver {pi + 1}</div>
                  <button onClick={() => removePrimary(pi)} className="rounded-xl p-2 text-red-600 hover:bg-red-50">
                    <Trash2 size={16} />
                  </button>
                </div>
                <TextAreaField label="ชื่อ Primary Driver" value={pd.title} onChange={(v) => updatePrimary(pi, "title", v)} icon={<Layers size={16} />} />
                <TextAreaField label="Primary KPI" value={pd.kpi} onChange={(v) => updatePrimary(pi, "kpi", v)} icon={<BarChart3 size={16} />} />

                <button onClick={() => addSecondary(pi)} className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                  <Plus size={16} /> Add Secondary
                </button>

                {pd.secondaryDrivers.map((sd, si) => (
                  <div key={sd.id} className="ml-0 space-y-3 rounded-3xl border border-amber-100 bg-amber-50 p-4 md:ml-5">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-amber-900">Secondary Driver {si + 1}</div>
                      <button onClick={() => removeSecondary(pi, si)} className="rounded-xl p-2 text-red-600 hover:bg-red-50">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <TextAreaField label="ชื่อ Secondary Driver" value={sd.title} onChange={(v) => updateSecondary(pi, si, "title", v)} icon={<GitBranch size={16} />} />
                    <TextAreaField label="Secondary KPI" value={sd.kpi} onChange={(v) => updateSecondary(pi, si, "kpi", v)} icon={<BarChart3 size={16} />} />

                    <button onClick={() => addChange(pi, si)} className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-600">
                      <Plus size={16} /> Add Change Idea
                    </button>

                    {sd.changeIdeas.map((ci, cii) => (
                      <div key={ci.id} className="ml-0 space-y-3 rounded-3xl border border-orange-100 bg-white p-4 md:ml-5">
                        <div className="flex items-center justify-between">
                          <div className="font-bold text-orange-900">Change Idea {cii + 1}</div>
                          <button onClick={() => removeChange(pi, si, cii)} className="rounded-xl p-2 text-red-600 hover:bg-red-50">
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <TextAreaField label="ชื่อ Change Idea" value={ci.title} onChange={(v) => updateChange(pi, si, cii, "title", v)} icon={<Lightbulb size={16} />} />
                        <TextAreaField label="Change KPI" value={ci.kpi} onChange={(v) => updateChange(pi, si, cii, "kpi", v)} icon={<BarChart3 size={16} />} />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </section>

          <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 lg:h-[82vh]">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-lg font-bold">Output</h2>
              <div className="flex rounded-2xl bg-slate-100 p-1">
                <button
                  onClick={() => setView("preview")}
                  className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ${view === "preview" ? "bg-white shadow-sm" : "text-slate-500"}`}
                >
                  <Eye size={16} /> Preview
                </button>
                <button
                  onClick={() => setView("code")}
                  className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ${view === "code" ? "bg-white shadow-sm" : "text-slate-500"}`}
                >
                  <Code2 size={16} /> Code
                </button>
              </div>
            </div>

            {view === "preview" ? (
              <div className="min-h-[20rem] overflow-auto rounded-3xl border border-slate-200 bg-white p-4 lg:h-[73vh]">
                {renderError ? (
                  <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{renderError}</div>
                ) : (
                  <div className="diagram-preview" dangerouslySetInnerHTML={{ __html: svg }} />
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-500">Edit Mermaid here, then apply it back into the form.</p>
                  <button
                    onClick={applyCodeToForm}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    Apply to Form
                  </button>
                </div>
                {codeSyncError ? <div className="rounded-2xl bg-red-50 p-3 text-sm text-red-700">{codeSyncError}</div> : null}
                {!codeSyncError && codeSyncMessage ? <div className="rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-700">{codeSyncMessage}</div> : null}
                <textarea
                  value={codeInput}
                  onChange={(e) => handleCodeInputChange(e.target.value)}
                  spellCheck={false}
                  className="min-h-[20rem] w-full overflow-auto rounded-3xl bg-slate-950 p-4 font-mono text-xs leading-relaxed text-slate-100 outline-none lg:h-[73vh]"
                />
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default App;
