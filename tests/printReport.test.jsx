import { describe, expect, test } from "vitest";
import { getKpiDisplayLines, getPrintReportPdfPageSelectors } from "../src/components/PrintReport.jsx";

describe("PrintReport", () => {
  test("prefixes the first KPI content line with KPI label", () => {
    expect(getKpiDisplayLines("Door to EKG < 10 นาที\nDoor to drug < 30 นาที")).toEqual([
      "KPI : Door to EKG < 10 นาที",
      "Door to drug < 30 นาที",
    ]);
  });

  test("uses print report pages as the PDF export source", () => {
    expect(getPrintReportPdfPageSelectors()).toEqual({
      report: ".print-report",
      pages: ".print-page",
    });
  });
});
