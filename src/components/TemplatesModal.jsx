import React, { useState, useEffect, useRef } from "react";
import { 
  X, 
  BookOpen, 
  Sparkles, 
  Upload, 
  Check, 
  AlertTriangle, 
  ChevronRight, 
  ChevronDown,
  FileText,
  Image as ImageIcon
} from "lucide-react";
import { useUIStore } from "../store/useUIStore.js";
import { useDiagramStore } from "../store/useDiagramStore.js";
import { translations, defaultLanguage } from "../utils/translations.js";
import { templates, getTemplateWithIds } from "../utils/templatesData.js";
import { uid } from "../utils/helpers.js";
import { buildMermaidCode } from "../utils/mermaidParser.js";
import { parseDiagramWithAI } from "../utils/geminiImporter.js";

export function TemplatesModal() {
  const open = useUIStore((state) => state.templatesModalOpen);
  const onClose = useUIStore((state) => state.setTemplatesModalOpen);
  const language = useUIStore((state) => state.language);
  const t = translations[language] || translations[defaultLanguage];

  const [activeTab, setActiveTab] = useState("library"); // 'library' or 'ai'
  const [selectedTemplateId, setSelectedTemplateId] = useState(templates[0]?.id || "");
  const [uploadFile, setUploadFile] = useState(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  
  const fileInputRef = useRef(null);

  const [shouldRender, setShouldRender] = useState(open);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setShouldRender(true);
      const frameId = window.requestAnimationFrame(() => setIsVisible(true));
      return () => window.cancelAnimationFrame(frameId);
    }

    setIsVisible(false);
    const timeoutId = window.setTimeout(() => setShouldRender(false), 220);
    return () => window.clearTimeout(timeoutId);
  }, [open]);

  // Clean up preview URL when file changes
  useEffect(() => {
    return () => {
      if (filePreviewUrl) {
        URL.revokeObjectURL(filePreviewUrl);
      }
    };
  }, [filePreviewUrl]);

  if (!shouldRender) return null;

  const selectedTemplate = templates.find((temp) => temp.id === selectedTemplateId) || templates[0];

  const handleImportTemplate = () => {
    if (!selectedTemplate) return;
    
    const preparedData = getTemplateWithIds(selectedTemplate.data, uid);
    const docTitle = language === "th" ? selectedTemplate.titleTh : selectedTemplate.titleEn;
    
    useDiagramStore.getState().importTemplateDiagram(preparedData, docTitle, t.importSuccess);

    onClose(false);
  };

  // Drag and drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file) => {
    const validTypes = ["image/png", "image/jpeg", "image/jpg", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      setScanError(language === "th" ? "รองรับเฉพาะไฟล์ภาพ (PNG, JPG) หรือไฟล์ PDF เท่านั้น" : "Only image files (PNG, JPG) or PDF files are supported.");
      setUploadFile(null);
      return;
    }
    
    setScanError("");
    setUploadFile(file);
    
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setFilePreviewUrl(url);
    } else {
      setFilePreviewUrl(null); // No preview for PDF files
    }
  };

  const handleAIScan = async () => {
    if (!uploadFile) return;

    setIsScanning(true);
    setScanError("");

    try {
      const parsedData = await parseDiagramWithAI(uploadFile);
      const preparedData = getTemplateWithIds(parsedData, uid);
      
      const suggestedTitle = preparedData.purpose.title 
        ? `${preparedData.purpose.title.substring(0, 30)}${preparedData.purpose.title.length > 30 ? "..." : ""}`
        : (language === "th" ? "แผนภูมิที่แกะด้วย AI" : "AI Scanned Diagram");

      useDiagramStore.getState().importTemplateDiagram(preparedData, suggestedTitle, t.aiImportSuccess);

      onClose(false);
    } catch (error) {
      console.error(error);
      if (error.message === "API_KEY_MISSING") {
        setScanError(t.aiApiKeyMissing);
      } else {
        setScanError(t.aiImportFailed + error.message);
      }
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose(false);
        }
      }}
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 transition-all duration-200 ease-out sm:p-6 ${
        isVisible ? "bg-slate-950/55 opacity-100" : "bg-slate-950/0 opacity-0"
      }`}
    >
      <div
        className={`flex h-[85vh] w-full max-w-[80rem] flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl ring-1 ring-slate-200 transition-all duration-200 ease-out ${
          isVisible ? "translate-y-0 scale-100 opacity-100" : "translate-y-4 scale-[0.985] opacity-0"
        }`}
      >
        {/* Header */}
        <div className="flex flex-col gap-3 border-b border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-950 flex items-center gap-2">
              <span>{t.templates}</span>
            </h2>
            <p className="mt-1 text-sm text-slate-500">{t.templatesDescription}</p>
          </div>
          <button
            onClick={() => onClose(false)}
            className="self-end sm:self-center inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-sm cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-100 px-5 bg-slate-50/50">
          <button
            onClick={() => setActiveTab("library")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === "library"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <BookOpen size={16} />
            <span>{language === "th" ? "ตัวอย่างคุณภาพ (9 แบบ)" : "Clinical Examples (9 templates)"}</span>
          </button>
          <button
            onClick={() => setActiveTab("ai")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === "ai"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <Sparkles size={16} />
            <span>{language === "th" ? "สแกนด้วย AI" : "AI Scanner"}</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden flex min-h-0 bg-slate-50/20">
          {activeTab === "library" ? (
            <div className="flex-1 flex overflow-hidden min-h-0 divide-x divide-slate-100">
              {/* Left Column: Template List */}
              <div className="w-1/3 overflow-y-auto p-4 flex flex-col gap-2.5 bg-white">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">
                  {t.selectTemplate}
                </span>
                {templates.map((temp) => (
                  <button
                    key={temp.id}
                    onClick={() => setSelectedTemplateId(temp.id)}
                    className={`text-left p-3.5 rounded-2xl border transition-all flex flex-col gap-1 cursor-pointer ${
                      selectedTemplateId === temp.id
                        ? "border-blue-500 bg-blue-50/60 shadow-sm"
                        : "border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200"
                    }`}
                  >
                    <span className="font-bold text-sm text-slate-900 line-clamp-2">
                      {language === "th" ? temp.titleTh : temp.titleEn}
                    </span>
                    <span className="text-xs text-slate-500">
                      {language === "th" ? `เป้าหมาย: ${temp.data.purpose.title}` : `Purpose: ${temp.data.purpose.title}`}
                    </span>
                  </button>
                ))}
              </div>

              {/* Right Column: Template Tree Preview */}
              <div className="w-2/3 flex flex-col overflow-hidden p-5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  {t.previewTemplate}
                </span>

                {selectedTemplate && (
                  <div className="flex-1 flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                      {/* Purpose */}
                      <div className="p-3 bg-pink-50 border border-pink-100 rounded-xl">
                        <span className="text-[10px] font-bold text-pink-700 uppercase tracking-wider">{t.purpose}</span>
                        <h4 className="font-bold text-slate-900 text-sm mt-0.5">{selectedTemplate.data.purpose.title}</h4>
                        {selectedTemplate.data.purpose.kpi && (
                          <p className="text-xs text-slate-600 mt-1 italic">KPI: {selectedTemplate.data.purpose.kpi}</p>
                        )}
                      </div>

                      {/* Tree hierarchy */}
                      <div className="space-y-4 pl-2 border-l border-slate-200 ml-4">
                        {selectedTemplate.data.primaryDrivers.map((pd, pIndex) => (
                          <div key={pIndex} className="space-y-3">
                            {/* Primary Driver */}
                            <div className="p-2.5 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-2">
                              <span className="mt-0.5 shrink-0 bg-blue-500 text-white font-bold text-[10px] h-4 w-4 rounded-full flex items-center justify-center">
                                1
                              </span>
                              <div>
                                <span className="text-[9px] font-bold text-blue-700 uppercase tracking-wider">Primary Driver</span>
                                <h5 className="font-semibold text-slate-800 text-xs mt-0.5">{pd.title}</h5>
                              </div>
                            </div>

                            {/* Secondary Drivers */}
                            {pd.secondaryDrivers && pd.secondaryDrivers.length > 0 && (
                              <div className="pl-6 space-y-3 border-l border-slate-100 ml-2">
                                {pd.secondaryDrivers.map((sd, sIndex) => (
                                  <div key={sIndex} className="space-y-2">
                                    {/* Secondary Driver */}
                                    <div className="p-2 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-1.5">
                                      <span className="mt-0.5 shrink-0 bg-amber-500 text-white font-bold text-[9px] h-3.5 w-3.5 rounded-full flex items-center justify-center">
                                        2
                                      </span>
                                      <div>
                                        <span className="text-[9px] font-bold text-amber-800 uppercase tracking-wider">Secondary Driver</span>
                                        <h6 className="font-semibold text-slate-800 text-xs mt-0.5">{sd.title}</h6>
                                      </div>
                                    </div>

                                    {/* Change Ideas */}
                                    {sd.changeIdeas && sd.changeIdeas.length > 0 && (
                                      <div className="pl-5 space-y-1.5 border-l border-amber-100/60 ml-2">
                                        {sd.changeIdeas.map((ci, cIndex) => (
                                          <div key={cIndex} className="p-1.5 bg-orange-50/50 border border-orange-100/60 rounded-lg text-xs text-slate-700 flex items-start gap-1">
                                            <ChevronRight size={12} className="text-orange-500 shrink-0 mt-0.5" />
                                            <span>{ci.title}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Import Button */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                      <button
                        onClick={handleImportTemplate}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 text-sm font-bold shadow-md cursor-pointer transition"
                      >
                        <Check size={16} />
                        <span>{t.importTemplate}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* AI OCR Scan Tab */
            <div className="flex-1 flex flex-col p-6 overflow-y-auto">
              <div className="max-w-2xl mx-auto w-full space-y-5">
                
                {/* AI Setup Info Tip (Collapsible details element) */}
                <details className="group border border-slate-200 bg-white rounded-2xl p-4 shadow-sm ring-1 ring-slate-100/50 transition-all [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex items-center justify-between cursor-pointer focus:outline-none select-none">
                    <span className="flex items-center gap-2 text-xs font-bold text-slate-700">
                      <Sparkles className="text-blue-500" size={14} />
                      {language === "th" ? "คู่มือตั้งค่าระบบสำหรับผู้ดูแลระบบ (Admin Guide)" : "System Configuration Guide for Administrators"}
                    </span>
                    <span className="text-slate-400 group-open:rotate-180 transition-transform duration-200">
                      <ChevronDown size={14} />
                    </span>
                  </summary>
                  <div className="mt-3 border-t border-slate-100 pt-3 text-slate-600 leading-relaxed text-xs">
                    {language === "th" ? (
                      <>
                        ระบบสแกนนี้ประมวลผลผ่าน <strong>Supabase Edge Function</strong> เพื่อความปลอดภัยสูงสุด (ไม่เปิดเผยคีย์ API แก่เบราว์เซอร์)<br/>
                        สำหรับผู้ดูแลระบบ โปรดติดตั้งฟังก์ชันและคีย์ด้วยคำสั่ง:<br/>
                        <code className="block bg-slate-800 text-slate-100 p-2.5 rounded-xl font-mono my-2 text-[11px] select-all">
                          supabase functions deploy parse-driver-diagram<br/>
                          supabase secrets set GEMINI_API_KEY=your_gemini_api_key
                        </code>
                      </>
                    ) : (
                      <>
                        This scanning feature runs via a secure <strong>Supabase Edge Function</strong> (protecting your API key from public exposure).<br/>
                        Admins can deploy the function and set secrets using:<br/>
                        <code className="block bg-slate-800 text-slate-100 p-2.5 rounded-xl font-mono my-2 text-[11px] select-all">
                          supabase functions deploy parse-driver-diagram<br/>
                          supabase secrets set GEMINI_API_KEY=your_gemini_api_key
                        </code>
                      </>
                    )}
                  </div>
                </details>

                {/* Upload drag drop zone */}
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition text-center ${
                    dragActive
                      ? "border-blue-500 bg-blue-50/40"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/png, image/jpeg, image/jpg, application/pdf"
                    onChange={handleFileChange}
                  />
                  <div className="h-14 w-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner">
                    <Upload size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">
                      {uploadFile ? uploadFile.name : t.uploadDiagramFile}
                    </p>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs">
                      {t.uploadHint}
                    </p>
                  </div>
                </div>

                {/* File details and scan action */}
                {uploadFile && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600">
                          {uploadFile.type === "application/pdf" ? (
                            <FileText size={20} />
                          ) : (
                            <ImageIcon size={20} />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 line-clamp-1">{uploadFile.name}</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {(uploadFile.size / 1024 / 1024).toFixed(2)} MB • {uploadFile.type}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setUploadFile(null);
                          setFilePreviewUrl(null);
                          setScanError("");
                        }}
                        className="text-xs text-red-500 hover:underline font-semibold cursor-pointer"
                        disabled={isScanning}
                      >
                        {language === "th" ? "ลบไฟล์" : "Remove"}
                      </button>
                    </div>

                    {/* Image Preview */}
                    {filePreviewUrl && (
                      <div className="rounded-xl overflow-hidden border border-slate-100 bg-slate-50 max-h-48 flex justify-center items-center">
                        <img
                          src={filePreviewUrl}
                          alt="Diagram Preview"
                          className="object-contain max-h-48 w-full"
                        />
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        onClick={handleAIScan}
                        disabled={isScanning}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white px-6 py-2.5 text-sm font-bold shadow-md cursor-pointer transition disabled:cursor-not-allowed"
                      >
                        <Sparkles size={16} className={isScanning ? "animate-spin" : ""} />
                        <span>{isScanning ? t.aiImporting : t.aiImportBtn}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Error messages */}
                {scanError && (
                  <div className="bg-red-50 border border-red-200 text-red-950 p-4 rounded-2xl flex gap-3 text-sm">
                    <AlertTriangle className="shrink-0 text-red-600 mt-0.5" size={20} />
                    <div className="space-y-1">
                      <h4 className="font-bold">{language === "th" ? "เกิดข้อผิดพลาด" : "Scan Error"}</h4>
                      <p className="text-red-800 leading-relaxed font-mono text-xs whitespace-pre-line">{scanError}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
