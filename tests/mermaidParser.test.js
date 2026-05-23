import { describe, it, expect } from "vitest";
import {
  buildMermaidCode,
  decodeMermaidText,
  normalizeNodeLabel,
  normalizeHeading,
  inferNodeType,
  escapeLooseXmlChars,
  sanitizeMermaidCode,
  parseNodeDefinitions,
  parseSubgraphMembership,
  parseEdges,
  findAssociatedKpis,
  parseMermaidCode,
  safeText,
  formatNodeLabel,
  escapeSvgText,
  wrapSvgText,
} from "~/utils/mermaidParser.js";

const minimalData = {
  purpose: { title: "ลดเวลารอ", kpi: "≤ 30 นาที" },
  primaryDrivers: [],
};

const onePrimaryData = {
  purpose: { title: "ลดเวลารอ", kpi: "≤ 30 นาที" },
  primaryDrivers: [
    {
      id: "pd1",
      title: "ปรับปรุงการนัดหมาย",
      kpi: "no-show < 10%",
      secondaryDrivers: [],
    },
  ],
};

const fullData = {
  purpose: { title: "ลดเวลารอ", kpi: "≤ 30 นาที" },
  primaryDrivers: [
    {
      id: "pd1",
      title: "ปรับปรุงการนัดหมาย",
      kpi: "no-show < 10%",
      secondaryDrivers: [
        {
          id: "sd1",
          title: "ระบบจองออนไลน์",
          kpi: "จองออนไลน์ ≥ 70%",
          changeIdeas: [
            { id: "ci1", title: "UX ดีขึ้น", kpi: "ใช้งานสำเร็จ ≥ 90%" },
          ],
        },
      ],
    },
  ],
};

// ─── buildMermaidCode ─────────────────────────────────────────────────────────

describe("buildMermaidCode", () => {
  it("starts with flowchart declaration", () => {
    const code = buildMermaidCode(minimalData);
    expect(code).toMatch(/^flowchart RL/);
  });

  it("contains Purpose node with title", () => {
    const code = buildMermaidCode(minimalData);
    expect(code).toMatch(/Purpose\["`Purpose\nลดเวลารอ`"\]/);
  });

  it("contains Purpose KPI node", () => {
    const code = buildMermaidCode(minimalData);
    expect(code).toMatch(/PKPI\["`Outcome KPI\n≤ 30 นาที`"\]/);
  });

  it("escapes XML characters in node labels", () => {
    const data = {
      purpose: { title: "A < B & C", kpi: "x > y" },
      primaryDrivers: [],
    };
    const code = buildMermaidCode(data);
    expect(code).not.toMatch(/< B/);
    expect(code).toMatch(/&lt;/);
  });

  it("adds primary driver with correct connections", () => {
    const code = buildMermaidCode(onePrimaryData);
    expect(code).toMatch(/PD1 --> Purpose/);
    expect(code).toMatch(/subgraph PD1G/);
    expect(code).toMatch(/PD1\["`Primary Driver 1\nปรับปรุงการนัดหมาย`"\]/);
  });

  it("adds secondary driver connected to primary", () => {
    const data = {
      purpose: { title: "Test", kpi: "" },
      primaryDrivers: [
        {
          id: "x",
          title: "Primary",
          kpi: "",
          secondaryDrivers: [
            { id: "y", title: "Secondary", kpi: "", changeIdeas: [] },
          ],
        },
      ],
    };
    const code = buildMermaidCode(data);
    expect(code).toMatch(/S1_1 --> PD1/);
    expect(code).toMatch(/S1_1\["`Secondary Driver\nSecondary`"\]/);
  });

  it("adds change idea connected to secondary", () => {
    const code = buildMermaidCode(fullData);
    expect(code).toMatch(/C1_1_1 --> S1_1/);
    expect(code).toMatch(/C1_1_1\["`Change Idea\nUX ดีขึ้น`"\]/);
  });

  it("applies correct CSS classes", () => {
    const code = buildMermaidCode(onePrimaryData);
    expect(code).toMatch(/classDef purpose/);
    expect(code).toMatch(/classDef primary/);
    expect(code).toMatch(/classDef kpi/);
    expect(code).toMatch(/class Purpose purpose/);
    expect(code).toMatch(/class PD1 primary/);
  });

  it("handles empty primary drivers gracefully", () => {
    const code = buildMermaidCode(minimalData);
    expect(code).toMatch(/^flowchart RL/);
    expect(code.split("\n").length).toBeGreaterThan(5);
  });

  it("handles node with empty title", () => {
    const data = {
      purpose: { title: "", kpi: "" },
      primaryDrivers: [{ id: "x", title: "", kpi: "", secondaryDrivers: [] }],
    };
    const code = buildMermaidCode(data);
    expect(code).toMatch(/^flowchart RL/);
  });
});

