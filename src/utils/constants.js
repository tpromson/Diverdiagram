const uid = () => Math.random().toString(36).slice(2, 9);

export const SHARE_LINK_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
export const MAX_VERSION_HISTORY = 50;
export const MAX_AUTOSAVE_VERSIONS = 10;
export const PREVIEW_ZOOM_MIN = 0.5;
export const PREVIEW_ZOOM_MAX = 2;
export const PREVIEW_ZOOM_STEP = 0.25;

export const GALLERY_DISPLAY_NAME_STORAGE_KEY = "driver-diagram-gallery-display-name";
export const WORKSPACE_INTRO_COLLAPSED_STORAGE_KEY = "driver-diagram-workspace-intro-collapsed";
export const PREVIEW_VIEW_STORAGE_KEY = "driver-diagram-preview-view";
export const PREVIEW_ZOOM_STORAGE_KEY = "driver-diagram-preview-zoom";

export const defaultData = {
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
