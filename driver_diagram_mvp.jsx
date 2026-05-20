import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Plus,
  Trash2,
  Copy,
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
  FilePlus2,
  Mail,
  LogOut,
} from "lucide-react";
import { isSupabaseConfigured, supabase } from "./src/supabaseClient.js";

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

const defaultDocumentTitle = "Driver Diagram ใหม่";

function normalizeStoredDiagramData(input) {
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

function buildDiagramSnapshot(title, diagramData, mermaidCode) {
  return JSON.stringify({
    title: String(title || "").trim() || defaultDocumentTitle,
    diagramData: normalizeStoredDiagramData(diagramData),
    mermaidCode: sanitizeMermaidCode(mermaidCode || ""),
  });
}

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

function escapeLooseXmlChars(text = "") {
  return String(text)
    .replace(/&(?!#?\w+;)/g, "&amp;")
    .replace(/</g, "&lt;");
}

function sanitizeMermaidCode(code = "") {
  return String(code).replace(/(\["?)([\s\S]*?)("\])/g, (_match, prefix, inner, suffix) => {
    const normalizedInner = inner
      .replace(/<br\s*\/?>/gi, "<br/>")
      .split("\n")
      .map((line) => escapeLooseXmlChars(line))
      .join("\n");

    return `${prefix}${normalizedInner}${suffix}`;
  });
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

function escapeSvgText(text = "") {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function wrapSvgText(text = "", maxChars = 28) {
  const segmentText = (input) => {
    if (typeof Intl !== "undefined" && Intl.Segmenter) {
      const segmenter = new Intl.Segmenter("th", { granularity: "word" });
      return Array.from(segmenter.segment(input), (part) => part.segment);
    }
    if (input.includes(" ")) {
      return input.split(/(\s+)/).filter(Boolean);
    }
    return Array.from(input);
  };

  return String(text || "")
    .split("\n")
    .flatMap((paragraph) => {
      const trimmed = paragraph.trim();
      if (!trimmed) return [""];
      const tokens = segmentText(trimmed);
      const lines = [];
      let current = "";

      tokens.forEach((token) => {
        const next = `${current}${token}`;
        const normalizedCurrent = current.trim();
        const normalizedNext = next.trim();
        if (normalizedCurrent && normalizedNext.length > maxChars) {
          lines.push(normalizedCurrent);
          current = token.trimStart();
        } else {
          current = next;
        }
      });

      if (current.trim()) {
        lines.push(current.trim());
      }

      return lines.length ? lines : [trimmed];
    });
}

function buildTemplateSvg(diagramData) {
  const theme = {
    bg: "#ffffff",
    headerBg: "#eef4ff",
    headerPurposeBg: "#eaf0ff",
    headerSecondaryBg: "#e8fbff",
    headerChangeBg: "#e9faf0",
    headerText: "#1d4ed8",
    headerSecondaryText: "#0f7490",
    headerChangeText: "#047857",
    purposeFill: "#4f46e5",
    purposeStroke: "#4338ca",
    purposeText: "#ffffff",
    purposeKpiText: "#e0e7ff",
    cardFill: "#ffffff",
    cardStroke: "#d9e2ef",
    primaryAccent: "#3b82f6",
    secondaryAccent: "#06b6d4",
    changeFill: "#ecfdf5",
    changeStroke: "#c7f0db",
    changeText: "#064e3b",
    bodyText: "#334155",
    mutedText: "#94a3b8",
    connector: "#cbd5e1",
  };

  const layout = {
    canvasWidth: 1980,
    topPad: 48,
    sidePad: 56,
    headerH: 46,
    headerGap: 46,
    contentTop: 160,
    bottomPad: 72,
    groupGap: 74,
    blockGap: 30,
    cardGap: 26,
    goalW: 420,
    primaryW: 392,
    secondaryW: 392,
    changeW: 384,
  };

  const columns = {
    goalX: layout.sidePad,
    primaryX: 552,
    secondaryX: 1028,
    changeX: 1504,
  };

  const headerWidth = 394;
  const headerX = {
    goal: columns.goalX + 18,
    primary: columns.primaryX,
    secondary: columns.secondaryX,
    change: columns.changeX,
  };

  const makeCard = (kind, title, kpi, width, accentColor = null) => {
    const titleLines = wrapSvgText(title, kind === "purpose" ? 26 : kind === "change" ? 27 : 25);
    const kpiLines = wrapSvgText(kpi ? `KPI: ${kpi}` : "", kind === "change" ? 31 : 28).filter(Boolean);
    const titleFontSize = kind === "purpose" ? 18 : 16;
    const kpiFontSize = kind === "purpose" ? 14 : 13;
    const titleLineHeight = kind === "purpose" ? 27 : 25;
    const kpiLineHeight = kind === "purpose" ? 20 : 18;
    const paddingX = kind === "purpose" ? 24 : 22;
    const paddingTop = kind === "purpose" ? 22 : 20;
    const separatorGap = kpiLines.length ? 14 : 0;
    const separatorY = paddingTop + titleLines.length * titleLineHeight + separatorGap;
    const kpiTop = separatorY + (kpiLines.length ? 18 : 0);
    const height = Math.max(
      kind === "purpose" ? 158 : kind === "change" ? 150 : 126,
      paddingTop +
        titleLines.length * titleLineHeight +
        (kpiLines.length ? 18 + kpiLines.length * kpiLineHeight : 0) +
        28
    );

    return {
      kind,
      width,
      height,
      titleLines,
      kpiLines,
      paddingX,
      paddingTop,
      titleFontSize,
      kpiFontSize,
      titleLineHeight,
      kpiLineHeight,
      separatorY,
      kpiTop,
      accentColor,
    };
  };

  const primaryGroups = diagramData.primaryDrivers.map((primary) => {
    const primaryCard = makeCard("primary", primary.title, primary.kpi, layout.primaryW, theme.primaryAccent);
    const secondaryBlocks = primary.secondaryDrivers.map((secondary) => {
      const secondaryCard = makeCard("secondary", secondary.title, secondary.kpi, layout.secondaryW, theme.secondaryAccent);
      const changeCards = (secondary.changeIdeas.length ? secondary.changeIdeas : [{ title: "", kpi: "" }]).map((change) =>
        makeCard("change", change.title, change.kpi, layout.changeW)
      );
      const changeStackHeight =
        changeCards.reduce((sum, card) => sum + card.height, 0) +
        Math.max(0, changeCards.length - 1) * layout.cardGap;
      const blockHeight = Math.max(secondaryCard.height, changeStackHeight);
      return { secondary, secondaryCard, changeCards, blockHeight };
    });
    const secondaryStackHeight =
      secondaryBlocks.reduce((sum, block) => sum + block.blockHeight, 0) +
      Math.max(0, secondaryBlocks.length - 1) * layout.blockGap;
    const groupHeight = Math.max(primaryCard.height, secondaryStackHeight);
    return { primary, primaryCard, secondaryBlocks, groupHeight };
  });

  let cursorY = layout.contentTop;
  const renderCards = [];
  const primaryCenters = [];
  const secondaryConnectors = [];
  const changeConnectors = [];

  primaryGroups.forEach((group) => {
    const groupTop = cursorY;
    const primaryY = groupTop + (group.groupHeight - group.primaryCard.height) / 2;
    renderCards.push({ x: columns.primaryX, y: primaryY, card: group.primaryCard });
    primaryCenters.push({
      x: columns.primaryX,
      y: primaryY + group.primaryCard.height / 2,
    });

    let blockY = groupTop + (group.groupHeight - (
      group.secondaryBlocks.reduce((sum, block) => sum + block.blockHeight, 0) +
      Math.max(0, group.secondaryBlocks.length - 1) * layout.blockGap
    )) / 2;

    group.secondaryBlocks.forEach((block) => {
      const secondaryY = blockY + (block.blockHeight - block.secondaryCard.height) / 2;
      renderCards.push({ x: columns.secondaryX, y: secondaryY, card: block.secondaryCard });
      secondaryConnectors.push({
        from: { x: columns.primaryX + group.primaryCard.width, y: primaryY + group.primaryCard.height / 2 },
        to: { x: columns.secondaryX, y: secondaryY + block.secondaryCard.height / 2 },
      });

      let changeY = blockY + (block.blockHeight - (
        block.changeCards.reduce((sum, card) => sum + card.height, 0) +
        Math.max(0, block.changeCards.length - 1) * layout.cardGap
      )) / 2;

      const changeCenters = [];
      block.changeCards.forEach((changeCard) => {
        renderCards.push({ x: columns.changeX, y: changeY, card: changeCard });
        changeCenters.push({ x: columns.changeX, y: changeY + changeCard.height / 2 });
        changeY += changeCard.height + layout.cardGap;
      });

      changeConnectors.push({
        from: { x: columns.secondaryX + block.secondaryCard.width, y: secondaryY + block.secondaryCard.height / 2 },
        to: changeCenters,
      });

      blockY += block.blockHeight + layout.blockGap;
    });

    cursorY += group.groupHeight + layout.groupGap;
  });

  const contentHeight = cursorY - layout.groupGap;
  const goalCard = makeCard("purpose", diagramData.purpose.title, diagramData.purpose.kpi, layout.goalW);
  const goalY = layout.contentTop + Math.max(0, (contentHeight - layout.contentTop - goalCard.height) / 2);
  const goalCenterY = goalY + goalCard.height / 2;
  renderCards.push({ x: columns.goalX, y: goalY, card: goalCard });

  const purposeTrunkX = columns.goalX + goalCard.width + 42;
  const primaryJoinX = columns.primaryX - 30;

  const svgHeight = Math.max(cursorY + layout.bottomPad, goalY + goalCard.height + layout.bottomPad);

  const renderTextLines = (lines, x, y, fontSize, lineHeight, fill, fontWeight = 500) =>
    lines
      .map(
        (line, index) =>
          `<tspan x="${x}" y="${y + index * lineHeight}" font-size="${fontSize}" font-weight="${fontWeight}" fill="${fill}">${escapeSvgText(line)}</tspan>`
      )
      .join("");

  const renderCardMarkup = ({ x, y, card }) => {
    const radius = card.kind === "purpose" ? 20 : 18;
    const fill =
      card.kind === "purpose" ? theme.purposeFill : card.kind === "change" ? theme.changeFill : theme.cardFill;
    const stroke =
      card.kind === "purpose" ? theme.purposeStroke : card.kind === "change" ? theme.changeStroke : theme.cardStroke;
    const titleFill = card.kind === "purpose" ? theme.purposeText : card.kind === "change" ? theme.changeText : theme.bodyText;
    const kpiFill = card.kind === "purpose" ? theme.purposeKpiText : theme.mutedText;
    const shadow = card.kind === "purpose" ? "url(#goalShadow)" : "url(#cardShadow)";
    const separatorColor = card.kind === "purpose" ? "rgba(255,255,255,0.24)" : "#eef2f7";
    const accent = card.accentColor
      ? `<rect x="${x}" y="${y}" width="6" height="${card.height}" rx="${radius}" fill="${card.accentColor}" />`
      : "";
    const separator = card.kpiLines.length
      ? `<line x1="${x + card.paddingX}" y1="${y + card.separatorY}" x2="${x + card.width - card.paddingX}" y2="${y + card.separatorY}" stroke="${separatorColor}" stroke-width="1.25"/>`
      : "";

    return `
      <g>
        <rect x="${x}" y="${y}" width="${card.width}" height="${card.height}" rx="${radius}" fill="${fill}" stroke="${stroke}" filter="${shadow}"/>
        ${accent}
        <text font-family="Inter, Arial, sans-serif">
          ${renderTextLines(card.titleLines, x + card.paddingX + (card.accentColor ? 8 : 0), y + card.paddingTop, card.titleFontSize, card.titleLineHeight, titleFill, 600)}
          ${renderTextLines(card.kpiLines, x + card.paddingX + (card.accentColor ? 8 : 0), y + card.kpiTop, card.kpiFontSize, card.kpiLineHeight, kpiFill, 600)}
        </text>
        ${separator}
      </g>
    `;
  };

  const headerY = layout.topPad;
  const headers = [
    { x: headerX.goal, label: "เป้าหมาย (AIM)", bg: theme.headerPurposeBg, color: "#3343c4" },
    { x: headerX.primary, label: "PRIMARY DRIVERS", bg: theme.headerBg, color: theme.headerText },
    { x: headerX.secondary, label: "SECONDARY DRIVERS", bg: theme.headerSecondaryBg, color: theme.headerSecondaryText },
    { x: headerX.change, label: "CHANGE IDEAS", bg: theme.headerChangeBg, color: theme.headerChangeText },
  ]
    .map(
      (header) => `
        <g>
          <rect x="${header.x}" y="${headerY}" width="${headerWidth}" height="${layout.headerH}" rx="10" fill="${header.bg}" />
          <text x="${header.x + headerWidth / 2}" y="${headerY + 30}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="17" font-weight="700" fill="${header.color}" letter-spacing="0.3">${escapeSvgText(header.label)}</text>
        </g>
      `
    )
    .join("");

  const purposeConnector = primaryCenters.length
    ? `
      <path d="M ${columns.goalX + goalCard.width} ${goalCenterY} H ${purposeTrunkX} V ${primaryCenters[0].y} H ${primaryJoinX}
               M ${purposeTrunkX} ${primaryCenters[0].y} V ${primaryCenters[primaryCenters.length - 1].y}"
            fill="none" stroke="${theme.connector}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
      ${primaryCenters
        .map(
          (center) =>
            `<path d="M ${primaryJoinX} ${center.y} H ${columns.primaryX}" fill="none" stroke="${theme.connector}" stroke-width="2.5" stroke-linecap="round" />`
        )
        .join("")}
    `
    : "";

  const secondaryConnectorMarkup = secondaryConnectors
    .map(
      ({ from, to }) =>
        `<path d="M ${from.x} ${from.y} H ${from.x + 26} V ${to.y} H ${to.x}" fill="none" stroke="${theme.connector}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />`
    )
    .join("");

  const changeConnectorMarkup = changeConnectors
    .map(({ from, to }) => {
      if (!to.length) return "";
      const joinX = from.x + 46;
      const vertical = to.length > 1 ? `M ${joinX} ${to[0].y} V ${to[to.length - 1].y}` : "";
      return `
        <path d="M ${from.x} ${from.y} H ${joinX}" fill="none" stroke="${theme.connector}" stroke-width="2.5" stroke-linecap="round" />
        <path d="${vertical}" fill="none" stroke="${theme.connector}" stroke-width="2.5" stroke-linecap="round" />
        ${to
          .map(
            (target) =>
              `<path d="M ${joinX} ${target.y} H ${target.x}" fill="none" stroke="${theme.connector}" stroke-width="2.5" stroke-linecap="round" />`
          )
          .join("")}
      `;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${layout.canvasWidth}" height="${svgHeight}" viewBox="0 0 ${layout.canvasWidth} ${svgHeight}" role="img" aria-label="Driver Diagram">
  <defs>
    <filter id="cardShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="5" stdDeviation="9" flood-color="#94a3b8" flood-opacity="0.11"/>
    </filter>
    <filter id="goalShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="10" stdDeviation="16" flood-color="#312e81" flood-opacity="0.2"/>
    </filter>
  </defs>
  <rect width="100%" height="100%" fill="${theme.bg}" />
  ${headers}
  ${purposeConnector}
  ${secondaryConnectorMarkup}
  ${changeConnectorMarkup}
  ${renderCards.map(renderCardMarkup).join("")}
</svg>`;
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
  const [documentTitle, setDocumentTitle] = useState(defaultDocumentTitle);
  const [currentDiagramId, setCurrentDiagramId] = useState("");
  const [session, setSession] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(isSupabaseConfigured);
  const [authVerifyingLink, setAuthVerifyingLink] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [authError, setAuthError] = useState("");
  const [savedDiagrams, setSavedDiagrams] = useState([]);
  const [loadingSavedDiagrams, setLoadingSavedDiagrams] = useState(false);
  const [savingDiagram, setSavingDiagram] = useState(false);
  const [autoSaveState, setAutoSaveState] = useState("idle");
  const [openingDiagramId, setOpeningDiagramId] = useState("");
  const [deletingDiagramId, setDeletingDiagramId] = useState("");
  const [storageMessage, setStorageMessage] = useState("");
  const [storageError, setStorageError] = useState("");
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
  const previousUserIdRef = useRef("");
  const lastSavedSnapshotRef = useRef(buildDiagramSnapshot(defaultDocumentTitle, defaultData, buildMermaidCode(defaultData)));
  const mermaidCode = useMemo(() => buildMermaidCode(data), [data]);
  const currentSnapshot = useMemo(
    () => buildDiagramSnapshot(documentTitle, data, codeInput),
    [documentTitle, data, codeInput]
  );
  const isAuthenticated = Boolean(currentUser?.id);

  useEffect(() => {
    if (codeSourceRef.current === "form") {
      setCodeInput(mermaidCode);
    }
  }, [mermaidCode]);

  useEffect(() => {
    if (!isSupabaseConfigured || !isAuthenticated || !currentDiagramId) {
      setAutoSaveState("idle");
      return;
    }

    if (currentSnapshot !== lastSavedSnapshotRef.current) {
      setAutoSaveState("dirty");
      return;
    }

    if (!savingDiagram) {
      setAutoSaveState("saved");
    }
  }, [currentSnapshot, currentDiagramId, isAuthenticated, savingDiagram]);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setAuthLoading(false);
      return;
    }

    let cancelled = false;

    const syncAuthState = (nextSession) => {
      if (cancelled) return;

      const nextUser = nextSession?.user ?? null;
      const nextUserId = nextUser?.id || "";
      const previousUserId = previousUserIdRef.current;

      previousUserIdRef.current = nextUserId;
      setSession(nextSession);
      setCurrentUser(nextUser);

      if (previousUserId && previousUserId !== nextUserId) {
        setCurrentDiagramId("");
        setSavedDiagrams([]);
        setAutoSaveState("idle");
        setStorageMessage("");
        setStorageError("");
      }

      if (!nextUserId) {
        setCurrentDiagramId("");
        setSavedDiagrams([]);
        setAutoSaveState("idle");
      }
    };

    const initializeAuth = async () => {
      setAuthLoading(true);

      const params = new URLSearchParams(window.location.search);
      const tokenHash = params.get("token_hash");
      const type = params.get("type");

      if (tokenHash) {
        setAuthVerifyingLink(true);
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type || "email",
        });

        if (cancelled) return;

        if (error) {
          setAuthError(error.message || "Unable to verify your sign-in link.");
        } else {
          setAuthError("");
          setAuthMessage("Signed in successfully.");
          window.history.replaceState({}, document.title, window.location.pathname);
        }

        setAuthVerifyingLink(false);
      }

      const { data: authData, error } = await supabase.auth.getSession();

      if (cancelled) return;

      if (error) {
        setAuthError(error.message || "Unable to restore your session.");
      } else {
        syncAuthState(authData.session);
      }

      setAuthLoading(false);
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      syncAuthState(nextSession);
      setAuthLoading(false);
      setAuthVerifyingLink(false);

      if (event === "SIGNED_IN") {
        setAuthError("");
        setAuthMessage("Signed in successfully.");
      }

      if (event === "SIGNED_OUT") {
        setAuthError("");
        setAuthMessage("Signed out.");
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !currentUser?.id) {
      setSavedDiagrams([]);
      setLoadingSavedDiagrams(false);
      return;
    }

    let cancelled = false;

    const loadSavedDiagrams = async () => {
      setLoadingSavedDiagrams(true);
      const { data: rows, error } = await supabase
        .from("driver_diagrams")
        .select("id, title, purpose_title, updated_at")
        .order("updated_at", { ascending: false });

      if (cancelled) return;

      if (error) {
        setStorageError(error.message || "Unable to load saved diagrams.");
      } else {
        setSavedDiagrams(rows || []);
      }
      setLoadingSavedDiagrams(false);
    };

    loadSavedDiagrams();
    return () => {
      cancelled = true;
    };
  }, [currentUser?.id]);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !isAuthenticated || !currentDiagramId) {
      return;
    }
    if (currentSnapshot === lastSavedSnapshotRef.current) {
      return;
    }
    if (savingDiagram || loadingSavedDiagrams || openingDiagramId || deletingDiagramId) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      saveDiagram({ isAuto: true });
    }, 1500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [currentSnapshot, currentDiagramId, deletingDiagramId, isAuthenticated, loadingSavedDiagrams, openingDiagramId, savingDiagram]);

  useEffect(() => {
    let cancelled = false;
    const id = ++renderId.current;

    async function renderDiagram() {
      try {
        const sanitizedCode = sanitizeMermaidCode(codeInput);
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
  }, [codeInput]);

  const updatePurpose = (field, value) => {
    codeSourceRef.current = "form";
    setData((d) => ({ ...d, purpose: { ...d.purpose, [field]: value } }));
  };

  const resetStorageNotice = () => {
    setStorageError("");
    setStorageMessage("");
  };

  const refreshSavedDiagrams = async () => {
    if (!isSupabaseConfigured || !supabase) {
      setStorageError("Add Supabase env vars before loading saved diagrams.");
      return;
    }
    if (!currentUser?.id) {
      setStorageError("Sign in before loading saved diagrams.");
      return;
    }

    setLoadingSavedDiagrams(true);
    const { data: rows, error } = await supabase
      .from("driver_diagrams")
      .select("id, title, purpose_title, updated_at")
      .order("updated_at", { ascending: false });

    if (error) {
      setStorageError(error.message || "Unable to refresh saved diagrams.");
    } else {
      setSavedDiagrams(rows || []);
      setStorageError("");
    }
    setLoadingSavedDiagrams(false);
  };

  const startNewDiagram = () => {
    codeSourceRef.current = "form";
    lastSavedSnapshotRef.current = buildDiagramSnapshot(
      defaultDocumentTitle,
      defaultData,
      buildMermaidCode(defaultData)
    );
    setCurrentDiagramId("");
    setDocumentTitle(defaultDocumentTitle);
    setData(normalizeStoredDiagramData(defaultData));
    setCodeInput(buildMermaidCode(defaultData));
    setAutoSaveState("idle");
    resetStorageNotice();
    setCodeSyncError("");
    setCodeSyncMessage("");
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

  const saveDiagram = async ({ isAuto = false } = {}) => {
    if (!isSupabaseConfigured || !supabase) {
      setStorageError("Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY before saving.");
      return;
    }
    if (!currentUser?.id) {
      setStorageError("Sign in before saving to the database.");
      return;
    }

    const normalizedCode = sanitizeMermaidCode(codeInput);
    const normalizedData = normalizeStoredDiagramData(data);
    const title = documentTitle.trim() || normalizedData.purpose.title || defaultDocumentTitle;
    const snapshot = buildDiagramSnapshot(title, normalizedData, normalizedCode);

    if (isAuto && (snapshot === lastSavedSnapshotRef.current || !currentDiagramId)) {
      return;
    }

    const payload = {
      user_id: currentUser.id,
      title,
      purpose_title: normalizedData.purpose.title,
      purpose_kpi: normalizedData.purpose.kpi,
      diagram_data: normalizedData,
      mermaid_code: normalizedCode,
    };

    setSavingDiagram(true);
    if (isAuto) {
      setAutoSaveState("saving");
    }
    setStorageError("");
    if (!isAuto) {
      setStorageMessage("");
    }

    const query = currentDiagramId
      ? supabase.from("driver_diagrams").update(payload).eq("id", currentDiagramId).select("id, title, purpose_title, updated_at").single()
      : supabase.from("driver_diagrams").insert(payload).select("id, title, purpose_title, updated_at").single();

    const { data: row, error } = await query;

    if (error) {
      setStorageError(error.message || "Unable to save this diagram.");
      setAutoSaveState("dirty");
      setSavingDiagram(false);
      return;
    }

    if (row) {
      setCurrentDiagramId(row.id);
      lastSavedSnapshotRef.current = snapshot;
      setDocumentTitle(row.title);
      setSavedDiagrams((items) => {
        const next = [row, ...items.filter((item) => item.id !== row.id)];
        return next.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
      });
    }

    setAutoSaveState("saved");
    setStorageMessage(
      isAuto ? "Draft auto-saved." : currentDiagramId ? "Saved changes to database." : "Saved to database."
    );
    setSavingDiagram(false);
  };

  const openDiagram = async (diagramId) => {
    if (!isSupabaseConfigured || !supabase) {
      setStorageError("Add Supabase env vars before opening saved diagrams.");
      return;
    }
    if (!currentUser?.id) {
      setStorageError("Sign in before opening saved diagrams.");
      return;
    }

    setOpeningDiagramId(diagramId);
    setStorageError("");
    setStorageMessage("");
    const { data: row, error } = await supabase
      .from("driver_diagrams")
      .select("*")
      .eq("id", diagramId)
      .single();
    setOpeningDiagramId("");

    if (error || !row) {
      setStorageError(error?.message || "Unable to open this diagram.");
      return;
    }

    const normalizedData = normalizeStoredDiagramData(row.diagram_data);
    const nextTitle = row.title || defaultDocumentTitle;
    const nextCode = sanitizeMermaidCode(row.mermaid_code || buildMermaidCode(normalizedData));

    codeSourceRef.current = "code";
    setCurrentDiagramId(row.id);
    setDocumentTitle(nextTitle);
    setData(normalizedData);
    setCodeInput(nextCode);
    lastSavedSnapshotRef.current = buildDiagramSnapshot(nextTitle, normalizedData, nextCode);
    setAutoSaveState("saved");
    setCodeSyncError("");
    setCodeSyncMessage("");
    setStorageMessage("Loaded diagram from database.");
  };

  const deleteDiagram = async (diagramId) => {
    if (!isSupabaseConfigured || !supabase) {
      setStorageError("Add Supabase env vars before deleting saved diagrams.");
      return;
    }
    if (!currentUser?.id) {
      setStorageError("Sign in before deleting saved diagrams.");
      return;
    }

    if (!window.confirm("Delete this saved diagram?")) {
      return;
    }

    setDeletingDiagramId(diagramId);
    setStorageError("");
    setStorageMessage("");
    const { error } = await supabase.from("driver_diagrams").delete().eq("id", diagramId);
    setDeletingDiagramId("");

    if (error) {
      setStorageError(error.message || "Unable to delete this diagram.");
      return;
    }

    setSavedDiagrams((items) => items.filter((item) => item.id !== diagramId));
    if (currentDiagramId === diagramId) {
      startNewDiagram();
    }
    setStorageMessage("Deleted diagram from database.");
  };

  const copyMermaid = async () => {
    await navigator.clipboard.writeText("```mermaid\n" + sanitizeMermaidCode(codeInput) + "\n```");
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
    const blob = new Blob([sanitizeMermaidCode(codeInput)], { type: "text/plain;charset=utf-8" });
    triggerBlobDownload(blob, "driver-diagram.mmd");
  };

  const downloadSvg = () => {
    let exportData = data;
    try {
      exportData = parseMermaidCode(sanitizeMermaidCode(codeInput));
    } catch (_error) {
      exportData = data;
    }
    const blob = new Blob([buildTemplateSvg(exportData)], { type: "image/svg+xml;charset=utf-8" });
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
      const normalizedCode = sanitizeMermaidCode(codeInput);
      const parsed = parseMermaidCode(normalizedCode);
      codeSourceRef.current = "code";
      setData(parsed);
      setCodeInput(normalizedCode);
      setCodeSyncError("");
      setCodeSyncMessage("Form updated from Mermaid code.");
    } catch (error) {
      setCodeSyncMessage("");
      setCodeSyncError(error?.message || "Unable to parse Mermaid code into the form.");
    }
  };

  const handleCodeInputChange = (value) => {
    codeSourceRef.current = "code";
    setCodeInput(sanitizeMermaidCode(value));
    setCodeSyncMessage("");
    if (codeSyncError) {
      setCodeSyncError("");
    }
  };

  const requestMagicLink = async () => {
    if (!isSupabaseConfigured || !supabase) {
      setAuthError("Add Supabase env vars before signing in.");
      return false;
    }

    const email = authEmail.trim();
    if (!email) {
      setAuthError("Enter your email before requesting a sign-in link.");
      return false;
    }

    setAuthSubmitting(true);
    setAuthError("");
    setAuthMessage("");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}${window.location.pathname}`,
      },
    });

    if (error) {
      setAuthError(error.message || "Unable to send the sign-in link.");
      setAuthSubmitting(false);
      return false;
    } else {
      setAuthMessage(`Check ${email} for the sign-in link.`);
    }

    setAuthSubmitting(false);
    return true;
  };

  const handleSignIn = async (event) => {
    event.preventDefault();
    await requestMagicLink();
  };

  const handleSignOut = async () => {
    if (!supabase) return;

    setAuthSubmitting(true);
    setAuthError("");
    setAuthMessage("");

    const { error } = await supabase.auth.signOut();
    if (error) {
      setAuthError(error.message || "Unable to sign out right now.");
    }

    setAuthSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-4">
        <header className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-3">
              <div>
              <h1 className="text-2xl font-bold tracking-tight">Driver Diagram MVP</h1>
                <p className="text-sm text-slate-500">สร้าง Driver Diagram พร้อม KPI ทุกระดับ พร้อม Live Preview, Export, และบันทึกขึ้นฐานข้อมูลแบบแยกตามผู้ใช้</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                {isAuthenticated ? (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Workspace</div>
                      <div className="mt-1 text-sm font-semibold text-slate-900">{currentUser?.email || session?.user?.email || "Signed-in user"}</div>
                      <p className="mt-1 text-sm text-slate-500">Saved diagrams in this workspace are only visible to this account.</p>
                    </div>
                    <button
                      onClick={handleSignOut}
                      disabled={authSubmitting}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-100 disabled:cursor-wait disabled:opacity-70"
                    >
                      <LogOut size={16} /> {authSubmitting ? "Signing out..." : "Sign out"}
                    </button>
                  </div>
                ) : (
                  <form className="space-y-3" onSubmit={handleSignIn}>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Private Cloud Save</div>
                      <p className="mt-1 text-sm text-slate-500">Sign in with your email to save, reopen, and auto-save diagrams in your own private workspace.</p>
                    </div>
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
                          <Mail size={16} /> {authSubmitting ? "Sending..." : "Email Sign-In Link"}
                        </button>
                    </div>
                    {authVerifyingLink ? (
                      <div className="rounded-2xl bg-blue-50 p-3 text-sm text-blue-700">Verifying your sign-in link...</div>
                    ) : authLoading ? (
                      <div className="rounded-2xl bg-slate-100 p-3 text-sm text-slate-600">Checking for an existing session...</div>
                    ) : null}
                    {authMessage ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={requestMagicLink}
                          disabled={authSubmitting}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-100 disabled:cursor-wait disabled:opacity-70"
                        >
                          <RefreshCw size={16} className={authSubmitting ? "animate-spin" : ""} /> Resend Link
                        </button>
                        <span className="text-xs text-slate-400">Use this if the first email takes a while to arrive.</span>
                      </div>
                    ) : null}
                    <p className="text-xs text-slate-400">Add your production and local URLs to Supabase Auth redirect URLs so the magic link can return here cleanly.</p>
                  </form>
                )}
                {authError ? <div className="mt-3 rounded-2xl bg-red-50 p-3 text-sm text-red-700">{authError}</div> : null}
                {!authError && authMessage ? <div className="mt-3 rounded-2xl bg-blue-50 p-3 text-sm text-blue-700">{authMessage}</div> : null}
              </div>
              <label className="block max-w-xl space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Document Title</span>
                <input
                  value={documentTitle}
                  onChange={(e) => {
                    setDocumentTitle(e.target.value);
                    resetStorageNotice();
                  }}
                  placeholder="ตั้งชื่อเอกสาร"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                />
              </label>
            </div>
            <div className="flex flex-wrap gap-2 xl:justify-end">
              <button
                onClick={startNewDiagram}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                <FilePlus2 size={16} /> New
              </button>
              <button
                onClick={saveDiagram}
                disabled={savingDiagram || !isAuthenticated}
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:cursor-wait disabled:opacity-70"
              >
                <Save size={16} /> {savingDiagram ? "Saving..." : isAuthenticated ? "Save" : "Sign in to save"}
              </button>
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
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
            <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 font-medium ${isSupabaseConfigured ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
              <Database size={15} />
              {isSupabaseConfigured ? "Supabase connected" : "Supabase env not configured yet"}
            </div>
            <div className={`rounded-full px-3 py-1.5 ${isAuthenticated ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600"}`}>
              {isAuthenticated
                ? "Private workspace active"
                : authVerifyingLink
                  ? "Verifying sign-in link..."
                  : authLoading
                    ? "Checking session..."
                    : "Sign in for private cloud save"}
            </div>
            {isSupabaseConfigured && currentDiagramId ? (
              <div
                className={`rounded-full px-3 py-1.5 ${
                  autoSaveState === "saving"
                    ? "bg-blue-50 text-blue-700"
                    : autoSaveState === "dirty"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-slate-100 text-slate-600"
                }`}
              >
                {autoSaveState === "saving"
                  ? "Auto-saving..."
                  : autoSaveState === "dirty"
                    ? "Unsaved changes"
                    : "All changes saved"}
              </div>
            ) : null}
            {currentDiagramId ? <div className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-600">ID: {currentDiagramId.slice(0, 8)}</div> : null}
          </div>
          {storageError ? <div className="mt-3 rounded-2xl bg-red-50 p-3 text-sm text-red-700">{storageError}</div> : null}
          {!storageError && storageMessage ? <div className="mt-3 rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-700">{storageMessage}</div> : null}
          {exportError ? <div className="mt-3 rounded-2xl bg-red-50 p-3 text-sm text-red-700">{exportError}</div> : null}
        </header>

        <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="space-y-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 lg:h-[82vh] lg:overflow-auto">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Saved Diagrams</h2>
                  <p className="text-sm text-slate-500">เปิดดูงานที่เคยบันทึกไว้ในฐานข้อมูล</p>
                </div>
                <button
                  onClick={refreshSavedDiagrams}
                  disabled={!isSupabaseConfigured || !isAuthenticated || loadingSavedDiagrams}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RefreshCw size={16} className={loadingSavedDiagrams ? "animate-spin" : ""} /> Refresh
                </button>
              </div>
              <div className="mt-3 space-y-2">
                {!isSupabaseConfigured ? (
                  <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                    ใส่ค่าใน <code>.env.local</code> ตามไฟล์ <code>.env.example</code> ก่อน ระบบถึงจะบันทึกและเปิดรายการจากฐานข้อมูลได้
                  </div>
                ) : !isAuthenticated ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-3 text-sm text-slate-600">
                    Sign in first, then this panel will show only the diagrams saved by your account.
                  </div>
                ) : loadingSavedDiagrams ? (
                  <div className="rounded-2xl bg-white p-3 text-sm text-slate-500">Loading saved diagrams...</div>
                ) : savedDiagrams.length ? (
                  savedDiagrams.map((item) => (
                    <div key={item.id} className="flex items-start justify-between gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
                      <button
                        onClick={() => openDiagram(item.id)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <div className="truncate font-semibold text-slate-900">{item.title || item.purpose_title || "Untitled Diagram"}</div>
                        <div className="mt-1 text-xs text-slate-500">
                          {item.updated_at ? new Date(item.updated_at).toLocaleString("th-TH") : ""}
                        </div>
                      </button>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openDiagram(item.id)}
                          disabled={openingDiagramId === item.id}
                          className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                          title="Open"
                        >
                          <FolderOpen size={16} />
                        </button>
                        <button
                          onClick={() => deleteDiagram(item.id)}
                          disabled={deletingDiagramId === item.id}
                          className="rounded-xl p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl bg-white p-4 text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
                    <div className="font-semibold text-slate-900">ยังไม่มีรายการที่บันทึกไว้</div>
                    <p className="mt-1">เริ่มจากกด Save งานปัจจุบัน แล้วรายการจะโผล่มาใน workspace นี้ทันที</p>
                    <button
                      onClick={() => saveDiagram()}
                      disabled={savingDiagram}
                      className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-wait disabled:opacity-70"
                    >
                      <Save size={16} /> {savingDiagram ? "Saving..." : "Save Current Diagram"}
                    </button>
                  </div>
                )}
              </div>
            </div>

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
