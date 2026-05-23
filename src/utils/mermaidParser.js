const uid = () => crypto.randomUUID();

export function buildMermaidCode(data) {
  const lines = [
    "flowchart RL",
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
    lines.push(`    ${p} --> Purpose`);
    lines.push(`    subgraph ${p}G[\" \"]`);
    lines.push("        direction TB");
    lines.push(`        ${p}[${formatNodeLabel(`Primary Driver ${i + 1}`, pd.title)}]`);
    lines.push(`        ${pk}[${formatNodeLabel("KPI", pd.kpi)}]`);
    lines.push("    end", "");

    pd.secondaryDrivers.forEach((sd, j) => {
      const s = `S${i + 1}_${j + 1}`;
      const sk = `SKPI${i + 1}_${j + 1}`;
      lines.push(`    ${s} --> ${p}`);
      lines.push(`    subgraph ${s}G[\" \"]`);
      lines.push("        direction TB");
      lines.push(`        ${s}[${formatNodeLabel("Secondary Driver", sd.title)}]`);
      lines.push(`        ${sk}[${formatNodeLabel("KPI", sd.kpi)}]`);
      lines.push("    end", "");

      sd.changeIdeas.forEach((ci, k) => {
        const c = `C${i + 1}_${j + 1}_${k + 1}`;
        const ck = `CKPI${i + 1}_${j + 1}_${k + 1}`;
        lines.push(`    ${c} --> ${s}`);
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

export function decodeMermaidText(text = "") {
  return String(text)
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

export function normalizeNodeLabel(rawLabel = "") {
  return decodeMermaidText(rawLabel)
    .replace(/^`|`$/g, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/\r\n/g, "\n")
    .trim();
}

export function normalizeHeading(heading = "") {
  return String(heading)
    .replace(/^[^\p{L}\p{N}]+/gu, "")
    .trim()
    .toLowerCase();
}

export function inferNodeType(heading = "", value = "") {
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

export function escapeLooseXmlChars(text = "") {
  return String(text)
    .replace(/&(?!#?\w+;)/g, "&amp;")
    .replace(/</g, "&lt;");
}

export function sanitizeMermaidCode(code = "") {
  return String(code).replace(/(\["?)([\s\S]*?)("\])/g, (_match, prefix, inner, suffix) => {
    const normalizedInner = inner
      .replace(/<br\s*\/?>/gi, "<br/>")
      .split("\n")
      .map((line) => escapeLooseXmlChars(line))
      .join("\n");

    return `${prefix}${normalizedInner}${suffix}`;
  });
}

export function parseNodeDefinitions(code) {
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

export function parseSubgraphMembership(code) {
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

export function parseEdges(code) {
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

export function findAssociatedKpis(nodeMap, nodeGroups) {
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

export function parseMermaidCode(code) {
  const normalized = String(code || "").trim();
  if (!normalized.startsWith("flowchart")) {
    throw new Error("Mermaid code must start with a flowchart declaration.");
  }

  const nodeMap = parseNodeDefinitions(normalized);
  const nodeGroups = parseSubgraphMembership(normalized);
  const adjacency = parseEdges(normalized);
  const reverseAdjacency = new Map();
  adjacency.forEach((targets, from) => {
    targets.forEach((to) => {
      const existing = reverseAdjacency.get(to) || [];
      if (!existing.includes(from)) {
        reverseAdjacency.set(to, [...existing, from]);
      }
    });
  });
  const kpiByNodeId = findAssociatedKpis(nodeMap, nodeGroups);

  if (!nodeMap.size) {
    throw new Error("No Mermaid nodes were found.");
  }

  const purposeNode =
    nodeMap.get("Purpose") ||
    Array.from(nodeMap.values()).find((node) => node.type === "purpose") ||
    Array.from(nodeMap.values()).find((node) => {
      const outgoingPrimary = (adjacency.get(node.id) || []).some((targetId) => nodeMap.get(targetId)?.type === "primary");
      const incomingPrimary = (reverseAdjacency.get(node.id) || []).some((sourceId) => nodeMap.get(sourceId)?.type === "primary");
      return outgoingPrimary || incomingPrimary;
    });

  if (!purposeNode) {
    throw new Error("A Purpose/Goal node is required.");
  }

  const primaryIds = [
    ...(adjacency.get(purposeNode.id) || []),
    ...(reverseAdjacency.get(purposeNode.id) || []),
  ].filter((nodeId, index, list) => {
    const node = nodeMap.get(nodeId);
    return node && node.type === "primary" && list.indexOf(nodeId) === index;
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
      const secondaryIds = [
        ...(adjacency.get(primaryId) || []),
        ...(reverseAdjacency.get(primaryId) || []),
      ].filter((nodeId, index, list) => {
        const node = nodeMap.get(nodeId);
        return node && node.type === "secondary" && list.indexOf(nodeId) === index;
      });

      return {
        id: uid(),
        title: primaryNode?.value || primaryNode?.heading || "",
        kpi: kpiByNodeId.get(primaryId) || "",
        secondaryDrivers: secondaryIds.map((secondaryId) => {
          const secondaryNode = nodeMap.get(secondaryId);
          const changeIds = [
            ...(adjacency.get(secondaryId) || []),
            ...(reverseAdjacency.get(secondaryId) || []),
          ].filter((nodeId, index, list) => {
            const node = nodeMap.get(nodeId);
            return node && node.type === "change" && list.indexOf(nodeId) === index;
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

export function safeText(text = "") {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/`/g, "'")
    .replace(/"/g, "'")
    .replace(/[\[\]{}]/g, "")
    .replace(/\\/g, "\\\\");
}

export function formatNodeLabel(heading, value) {
  return `"\`${heading}\n${safeText(value)}\`"`;
}

export function escapeSvgText(text = "") {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function getVisualLength(str) {
  return String(str || "").replace(/[\u0e31\u0e34-\u0e3a\u0e47-\u0e4e]/g, "").length;
}

export function wrapSvgText(text = "", maxChars = 28, maxLines = 0) {
  // Merge common Thai compound words that segmenter splits incorrectly
  const mergeThaiTokens = (tokens) => {
    const merged = [];
    for (let i = 0; i < tokens.length; i++) {
      let current = tokens[i];
      let next = tokens[i + 1];
      
      if (next) {
        // Rule 1: "ผู้" + next Thai word
        if (current === "ผู้" && /[\u0e00-\u0e7f]/.test(next)) {
          current = current + next;
          i++;
          // Check for service recipient: "ผู้รับบริการ"
          const nextNext = tokens[i + 1];
          if (nextNext && next === "รับ" && nextNext === "บริการ") {
            current = current + nextNext;
            i++;
          }
        }
        // Rule 2: "โรง" + "พยาบาล"
        else if (current === "โรง" && next === "พยาบาล") {
          current = "โรงพยาบาล";
          i++;
        }
        // Rule 3: "เบา" + "หวาน"
        else if (current === "เบา" && next === "หวาน") {
          current = "เบาหวาน";
          i++;
        }
        // Rule 4: "น้ำ" + "ตาล"
        else if (current === "น้ำ" && next === "ตาล") {
          current = "น้ำตาล";
          i++;
        }
        // Rule 5: "ติด" + "ตาม"
        else if (current === "ติด" && next === "ตาม") {
          current = "ติดตาม";
          i++;
        }
        // Rule 6: "เยี่ยม" + "บ้าน"
        else if (current === "เยี่ยม" && next === "บ้าน") {
          current = "เยี่ยมบ้าน";
          i++;
        }
      }
      merged.push(current);
    }
    return merged;
  };

  const segmentText = (input) => {
    // Regex matching parentheticals, math/Thai comparisons, and percentages to keep them whole (precedence calibrated)
    const keeperRegex = /(\s*\(.+?\)|\s*(?:มากกว่าหรือเท่ากับ|น้อยกว่าหรือเท่ากับ|มากกว่า|น้อยกว่า|เท่ากับ)\s*\d+(?:\.\d+)?%?|\s*(?:[<>]=?|=|\u2264|\u2265|&lt;|&gt;)\s*\d+(?:\.\d+)?%?|\s*\d+(?:\.\d+)?%|\s*[<>]=?|\s*=)/gi;
    
    const parts = input.split(keeperRegex).filter(Boolean);
    const allTokens = [];
    
    parts.forEach((part) => {
      const trimmed = part.trim();
      
      // If it matches any of our keeper patterns, treat it as a single unbreakable token!
      if (
        (trimmed.startsWith("(") && trimmed.endsWith(")")) ||
        /^[<>]=?|=|\u2264|\u2265|&lt;|&gt;/i.test(trimmed) ||
        /^(?:มากกว่าหรือเท่ากับ|น้อยกว่าหรือเท่ากับ|มากกว่า|น้อยกว่า|เท่ากับ)\s*\d+/i.test(trimmed) ||
        /^\d+(?:\.\d+)?%$/i.test(trimmed)
      ) {
        allTokens.push(part);
      } else {
        // Otherwise, segment with standard Thai word segmentation
        if (typeof Intl !== "undefined" && Intl.Segmenter) {
          const segmenter = new Intl.Segmenter("th", { granularity: "word" });
          const segments = Array.from(segmenter.segment(part), (p) => p.segment);
          allTokens.push(...mergeThaiTokens(segments));
        } else if (part.includes(" ")) {
          allTokens.push(...part.split(/(\s+)/).filter(Boolean));
        } else {
          allTokens.push(...Array.from(part));
        }
      }
    });
    
    return allTokens;
  };

  const lines = String(text || "")
    .split("\n")
    .flatMap((paragraph) => {
      const trimmed = paragraph.trim();
      if (!trimmed) return [""];
      const tokens = segmentText(trimmed);
      const result = [];
      let current = "";

      tokens.forEach((token) => {
        const next = `${current}${token}`;
        const normalizedCurrent = current.trim();
        const normalizedNext = next.trim();
        if (normalizedCurrent && getVisualLength(normalizedNext) > maxChars) {
          result.push(normalizedCurrent);
          current = token.trimStart();
        } else {
          current = next;
        }
      });

      if (current.trim()) {
        result.push(current.trim());
      }

      return result.length ? result : [trimmed];
    });

  return maxLines > 0 ? lines.slice(0, maxLines) : lines;
}

export function buildTemplateSvg(diagramData) {
  const theme = {
    bg: "#f8fafc", // slate-50 neutral base
    headerBg: "#dbeafe", // blue-100
    headerPurposeBg: "#fce4ec", // pink-100
    headerSecondaryBg: "#fef3c7", // amber-100
    headerChangeBg: "#ffedd5", // orange-100
    headerText: "#1565c0",
    headerSecondaryText: "#92400e",
    headerChangeText: "#c2410c",
    
    // AIM/Goal (Purpose)
    purposeFill: "#fce4ec", // pink-50
    purposeStroke: "#f8bbd0", // pink-200
    purposeText: "#9d174d", // pink-800
    purposeKpiText: "#c2185b", // pink-700
    
    // Primary Driver
    primaryFill: "#dbeafe", // blue-50
    primaryStroke: "#93c5fd", // blue-200
    primaryText: "#1565c0", // blue-800
    primaryKpiText: "#1976d2", // blue-700
    
    // Secondary Driver
    secondaryFill: "#fef3c7", // amber-50
    secondaryStroke: "#fcd34d", // amber-200
    secondaryText: "#92400e", // amber-800
    secondaryKpiText: "#b7791f", // amber-700
    
    // Change Idea
    changeFill: "#ffedd5", // orange-50
    changeStroke: "#fed7aa", // orange-200
    changeText: "#c2410c", // orange-800
    changeKpiText: "#ea580c", // orange-700
    
    bodyText: "#1e293b", // slate-800
    mutedText: "#475569", // slate-600
    connector: "#94a3b8", // slate-400
    border: "#e2e8f0", // slate-200
    cardFill: "#ffffff",
    cardStroke: "#e2e8f0",
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
    // Join any embedded newlines into single space to prevent forced line breaks in card
    const singleLineTitle = String(title || "").replace(/\n/g, " ").trim();
    const singleLineKpi = String(kpi || "").replace(/\n/g, " ").trim();
    
    // Clean pre-existing "KPI:" prefixes to avoid "KPI: KPI:" duplication
    const cleanKpi = singleLineKpi.replace(/^kpi:\s*/i, "").trim();
    
    const titleFontSize = kind === "purpose" ? 22 : 18;
    const kpiFontSize = kind === "purpose" ? 16 : 15;
    const titleLineHeight = kind === "purpose" ? 30 : 28;
    const kpiLineHeight = kind === "purpose" ? 24 : 22;
    
    const paddingX = kind === "purpose" ? 24 : 22;
    const paddingTop = kind === "purpose" ? 22 : 20;

    const availableWidth = width - 2 * paddingX;
    const titleMaxChars = Math.floor(availableWidth / (titleFontSize * (kind === "purpose" ? 0.56 : 0.57)));
    const kpiMaxChars = Math.floor(availableWidth / (kpiFontSize * 0.58));
    
    // Wrap text lines properly (unlimited lines to prevent truncation of words like "เดือน")
    const titleLines = wrapSvgText(singleLineTitle, titleMaxChars);
    const kpiLines = wrapSvgText(cleanKpi ? `KPI: ${cleanKpi}` : "", kpiMaxChars).filter(Boolean);
    
    // Correct baseline vertical offset for premium typography rendering (prevent top-line touch & fill bottom empty space)
    const titleBaseline = paddingTop + titleFontSize * 0.8;
    const separatorGap = kpiLines.length ? 14 : 0;
    const titleLinesCount = Math.max(1, titleLines.length);
    const separatorY = titleBaseline + (titleLinesCount - 1) * titleLineHeight + separatorGap + titleFontSize * 0.2;
    const kpiTop = separatorY + (kpiLines.length ? 18 + kpiFontSize * 0.8 : 0);
    const kpiLinesCount = Math.max(1, kpiLines.length);
    
    const calculatedHeight = (kpiLines.length ? kpiTop + (kpiLinesCount - 1) * kpiLineHeight : separatorY) + 28;
    const height = Math.max(
      kind === "purpose" ? 180 : kind === "change" ? 150 : 126,
      calculatedHeight
    );

    return {
      kind,
      width,
      height,
      titleLines,
      kpiLines,
      paddingX,
      paddingTop: titleBaseline, // Serves as the first title line baseline
      titleFontSize,
      kpiFontSize,
      titleLineHeight,
      kpiLineHeight,
      separatorY,
      kpiTop, // Serves as the first KPI line baseline
      accentColor,
    };
  };

  const primaryGroups = diagramData.primaryDrivers.map((primary) => {
    const primaryCard = makeCard("primary", primary.title, primary.kpi, layout.primaryW, theme.primaryText);
    const secondaryBlocks = primary.secondaryDrivers.map((secondary) => {
      const secondaryCard = makeCard("secondary", secondary.title, secondary.kpi, layout.secondaryW, theme.secondaryText);
      const changeCards = (secondary.changeIdeas.length ? secondary.changeIdeas : [{ title: "", kpi: "" }]).map((change) =>
        makeCard("change", change.title, change.kpi, layout.changeW, theme.changeText)
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
    const radius = 24; // Matches rounded.lg (24px) in DESIGN.md
    
    let fill = theme.cardFill;
    let stroke = theme.cardStroke;
    let titleFill = theme.bodyText;
    let kpiFill = theme.mutedText;
    let separatorColor = theme.border;
    
    if (card.kind === "purpose") {
      fill = theme.purposeFill;
      stroke = theme.purposeStroke;
      titleFill = theme.purposeText;
      kpiFill = theme.purposeKpiText;
      separatorColor = "rgba(157, 23, 77, 0.15)";
    } else if (card.kind === "primary") {
      fill = theme.primaryFill;
      stroke = theme.primaryStroke;
      titleFill = theme.primaryText;
      kpiFill = theme.primaryKpiText;
      separatorColor = "rgba(21, 101, 192, 0.15)";
    } else if (card.kind === "secondary") {
      fill = theme.secondaryFill;
      stroke = theme.secondaryStroke;
      titleFill = theme.secondaryText;
      kpiFill = theme.secondaryKpiText;
      separatorColor = "rgba(146, 64, 14, 0.15)";
    } else if (card.kind === "change") {
      fill = theme.changeFill;
      stroke = theme.changeStroke;
      titleFill = theme.changeText;
      kpiFill = theme.changeKpiText;
      separatorColor = "rgba(194, 65, 12, 0.15)";
    }
    
    const shadow = card.kind === "purpose" ? "url(#goalShadow)" : "url(#cardShadow)";
    const accentColor = card.kind === "purpose" ? theme.purposeText :
                        card.kind === "primary" ? theme.primaryText :
                        card.kind === "secondary" ? theme.secondaryText :
                        theme.changeText;
                        
    const accent = `<rect x="${x}" y="${y}" width="6" height="${card.height}" rx="3" fill="${accentColor}" />`;
    
    const separator = card.kpiLines.length
      ? `<line x1="${x + card.paddingX}" y1="${y + card.separatorY}" x2="${x + card.width - card.paddingX}" y2="${y + card.separatorY}" stroke="${separatorColor}" stroke-width="1.25"/>`
      : "";

    return `
      <g>
        <rect x="${x}" y="${y}" width="${card.width}" height="${card.height}" rx="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="1.5" filter="${shadow}"/>
        ${accent}
        <text font-family="'IBM Plex Sans Thai', 'Noto Sans Thai', 'Inter', sans-serif">
          ${renderTextLines(card.titleLines, x + card.paddingX + 8, y + card.paddingTop, card.titleFontSize, card.titleLineHeight, titleFill, 600)}
          ${renderTextLines(card.kpiLines, x + card.paddingX + 8, y + card.kpiTop, card.kpiFontSize, card.kpiLineHeight, kpiFill, 500)}
        </text>
        ${separator}
      </g>
    `;
  };

  const headerY = layout.topPad;
  const headers = [
    { x: headerX.goal, label: "เป้าหมาย (AIM)", bg: theme.headerPurposeBg, color: theme.purposeText },
    { x: headerX.primary, label: "PRIMARY DRIVERS", bg: theme.headerBg, color: theme.primaryText },
    { x: headerX.secondary, label: "SECONDARY DRIVERS", bg: theme.headerSecondaryBg, color: theme.secondaryText },
    { x: headerX.change, label: "CHANGE IDEAS", bg: theme.headerChangeBg, color: theme.changeText },
  ]
    .map(
      (header) => `
        <g>
          <rect x="${header.x}" y="${headerY}" width="${headerWidth}" height="${layout.headerH}" rx="12" fill="${header.bg}" />
          <text x="${header.x + headerWidth / 2}" y="${headerY + 29}" text-anchor="middle" font-family="'IBM Plex Sans Thai', 'Noto Sans Thai', 'Inter', sans-serif" font-size="16" font-weight="700" fill="${header.color}" letter-spacing="0.5">${escapeSvgText(header.label)}</text>
        </g>
      `
    )
    .join("");

  const purposeConnector = primaryCenters.length
    ? `
      <!-- Main trunk pointing left to Goal/Aim -->
      <path d="M ${purposeTrunkX} ${goalCenterY} H ${columns.goalX + goalCard.width + 8}"
            fill="none" stroke="${theme.connector}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" marker-end="url(#arrow)" />
      <!-- Vertical trunk line connecting all branches -->
      <path d="M ${purposeTrunkX} ${primaryCenters[0].y} V ${primaryCenters[primaryCenters.length - 1].y}"
            fill="none" stroke="${theme.connector}" stroke-width="2.5" stroke-linecap="round" />
      <!-- Branches from Primary Drivers to trunk -->
      ${primaryCenters
        .map(
          (center) =>
            `<path d="M ${columns.primaryX} ${center.y} H ${purposeTrunkX}" fill="none" stroke="${theme.connector}" stroke-width="2.5" stroke-linecap="round" />`
        )
        .join("")}
    `
    : "";

  const secondaryConnectorMarkup = secondaryConnectors
    .map(
      ({ from, to }) =>
        `<path d="M ${to.x} ${to.y} H ${from.x + 36} V ${from.y} H ${from.x + 8}" fill="none" stroke="${theme.connector}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" marker-end="url(#arrow)" />`
    )
    .join("");

  const changeConnectorMarkup = changeConnectors
    .map(({ from, to }) => {
      if (!to.length) return "";
      const joinX = from.x + 46;
      
      // Main horizontal arrow pointing left into the Secondary Driver
      const mainArrow = `<path d="M ${joinX} ${from.y} H ${from.x + 8}" fill="none" stroke="${theme.connector}" stroke-width="2.5" stroke-linecap="round" marker-end="url(#arrow)" />`;
      
      // Vertical trunk connecting all Change Ideas
      const vertical = to.length > 1 ? `<path d="M ${joinX} ${to[0].y} V ${to[to.length - 1].y}" fill="none" stroke="${theme.connector}" stroke-width="2.5" stroke-linecap="round" />` : "";
      
      // Branch lines from each Change Idea to the vertical trunk
      const branches = to
        .map(
          (target) =>
            `<path d="M ${target.x} ${target.y} H ${joinX}" fill="none" stroke="${theme.connector}" stroke-width="2.5" stroke-linecap="round" />`
        )
        .join("");
        
      return `
        ${mainArrow}
        ${vertical}
        ${branches}
      `;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${layout.canvasWidth}" height="${svgHeight}" viewBox="0 0 ${layout.canvasWidth} ${svgHeight}" role="img" aria-label="Driver Diagram">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@400;500;600;700&amp;family=Inter:wght@400;500;600;700&amp;display=swap');
      text, tspan {
        font-family: 'IBM Plex Sans Thai', 'Noto Sans Thai', 'Inter', sans-serif;
      }
    </style>
    <filter id="cardShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="12" flood-color="#0f172a" flood-opacity="0.08"/>
    </filter>
    <filter id="goalShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#9d174d" flood-opacity="0.12"/>
    </filter>
    <!-- Beautiful modern arrowhead pointing left (drawn right-facing for auto orient rotation) -->
    <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 2 2.5 L 8 5 L 2 7.5 z" fill="${theme.connector}" />
    </marker>
  </defs>
  <rect width="100%" height="100%" fill="${theme.bg}" />
  ${headers}
  ${purposeConnector}
  ${secondaryConnectorMarkup}
  ${changeConnectorMarkup}
  ${renderCards.map(renderCardMarkup).join("")}
</svg>`;
}
