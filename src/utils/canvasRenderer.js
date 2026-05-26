import { wrapSvgText } from "./mermaidParser.js";

// Premium Color Palette
const THEME = {
  bg: "#f8fafc",
  headerBg: "#dbeafe",
  headerPurposeBg: "#fce4ec",
  headerSecondaryBg: "#fef3c7",
  headerChangeBg: "#ffedd5",
  headerText: "#1565c0",
  headerSecondaryText: "#92400e",
  headerChangeText: "#c2410c",
  
  purposeFill: "#fce4ec",
  purposeStroke: "#f8bbd0",
  purposeText: "#9d174d",
  purposeKpiText: "#c2185b",
  
  primaryFill: "#dbeafe",
  primaryStroke: "#93c5fd",
  primaryText: "#1565c0",
  primaryKpiText: "#1976d2",
  
  secondaryFill: "#fef3c7",
  secondaryStroke: "#fcd34d",
  secondaryText: "#92400e",
  secondaryKpiText: "#b7791f",
  
  changeFill: "#ffedd5",
  changeStroke: "#fed7aa",
  changeText: "#c2410c",
  changeKpiText: "#ea580c",
  
  bodyText: "#1e293b",
  mutedText: "#475569",
  connector: "#94a3b8",
  border: "#e2e8f0",
  cardFill: "#ffffff",
  cardStroke: "#e2e8f0",
};

const LAYOUT = {
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

const COLUMNS = {
  goalX: LAYOUT.sidePad,
  primaryX: 552,
  secondaryX: 1028,
  changeX: 1504,
};

const HEADER_WIDTH = 394;
const HEADER_X = {
  goal: COLUMNS.goalX + 18,
  primary: COLUMNS.primaryX,
  secondary: COLUMNS.secondaryX,
  change: COLUMNS.changeX,
};

function makeCard(kind, title, kpi, width) {
  const singleLineTitle = String(title || "").replace(/\n/g, " ").trim();
  const singleLineKpi = String(kpi || "").replace(/\n/g, " ").trim();
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
  
  const titleLines = wrapSvgText(singleLineTitle, titleMaxChars);
  const kpiLines = wrapSvgText(cleanKpi ? `KPI: ${cleanKpi}` : "", kpiMaxChars).filter(Boolean);
  
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
    paddingTop: titleBaseline,
    titleFontSize,
    kpiFontSize,
    titleLineHeight,
    kpiLineHeight,
    separatorY,
    kpiTop,
  };
}

function drawLeftArrow(ctx, toX, toY, color) {
  const headLength = 10;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(toX + headLength, toY - 5);
  ctx.lineTo(toX + headLength, toY + 5);
  ctx.closePath();
  ctx.fill();
}

