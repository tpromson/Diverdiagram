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
  const [view, setView] = useState("preview");
  const [svg, setSvg] = useState("");
  const [renderError, setRenderError] = useState("");
  const renderId = useRef(0);
  const mermaidRef = useRef(null);
  const mermaidInitialized = useRef(false);

  const mermaidCode = useMemo(() => {
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
  }, [data]);

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

        const result = await mermaidRef.current.render(`driver-diagram-${id}`, mermaidCode);
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
  }, [mermaidCode]);

  const updatePurpose = (field, value) => {
    setData((d) => ({ ...d, purpose: { ...d.purpose, [field]: value } }));
  };

  const addPrimary = () => {
    setData((d) => ({
      ...d,
      primaryDrivers: [
        ...d.primaryDrivers,
        { id: uid(), title: "Primary Driver ใหม่", kpi: "ระบุ KPI", secondaryDrivers: [] },
      ],
    }));
  };

  const updatePrimary = (pi, field, value) => {
    setData((d) => ({
      ...d,
      primaryDrivers: d.primaryDrivers.map((p, i) => (i === pi ? { ...p, [field]: value } : p)),
    }));
  };

  const removePrimary = (pi) => {
    setData((d) => ({ ...d, primaryDrivers: d.primaryDrivers.filter((_, i) => i !== pi) }));
  };

  const addSecondary = (pi) => {
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
    await navigator.clipboard.writeText("```mermaid\n" + mermaidCode + "\n```");
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const downloadMermaid = () => {
    const blob = new Blob([mermaidCode], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "driver-diagram.mmd";
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadSvg = () => {
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "driver-diagram.svg";
    a.click();
    URL.revokeObjectURL(url);
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
            </div>
          </div>
        </header>

        <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="h-[82vh] space-y-4 overflow-auto rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
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

          <section className="h-[82vh] rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
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
              <div className="h-[73vh] overflow-auto rounded-3xl border border-slate-200 bg-white p-4">
                {renderError ? (
                  <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{renderError}</div>
                ) : (
                  <div className="min-w-max" dangerouslySetInnerHTML={{ __html: svg }} />
                )}
              </div>
            ) : (
              <pre className="h-[73vh] overflow-auto rounded-3xl bg-slate-950 p-4 text-xs leading-relaxed text-slate-100">
                {mermaidCode}
              </pre>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default App;
