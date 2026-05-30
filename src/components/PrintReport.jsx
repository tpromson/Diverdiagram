import React from "react";
import { useDiagramStore } from "../store/useDiagramStore.js";
import { useUIStore } from "../store/useUIStore.js";
export { getPrintReportPdfPageSelectors } from "../utils/printReportPdf.js";
import {
  Target,
  BarChart3,
  Layers,
  GitBranch,
  Ambulance,
  Stethoscope,
  TestTube,
  Users,
  Clock,
  ClipboardList,
  FlaskConical,
  HeartPulse,
  RefreshCw,
} from "lucide-react";

// Helper functions to dynamically map titles to Lucide icons
const getPrimaryIcon = (title) => {
  const t = (title || "").toLowerCase();
  if (t.includes("เข้าถึง") || t.includes("ambulance") || t.includes("ส่งต่อ") || t.includes("เร็ว")) {
    return <Ambulance size={32} strokeWidth={2.8} className="node-icon text-blue-700 shrink-0" />;
  }
  if (t.includes("คัดกรอง") || t.includes("screen") || t.includes("แพทย์")) {
    return <Stethoscope size={32} strokeWidth={2.8} className="node-icon text-blue-700 shrink-0" />;
  }
  if (t.includes("วินิจฉัย") || t.includes("dx") || t.includes("ตรวจ") || t.includes("lab")) {
    return <TestTube size={32} strokeWidth={2.8} className="node-icon text-blue-700 shrink-0" />;
  }
  if (t.includes("รักษา") || t.includes("ดูแล") || t.includes("ทีม") || t.includes("สหสาขา") || t.includes("ต่อเนื่อง")) {
    return <Users size={32} strokeWidth={2.8} className="node-icon text-blue-700 shrink-0" />;
  }
  return <Layers size={32} strokeWidth={2.8} className="node-icon text-blue-700 shrink-0" />;
};

const getSecondaryIcon = (title) => {
  const t = (title || "").toLowerCase();
  if (t.includes("ความรู้") || t.includes("knowledge") || t.includes("เวลา")) {
    return <Clock size={34} strokeWidth={2.8} className="node-icon text-orange-600 shrink-0" />;
  }
  if (t.includes("คัดกรอง") || t.includes("screen")) {
    return <ClipboardList size={34} strokeWidth={2.8} className="node-icon text-orange-600 shrink-0" />;
  }
  if (t.includes("เตรียมยา") || t.includes("ละลายลิ่มเลือด") || t.includes("electrolyte") || t.includes("lab")) {
    return <FlaskConical size={34} strokeWidth={2.8} className="node-icon text-orange-600 shrink-0" />;
  }
  if (t.includes("refer") || t.includes("ส่งต่อ")) {
    return <Users size={34} strokeWidth={2.8} className="node-icon text-orange-600 shrink-0" />;
  }
  if (t.includes("รักษาเร็ว") || t.includes("acute") || t.includes("heart") || t.includes("รักษา")) {
    return <HeartPulse size={34} strokeWidth={2.8} className="node-icon text-orange-600 shrink-0" />;
  }
  if (t.includes("rehabilitation") || t.includes("ฟื้นฟู") || t.includes("กายภาพ")) {
    return <RefreshCw size={34} strokeWidth={2.8} className="node-icon text-orange-600 shrink-0" />;
  }
  return <GitBranch size={34} strokeWidth={2.8} className="node-icon text-orange-600 shrink-0" />;
};

