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

export function wrapSvgText(text = "", maxChars = 28, maxLines = 0) {
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
        if (normalizedCurrent && normalizedNext.length > maxChars) {
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
    const titleLines = wrapSvgText(title, kind === "purpose" ? 50 : 55);
    const kpiLines = wrapSvgText(kpi ? `KPI: ${kpi}` : "", 50).filter(Boolean);
    const titleFontSize = kind === "purpose" ? 24 : 16;
    const kpiFontSize = kind === "purpose" ? 14 : 13;
    const titleLineHeight = kind === "purpose" ? 36 : 25;
    const kpiLineHeight = kind === "purpose" ? 20 : 18;
    const paddingX = kind === "purpose" ? 24 : 22;
    const paddingTop = kind === "purpose" ? 22 : 20;
    const separatorGap = kpiLines.length ? 14 : 0;
    const separatorY = paddingTop + titleLines.length * titleLineHeight + separatorGap;
    const kpiTop = separatorY + (kpiLines.length ? 18 : 0);
    const height = Math.max(
      kind === "purpose" ? 180 : kind === "change" ? 150 : 126,
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
