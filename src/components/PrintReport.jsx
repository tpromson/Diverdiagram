import React from "react";
import { useDiagramStore } from "../store/useDiagramStore.js";
import { useUIStore } from "../store/useUIStore.js";

export function PrintReport() {
  const data = useDiagramStore((state) => state.data);
  const documentTitle = useDiagramStore((state) => state.documentTitle);
  const language = useUIStore((state) => state.language);

  const headers = language === "th" ? {
    primary: "ปัจจัยขับเคลื่อนหลัก (Primary Drivers) & KPIs",
    secondary: "ปัจจัยขับเคลื่อนรอง (Secondary Drivers) & KPIs",
    change: "แนวคิดการเปลี่ยนแปลง (Change Ideas) & KPIs",
    purpose: "เป้าหมาย (Purpose)",
    purposeKpi: "ตัวชี้วัดผลลัพธ์ (Purpose KPI)",
    diagramTitle: "แผนภูมิ Driver Diagram",
    tableTitle: "ตารางสรุปรายละเอียด (Driver Diagram Details)",
    purposeLabel: "Goal (เป้าหมาย)",
    primaryLabel: "Primary Driver",
    secondaryLabel: "Secondary Driver",
    changeLabel: "Change Idea"
  } : {
    primary: "Primary Drivers & KPIs",
    secondary: "Secondary Drivers & KPIs",
    change: "Change Ideas & KPIs",
    purpose: "Purpose",
    purposeKpi: "Purpose KPI",
    diagramTitle: "Driver Diagram",
    tableTitle: "Driver Diagram Details Table",
    purposeLabel: "Goal",
    primaryLabel: "Primary Driver",
    secondaryLabel: "Secondary Driver",
    changeLabel: "Change Idea"
  };

  // Estimate tree height — each secondary driver row = max(secondary card, change bullet box)
  const getEstimatedTreeHeight = (diagramData) => {
    if (!diagramData || !diagramData.primaryDrivers || diagramData.primaryDrivers.length === 0) {
      return 100;
    }
    
    const charsPerLine = 12; // Thai characters are ~1.5x wider than Latin
    const changeCharsPerLine = 16; // change column is wider (220px)
    const itemPadding = 12;
    const gapBetween = 12;
    
    const estimateCardHeight = (title, kpi, cpl = charsPerLine) => {
      const titleText = title || "";
      const titleLines = Math.max(1, Math.ceil(titleText.length / cpl));
      let kpiLines = 0;
      if (kpi) {
        String(kpi).split("\n").forEach((seg) => {
          kpiLines += Math.max(1, Math.ceil(seg.length / cpl));
        });
      }
      return 14 + (titleLines * 13) + (kpiLines * 11);
    };

    let totalHeight = 0;
    diagramData.primaryDrivers.forEach((primary) => {
      const hasSecondary = primary.secondaryDrivers && primary.secondaryDrivers.length > 0;
      if (!hasSecondary) {
        totalHeight += estimateCardHeight(primary.title, primary.kpi) + itemPadding + gapBetween;
      } else {
        primary.secondaryDrivers.forEach((secondary) => {
          const secHeight = estimateCardHeight(secondary.title, secondary.kpi);
          // Change ideas are now a single bullet-list box
          let changeBoxHeight = 12;
          if (secondary.changeIdeas && secondary.changeIdeas.length > 0) {
            secondary.changeIdeas.forEach((ch) => {
              const lines = Math.max(1, Math.ceil((ch.title || "").length / changeCharsPerLine));
              changeBoxHeight += lines * 13 + 5;
            });
          }
          totalHeight += Math.max(secHeight, changeBoxHeight) + itemPadding + gapBetween;
        });
      }
    });

    return Math.max(100, Math.round((totalHeight - gapBetween) * 1.15));
  };

  const estimatedHeight = getEstimatedTreeHeight(data);
  const treeNaturalWidth = 790; // 170+20+170+20+170+20+220
  
  // A4 landscape usable dimensions
  const availableWidth = 1000;
  const availableHeight = 480;
  
  // Calculate zoom to FILL the page — allow zooming UP (>1) to spread the diagram
  const zoomW = availableWidth / treeNaturalWidth;
  const zoomH = availableHeight / estimatedHeight;
  const zoomLevel = Math.min(zoomW, zoomH, 1.6);
  
  const treeWrapperStyle = {
    zoom: zoomLevel,
  };

  // Build rows using the DOCX-equivalent row spanning algorithm
  const rows = [];
  if (data && data.primaryDrivers) {
    data.primaryDrivers.forEach((primary) => {
      const secondaryGroups = (primary.secondaryDrivers && primary.secondaryDrivers.length)
        ? primary.secondaryDrivers
        : [{ title: "", kpi: "", changeIdeas: [{ title: "", kpi: "" }] }];

      const primarySpan = secondaryGroups.reduce(
        (sum, secondary) => sum + Math.max(secondary.changeIdeas ? secondary.changeIdeas.length : 0, 1),
        0
      );

      let primaryPlaced = false;

      secondaryGroups.forEach((secondary) => {
        const changes = (secondary.changeIdeas && secondary.changeIdeas.length)
          ? secondary.changeIdeas
          : [{ title: "", kpi: "" }];
        let secondaryPlaced = false;

        changes.forEach((change) => {
          rows.push({
            primary: !primaryPlaced ? { title: primary.title, kpi: primary.kpi, span: primarySpan } : null,
            secondary: !secondaryPlaced ? { title: secondary.title, kpi: secondary.kpi, span: changes.length } : null,
            change: { title: change.title, kpi: change.kpi },
          });
          primaryPlaced = true;
          secondaryPlaced = true;
        });
      });
    });
  }

  // Format multi-line text (like titles or KPIs) into separate lines inside cards/table cells
  const formatText = (text) => {
    if (!text) return null;
    return String(text)
      .split("\n")
      .filter((line) => line.trim())
      .map((line, index) => (
        <div key={index} className="text-line">
          {line}
        </div>
      ));
  };

  return (
    <div className="print-report" data-tour="print-layout">
      {/* PAGE 1: DIAGRAM SCREEN */}
      <div className="print-page print-page-diagram">
        {/* Document Header */}
        <div className="print-header">
          <h1 className="print-doc-title">{documentTitle}</h1>
          <div className="print-purpose-card">
            <div className="purpose-item">
              <span className="purpose-label">{headers.purpose}: </span>
              <span className="purpose-value">{data?.purpose?.title || "-"}</span>
            </div>
            {data?.purpose?.kpi && (
              <div className="purpose-item kpi-item">
                <span className="purpose-label">{headers.purposeKpi}: </span>
                <div className="purpose-value kpi-list">{formatText(data.purpose.kpi)}</div>
              </div>
            )}
          </div>
        </div>

        {/* HTML-Native Tree Diagram */}
        <div className="print-diagram-section">
          <h2 className="section-title">{headers.diagramTitle}</h2>
          {/* Single wrapper with zoom — keeps headers + tree perfectly aligned */}
          <div className="print-tree-wrapper" style={treeWrapperStyle}>
            {/* Column headers row */}
            <div className="tree-column-headers">
              <div className="col-header col-purpose">{headers.purposeLabel}</div>
              <div className="col-header col-primary">{headers.primaryLabel}</div>
              <div className="col-header col-secondary">{headers.secondaryLabel}</div>
              <div className="col-header col-change">{headers.changeLabel}</div>
            </div>
            {/* Tree */}
            <div className="tree-group">
              {/* Level 0: Purpose */}
              <div className={`tree-node node-purpose ${data?.primaryDrivers?.length ? 'has-children' : ''}`}>
                <div className="node-title">{formatText(data?.purpose?.title || "-")}</div>
                {data?.purpose?.kpi && (
                  <div className="node-kpi">
                    {formatText(data.purpose.kpi)}
                  </div>
                )}
              </div>

              {data?.primaryDrivers?.length > 0 && (
                <div className="tree-children">
                  {data.primaryDrivers.map((primary) => (
                    <div key={primary.id} className="tree-item">
                      <div className="tree-group">
                        {/* Level 1: Primary Driver */}
                        <div className={`tree-node node-primary ${primary.secondaryDrivers?.length ? 'has-children' : ''}`}>
                          <div className="node-title">{formatText(primary.title || "-")}</div>
                          {primary.kpi && (
                            <div className="node-kpi">
                              {formatText(primary.kpi)}
                            </div>
                          )}
                        </div>

                        {primary.secondaryDrivers?.length > 0 && (
                          <div className="tree-children">
                            {primary.secondaryDrivers.map((secondary) => (
                              <div key={secondary.id} className="tree-item">
                                <div className="tree-group">
                                  {/* Level 2: Secondary Driver */}
                                  <div className={`tree-node node-secondary ${secondary.changeIdeas?.length ? 'has-children' : ''}`}>
                                    <div className="node-title">{formatText(secondary.title || "-")}</div>
                                    {secondary.kpi && (
                                      <div className="node-kpi">
                                        {formatText(secondary.kpi)}
                                      </div>
                                    )}
                                  </div>

                                  {secondary.changeIdeas?.length > 0 && (
                                    <div className="tree-children">
                                      <div className="tree-item">
                                        {/* Level 3: Change Ideas — grouped as bullet list */}
                                        <div className="tree-node node-change change-list">
                                          <ul className="change-bullets">
                                            {secondary.changeIdeas.map((change) => (
                                              <li key={change.id}>{change.title || "-"}</li>
                                            ))}
                                          </ul>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PAGE 2+: STRUCTURED TEXT TABLE */}
      {rows.length > 0 && (
        <div className="print-page print-page-table">
          <div className="print-table-header">
            <h2 className="print-table-title">{headers.tableTitle}</h2>
          </div>
          <table className="print-data-table">
            <thead>
              <tr>
                <th>{headers.primary}</th>
                <th>{headers.secondary}</th>
                <th>{headers.change}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index}>
                  {row.primary && (
                    <td rowSpan={row.primary.span} className="td-primary">
                      <div className="cell-title">{row.primary.title || "-"}</div>
                      {row.primary.kpi && (
                        <div className="cell-kpi">
                          <span className="kpi-tag">KPI:</span>
                          <div className="kpi-lines">{formatText(row.primary.kpi)}</div>
                        </div>
                      )}
                    </td>
                  )}
                  {row.secondary && (
                    <td rowSpan={row.secondary.span} className="td-secondary">
                      <div className="cell-title">{row.secondary.title || "-"}</div>
                      {row.secondary.kpi && (
                        <div className="cell-kpi">
                          <span className="kpi-tag">KPI:</span>
                          <div className="kpi-lines">{formatText(row.secondary.kpi)}</div>
                        </div>
                      )}
                    </td>
                  )}
                  <td className="td-change">
                    <div className="cell-title">{row.change.title || "-"}</div>
                    {row.change.kpi && (
                      <div className="cell-kpi">
                        <span className="kpi-tag">KPI:</span>
                        <div className="kpi-lines">{formatText(row.change.kpi)}</div>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