export const getKpiDisplayLines = (text) => {
  const lines = String(text || "")
    .split("\n")
    .filter((line) => line.trim());

  return lines.map((line, index) => (index === 0 ? `KPI : ${line}` : line));
};

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

  React.useEffect(() => {
    const handleBeforePrint = () => {
      window._originalTitle = document.title;
      document.title = " ";
    };
    const handleAfterPrint = () => {
      if (window._originalTitle !== undefined) {
        document.title = window._originalTitle;
      }
    };

    window.addEventListener("beforeprint", handleBeforePrint);
    window.addEventListener("afterprint", handleAfterPrint);
    return () => {
      window.removeEventListener("beforeprint", handleBeforePrint);
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, []);

  // Estimate tree height — each secondary driver row = max(secondary card, sum of change cards)
  const getEstimatedTreeHeight = (diagramData) => {
    if (!diagramData || !diagramData.primaryDrivers || diagramData.primaryDrivers.length === 0) {
      return 100;
    }
    
    const charsPerLine = 20;
    const changeCharsPerLine = 29;
    const itemPadding = 20;
    const gapBetween = 22;
    
    const estimateCardHeight = (title, kpi, cpl = charsPerLine) => {
      const titleText = title || "";
      const titleLines = Math.max(1, Math.ceil(titleText.length / cpl));
      let kpiLines = 0;
      if (kpi) {
        String(kpi).split("\n").forEach((seg) => {
          kpiLines += Math.max(1, Math.ceil(seg.length / cpl));
        });
      }
      return Math.max(76, 30 + (titleLines * 17) + (kpiLines * 13));
    };

    let totalHeight = 0;
    diagramData.primaryDrivers.forEach((primary) => {
      const hasSecondary = primary.secondaryDrivers && primary.secondaryDrivers.length > 0;
      if (!hasSecondary) {
        totalHeight += estimateCardHeight(primary.title, primary.kpi) + itemPadding + gapBetween;
      } else {
        primary.secondaryDrivers.forEach((secondary) => {
          const secHeight = estimateCardHeight(secondary.title, secondary.kpi);
          
          let changeIdeasHeight = 0;
          if (secondary.changeIdeas && secondary.changeIdeas.length > 0) {
            secondary.changeIdeas.forEach((ch) => {
              changeIdeasHeight += estimateCardHeight(ch.title, ch.kpi, changeCharsPerLine) + 12; // gap
            });
            changeIdeasHeight = Math.max(0, changeIdeasHeight - 12);
          } else {
            changeIdeasHeight = estimateCardHeight("", "", changeCharsPerLine);
          }
          
          totalHeight += Math.max(secHeight, changeIdeasHeight) + itemPadding + gapBetween;
        });
      }
    });

    return Math.max(100, Math.round((totalHeight - gapBetween) * 0.9));
  };

  const estimatedHeight = getEstimatedTreeHeight(data);
  const treeNaturalWidth = 1440; // 260+52+300+52+330+42+404
  
  // A4 landscape usable dimensions
  const availableWidth = 1046; // 277mm usable width at 96 DPI
  const availableHeight = 520;
  
  // Calculate zoom to FILL the page — cap at 1.0 to keep height natural/compact while scaling down if height exceeds A4 bounds
  const zoomW = availableWidth / treeNaturalWidth;
  const zoomH = availableHeight / estimatedHeight;
  const zoomLevel = Math.min(zoomW, zoomH, 1.0);
  
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
  const formatText = (text, options = {}) => {
    if (!text) return null;
    const lines = options.prefixKpi ? getKpiDisplayLines(text) : String(text)
      .split("\n")
      .filter((line) => line.trim());

    return lines
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
              <Target size={24} strokeWidth={3} className="text-blue-700 shrink-0" />
              <span className="purpose-label">{headers.purpose}: </span>
              <span className="purpose-value">{data?.purpose?.title || "-"}</span>
            </div>
            {data?.purpose?.kpi && (
              <div className="purpose-item kpi-item">
                <BarChart3 size={24} strokeWidth={3} className="text-blue-700 shrink-0" />
                <span className="purpose-label">{headers.purposeKpi}: </span>
                <div className="purpose-value kpi-list">{formatText(data.purpose.kpi, { prefixKpi: true })}</div>
              </div>
            )}
          </div>
          <h2 className="print-doc-subtitle">{headers.diagramTitle}</h2>
        </div>

        {/* HTML-Native Tree Diagram */}
        <div className="print-diagram-section">
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
                <div className="node-goal-icon-wrapper">
                  <Target size={36} className="goal-icon text-pink-600" />
                </div>
                <div className="node-title">{formatText(data?.purpose?.title || "-")}</div>
                {data?.purpose?.kpi && (
                  <div className="node-kpi">
                    {formatText(data.purpose.kpi, { prefixKpi: true })}
                  </div>
                )}
              </div>

              {data?.primaryDrivers?.length > 0 && (
                <div className="tree-children">
                  {data.primaryDrivers.map((primary) => (
                    <div key={primary.id} className="tree-item lvl-1-item">
                      <div className="tree-group">
                        {/* Level 1: Primary Driver */}
                        <div className={`tree-node node-primary ${primary.secondaryDrivers?.length ? 'has-children' : ''}`}>
                          <div className="node-content-row">
                            {getPrimaryIcon(primary.title)}
                            <div className="node-title">{formatText(primary.title || "-")}</div>
                          </div>
                          {primary.kpi && (
                            <div className="node-kpi">
                              {formatText(primary.kpi, { prefixKpi: true })}
                            </div>
                          )}
                        </div>

                        {primary.secondaryDrivers?.length > 0 && (
                          <div className="tree-children">
                            {primary.secondaryDrivers.map((secondary) => (
                              <div key={secondary.id} className="tree-item lvl-2-item">
                                <div className="tree-group">
                                  {/* Level 2: Secondary Driver */}
                                  <div className={`tree-node node-secondary ${secondary.changeIdeas?.length ? 'has-children' : ''}`}>
                                    <div className="node-content-row">
                                      {getSecondaryIcon(secondary.title)}
                                      <div className="node-title">{formatText(secondary.title || "-")}</div>
                                    </div>
                                    {secondary.kpi && (
                                      <div className="node-kpi">
                                        {formatText(secondary.kpi, { prefixKpi: true })}
                                      </div>
                                    )}
                                  </div>

                                  {secondary.changeIdeas?.length > 0 && (
                                    <div className="tree-children">
                                      {secondary.changeIdeas.map((change) => (
                                        <div key={change.id} className="tree-item lvl-3-item">
                                          {/* Level 3: Change Idea */}
                                          <div className="tree-node node-change">
                                            <div className="change-bullet-content">
                                              <span className="bullet-char">•</span>
                                              <div className="node-title">{formatText(change.title || "-")}</div>
                                            </div>
                                            {change.kpi && (
                                              <div className="node-kpi">
                                                {formatText(change.kpi, { prefixKpi: true })}
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
                          <div className="kpi-lines">{formatText(row.primary.kpi, { prefixKpi: true })}</div>
                        </div>
                      )}
                    </td>
                  )}
                  {row.secondary && (
                    <td rowSpan={row.secondary.span} className="td-secondary">
                      <div className="cell-title">{row.secondary.title || "-"}</div>
                      {row.secondary.kpi && (
                        <div className="cell-kpi">
                          <div className="kpi-lines">{formatText(row.secondary.kpi, { prefixKpi: true })}</div>
                        </div>
                      )}
                    </td>
                  )}
                  <td className="td-change">
                    <div className="cell-title">{row.change.title || "-"}</div>
                    {row.change.kpi && (
                      <div className="cell-kpi">
                        <div className="kpi-lines">{formatText(row.change.kpi, { prefixKpi: true })}</div>
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