function drawCard(ctx, x, y, card) {
  let fill = THEME.cardFill;
  let stroke = THEME.cardStroke;
  let titleFill = THEME.bodyText;
  let kpiFill = THEME.mutedText;
  let separatorColor = THEME.border;
  let accentColor = THEME.primaryText;
  
  if (card.kind === "purpose") {
    fill = THEME.purposeFill;
    stroke = THEME.purposeStroke;
    titleFill = THEME.purposeText;
    kpiFill = THEME.purposeKpiText;
    separatorColor = "rgba(157, 23, 77, 0.15)";
    accentColor = THEME.purposeText;
  } else if (card.kind === "primary") {
    fill = THEME.primaryFill;
    stroke = THEME.primaryStroke;
    titleFill = THEME.primaryText;
    kpiFill = THEME.primaryKpiText;
    separatorColor = "rgba(21, 101, 192, 0.15)";
    accentColor = THEME.primaryText;
  } else if (card.kind === "secondary") {
    fill = THEME.secondaryFill;
    stroke = THEME.secondaryStroke;
    titleFill = THEME.secondaryText;
    kpiFill = THEME.secondaryKpiText;
    separatorColor = "rgba(146, 64, 14, 0.15)";
    accentColor = THEME.secondaryText;
  } else if (card.kind === "change") {
    fill = THEME.changeFill;
    stroke = THEME.changeStroke;
    titleFill = THEME.changeText;
    kpiFill = THEME.changeKpiText;
    separatorColor = "rgba(194, 65, 12, 0.15)";
    accentColor = THEME.changeText;
  }

  // Soft modern drop shadow
  ctx.save();
  ctx.shadowColor = card.kind === "purpose" ? "rgba(157, 23, 77, 0.12)" : "rgba(15, 23, 42, 0.08)";
  ctx.shadowBlur = card.kind === "purpose" ? 24 : 16;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = card.kind === "purpose" ? 8 : 4;

  // Draw rounded card
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(x, y, card.width, card.height, 24);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Accent vertical stripe
  ctx.fillStyle = accentColor;
  ctx.beginPath();
  ctx.roundRect(x, y, 6, card.height, [3, 0, 0, 3]);
  ctx.fill();

  // Draw Text Lines
  ctx.textBaseline = "alphabetic";
  const fontFamily = "'IBM Plex Sans Thai', 'Noto Sans Thai', 'Inter', 'Tahoma', 'Arial', sans-serif";

  // Title text
  ctx.font = `600 ${card.titleFontSize}px ${fontFamily}`;
  ctx.fillStyle = titleFill;
  card.titleLines.forEach((line, index) => {
    ctx.fillText(line, x + card.paddingX + 8, y + card.paddingTop + index * card.titleLineHeight);
  });

  // KPI separator line
  if (card.kpiLines.length) {
    ctx.strokeStyle = separatorColor;
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.moveTo(x + card.paddingX, y + card.separatorY);
    ctx.lineTo(x + card.width - card.paddingX, y + card.separatorY);
    ctx.stroke();

    // KPI text
    ctx.font = `500 ${card.kpiFontSize}px ${fontFamily}`;
    ctx.fillStyle = kpiFill;
    card.kpiLines.forEach((line, index) => {
      ctx.fillText(line, x + card.paddingX + 8, y + card.kpiTop + index * card.kpiLineHeight);
    });
  }
}

function drawHeader(ctx, x, y, label, bg, color) {
  // Rounded header card
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.roundRect(x, y, HEADER_WIDTH, LAYOUT.headerH, 12);
  ctx.fill();

  // Header text
  ctx.font = "700 16px 'IBM Plex Sans Thai', 'Noto Sans Thai', 'Inter', 'Tahoma', 'Arial', sans-serif";
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x + HEADER_WIDTH / 2, y + LAYOUT.headerH / 2 + 1);
  ctx.textAlign = "left"; // Reset
}

