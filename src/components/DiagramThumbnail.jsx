import React, { useMemo } from "react";

export const THEME_EMOJI = {
  healthcare: "🏥",
  hospital: "🏥",
  patient: "🩺",
  clinic: "🏥",
  doctor: "👨‍⚕️",
  nurse: "👩‍⚕️",
  staff: "👥",
  opd: "⏱️",
  waiting: "⏳",
  appointment: "📅",
  kpi: "📊",
  business: "💼",
  process: "⚙️",
  improve: "📈",
  quality: "✅",
  safety: "🛡️",
  emergency: "🚑",
  surgery: "🏥",
  pharmacy: "💊",
  lab: "🔬",
  default: "🎯",
};

export function getThemeEmoji(title = "", purposeTitle = "") {
  const text = `${title} ${purposeTitle}`.toLowerCase();
  
  const themeMap = {
    healthcare: ["healthcare", "สุขภาพ", "โรงพยาบาล", "คลินิก"],
    hospital: ["hospital", "โรงพยาบาล"],
    patient: ["patient", "ผู้ป่วย", "คนไข้"],
    clinic: ["clinic", "คลินิก"],
    doctor: ["doctor", "หมอ", "แพทย์"],
    nurse: ["nurse", "พยาบาล"],
    staff: ["staff", "บุคลากร", "เจ้าหน้าที่"],
    opd: ["opd", "ผู้ป่วยนอก", "outpatient"],
    waiting: ["waiting", "รอ", "เวลารอ", "wait time"],
    appointment: ["appointment", "นัด", "จอง"],
    kpi: ["kpi", "ตัวชี้วัด", "วัดผล"],
    business: ["business", "ธุรกิจ", "company"],
    process: ["process", "กระบวนการ", "process"],
    improve: ["improve", "ปรับปรุง", "พัฒนา"],
    quality: ["quality", "คุณภาพ", "qc"],
    safety: ["safety", "ความปลอดภัย", "safety"],
    emergency: ["emergency", "ฉุกเฉิน", "ห้องฉุกเฉิน"],
    surgery: ["surgery", "ผ่าตัด", "operation"],
    pharmacy: ["pharmacy", "ยา", "เวชภัณฑ์"],
    lab: ["lab", "laboratory", "แล็บ", "ตรวจ"],
  };

  for (const [theme, keywords] of Object.entries(themeMap)) {
    if (keywords.some((kw) => text.includes(kw))) {
      return THEME_EMOJI[theme] || THEME_EMOJI.default;
    }
  }
  return THEME_EMOJI.default;
}

export function DiagramThumbnail({ title, thumbnailSvg = "", diagramData, mermaidCode, purposeTitle, className = "" }) {
  const diagramPurposeTitle = diagramData?.purpose?.title || "";
  const displayPurposeTitle = purposeTitle || diagramPurposeTitle;
  const emoji = useMemo(() => getThemeEmoji(title, displayPurposeTitle), [title, displayPurposeTitle]);
  const defaultDocumentTitle = "Driver Diagram ใหม่";
  const displayTitle = title || displayPurposeTitle || defaultDocumentTitle;
  
  const randomImage = useMemo(() => {
    const seed = Math.random().toString(36).substring(7);
    return `https://picsum.photos/seed/${seed}/400/200`;
  }, []);

  return (
    <div className={`diagram-thumbnail ${className}`}>
      <div className="diagram-thumbnail-fallback relative flex flex-row items-center gap-3 p-4 overflow-hidden">
        <img
          src={randomImage}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-20"
          loading="lazy"
        />
        <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/90 text-2xl shadow-sm">
          {emoji}
        </div>
        <div className="relative z-10 min-w-0 flex-1">
          <div className="truncate text-base font-semibold text-slate-900 leading-tight">
            {displayTitle}
          </div>
          {displayPurposeTitle && displayPurposeTitle !== title && (
            <div className="mt-1 truncate text-xs text-slate-600 leading-tight">
              {displayPurposeTitle}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
