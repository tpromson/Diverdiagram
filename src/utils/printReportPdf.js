export const PRINT_REPORT_PDF_EXPORT_CLASS = "pdf-export-mode";

export const getPrintReportPdfPageSelectors = () => ({
  report: ".print-report",
  pages: ".print-page",
});

export const getPrintReportPdfPages = (rootDocument = document) => {
  const { report, pages } = getPrintReportPdfPageSelectors();
  const reportElement = rootDocument.querySelector(report);
  if (!reportElement) return [];
  return Array.from(reportElement.querySelectorAll(pages));
};

export const createPrintReportPdfStyleElement = (rootDocument = document) => {
  const styleElement = rootDocument.createElement("style");
  const printRules = [];

  Array.from(rootDocument.styleSheets).forEach((sheet) => {
    let rules = [];
    try {
      rules = Array.from(sheet.cssRules || []);
    } catch (_error) {
      return;
    }

    rules.forEach((rule) => {
      if (rule.conditionText && rule.conditionText.includes("print") && rule.cssRules) {
        printRules.push(...Array.from(rule.cssRules).map((nestedRule) => nestedRule.cssText));
      }
    });
  });

  styleElement.textContent = `
    ${printRules.join("\n")}
    body.${PRINT_REPORT_PDF_EXPORT_CLASS} {
      background: #ffffff !important;
    }
    body.${PRINT_REPORT_PDF_EXPORT_CLASS} .print-report {
      display: block !important;
      width: 1540px !important;
      background: #ffffff !important;
    }
    body.${PRINT_REPORT_PDF_EXPORT_CLASS} .print-page {
      width: 1540px !important;
      background: #ffffff !important;
      padding: 40px 50px !important;
      box-sizing: border-box !important;
    }
    body.${PRINT_REPORT_PDF_EXPORT_CLASS} .print-tree-wrapper {
      zoom: 1 !important;
    }
    body.${PRINT_REPORT_PDF_EXPORT_CLASS} .print-report svg {
      color: #1565c0 !important;
      stroke: currentColor !important;
    }
    body.${PRINT_REPORT_PDF_EXPORT_CLASS} .print-purpose-card svg {
      color: #0f5ed7 !important;
    }
    body.${PRINT_REPORT_PDF_EXPORT_CLASS} .node-purpose svg,
    body.${PRINT_REPORT_PDF_EXPORT_CLASS} .goal-icon {
      color: #d11a5b !important;
    }
    body.${PRINT_REPORT_PDF_EXPORT_CLASS} .node-primary .node-icon {
      color: #1565c0 !important;
    }
    body.${PRINT_REPORT_PDF_EXPORT_CLASS} .node-secondary .node-icon {
      color: #ed6c02 !important;
    }
  `;

  return styleElement;
};