export async function renderDiagramToCanvas(canvas, diagramData, svgLayoutMode = "auto") {
  // Make sure fonts are fully loaded inside browser context!
  if (typeof document !== "undefined" && document.fonts) {
    await document.fonts.ready;
  }

  const primaryGroups = diagramData.primaryDrivers.map((primary) => {
    const primaryCard = makeCard("primary", primary.title, primary.kpi, LAYOUT.primaryW);
    const secondaryBlocks = primary.secondaryDrivers.map((secondary) => {
      const secondaryCard = makeCard("secondary", secondary.title, secondary.kpi, LAYOUT.secondaryW);
      const changeCards = (secondary.changeIdeas.length ? secondary.changeIdeas : [{ title: "", kpi: "" }]).map((change) =>
        makeCard("change", change.title, change.kpi, LAYOUT.changeW)
      );
      const changeStackHeight =
        changeCards.reduce((sum, card) => sum + card.height, 0) +
        Math.max(0, changeCards.length - 1) * LAYOUT.cardGap;
      const blockHeight = Math.max(secondaryCard.height, changeStackHeight);
      return { secondary, secondaryCard, changeCards, blockHeight };
    });
    const secondaryStackHeight =
      secondaryBlocks.reduce((sum, block) => sum + block.blockHeight, 0) +
      Math.max(0, secondaryBlocks.length - 1) * LAYOUT.blockGap;
    const groupHeight = Math.max(primaryCard.height, secondaryStackHeight);
    return { primary, primaryCard, secondaryBlocks, groupHeight };
  });

  let cursorY = LAYOUT.contentTop;
  const renderCards = [];
  const primaryCenters = [];
  const secondaryConnectors = [];
  const changeConnectors = [];

  primaryGroups.forEach((group) => {
    const groupTop = cursorY;
    const primaryY = groupTop + (group.groupHeight - group.primaryCard.height) / 2;
    renderCards.push({ x: COLUMNS.primaryX, y: primaryY, card: group.primaryCard });
    primaryCenters.push({
      x: COLUMNS.primaryX,
      y: primaryY + group.primaryCard.height / 2,
    });

    let blockY = groupTop + (group.groupHeight - (
      group.secondaryBlocks.reduce((sum, block) => sum + block.blockHeight, 0) +
      Math.max(0, group.secondaryBlocks.length - 1) * LAYOUT.blockGap
    )) / 2;

    group.secondaryBlocks.forEach((block) => {
      const secondaryY = blockY + (block.blockHeight - block.secondaryCard.height) / 2;
      renderCards.push({ x: COLUMNS.secondaryX, y: secondaryY, card: block.secondaryCard });
      secondaryConnectors.push({
        from: { x: COLUMNS.primaryX + group.primaryCard.width, y: primaryY + group.primaryCard.height / 2 },
        to: { x: COLUMNS.secondaryX, y: secondaryY + block.secondaryCard.height / 2 },
      });

      let changeY = blockY + (block.blockHeight - (
        block.changeCards.reduce((sum, card) => sum + card.height, 0) +
        Math.max(0, block.changeCards.length - 1) * LAYOUT.cardGap
      )) / 2;

      const changeCenters = [];
      block.changeCards.forEach((changeCard) => {
        renderCards.push({ x: COLUMNS.changeX, y: changeY, card: changeCard });
        changeCenters.push({ x: COLUMNS.changeX, y: changeY + changeCard.height / 2 });
        changeY += changeCard.height + LAYOUT.cardGap;
      });

      changeConnectors.push({
        from: { x: COLUMNS.secondaryX + block.secondaryCard.width, y: secondaryY + block.secondaryCard.height / 2 },
        to: changeCenters,
      });

      blockY += block.blockHeight + LAYOUT.blockGap;
    });

    cursorY += group.groupHeight + LAYOUT.groupGap;
  });

  const contentHeight = cursorY - LAYOUT.groupGap;
  const goalCard = makeCard("purpose", diagramData.purpose.title, diagramData.purpose.kpi, LAYOUT.goalW);
  const goalY = LAYOUT.contentTop + Math.max(0, (contentHeight - LAYOUT.contentTop - goalCard.height) / 2);
  const goalCenterY = goalY + goalCard.height / 2;
  renderCards.push({ x: COLUMNS.goalX, y: goalY, card: goalCard });

  const purposeTrunkX = COLUMNS.goalX + goalCard.width + 42;
  const svgHeight = Math.max(cursorY + LAYOUT.bottomPad, goalY + goalCard.height + LAYOUT.bottomPad);

  // Setup Target Resolution
  let targetWidth = LAYOUT.canvasWidth;
  let targetHeight = svgHeight;
  let translateX = 0;
  let translateY = 0;
  let scale = 1;

  if (svgLayoutMode && svgLayoutMode !== "auto") {
    targetWidth = 1980;
    if (svgLayoutMode === "landscape_a4") {
      targetHeight = 1400;
    } else if (svgLayoutMode === "widescreen") {
      targetHeight = 1113;
    }

    scale = Math.min(1.0, targetHeight / svgHeight);
    translateX = (targetWidth - targetWidth * scale) / 2;
    translateY = scale === 1.0 ? (targetHeight - svgHeight) / 2 : 0;
  }

  // Set Canvas Dimensions at high-DPI (Retina scaling = 2x)
  const renderScale = 2;
  canvas.width = targetWidth * renderScale;
  canvas.height = targetHeight * renderScale;
  
  const ctx = canvas.getContext("2d");
  ctx.scale(renderScale, renderScale);

  // Background Slate Fill
  ctx.fillStyle = THEME.bg;
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  // Apply layout transformations
  ctx.save();
  ctx.translate(translateX, translateY);
  ctx.scale(scale, scale);

  // 1. Draw Connectors (Lines and Arrows)
  ctx.strokeStyle = THEME.connector;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Goal Aim Connector
  if (primaryCenters.length) {
    // Goal aiming horizontal line trunk
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(purposeTrunkX, goalCenterY);
    ctx.lineTo(COLUMNS.goalX + goalCard.width + 8, goalCenterY);
    ctx.stroke();
    drawLeftArrow(ctx, COLUMNS.goalX + goalCard.width + 8, goalCenterY, THEME.connector);

    // Vertical line connecting all Primary Drivers
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(purposeTrunkX, primaryCenters[0].y);
    ctx.lineTo(purposeTrunkX, primaryCenters[primaryCenters.length - 1].y);
    ctx.stroke();

    // Branches from each Primary Driver to the vertical trunk
    primaryCenters.forEach((center) => {
      ctx.beginPath();
      ctx.moveTo(COLUMNS.primaryX, center.y);
      ctx.lineTo(purposeTrunkX, center.y);
      ctx.stroke();
    });
  }

  // Secondary Driver Connectors
  ctx.lineWidth = 2.5;
  secondaryConnectors.forEach(({ from, to }) => {
    ctx.beginPath();
    ctx.moveTo(to.x, to.y);
    ctx.lineTo(from.x + 36, to.y);
    ctx.lineTo(from.x + 36, from.y);
    ctx.lineTo(from.x + 8, from.y);
    ctx.stroke();
    drawLeftArrow(ctx, from.x + 8, from.y, THEME.connector);
  });

  // Change Idea Connectors
  changeConnectors.forEach(({ from, to }) => {
    if (!to.length) return;
    const joinX = from.x + 46;

    // Horizontal arrow pointing to secondary driver
    ctx.beginPath();
    ctx.moveTo(joinX, from.y);
    ctx.lineTo(from.x + 8, from.y);
    ctx.stroke();
    drawLeftArrow(ctx, from.x + 8, from.y, THEME.connector);

    // Vertical trunk
    if (to.length > 1) {
      ctx.beginPath();
      ctx.moveTo(joinX, to[0].y);
      ctx.lineTo(joinX, to[to.length - 1].y);
      ctx.stroke();
    }

    // Branch horizontal lines
    to.forEach((target) => {
      ctx.beginPath();
      ctx.moveTo(target.x, target.y);
      ctx.lineTo(joinX, target.y);
      ctx.stroke();
    });
  });

  // 2. Draw Column Headers
  const headerY = LAYOUT.topPad;
  drawHeader(ctx, HEADER_X.goal, headerY, "เป้าหมาย (AIM)", THEME.headerPurposeBg, THEME.purposeText);
  drawHeader(ctx, HEADER_X.primary, headerY, "PRIMARY DRIVERS", THEME.headerBg, THEME.primaryText);
  drawHeader(ctx, HEADER_X.secondary, headerY, "SECONDARY DRIVERS", THEME.headerSecondaryBg, THEME.secondaryText);
  drawHeader(ctx, HEADER_X.change, headerY, "CHANGE IDEAS", THEME.headerChangeBg, THEME.changeText);

  // 3. Draw All Cards
  renderCards.forEach(({ x, y, card }) => {
    drawCard(ctx, x, y, card);
  });

  ctx.restore();
}