// ─── parseMermaidCode (round-trip tests) ────────────────────────────────────

describe("parseMermaidCode", () => {
  it("parses a minimal flowchart and extracts purpose", () => {
    const code = `flowchart RL

    subgraph P0[" "]
        direction TB
        Purpose["\`Purpose\nTest Goal\`"]
        PKPI["\`Outcome KPI\nTest KPI\`"]
    end

    PD1 --> Purpose
    subgraph PD1G[" "]
        direction TB
        PD1["\`Primary Driver 1\nPrimary\`"]
        PDKPI1["\`KPI\n\`"]
    end

    classDef purpose fill:#FCE4EC,stroke:#D81B60,color:#880E4F;
    classDef kpi fill:#E8F5E9,stroke:#43A047,color:#1B5E20;
    classDef primary fill:#E3F2FD,stroke:#1565C0,color:#0D47A1;
    class Purpose purpose;
    class PKPI kpi;
    class PD1 primary;
    class PDKPI1 kpi;`;
    const result = parseMermaidCode(code);
    expect(result.purpose.title).toBe("Test Goal");
    expect(result.purpose.kpi).toBe("Test KPI");
  });

  it("throws if code does not start with flowchart", () => {
    expect(() => parseMermaidCode("graph TD\na-->b")).toThrow(
      "Mermaid code must start with a flowchart declaration."
    );
  });

  it("throws if no nodes are found", () => {
    expect(() => parseMermaidCode("flowchart RL")).toThrow("No Mermaid nodes were found.");
  });

  it("throws if no Purpose node exists", () => {
    const code = `flowchart RL
    subgraph X[" "]
        direction TB
        PD1["\`Primary Driver 1\nx\`"]
    end
    classDef primary fill:#E3F2FD,stroke:#1565C0,color:#0D47A1;
    class PD1 primary;`;
    expect(() => parseMermaidCode(code)).toThrow("A Purpose/Goal node is required.");
  });

  it("throws if no primary driver connected to purpose", () => {
    const code = `flowchart RL
    subgraph P0[" "]
        direction TB
        Purpose["\`Purpose\ngoal\`"]
        PKPI["\`Outcome KPI\n\`"]
    end
    classDef purpose fill:#FCE4EC,stroke:#D81B60,color:#880E4F;
    classDef kpi fill:#E8F5E9,stroke:#43A047,color:#1B5E20;
    class Purpose purpose;
    class PKPI kpi;`;
    expect(() => parseMermaidCode(code)).toThrow(
      "At least one Primary Driver connected from the Purpose node is required."
    );
  });

  it("roundtrips purpose through build and parse", () => {
    const original = {
      purpose: { title: "Test Goal", kpi: "KPI = 100" },
      primaryDrivers: [{ id: "x", title: "Primary", kpi: "", secondaryDrivers: [] }],
    };
    const code = buildMermaidCode(original);
    const parsed = parseMermaidCode(code);
    expect(parsed.purpose.title).toBe("Test Goal");
    expect(parsed.purpose.kpi).toBe("KPI = 100");
  });

  it("roundtrips purpose with Thai text", () => {
    const original = {
      purpose: { title: "ลดเวลารอผู้ป่วย", kpi: "≤ 30 นาที" },
      primaryDrivers: [{ id: "x", title: "Primary", kpi: "", secondaryDrivers: [] }],
    };
    const code = buildMermaidCode(original);
    const parsed = parseMermaidCode(code);
    expect(parsed.purpose.title).toBe("ลดเวลารอผู้ป่วย");
  });

  it("roundtrips single primary driver with KPI", () => {
    const code = buildMermaidCode(onePrimaryData);
    const parsed = parseMermaidCode(code);
    expect(parsed.primaryDrivers).toHaveLength(1);
    expect(parsed.primaryDrivers[0].title).toBe("ปรับปรุงการนัดหมาย");
    expect(parsed.primaryDrivers[0].kpi).toBe("no-show < 10%");
  });

  it("roundtrips full hierarchy (purpose → primary → secondary → change)", () => {
    const code = buildMermaidCode(fullData);
    const parsed = parseMermaidCode(code);
    expect(parsed.primaryDrivers).toHaveLength(1);
    expect(parsed.primaryDrivers[0].secondaryDrivers).toHaveLength(1);
    expect(parsed.primaryDrivers[0].secondaryDrivers[0].changeIdeas).toHaveLength(1);
    expect(parsed.primaryDrivers[0].secondaryDrivers[0].changeIdeas[0].title).toBe("UX ดีขึ้น");
  });

  it("assigns UUID-like ids to parsed drivers", () => {
    const code = buildMermaidCode(onePrimaryData);
    const parsed = parseMermaidCode(code);
    expect(parsed.primaryDrivers[0].id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
  });

  it("parses multiline KPI value", () => {
    const data = {
      purpose: { title: "Goal", kpi: "Line 1\nLine 2\nLine 3" },
      primaryDrivers: [{ id: "x", title: "Primary", kpi: "", secondaryDrivers: [] }],
    };
    const code = buildMermaidCode(data);
    const parsed = parseMermaidCode(code);
    expect(parsed.purpose.kpi).toBe("Line 1\nLine 2\nLine 3");
  });
});

// ─── sanitizeMermaidCode ────────────────────────────────────────────────────

describe("sanitizeMermaidCode", () => {
  it("escapes < and > inside node labels", () => {
    const code = `flowchart RL
    subgraph P0[" "]
        direction TB
        Purpose["\`Purpose\na < b & c\`"]
    end`;
    const result = sanitizeMermaidCode(code);
    expect(result).toMatch(/&lt;/);
    expect(result).toMatch(/&amp;/);
    expect(result).not.toMatch(/a < b/);
  });

  it("normalizes <br/> tags to <br/>", () => {
    const code = `flowchart RL
    Purpose["\`Purpose\nline1<br>line2\`"]`;
    const result = sanitizeMermaidCode(code);
    expect(result).toContain("line1&lt;br/>line2");
    expect(result).not.toMatch(/<br>/);
  });

  it("preserves non-escaped content", () => {
    const code = `flowchart RL\n    Purpose["\`Purpose\nHello\`"]`;
    const result = sanitizeMermaidCode(code);
    expect(result).toMatch(/Hello/);
  });

  it("handles empty string", () => {
    expect(sanitizeMermaidCode("")).toBe("");
  });

  it("handles string with no special chars", () => {
    const code = `flowchart RL\n    Purpose["\`Purpose\ntest\`"]`;
    expect(sanitizeMermaidCode(code)).toBe(code);
  });
});

// ─── safeText / formatNodeLabel ─────────────────────────────────────────────

describe("safeText", () => {
  it("escapes ampersand", () => {
    expect(safeText("A & B")).toBe("A &amp; B");
  });

  it("escapes angle brackets", () => {
    expect(safeText("<tag>")).toBe("&lt;tag&gt;");
  });

  it("removes backticks and quotes", () => {
    expect(safeText('`code` "quote"')).toBe("'code' 'quote'");
  });

  it("removes square brackets", () => {
    expect(safeText("a[b]c")).toBe("abc");
  });

  it("escapes backslash", () => {
    expect(safeText("\\backslash\\")).toBe("\\\\backslash\\\\");
  });
});

describe("formatNodeLabel", () => {
  it("wraps heading and value in mermaid label syntax", () => {
    const result = formatNodeLabel("Purpose", "Reduce wait time");
    expect(result).toBe('"`Purpose\nReduce wait time`"');
  });

  it("escapes special characters in value", () => {
    const result = formatNodeLabel("KPI", "A < B & C");
    expect(result).toBe('"`KPI\nA &lt; B &amp; C`"');
  });

  it("handles empty value", () => {
    const result = formatNodeLabel("Title", "");
    expect(result).toBe('"`Title\n`"');
  });
});

// ─── escapeSvgText ──────────────────────────────────────────────────────────

describe("escapeSvgText", () => {
  it("escapes & to &amp;", () => {
    expect(escapeSvgText("A & B")).toBe("A &amp; B");
  });

  it("escapes < to &lt;", () => {
    expect(escapeSvgText("<element>")).toBe("&lt;element&gt;");
  });

  it("escapes > to &gt;", () => {
    expect(escapeSvgText("a > b")).toBe("a &gt; b");
  });

  it("escapes double quote", () => {
    expect(escapeSvgText('say "hello"')).toBe("say &quot;hello&quot;");
  });

  it("escapes single quote", () => {
    expect(escapeSvgText("it's")).toBe("it&apos;s");
  });
});

// ─── wrapSvgText ────────────────────────────────────────────────────────────

describe("wrapSvgText", () => {
  it("returns single line when under maxChars", () => {
    const result = wrapSvgText("short text", 28);
    expect(result).toEqual(["short text"]);
  });

  it("wraps at space boundary when exceeding maxChars", () => {
    const result = wrapSvgText("this is a longer piece of text", 10);
    expect(result.length).toBeGreaterThan(1);
    result.forEach((line) => expect(line.length).toBeLessThanOrEqual(10));
  });

  it("handles Thai text without spaces (Intl.Segmenter fallback)", () => {
    const thai = "ก".repeat(30);
    const result = wrapSvgText(thai, 10);
    expect(result.some((l) => l.length <= 10)).toBe(true);
  });

  it("splits on newlines", () => {
    const result = wrapSvgText("line1\nline2\nline3", 30);
    expect(result).toHaveLength(3);
  });

  it("handles empty string", () => {
    expect(wrapSvgText("", 28, 3)).toEqual([""]);
  });

  it("returns trimmed paragraph as single line when exact max", () => {
    const result = wrapSvgText("exactly28characterstext!!", 28);
    expect(result).toEqual(["exactly28characterstext!!"]);
  });

  it("keeps Thai text 'ผ่านเกณฑ์' and '> 80%' on the same line when maxChars is 34", () => {
    const text = "KPI: ร้อยละของผู้ป่วยที่มีความรู้เรื่องเบาหวานผ่านเกณฑ์ > 80%";
    const result = wrapSvgText(text, 34);
    const matchLine = result.find(line => line.includes("ผ่านเกณฑ์"));
    expect(matchLine).toBeDefined();
    expect(matchLine).toContain("> 80%");
  });
});

// ─── normalizeNodeLabel ────────────────────────────────────────────────────

describe("normalizeNodeLabel", () => {
  it("strips backtick delimiters", () => {
    expect(normalizeNodeLabel("`Purpose\ntext`")).toBe("Purpose\ntext");
  });

  it("converts <br/> to newline", () => {
    expect(normalizeNodeLabel("`Title\nline1<br/>line2`")).toBe("Title\nline1\nline2");
  });

  it("converts &lt; to <", () => {
    expect(normalizeNodeLabel("`Title\nA &lt; B`")).toBe("Title\nA < B");
  });

  it("converts &gt; to >", () => {
    expect(normalizeNodeLabel("`Title\nA &gt; B`")).toBe("Title\nA > B");
  });

  it("converts &amp; to &", () => {
    expect(normalizeNodeLabel("`Title\nA &amp; B`")).toBe("Title\nA & B");
  });

  it("trims whitespace", () => {
    expect(normalizeNodeLabel("  `Title\ntext`  ")).toBe("`Title\ntext`");
  });
});

// ─── normalizeHeading ────────────────────────────────────────────────────────

describe("normalizeHeading", () => {
  it("removes leading non-letter characters", () => {
    expect(normalizeHeading("**BOLD** Title")).toBe("bold** title");
  });

  it("converts to lowercase", () => {
    expect(normalizeHeading("PRIMARY DRIVER")).toBe("primary driver");
  });

  it("trims whitespace", () => {
    expect(normalizeHeading("  Title  ")).toBe("title");
  });
});

// ─── inferNodeType ──────────────────────────────────────────────────────────

describe("inferNodeType", () => {
  it('returns "primary" for "Primary Driver"', () => {
    expect(inferNodeType("Primary Driver 1", "")).toBe("primary");
  });

  it('returns "secondary" for "Secondary Driver"', () => {
    expect(inferNodeType("Secondary Driver", "")).toBe("secondary");
  });

  it('returns "change" for "Change Idea"', () => {
    expect(inferNodeType("Change Idea", "")).toBe("change");
  });

  it('returns "purpose" for "Purpose"', () => {
    expect(inferNodeType("Purpose", "")).toBe("purpose");
  });

  it('returns "kpi" for "Outcome KPI"', () => {
    expect(inferNodeType("Outcome KPI", "")).toBe("kpi");
  });

  it('returns "purpose" for Thai เป้าหมาย', () => {
    expect(inferNodeType("", "เป้าหมาย: ลดเวลารอ")).toBe("purpose");
  });

  it('returns "kpi" when heading starts with KPI', () => {
    expect(inferNodeType("KPI metric", "")).toBe("kpi");
  });

  it('returns "unknown" for unrecognized heading', () => {
    expect(inferNodeType("Something Random", "")).toBe("unknown");
  });
});

// ─── decodeMermaidText ─────────────────────────────────────────────────────

describe("decodeMermaidText", () => {
  it("converts &lt; to <", () => {
    expect(decodeMermaidText("a &lt; b")).toBe("a < b");
  });

  it("converts &gt; to >", () => {
    expect(decodeMermaidText("a &gt; b")).toBe("a > b");
  });

  it("converts &amp; to &", () => {
    expect(decodeMermaidText("a &amp; b")).toBe("a & b");
  });

  it("handles combined entities", () => {
    expect(decodeMermaidText("A &lt; B &amp; C &gt; D")).toBe("A < B & C > D");
  });
});

// ─── escapeLooseXmlChars ───────────────────────────────────────────────────

describe("escapeLooseXmlChars", () => {
  it("escapes standalone ampersand", () => {
    expect(escapeLooseXmlChars("a & b")).toBe("a &amp; b");
  });

  it("does not escape existing HTML entities", () => {
    expect(escapeLooseXmlChars("a &lt; b")).toBe("a &lt; b");
  });

  it("escapes < and >", () => {
    expect(escapeLooseXmlChars("<tag>")).toBe("&lt;tag>");
  });
});

// ─── parseNodeDefinitions ───────────────────────────────────────────────────

describe("parseNodeDefinitions", () => {
  it("extracts node id and label", () => {
    const code = `Purpose["\`Purpose\nGoal\`"]`;
    const nodes = parseNodeDefinitions(code);
    expect(nodes.has("Purpose")).toBe(true);
    expect(nodes.get("Purpose").heading).toBe("Purpose");
    expect(nodes.get("Purpose").value).toBe("Goal");
  });

  it("infers node type from heading", () => {
    const code = `PD1["\`Primary Driver 1\nDriver title\`"]`;
    const nodes = parseNodeDefinitions(code);
    expect(nodes.get("PD1").type).toBe("primary");
  });

  it("returns empty map for empty code", () => {
    expect(parseNodeDefinitions("")).toEqual(new Map());
  });
});

// ─── parseSubgraphMembership ────────────────────────────────────────────────

describe("parseSubgraphMembership", () => {
  it("groups nodes within same subgraph", () => {
    const code = `subgraph PD1G[" "]
        PD1["\`Primary Driver 1\nx\`"]
        PDKPI1["\`KPI\ny\`"]
    end`;
    const groups = parseSubgraphMembership(code);
    expect(groups.has("PD1")).toBe(true);
    expect(groups.get("PD1")).toContain("PDKPI1");
  });

  it("returns empty map for code with no subgraphs", () => {
    expect(parseSubgraphMembership("PD1-->Purpose")).toEqual(new Map());
  });
});

// ─── parseEdges ─────────────────────────────────────────────────────────────

describe("parseEdges", () => {
  it("parses simple edge", () => {
    const edges = parseEdges("PD1 --> Purpose");
    expect(edges.get("PD1")).toContain("Purpose");
  });

  it("ignores class and classDef lines", () => {
    const code = "class PD1 primary;\nclassDef kpi fill:#E8F5E9;";
    expect(parseEdges(code)).toEqual(new Map());
  });

  it("ignores semicolon comments", () => {
    const edges = parseEdges("PD1 --> Purpose; class PD1 primary;");
    expect(edges.get("PD1")).toContain("Purpose");
  });
});

// ─── findAssociatedKpis ─────────────────────────────────────────────────────

describe("findAssociatedKpis", () => {
  it("associates KPI with purpose node via grouped nodes", () => {
    const nodeMap = new Map([
      ["Purpose", { id: "Purpose", heading: "Purpose", value: "Goal", type: "purpose" }],
      ["PKPI", { id: "PKPI", heading: "Outcome KPI", value: "KPI metric", type: "kpi" }],
    ]);
    const nodeGroups = new Map([
      ["Purpose", ["PKPI"]],
    ]);
    const kpis = findAssociatedKpis(nodeMap, nodeGroups);
    expect(kpis.get("Purpose")).toBe("KPI metric");
  });

  it("falls back to PDKPI pattern for primary nodes", () => {
    const nodeMap = new Map([
      ["PD1", { id: "PD1", heading: "Primary Driver 1", value: "Driver Title", type: "primary" }],
      ["PDKPI1", { id: "PDKPI1", heading: "KPI", value: "KPI val", type: "kpi" }],
    ]);
    const nodeGroups = new Map();
    const kpis = findAssociatedKpis(nodeMap, nodeGroups);
    expect(kpis.get("PD1")).toBe("KPI val");
  });
});
