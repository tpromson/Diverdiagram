import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Plus,
  Minus,
  Trash2,
  Copy,
  Download,
  Target,
  Layers,
  GitBranch,
  Lightbulb,
  BarChart3,
  Eye,
  Code2,
  Save,
  FolderOpen,
  RefreshCw,
  Database,
  FilePlus2,
  Mail,
  LogOut,
  Search,
  Pencil,
  Check,
  X,
  Star,
  Archive,
  ArchiveRestore,
  Link2,
  ExternalLink,
  History,
  RotateCcw,
  Maximize2,
  LayoutGrid,
  Upload,
  Flag,
  Shield,
  EyeOff,
  Undo2,
} from "lucide-react";
import { isSupabaseConfigured, supabase, supabasePublishableKey, supabaseUrl } from "./src/supabaseClient.js";

const uid = () => Math.random().toString(36).slice(2, 9);
const SHARE_LINK_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_VERSION_HISTORY = 50;
const MAX_AUTOSAVE_VERSIONS = 10;
const PREVIEW_ZOOM_MIN = 0.5;
const PREVIEW_ZOOM_MAX = 2;
const PREVIEW_ZOOM_STEP = 0.25;
const GALLERY_DISPLAY_NAME_STORAGE_KEY = "driver-diagram-gallery-display-name";

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

const defaultDocumentTitle = "Driver Diagram ใหม่";
const defaultLanguage = "th";
const translations = {
  th: {
    languageLabel: "ภาษา",
    languageTh: "TH",
    languageEn: "EN",
    sharedViewTitle: "Driver Diagram Shared View",
    loadingSharedDiagram: "กำลังโหลด shared diagram...",
    backToWorkspace: "กลับไป workspace",
    sharedReadOnlyDescription: "หน้า shared แบบอ่านอย่างเดียว สามารถ preview, ตรวจ Mermaid code, และ export diagram นี้ได้",
    copied: "Copied",
    copyMermaid: "Copy Mermaid",
    exporting: "กำลัง export...",
    readOnlySharedLink: "Read-only shared link",
    shared: "Shared",
    expires: "Expires",
    opened: "Opened",
    output: "output",
    sharedOutputDescription: "Preview shared diagram, สลับไปดู Mermaid code, หรือ zoom เพื่ออ่านรายละเอียดได้ชัดขึ้น",
    expand: "ขยาย",
    preview: "Preview",
    code: "Code",
    appEyebrow: "Driver Diagram Workspace",
    appTitle: "Driver Diagram MVP",
    appDescription: "สร้าง Driver Diagram พร้อม KPI ทุกระดับ, แก้ไข Mermaid ได้สองทาง, export เอกสาร, และบันทึกขึ้นฐานข้อมูลแบบแยกตามผู้ใช้ใน workspace เดียวกัน",
    document: "Document",
    workspace: "Workspace",
    session: "Session",
    primary: "primary",
    secondary: "secondary",
    changeIdeas: "change ideas",
    privateCloudSave: "Private Cloud Save",
    privateCloudSaveTitle: "Private Cloud Save",
    privateCloudSaveActive: "Diagrams, auto-save, version history, และ share links จะอยู่ใน private workspace นี้",
    privateCloudSaveInactive: "Sign in ด้วย email เพื่อ save, reopen, auto-save, และ share diagrams ใน private workspace ของคุณ",
    signedInAs: "Signed in as",
    signOut: "Sign out",
    signingOut: "กำลัง sign out...",
    sending: "กำลังส่ง...",
    emailSignInLink: "Email Sign-In Link",
    verifyingSignInLink: "กำลังตรวจ sign-in link...",
    checkingSession: "กำลังตรวจ session เดิม...",
    resendLink: "Resend Link",
    resendHint: "ใช้ปุ่มนี้ถ้า email แรกมาช้า",
    redirectHint: "เพิ่ม production และ local URLs ใน Supabase Auth redirect URLs เพื่อให้ magic link กลับมาหน้านี้ได้",
    previewAuthOnly: "Preview auth layout เท่านั้น การ save, autosave, และ private data actions ยังต้อง sign in จริง",
    privateCloudSaveSummaryActive: "Saved diagrams, version history, และ share links ใน workspace นี้เป็นของ account นี้เท่านั้น",
    privateCloudSaveSummaryInactive: "Sign in ด้วย email เพื่อ save, reopen, auto-save, และ share diagrams จาก workspace ของคุณ",
    supabaseConnected: "Supabase connected",
    supabaseEnvMissing: "Supabase env missing",
    privateWorkspaceActive: "Private workspace active",
    verifyingLink: "กำลังตรวจ sign-in link...",
    checkingSessionShort: "กำลังตรวจ session...",
    signInForCloudSave: "Sign in เพื่อ cloud save",
    autoSaving: "Auto-saving...",
    unsavedChanges: "Unsaved changes",
    allChangesSaved: "All changes saved",
    currentId: "Current ID",
    newUnsavedDocument: "New unsaved document",
    documentTitle: "Document Title",
    documentTitlePlaceholder: "ตั้งชื่อเอกสาร",
    documentTitleHint: "ชื่อนี้จะถูกใช้กับรายการ saved, share title, และชื่อไฟล์ export ด้วย",
    primaryActions: "Primary Actions",
    saving: "Saving...",
    saveDiagram: "Save Diagram",
    signInToSave: "Sign in to save",
    newDiagram: "New Diagram",
    exportAndCode: "Export & Code",
    copiedMermaid: "Copied Mermaid",
    exportMmd: "Export .mmd",
    exportSvg: "Export .svg",
    exportDocx: "Export .docx",
    exportHint: "Export จะใช้ document title ปัจจุบันเป็นชื่อไฟล์ และอ้างอิง state ล่าสุดของ form/code",
    openSharedView: "Open shared view",
    openGallery: "Open gallery",
    backToGallery: "Back to gallery",
    galleryTitle: "Community Gallery",
    galleryDescription: "รวมงานที่เจ้าของเลือกส่งมาแสดงร่วมกันในหน้าเดียว",
    galleryLoading: "กำลังโหลดงานใน gallery...",
    galleryEmpty: "ยังไม่มีงานที่ถูกส่งเข้า gallery",
    gallerySearchPlaceholder: "Search gallery by title or purpose",
    submitToGallery: "ส่งเข้า gallery",
    removeFromGallery: "เอาออกจาก gallery",
    inGallery: "In gallery",
    gallerySubmitted: "Submitted",
    galleryOpenReadOnly: "Open read-only view",
    galleryOwnerLabel: "By",
    galleryDisplayName: "Gallery display name",
    galleryDisplayNamePlaceholder: "ชื่อที่อยากให้แสดงใน gallery",
    galleryDisplayNameHint: "ใช้ชื่อนี้แทน email เวลาส่งงานเข้า gallery",
    galleryDisplayNameSaved: "อัปเดตชื่อที่ใช้แสดงใน gallery แล้ว",
    reportGallery: "Report",
    reporting: "กำลังส่ง...",
    reportGalleryPrompt: "บอกสั้น ๆ ว่าต้องการ report งานนี้เรื่องอะไร",
    reportGallerySuccess: "ส่ง report สำหรับงานนี้แล้ว",
    reportGalleryFailed: "ยังส่ง report ไม่สำเร็จ",
    openModeration: "Moderation",
    adminModerationTitle: "Gallery Moderation",
    adminModerationDescription: "จัดการรายงาน, ซ่อนงานจาก gallery, และคืนงานกลับขึ้นแสดงเมื่อพร้อม",
    adminQueueLoading: "กำลังโหลด moderation queue...",
    adminQueueEmpty: "ยังไม่มีงานที่ต้อง moderation ตอนนี้",
    adminAccessDenied: "บัญชีนี้ยังไม่มีสิทธิ์ moderation",
    reportCount: "Reports",
    hideFromGallery: "Hide from gallery",
    restoreToGallery: "Restore to gallery",
    resolveReports: "Resolve reports",
    hiddenFromGallery: "Hidden",
    moderationReasonPrompt: "ระบุเหตุผลสั้น ๆ สำหรับการซ่อนหรือปิดรายงานนี้",
    loadMore: "Load more",
    moderationUpdated: "อัปเดต moderation queue แล้ว",
    savedDiagrams: "Saved Diagrams",
    savedDiagramsDescription: "เปิดดู จัดการ และกลับมาทำงานต่อจากรายการใน workspace นี้",
    shown: "shown",
    refresh: "Refresh",
    searchPlaceholder: "Search by title or purpose",
    envMissingHelp: "ใส่ค่าใน .env.local ตามไฟล์ .env.example ก่อน ระบบถึงจะบันทึกและเปิดรายการจากฐานข้อมูลได้",
    signInFirstSaved: "Sign in ก่อน แล้ว panel นี้จะแสดงเฉพาะ diagrams ที่ account ของคุณ save ไว้",
    loadingSavedDiagrams: "กำลังโหลด saved diagrams...",
    untitledDiagram: "Untitled Diagram",
    archived: "Archived",
    shareExpired: "Share expired",
    updated: "Updated",
    lastOpened: "Last opened",
    notOpenedYet: "Not opened yet",
    sharedUntil: "Shared until",
    open: "Open",
    copyShareLink: "Copy share link",
    createShareLink: "Create 7-day share link",
    regenerateShareLink: "Regenerate 7-day share link",
    revokeShareLink: "Revoke share link",
    favorite: "Favorite",
    unfavorite: "Unfavorite",
    rename: "Rename",
    duplicate: "Duplicate",
    restore: "Restore",
    archive: "Archive",
    deletePermanently: "Delete permanently",
    save: "Save",
    cancel: "Cancel",
    noSearchResultsTitle: "ไม่พบรายการที่ตรงกับคำค้นหา",
    noSearchResultsBody: "ลองค้นด้วยชื่อที่สั้นลง หรือสลับ sort เพื่อหางานที่ต้องการ",
    noArchivedTitle: "ยังไม่มีรายการที่ archive ไว้",
    noSavedTitle: "ยังไม่มีรายการที่บันทึกไว้",
    noArchivedBody: "รายการที่ archive ไว้จะมาอยู่ตรงนี้ และกด restore กลับไปที่รายการหลักได้",
    noSavedBody: "เริ่มจากกด Save งานปัจจุบัน แล้วรายการจะโผล่มาใน workspace นี้ทันที",
    saveCurrentDiagram: "Save Current Diagram",
    versionHistory: "Version History",
    versionHistoryDescription: "ย้อนกลับไปยัง snapshot ล่าสุดของเอกสารที่กำลังเปิดอยู่ได้ โดยเก็บ autosave ล่าสุด 10 รายการ และรวมไม่เกิน 50 รายการต่อเอกสาร",
    versions: "versions",
    openSavedDiagram: "Open a saved diagram",
    signInForVersionHistory: "Sign in และ open saved diagram เพื่อดู version history",
    openSavedFirst: "Open saved diagram ก่อน งานที่ save ใหม่จะเริ่มเก็บ versions อัตโนมัติ",
    loadingVersionHistory: "กำลังโหลด version history...",
    saved: "Saved",
    restoring: "Restoring...",
    loadToEditor: "Load to editor",
    restoreAndSave: "Restore & Save",
    noVersions: "ยังไม่มี versions การ save หรือ auto-save ครั้งถัดไปจะสร้าง snapshot แรก",
    purposeOutcomeKpi: "purpose & outcome KPI",
    purposeDescription: "เริ่มจากเป้าหมายหลักและ KPI ระดับผลลัพธ์ เพื่อให้ทุก branch ด้านล่างวิ่งกลับมาหาเป้าหมายเดียวกัน",
    topLevelGoal: "Top-level goal",
    purpose: "purpose",
    purposeKpi: "purpose KPI",
    primaryDrivers: "primary drivers",
    primaryDriversDescription: "แตกเป้าหมายเป็น primary driver แล้วค่อยเติม secondary และ change ideas ใต้แต่ละ branch",
    addPrimary: "Add primary",
    primaryDriver: "primary driver",
    primaryDriverHelp: "Main lever for the outcome goal",
    primaryDriverName: "ชื่อ primary driver",
    primaryKpi: "primary KPI",
    addSecondary: "Add secondary",
    secondaryDriver: "secondary driver",
    secondaryDriverHelp: "Supporting branch under this primary driver",
    secondaryDriverName: "ชื่อ secondary driver",
    secondaryKpi: "secondary KPI",
    addChangeIdea: "Add change idea",
    changeIdea: "change idea",
    changeIdeaHelp: "Concrete experiment or implementation idea",
    changeIdeaName: "ชื่อ change idea",
    changeKpi: "change KPI",
    outputDescription: "Preview diagram ปัจจุบัน หรือแก้ Mermaid โดยตรง แล้ว sync กลับเข้า form เมื่อพร้อม",
    editMermaidHint: "แก้ Mermaid ตรงนี้ แล้ว apply กลับเข้า form",
    applyToForm: "Apply to Form",
    modalDescription: "Full-screen preview สำหรับตรวจโครงสร้าง diagram และอ่านรายละเอียดเล็ก ๆ ก่อน export",
    close: "Close",
    zoomOut: "Zoom out",
    zoomIn: "Zoom in",
    resetZoom: "Reset zoom",
    signedInUser: "Signed-in user",
    metaLoadingSharedTitle: "กำลังโหลด Shared Driver Diagram",
    metaLoadingSharedDescription: "กำลังเปิด shared driver diagram แบบ read-only",
    metaUnavailableTitle: "Shared Driver Diagram ไม่พร้อมใช้งาน",
    metaUnavailableDescription: "Shared driver diagram link นี้ไม่พร้อมใช้งานหรือถูก revoke แล้ว",
    metaSharedTitleSuffix: "Shared Driver Diagram",
    metaSharedDescription: "Read-only driver diagram view พร้อม Mermaid preview, code inspection, และ export options",
    metaAppDescription: "Create, edit, save, share, and export driver diagrams with Mermaid and Supabase.",
    sortOptions: {
      updated_desc: "Updated ล่าสุด",
      opened_desc: "Opened ล่าสุด",
      title_asc: "ชื่อ A-Z",
    },
    scopeOptions: {
      active: "Active",
      all: "All",
      archived: "Archived",
    },
  },
  en: {
    languageLabel: "Language",
    languageTh: "TH",
    languageEn: "EN",
    sharedViewTitle: "Driver Diagram Shared View",
    loadingSharedDiagram: "Loading shared diagram...",
    backToWorkspace: "Back to workspace",
    sharedReadOnlyDescription: "Shared read-only view. You can preview, inspect the Mermaid code, and export this diagram.",
    copied: "Copied",
    copyMermaid: "Copy Mermaid",
    exporting: "Exporting...",
    readOnlySharedLink: "Read-only shared link",
    shared: "Shared",
    expires: "Expires",
    opened: "Opened",
    output: "output",
    sharedOutputDescription: "Preview the shared diagram, switch to Mermaid code, or zoom in to inspect details more comfortably.",
    expand: "Expand",
    preview: "Preview",
    code: "Code",
    appEyebrow: "Driver Diagram Workspace",
    appTitle: "Driver Diagram MVP",
    appDescription: "Create a Driver Diagram with KPI at every level, edit Mermaid in both directions, export documentation, and save per user in one shared workspace.",
    document: "Document",
    workspace: "Workspace",
    session: "Session",
    primary: "primary",
    secondary: "secondary",
    changeIdeas: "change ideas",
    privateCloudSave: "Private Cloud Save",
    privateCloudSaveTitle: "Private Cloud Save",
    privateCloudSaveActive: "Your diagrams, auto-saves, version history, and share links stay inside this private workspace.",
    privateCloudSaveInactive: "Sign in with your email to save, reopen, and auto-save diagrams in your own private workspace.",
    signedInAs: "Signed in as",
    signOut: "Sign out",
    signingOut: "Signing out...",
    sending: "Sending...",
    emailSignInLink: "Email Sign-In Link",
    verifyingSignInLink: "Verifying your sign-in link...",
    checkingSession: "Checking for an existing session...",
    resendLink: "Resend Link",
    resendHint: "Use this if the first email takes a while to arrive.",
    redirectHint: "Add your production and local URLs to Supabase Auth redirect URLs so the magic link can return here cleanly.",
    previewAuthOnly: "Preview auth layout only. Save, autosave, and private data actions still require a real sign-in.",
    privateCloudSaveSummaryActive: "Saved diagrams, version history, and share links in this workspace belong only to this account.",
    privateCloudSaveSummaryInactive: "Sign in with your email to save, reopen, auto-save, and share diagrams from your own workspace.",
    supabaseConnected: "Supabase connected",
    supabaseEnvMissing: "Supabase env missing",
    privateWorkspaceActive: "Private workspace active",
    verifyingLink: "Verifying sign-in link...",
    checkingSessionShort: "Checking session...",
    signInForCloudSave: "Sign in for cloud save",
    autoSaving: "Auto-saving...",
    unsavedChanges: "Unsaved changes",
    allChangesSaved: "All changes saved",
    currentId: "Current ID",
    newUnsavedDocument: "New unsaved document",
    documentTitle: "Document Title",
    documentTitlePlaceholder: "Name this document",
    documentTitleHint: "This name is used for saved items, share title, and export filename.",
    primaryActions: "Primary Actions",
    saving: "Saving...",
    saveDiagram: "Save Diagram",
    signInToSave: "Sign in to save",
    newDiagram: "New Diagram",
    exportAndCode: "Export & Code",
    copiedMermaid: "Copied Mermaid",
    exportMmd: "Export .mmd",
    exportSvg: "Export .svg",
    exportDocx: "Export .docx",
    exportHint: "Export uses the current document title as the filename and reflects the latest form/code state.",
    openSharedView: "Open shared view",
    openGallery: "Open gallery",
    backToGallery: "Back to gallery",
    galleryTitle: "Community Gallery",
    galleryDescription: "Browse diagrams that owners have chosen to publish together in one shared page.",
    galleryLoading: "Loading gallery items...",
    galleryEmpty: "No diagrams have been submitted to the gallery yet.",
    gallerySearchPlaceholder: "Search gallery by title or purpose",
    submitToGallery: "Submit to gallery",
    removeFromGallery: "Remove from gallery",
    inGallery: "In gallery",
    gallerySubmitted: "Submitted",
    galleryOpenReadOnly: "Open read-only view",
    galleryOwnerLabel: "By",
    galleryDisplayName: "Gallery display name",
    galleryDisplayNamePlaceholder: "Name to show in the gallery",
    galleryDisplayNameHint: "This replaces your email when you publish to the gallery.",
    galleryDisplayNameSaved: "Updated the gallery display name.",
    reportGallery: "Report",
    reporting: "Reporting...",
    reportGalleryPrompt: "Briefly describe why you are reporting this gallery item.",
    reportGallerySuccess: "Sent a report for this gallery item.",
    reportGalleryFailed: "Unable to send the report right now.",
    openModeration: "Moderation",
    adminModerationTitle: "Gallery Moderation",
    adminModerationDescription: "Review reports, hide gallery items, and restore them when they are ready to come back.",
    adminQueueLoading: "Loading moderation queue...",
    adminQueueEmpty: "No gallery items need moderation right now.",
    adminAccessDenied: "This account does not have moderation access.",
    reportCount: "Reports",
    hideFromGallery: "Hide from gallery",
    restoreToGallery: "Restore to gallery",
    resolveReports: "Resolve reports",
    hiddenFromGallery: "Hidden",
    moderationReasonPrompt: "Add a short note for hiding or resolving this gallery item.",
    loadMore: "Load more",
    moderationUpdated: "Updated the moderation queue.",
    savedDiagrams: "Saved Diagrams",
    savedDiagramsDescription: "Open, manage, and continue work from this workspace.",
    shown: "shown",
    refresh: "Refresh",
    searchPlaceholder: "Search by title or purpose",
    envMissingHelp: "Add values to .env.local from .env.example before saving or opening diagrams from the database.",
    signInFirstSaved: "Sign in first, then this panel will show only the diagrams saved by your account.",
    loadingSavedDiagrams: "Loading saved diagrams...",
    untitledDiagram: "Untitled Diagram",
    archived: "Archived",
    shareExpired: "Share expired",
    updated: "Updated",
    lastOpened: "Last opened",
    notOpenedYet: "Not opened yet",
    sharedUntil: "Shared until",
    open: "Open",
    copyShareLink: "Copy share link",
    createShareLink: "Create 7-day share link",
    regenerateShareLink: "Regenerate 7-day share link",
    revokeShareLink: "Revoke share link",
    favorite: "Favorite",
    unfavorite: "Unfavorite",
    rename: "Rename",
    duplicate: "Duplicate",
    restore: "Restore",
    archive: "Archive",
    deletePermanently: "Delete permanently",
    save: "Save",
    cancel: "Cancel",
    noSearchResultsTitle: "No matching saved diagrams",
    noSearchResultsBody: "Try a shorter title or switch sort order to find the work you need.",
    noArchivedTitle: "No archived diagrams yet",
    noSavedTitle: "No saved diagrams yet",
    noArchivedBody: "Archived diagrams will appear here, and you can restore them to the main list.",
    noSavedBody: "Start by saving the current diagram, then it will appear in this workspace.",
    saveCurrentDiagram: "Save Current Diagram",
    versionHistory: "Version History",
    versionHistoryDescription: "Return to recent snapshots for the open document. Keeps the latest 10 auto-save versions and up to 50 versions per document.",
    versions: "versions",
    openSavedDiagram: "Open a saved diagram",
    signInForVersionHistory: "Sign in and open a saved diagram to browse version history.",
    openSavedFirst: "Open a saved diagram first. New saves will start collecting versions automatically.",
    loadingVersionHistory: "Loading version history...",
    saved: "Saved",
    restoring: "Restoring...",
    loadToEditor: "Load to editor",
    restoreAndSave: "Restore & Save",
    noVersions: "No versions yet. The next save or auto-save will create the first recoverable snapshot.",
    purposeOutcomeKpi: "purpose & outcome KPI",
    purposeDescription: "Start with the main goal and outcome KPI so every branch below traces back to one shared purpose.",
    topLevelGoal: "Top-level goal",
    purpose: "purpose",
    purposeKpi: "purpose KPI",
    primaryDrivers: "primary drivers",
    primaryDriversDescription: "Break the goal into primary driver items, then add secondary and change ideas under each branch.",
    addPrimary: "Add primary",
    primaryDriver: "primary driver",
    primaryDriverHelp: "Main lever for the outcome goal",
    primaryDriverName: "primary driver name",
    primaryKpi: "primary KPI",
    addSecondary: "Add secondary",
    secondaryDriver: "secondary driver",
    secondaryDriverHelp: "Supporting branch under this primary driver",
    secondaryDriverName: "secondary driver name",
    secondaryKpi: "secondary KPI",
    addChangeIdea: "Add change idea",
    changeIdea: "change idea",
    changeIdeaHelp: "Concrete experiment or implementation idea",
    changeIdeaName: "change idea name",
    changeKpi: "change KPI",
    outputDescription: "Preview the current diagram or edit Mermaid directly, then sync it back into the form when you are ready.",
    editMermaidHint: "Edit Mermaid here, then apply it back into the form.",
    applyToForm: "Apply to Form",
    modalDescription: "Full-screen preview for reviewing diagram structure and reading small details before export.",
    close: "Close",
    zoomOut: "Zoom out",
    zoomIn: "Zoom in",
    resetZoom: "Reset zoom",
    signedInUser: "Signed-in user",
    metaLoadingSharedTitle: "Loading Shared Driver Diagram",
    metaLoadingSharedDescription: "Opening a shared driver diagram in read-only mode.",
    metaUnavailableTitle: "Shared Driver Diagram Unavailable",
    metaUnavailableDescription: "This shared driver diagram link is unavailable or has been revoked.",
    metaSharedTitleSuffix: "Shared Driver Diagram",
    metaSharedDescription: "Read-only driver diagram view with Mermaid preview, code inspection, and export options.",
    metaAppDescription: "Create, edit, save, share, and export driver diagrams with Mermaid and Supabase.",
    sortOptions: {
      updated_desc: "Recently updated",
      opened_desc: "Recently opened",
      title_asc: "Title A-Z",
    },
    scopeOptions: {
      active: "Active",
      all: "All",
      archived: "Archived",
    },
  },
};

function getSavedDiagramSortOptions(t) {
  return [
    { value: "updated_desc", label: t.sortOptions.updated_desc },
    { value: "opened_desc", label: t.sortOptions.opened_desc },
    { value: "title_asc", label: t.sortOptions.title_asc },
  ];
}

function getSavedDiagramScopeOptions(t) {
  return [
    { value: "active", label: t.scopeOptions.active },
    { value: "all", label: t.scopeOptions.all },
    { value: "archived", label: t.scopeOptions.archived },
  ];
}

function formatSavedDateTime(value, language = defaultLanguage) {
  return value ? new Date(value).toLocaleString(language === "en" ? "en-US" : "th-TH") : "-";
}

function ensureDocumentMeta(selector, attributes) {
  if (typeof document === "undefined") return null;

  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement("meta");
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
    document.head.appendChild(element);
  }
  return element;
}

function updateDocumentPresentation({ title, description }) {
  if (typeof document === "undefined") return;

  document.title = title;

  [
    ['meta[name="description"]', { name: "description" }, description],
    ['meta[property="og:title"]', { property: "og:title" }, title],
    ['meta[property="og:description"]', { property: "og:description" }, description],
    ['meta[name="twitter:title"]', { name: "twitter:title" }, title],
    ['meta[name="twitter:description"]', { name: "twitter:description" }, description],
  ].forEach(([selector, attrs, content]) => {
    const tag = ensureDocumentMeta(selector, attrs);
    if (tag) {
      tag.setAttribute("content", content);
    }
  });
}

function isPreviewAuthLayoutEnabled() {
  if (typeof window === "undefined") return false;

  const params = new URLSearchParams(window.location.search);
  return params.get("previewAuth") === "1";
}

function buildExportFilename(title, extension) {
  const base = String(title || defaultDocumentTitle)
    .trim()
    .replace(/[\\/:*?"<>|]+/g, " ")
    .replace(/\s+/g, " ")
    .slice(0, 80);

  return `${base || defaultDocumentTitle}.${extension}`;
}

function getNextShareExpiry() {
  return new Date(Date.now() + SHARE_LINK_DURATION_MS).toISOString();
}

function isExpiredTimestamp(value) {
  return Boolean(value) && new Date(value).getTime() <= Date.now();
}

function hasActiveShareLink(item) {
  return Boolean(item?.share_id) && !item?.share_revoked_at && !isExpiredTimestamp(item?.share_expires_at);
}

function getSharedDiagramFunctionUrl(shareId) {
  if (!supabaseUrl || !shareId) return "";
  return `${supabaseUrl}/functions/v1/shared-driver-diagram?share=${encodeURIComponent(shareId)}`;
}

function getPublicGalleryFunctionUrl() {
  if (!supabaseUrl) return "";
  return `${supabaseUrl}/functions/v1/public-gallery`;
}

function getAdminModerationFunctionUrl() {
  if (!supabaseUrl) return "";
  return `${supabaseUrl}/functions/v1/gallery-admin-moderation`;
}

function getReportGalleryFunctionUrl() {
  if (!supabaseUrl) return "";
  return `${supabaseUrl}/functions/v1/report-gallery-item`;
}

function readGalleryDisplayName() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(GALLERY_DISPLAY_NAME_STORAGE_KEY) || "";
}

function buildGalleryDisplayName(name, email = "") {
  const trimmed = String(name || "").trim();
  if (trimmed) return trimmed;

  const emailPrefix = String(email || "").split("@")[0].replace(/[._-]+/g, " ").trim();
  return emailPrefix;
}

function readAppLocation() {
  if (typeof window === "undefined") {
    return { shareId: "", gallery: false, admin: false };
  }

  const params = new URLSearchParams(window.location.search);
  return {
    shareId: params.get("share") || "",
    gallery: params.get("gallery") === "1",
    admin: params.get("admin") === "1",
  };
}

function replaceAppLocation(nextParams) {
  if (typeof window === "undefined") return;

  const query = nextParams.toString();
  const nextUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
  window.history.replaceState({}, document.title, nextUrl);
}

function sortSavedDiagrams(items, sortKey) {
  const list = [...items];

  const compareFavorite = (a, b) => Number(Boolean(b.is_favorite)) - Number(Boolean(a.is_favorite));

  if (sortKey === "title_asc") {
    return list.sort((a, b) => {
      const favoriteDelta = compareFavorite(a, b);
      if (favoriteDelta) return favoriteDelta;
      return String(a.title || a.purpose_title || "").localeCompare(String(b.title || b.purpose_title || ""), "th");
    });
  }

  if (sortKey === "opened_desc") {
    return list.sort((a, b) => {
      const favoriteDelta = compareFavorite(a, b);
      if (favoriteDelta) return favoriteDelta;
      return new Date(b.last_opened_at || 0).getTime() - new Date(a.last_opened_at || 0).getTime();
    });
  }

  return list.sort((a, b) => {
    const favoriteDelta = compareFavorite(a, b);
    if (favoriteDelta) return favoriteDelta;
    return new Date(b.updated_at || b.created_at || 0).getTime() - new Date(a.updated_at || a.created_at || 0).getTime();
  });
}

function normalizeStoredDiagramData(input) {
  const source = input && typeof input === "object" ? input : defaultData;

  return {
    purpose: {
      title: String(source?.purpose?.title || ""),
      kpi: String(source?.purpose?.kpi || ""),
    },
    primaryDrivers: Array.isArray(source?.primaryDrivers)
      ? source.primaryDrivers.map((primary) => ({
          id: primary?.id || uid(),
          title: String(primary?.title || ""),
          kpi: String(primary?.kpi || ""),
          secondaryDrivers: Array.isArray(primary?.secondaryDrivers)
            ? primary.secondaryDrivers.map((secondary) => ({
                id: secondary?.id || uid(),
                title: String(secondary?.title || ""),
                kpi: String(secondary?.kpi || ""),
                changeIdeas: Array.isArray(secondary?.changeIdeas)
                  ? secondary.changeIdeas.map((change) => ({
                      id: change?.id || uid(),
                      title: String(change?.title || ""),
                      kpi: String(change?.kpi || ""),
                    }))
                  : [],
              }))
            : [],
        }))
      : [],
  };
}

function hasRenderableDiagramData(diagramData) {
  if (!diagramData || typeof diagramData !== "object") return false;

  const purposeTitle = String(diagramData?.purpose?.title || "").trim();
  const purposeKpi = String(diagramData?.purpose?.kpi || "").trim();
  const primaryCount = Array.isArray(diagramData?.primaryDrivers) ? diagramData.primaryDrivers.length : 0;

  return Boolean(purposeTitle || purposeKpi || primaryCount > 0);
}

function resolveDiagramDataForEditor(diagramData, mermaidCode) {
  if (hasRenderableDiagramData(diagramData)) {
    return normalizeStoredDiagramData(diagramData);
  }

  const normalizedCode = sanitizeMermaidCode(mermaidCode || "");
  if (normalizedCode) {
    try {
      return normalizeStoredDiagramData(parseMermaidCode(normalizedCode));
    } catch (_error) {
      // Older saved diagrams can still fall back to their stored payload/default scaffold.
    }
  }

  return normalizeStoredDiagramData(diagramData);
}

function buildDiagramSnapshot(title, diagramData, mermaidCode) {
  return JSON.stringify({
    title: String(title || "").trim() || defaultDocumentTitle,
    diagramData: normalizeStoredDiagramData(diagramData),
    mermaidCode: sanitizeMermaidCode(mermaidCode || ""),
  });
}

function getThumbnailMarkup(diagramData, mermaidCode) {
  const normalizedData = resolveDiagramDataForEditor(diagramData, mermaidCode);
  return buildTemplateSvg(normalizedData);
}

function buildStoredThumbnailSvg(diagramData, mermaidCode) {
  return getThumbnailMarkup(diagramData, mermaidCode);
}

function getStoredThumbnailMarkup(thumbnailSvg, diagramData, mermaidCode) {
  const stored = String(thumbnailSvg || "").trim();
  if (stored) return stored;
  return getThumbnailMarkup(diagramData, mermaidCode);
}

const thumbnailMarkupCache = new Map();

function getCachedThumbnailMarkup(diagramData, mermaidCode) {
  const key = buildDiagramSnapshot("thumbnail", diagramData, mermaidCode);
  if (thumbnailMarkupCache.has(key)) {
    return thumbnailMarkupCache.get(key);
  }

  const markup = getThumbnailMarkup(diagramData, mermaidCode);
  thumbnailMarkupCache.set(key, markup);

  if (thumbnailMarkupCache.size > 80) {
    const oldestKey = thumbnailMarkupCache.keys().next().value;
    thumbnailMarkupCache.delete(oldestKey);
  }

  return markup;
}

function buildMermaidCode(data) {
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
}

function decodeMermaidText(text = "") {
  return String(text)
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function normalizeNodeLabel(rawLabel = "") {
  return decodeMermaidText(rawLabel)
    .replace(/^`|`$/g, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/\r\n/g, "\n")
    .trim();
}

function normalizeHeading(heading = "") {
  return String(heading)
    .replace(/^[^\p{L}\p{N}]+/gu, "")
    .trim()
    .toLowerCase();
}

function inferNodeType(heading = "", value = "") {
  const normalizedHeading = normalizeHeading(heading);
  const normalizedValue = String(value || "").trim().toLowerCase();
  const combined = `${normalizedHeading}\n${normalizedValue}`;

  if (
    normalizedHeading.includes("primary driver") ||
    normalizedHeading.includes("secondary driver") ||
    normalizedHeading.includes("change idea") ||
    normalizedHeading === "purpose" ||
    normalizedHeading === "outcome kpi"
  ) {
    if (normalizedHeading.includes("primary driver")) return "primary";
    if (normalizedHeading.includes("secondary driver")) return "secondary";
    if (normalizedHeading.includes("change idea")) return "change";
    if (normalizedHeading === "purpose") return "purpose";
    return "kpi";
  }

  if (combined.includes("เป้าหมาย") || combined.includes("goal")) return "purpose";
  if (normalizedHeading.startsWith("kpi") || combined.includes("purpose kpi") || combined.includes("outcome kpi")) {
    return "kpi";
  }
  if (combined.includes("primary driver")) return "primary";
  if (combined.includes("secondary driver")) return "secondary";
  if (combined.includes("change idea")) return "change";

  return "unknown";
}

function escapeLooseXmlChars(text = "") {
  return String(text)
    .replace(/&(?!#?\w+;)/g, "&amp;")
    .replace(/</g, "&lt;");
}

function sanitizeMermaidCode(code = "") {
  return String(code).replace(/(\["?)([\s\S]*?)("\])/g, (_match, prefix, inner, suffix) => {
    const normalizedInner = inner
      .replace(/<br\s*\/?>/gi, "<br/>")
      .split("\n")
      .map((line) => escapeLooseXmlChars(line))
      .join("\n");

    return `${prefix}${normalizedInner}${suffix}`;
  });
}

function parseNodeDefinitions(code) {
  const nodeMap = new Map();
  const nodePattern = /([A-Za-z0-9_]+)\["([\s\S]*?)"\]/g;
  let match;

  while ((match = nodePattern.exec(code))) {
    const [, id, rawLabel] = match;
    const normalizedLabel = normalizeNodeLabel(rawLabel);
    const [heading, ...rest] = normalizedLabel.split("\n");
    nodeMap.set(id, {
      id,
      heading: (heading || "").trim(),
      value: rest.join("\n").trim(),
      type: inferNodeType(heading || "", rest.join("\n")),
    });
  }

  return nodeMap;
}

function parseSubgraphMembership(code) {
  const nodeGroups = new Map();
  const subgraphPattern = /subgraph\s+[A-Za-z0-9_]+\[[\s\S]*?\]([\s\S]*?)end/g;
  let match;

  while ((match = subgraphPattern.exec(code))) {
    const body = match[1];
    const nodeIds = Array.from(body.matchAll(/([A-Za-z0-9_]+)\["[\s\S]*?"\]/g)).map((parts) => parts[1]);
    if (nodeIds.length > 1) {
      nodeIds.forEach((nodeId) => {
        nodeGroups.set(nodeId, nodeIds.filter((id) => id !== nodeId));
      });
    }
  }

  return nodeGroups;
}

function parseEdges(code) {
  const adjacency = new Map();
  const extractNodeId = (segment, pick = "first") => {
    const matches = Array.from(String(segment || "").matchAll(/([A-Za-z0-9_]+)(?=\s*(?:\[|$))/g));
    if (!matches.length) return "";
    return pick === "last" ? matches[matches.length - 1][1] : matches[0][1];
  };

  const addEdge = (from, to) => {
    if (!from || !to) return;
    const existing = adjacency.get(from) || [];
    if (!existing.includes(to)) {
      adjacency.set(from, [...existing, to]);
    }
  };

  String(code || "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.includes("-->") && !line.startsWith("class ") && !line.startsWith("classDef "))
    .forEach((line) => {
      const edgeLine = line.replace(/;.*/, "");
      const parts = edgeLine.split("-->");
      if (parts.length < 2) return;
      const from = extractNodeId(parts[0], "last");
      if (!from) return;
      const rightSide = parts.slice(1).join("-->");
      const targets = rightSide
        .split("&")
        .map((segment) => extractNodeId(segment, "first"))
        .filter(Boolean);

      targets.forEach((to) => addEdge(from, to));
    });

  return adjacency;
}

function findAssociatedKpis(nodeMap, nodeGroups) {
  const kpiByNodeId = new Map();
  const fallbackPairs = [
    ["Purpose", "PKPI"],
  ];

  nodeMap.forEach((node) => {
    const groupedNodes = (nodeGroups.get(node.id) || [])
      .map((id) => nodeMap.get(id))
      .filter(Boolean);
    const groupedKpis = groupedNodes.filter((groupedNode) => groupedNode.type === "kpi");

    if (node.type !== "kpi" && groupedKpis.length) {
      kpiByNodeId.set(node.id, groupedKpis.map((groupedNode) => groupedNode.value).filter(Boolean).join("\n"));
    }
  });

  fallbackPairs.forEach(([nodeId, kpiId]) => {
    if (!kpiByNodeId.has(nodeId) && nodeMap.has(kpiId)) {
      kpiByNodeId.set(nodeId, nodeMap.get(kpiId)?.value || "");
    }
  });

  nodeMap.forEach((node) => {
    if (kpiByNodeId.has(node.id)) return;
    if (node.type === "primary") {
      const match = node.id.match(/^PD(\d+)$/);
      if (match && nodeMap.has(`PDKPI${match[1]}`)) {
        kpiByNodeId.set(node.id, nodeMap.get(`PDKPI${match[1]}`)?.value || "");
      }
    }
    if (node.type === "secondary") {
      const match = node.id.match(/^S(\d+)_(\d+)$/);
      if (match && nodeMap.has(`SKPI${match[1]}_${match[2]}`)) {
        kpiByNodeId.set(node.id, nodeMap.get(`SKPI${match[1]}_${match[2]}`)?.value || "");
      }
    }
    if (node.type === "change") {
      const match = node.id.match(/^C(\d+)_(\d+)_(\d+)$/);
      if (match && nodeMap.has(`CKPI${match[1]}_${match[2]}_${match[3]}`)) {
        kpiByNodeId.set(node.id, nodeMap.get(`CKPI${match[1]}_${match[2]}_${match[3]}`)?.value || "");
      }
    }
  });

  return kpiByNodeId;
}

function parseMermaidCode(code) {
  const normalized = String(code || "").trim();
  if (!normalized.startsWith("flowchart")) {
    throw new Error("Mermaid code must start with a flowchart declaration.");
  }

  const nodeMap = parseNodeDefinitions(normalized);
  const nodeGroups = parseSubgraphMembership(normalized);
  const adjacency = parseEdges(normalized);
  const kpiByNodeId = findAssociatedKpis(nodeMap, nodeGroups);

  if (!nodeMap.size) {
    throw new Error("No Mermaid nodes were found.");
  }

  const purposeNode =
    nodeMap.get("Purpose") ||
    Array.from(nodeMap.values()).find((node) => node.type === "purpose") ||
    Array.from(nodeMap.values()).find((node) => (adjacency.get(node.id) || []).some((targetId) => nodeMap.get(targetId)?.type === "primary"));

  if (!purposeNode) {
    throw new Error("A Purpose/Goal node is required.");
  }

  const primaryIds = (adjacency.get(purposeNode.id) || []).filter((nodeId) => {
    const node = nodeMap.get(nodeId);
    return node && node.type !== "kpi";
  });

  if (!primaryIds.length) {
    throw new Error("At least one Primary Driver connected from the Purpose node is required.");
  }

  return {
    purpose: {
      title: purposeNode.value || purposeNode.heading || "",
      kpi: kpiByNodeId.get(purposeNode.id) || "",
    },
    primaryDrivers: primaryIds.map((primaryId) => {
      const primaryNode = nodeMap.get(primaryId);
      const secondaryIds = (adjacency.get(primaryId) || []).filter((nodeId) => {
        const node = nodeMap.get(nodeId);
        return node && node.type !== "kpi";
      });

      return {
        id: uid(),
        title: primaryNode?.value || primaryNode?.heading || "",
        kpi: kpiByNodeId.get(primaryId) || "",
        secondaryDrivers: secondaryIds.map((secondaryId) => {
          const secondaryNode = nodeMap.get(secondaryId);
          const changeIds = (adjacency.get(secondaryId) || []).filter((nodeId) => {
            const node = nodeMap.get(nodeId);
            return node && node.type !== "kpi";
          });

          return {
            id: uid(),
            title: secondaryNode?.value || secondaryNode?.heading || "",
            kpi: kpiByNodeId.get(secondaryId) || "",
            changeIdeas: changeIds.map((changeId) => {
              const changeNode = nodeMap.get(changeId);
              return {
                id: uid(),
                title: changeNode?.value || changeNode?.heading || "",
                kpi: kpiByNodeId.get(changeId) || "",
              };
            }),
          };
        }),
      };
    }),
  };
}

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

function escapeSvgText(text = "") {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function wrapSvgText(text = "", maxChars = 28) {
  const segmentText = (input) => {
    if (typeof Intl !== "undefined" && Intl.Segmenter) {
      const segmenter = new Intl.Segmenter("th", { granularity: "word" });
      return Array.from(segmenter.segment(input), (part) => part.segment);
    }
    if (input.includes(" ")) {
      return input.split(/(\s+)/).filter(Boolean);
    }
    return Array.from(input);
  };

  return String(text || "")
    .split("\n")
    .flatMap((paragraph) => {
      const trimmed = paragraph.trim();
      if (!trimmed) return [""];
      const tokens = segmentText(trimmed);
      const lines = [];
      let current = "";

      tokens.forEach((token) => {
        const next = `${current}${token}`;
        const normalizedCurrent = current.trim();
        const normalizedNext = next.trim();
        if (normalizedCurrent && normalizedNext.length > maxChars) {
          lines.push(normalizedCurrent);
          current = token.trimStart();
        } else {
          current = next;
        }
      });

      if (current.trim()) {
        lines.push(current.trim());
      }

      return lines.length ? lines : [trimmed];
    });
}

function buildTemplateSvg(diagramData) {
  const theme = {
    bg: "#ffffff",
    headerBg: "#eef4ff",
    headerPurposeBg: "#eaf0ff",
    headerSecondaryBg: "#e8fbff",
    headerChangeBg: "#e9faf0",
    headerText: "#1d4ed8",
    headerSecondaryText: "#0f7490",
    headerChangeText: "#047857",
    purposeFill: "#4f46e5",
    purposeStroke: "#4338ca",
    purposeText: "#ffffff",
    purposeKpiText: "#e0e7ff",
    cardFill: "#ffffff",
    cardStroke: "#d9e2ef",
    primaryAccent: "#3b82f6",
    secondaryAccent: "#06b6d4",
    changeFill: "#ecfdf5",
    changeStroke: "#c7f0db",
    changeText: "#064e3b",
    bodyText: "#334155",
    mutedText: "#94a3b8",
    connector: "#cbd5e1",
  };

  const layout = {
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

  const columns = {
    goalX: layout.sidePad,
    primaryX: 552,
    secondaryX: 1028,
    changeX: 1504,
  };

  const headerWidth = 394;
  const headerX = {
    goal: columns.goalX + 18,
    primary: columns.primaryX,
    secondary: columns.secondaryX,
    change: columns.changeX,
  };

  const makeCard = (kind, title, kpi, width, accentColor = null) => {
    const titleLines = wrapSvgText(title, kind === "purpose" ? 26 : kind === "change" ? 27 : 25);
    const kpiLines = wrapSvgText(kpi ? `KPI: ${kpi}` : "", kind === "change" ? 31 : 28).filter(Boolean);
    const titleFontSize = kind === "purpose" ? 18 : 16;
    const kpiFontSize = kind === "purpose" ? 14 : 13;
    const titleLineHeight = kind === "purpose" ? 27 : 25;
    const kpiLineHeight = kind === "purpose" ? 20 : 18;
    const paddingX = kind === "purpose" ? 24 : 22;
    const paddingTop = kind === "purpose" ? 22 : 20;
    const separatorGap = kpiLines.length ? 14 : 0;
    const separatorY = paddingTop + titleLines.length * titleLineHeight + separatorGap;
    const kpiTop = separatorY + (kpiLines.length ? 18 : 0);
    const height = Math.max(
      kind === "purpose" ? 158 : kind === "change" ? 150 : 126,
      paddingTop +
        titleLines.length * titleLineHeight +
        (kpiLines.length ? 18 + kpiLines.length * kpiLineHeight : 0) +
        28
    );

    return {
      kind,
      width,
      height,
      titleLines,
      kpiLines,
      paddingX,
      paddingTop,
      titleFontSize,
      kpiFontSize,
      titleLineHeight,
      kpiLineHeight,
      separatorY,
      kpiTop,
      accentColor,
    };
  };

  const primaryGroups = diagramData.primaryDrivers.map((primary) => {
    const primaryCard = makeCard("primary", primary.title, primary.kpi, layout.primaryW, theme.primaryAccent);
    const secondaryBlocks = primary.secondaryDrivers.map((secondary) => {
      const secondaryCard = makeCard("secondary", secondary.title, secondary.kpi, layout.secondaryW, theme.secondaryAccent);
      const changeCards = (secondary.changeIdeas.length ? secondary.changeIdeas : [{ title: "", kpi: "" }]).map((change) =>
        makeCard("change", change.title, change.kpi, layout.changeW)
      );
      const changeStackHeight =
        changeCards.reduce((sum, card) => sum + card.height, 0) +
        Math.max(0, changeCards.length - 1) * layout.cardGap;
      const blockHeight = Math.max(secondaryCard.height, changeStackHeight);
      return { secondary, secondaryCard, changeCards, blockHeight };
    });
    const secondaryStackHeight =
      secondaryBlocks.reduce((sum, block) => sum + block.blockHeight, 0) +
      Math.max(0, secondaryBlocks.length - 1) * layout.blockGap;
    const groupHeight = Math.max(primaryCard.height, secondaryStackHeight);
    return { primary, primaryCard, secondaryBlocks, groupHeight };
  });

  let cursorY = layout.contentTop;
  const renderCards = [];
  const primaryCenters = [];
  const secondaryConnectors = [];
  const changeConnectors = [];

  primaryGroups.forEach((group) => {
    const groupTop = cursorY;
    const primaryY = groupTop + (group.groupHeight - group.primaryCard.height) / 2;
    renderCards.push({ x: columns.primaryX, y: primaryY, card: group.primaryCard });
    primaryCenters.push({
      x: columns.primaryX,
      y: primaryY + group.primaryCard.height / 2,
    });

    let blockY = groupTop + (group.groupHeight - (
      group.secondaryBlocks.reduce((sum, block) => sum + block.blockHeight, 0) +
      Math.max(0, group.secondaryBlocks.length - 1) * layout.blockGap
    )) / 2;

    group.secondaryBlocks.forEach((block) => {
      const secondaryY = blockY + (block.blockHeight - block.secondaryCard.height) / 2;
      renderCards.push({ x: columns.secondaryX, y: secondaryY, card: block.secondaryCard });
      secondaryConnectors.push({
        from: { x: columns.primaryX + group.primaryCard.width, y: primaryY + group.primaryCard.height / 2 },
        to: { x: columns.secondaryX, y: secondaryY + block.secondaryCard.height / 2 },
      });

      let changeY = blockY + (block.blockHeight - (
        block.changeCards.reduce((sum, card) => sum + card.height, 0) +
        Math.max(0, block.changeCards.length - 1) * layout.cardGap
      )) / 2;

      const changeCenters = [];
      block.changeCards.forEach((changeCard) => {
        renderCards.push({ x: columns.changeX, y: changeY, card: changeCard });
        changeCenters.push({ x: columns.changeX, y: changeY + changeCard.height / 2 });
        changeY += changeCard.height + layout.cardGap;
      });

      changeConnectors.push({
        from: { x: columns.secondaryX + block.secondaryCard.width, y: secondaryY + block.secondaryCard.height / 2 },
        to: changeCenters,
      });

      blockY += block.blockHeight + layout.blockGap;
    });

    cursorY += group.groupHeight + layout.groupGap;
  });

  const contentHeight = cursorY - layout.groupGap;
  const goalCard = makeCard("purpose", diagramData.purpose.title, diagramData.purpose.kpi, layout.goalW);
  const goalY = layout.contentTop + Math.max(0, (contentHeight - layout.contentTop - goalCard.height) / 2);
  const goalCenterY = goalY + goalCard.height / 2;
  renderCards.push({ x: columns.goalX, y: goalY, card: goalCard });

  const purposeTrunkX = columns.goalX + goalCard.width + 42;
  const primaryJoinX = columns.primaryX - 30;

  const svgHeight = Math.max(cursorY + layout.bottomPad, goalY + goalCard.height + layout.bottomPad);

  const renderTextLines = (lines, x, y, fontSize, lineHeight, fill, fontWeight = 500) =>
    lines
      .map(
        (line, index) =>
          `<tspan x="${x}" y="${y + index * lineHeight}" font-size="${fontSize}" font-weight="${fontWeight}" fill="${fill}">${escapeSvgText(line)}</tspan>`
      )
      .join("");

  const renderCardMarkup = ({ x, y, card }) => {
    const radius = card.kind === "purpose" ? 20 : 18;
    const fill =
      card.kind === "purpose" ? theme.purposeFill : card.kind === "change" ? theme.changeFill : theme.cardFill;
    const stroke =
      card.kind === "purpose" ? theme.purposeStroke : card.kind === "change" ? theme.changeStroke : theme.cardStroke;
    const titleFill = card.kind === "purpose" ? theme.purposeText : card.kind === "change" ? theme.changeText : theme.bodyText;
    const kpiFill = card.kind === "purpose" ? theme.purposeKpiText : theme.mutedText;
    const shadow = card.kind === "purpose" ? "url(#goalShadow)" : "url(#cardShadow)";
    const separatorColor = card.kind === "purpose" ? "rgba(255,255,255,0.24)" : "#eef2f7";
    const accent = card.accentColor
      ? `<rect x="${x}" y="${y}" width="6" height="${card.height}" rx="${radius}" fill="${card.accentColor}" />`
      : "";
    const separator = card.kpiLines.length
      ? `<line x1="${x + card.paddingX}" y1="${y + card.separatorY}" x2="${x + card.width - card.paddingX}" y2="${y + card.separatorY}" stroke="${separatorColor}" stroke-width="1.25"/>`
      : "";

    return `
      <g>
        <rect x="${x}" y="${y}" width="${card.width}" height="${card.height}" rx="${radius}" fill="${fill}" stroke="${stroke}" filter="${shadow}"/>
        ${accent}
        <text font-family="Inter, Arial, sans-serif">
          ${renderTextLines(card.titleLines, x + card.paddingX + (card.accentColor ? 8 : 0), y + card.paddingTop, card.titleFontSize, card.titleLineHeight, titleFill, 600)}
          ${renderTextLines(card.kpiLines, x + card.paddingX + (card.accentColor ? 8 : 0), y + card.kpiTop, card.kpiFontSize, card.kpiLineHeight, kpiFill, 600)}
        </text>
        ${separator}
      </g>
    `;
  };

  const headerY = layout.topPad;
  const headers = [
    { x: headerX.goal, label: "เป้าหมาย (AIM)", bg: theme.headerPurposeBg, color: "#3343c4" },
    { x: headerX.primary, label: "PRIMARY DRIVERS", bg: theme.headerBg, color: theme.headerText },
    { x: headerX.secondary, label: "SECONDARY DRIVERS", bg: theme.headerSecondaryBg, color: theme.headerSecondaryText },
    { x: headerX.change, label: "CHANGE IDEAS", bg: theme.headerChangeBg, color: theme.headerChangeText },
  ]
    .map(
      (header) => `
        <g>
          <rect x="${header.x}" y="${headerY}" width="${headerWidth}" height="${layout.headerH}" rx="10" fill="${header.bg}" />
          <text x="${header.x + headerWidth / 2}" y="${headerY + 30}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="17" font-weight="700" fill="${header.color}" letter-spacing="0.3">${escapeSvgText(header.label)}</text>
        </g>
      `
    )
    .join("");

  const purposeConnector = primaryCenters.length
    ? `
      <path d="M ${columns.goalX + goalCard.width} ${goalCenterY} H ${purposeTrunkX} V ${primaryCenters[0].y} H ${primaryJoinX}
               M ${purposeTrunkX} ${primaryCenters[0].y} V ${primaryCenters[primaryCenters.length - 1].y}"
            fill="none" stroke="${theme.connector}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
      ${primaryCenters
        .map(
          (center) =>
            `<path d="M ${primaryJoinX} ${center.y} H ${columns.primaryX}" fill="none" stroke="${theme.connector}" stroke-width="2.5" stroke-linecap="round" />`
        )
        .join("")}
    `
    : "";

  const secondaryConnectorMarkup = secondaryConnectors
    .map(
      ({ from, to }) =>
        `<path d="M ${from.x} ${from.y} H ${from.x + 26} V ${to.y} H ${to.x}" fill="none" stroke="${theme.connector}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />`
    )
    .join("");

  const changeConnectorMarkup = changeConnectors
    .map(({ from, to }) => {
      if (!to.length) return "";
      const joinX = from.x + 46;
      const vertical = to.length > 1 ? `M ${joinX} ${to[0].y} V ${to[to.length - 1].y}` : "";
      return `
        <path d="M ${from.x} ${from.y} H ${joinX}" fill="none" stroke="${theme.connector}" stroke-width="2.5" stroke-linecap="round" />
        <path d="${vertical}" fill="none" stroke="${theme.connector}" stroke-width="2.5" stroke-linecap="round" />
        ${to
          .map(
            (target) =>
              `<path d="M ${joinX} ${target.y} H ${target.x}" fill="none" stroke="${theme.connector}" stroke-width="2.5" stroke-linecap="round" />`
          )
          .join("")}
      `;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${layout.canvasWidth}" height="${svgHeight}" viewBox="0 0 ${layout.canvasWidth} ${svgHeight}" role="img" aria-label="Driver Diagram">
  <defs>
    <filter id="cardShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="5" stdDeviation="9" flood-color="#94a3b8" flood-opacity="0.11"/>
    </filter>
    <filter id="goalShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="10" stdDeviation="16" flood-color="#312e81" flood-opacity="0.2"/>
    </filter>
  </defs>
  <rect width="100%" height="100%" fill="${theme.bg}" />
  ${headers}
  ${purposeConnector}
  ${secondaryConnectorMarkup}
  ${changeConnectorMarkup}
  ${renderCards.map(renderCardMarkup).join("")}
</svg>`;
}

function TextAreaField({ label, value, onChange, icon, testId = "" }) {
  return (
    <label className="block space-y-2">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm ring-1 ring-slate-200">
          {icon}
        </span>
        <span>{label}</span>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        data-testid={testId || undefined}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}

function StatusPill({ tone = "neutral", icon, children }) {
  const toneClass =
    tone === "success"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
      : tone === "info"
        ? "bg-blue-50 text-blue-700 ring-blue-100"
        : tone === "warning"
          ? "bg-amber-50 text-amber-700 ring-amber-100"
          : "bg-slate-100 text-slate-600 ring-slate-200";

  return (
    <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ring-1 ${toneClass}`}>
      {icon}
      {children}
    </div>
  );
}

function LanguageToggle({ language, onChange, t }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 p-1 text-sm font-semibold">
      <span className="px-2 text-xs uppercase text-slate-500">{t.languageLabel}</span>
      {["th", "en"].map((option) => (
        <button
          key={option}
          type="button"
          data-testid={`language-toggle-${option}`}
          onClick={() => onChange(option)}
          className={`rounded-xl px-3 py-2 transition ${language === option ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
          aria-pressed={language === option}
        >
          {option === "th" ? t.languageTh : t.languageEn}
        </button>
      ))}
    </div>
  );
}

function PreviewZoomControls({ zoom, onZoomOut, onZoomIn, onReset, labels = translations.th }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-2xl bg-slate-100 p-1">
      <button
        onClick={onZoomOut}
        disabled={zoom <= PREVIEW_ZOOM_MIN}
        className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
        title={labels.zoomOut}
      >
        <Minus size={16} />
      </button>
      <button
        onClick={onReset}
        className="inline-flex min-w-[72px] items-center justify-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm"
        title={labels.resetZoom}
      >
        <RotateCcw size={14} /> {Math.round(zoom * 100)}%
      </button>
      <button
        onClick={onZoomIn}
        disabled={zoom >= PREVIEW_ZOOM_MAX}
        className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
        title={labels.zoomIn}
      >
        <Plus size={16} />
      </button>
    </div>
  );
}

function PreviewCanvas({ svg, renderError, zoom, className = "" }) {
  if (renderError) {
    return <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{renderError}</div>;
  }

  return (
    <div className={`preview-surface overflow-auto rounded-[24px] bg-slate-100 p-3 ring-1 ring-slate-200 ${className}`}>
      <div className="preview-paper shadow-sm">
        <div
          className="diagram-preview"
          style={{ "--diagram-scale": zoom }}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>
    </div>
  );
}

function DiagramThumbnail({ title, thumbnailSvg = "", diagramData, mermaidCode, className = "" }) {
  const markup = useMemo(() => {
    try {
      return getStoredThumbnailMarkup(thumbnailSvg, diagramData, mermaidCode);
    } catch (_error) {
      return "";
    }
  }, [diagramData, mermaidCode, thumbnailSvg]);

  return (
    <div className={`diagram-thumbnail ${className}`}>
      {markup ? (
        <div
          className="diagram-thumbnail-inner"
          aria-hidden="true"
          dangerouslySetInnerHTML={{ __html: markup }}
        />
      ) : (
        <div className="diagram-thumbnail-fallback">{title || defaultDocumentTitle}</div>
      )}
    </div>
  );
}

function PreviewModal({ open, title, svg, renderError, zoom, onClose, onZoomOut, onZoomIn, onReset, t = translations.th }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-3 sm:p-6">
      <div className="flex h-[92vh] w-full max-w-[96rem] flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl ring-1 ring-slate-200">
        <div className="flex flex-col gap-3 border-b border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <h2 className="text-lg font-bold text-slate-950">{title || defaultDocumentTitle}</h2>
            <p className="mt-1 text-sm text-slate-500">{t.modalDescription}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <PreviewZoomControls zoom={zoom} onZoomOut={onZoomOut} onZoomIn={onZoomIn} onReset={onReset} labels={t} />
            <button
              onClick={onClose}
              data-testid="close-preview-modal-button"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <X size={16} /> {t.close}
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 bg-slate-100 p-4">
          <PreviewCanvas svg={svg} renderError={renderError} zoom={zoom} className="h-full" />
        </div>
      </div>
    </div>
  );
}

function App() {
  const [language, setLanguage] = useState(defaultLanguage);
  const [routeState, setRouteState] = useState(() => readAppLocation());
  const [data, setData] = useState(defaultData);
  const [documentTitle, setDocumentTitle] = useState(defaultDocumentTitle);
  const [currentDiagramId, setCurrentDiagramId] = useState("");
  const [session, setSession] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(isSupabaseConfigured);
  const [authVerifyingLink, setAuthVerifyingLink] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [authError, setAuthError] = useState("");
  const [galleryDisplayName, setGalleryDisplayName] = useState(() => readGalleryDisplayName());
  const [savedDiagrams, setSavedDiagrams] = useState([]);
  const [savedSearch, setSavedSearch] = useState("");
  const [savedSort, setSavedSort] = useState("updated_desc");
  const [savedScope, setSavedScope] = useState("active");
  const [loadingSavedDiagrams, setLoadingSavedDiagrams] = useState(false);
  const [savingDiagram, setSavingDiagram] = useState(false);
  const [autoSaveState, setAutoSaveState] = useState("idle");
  const [openingDiagramId, setOpeningDiagramId] = useState("");
  const [deletingDiagramId, setDeletingDiagramId] = useState("");
  const [duplicatingDiagramId, setDuplicatingDiagramId] = useState("");
  const [renamingDiagramId, setRenamingDiagramId] = useState("");
  const [renameDraft, setRenameDraft] = useState("");
  const [renamingDiagram, setRenamingDiagram] = useState(false);
  const [sharingDiagramId, setSharingDiagramId] = useState("");
  const [gallerySubmittingId, setGallerySubmittingId] = useState("");
  const [storageMessage, setStorageMessage] = useState("");
  const [storageError, setStorageError] = useState("");
  const [copied, setCopied] = useState(false);
  const [codeInput, setCodeInput] = useState(() => buildMermaidCode(defaultData));
  const [codeSyncError, setCodeSyncError] = useState("");
  const [codeSyncMessage, setCodeSyncMessage] = useState("");
  const [exportingDocx, setExportingDocx] = useState(false);
  const [exportError, setExportError] = useState("");
  const [view, setView] = useState("preview");
  const [previewZoom, setPreviewZoom] = useState(1);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [svg, setSvg] = useState("");
  const [renderError, setRenderError] = useState("");
  const [sharedView, setSharedView] = useState(null);
  const [sharedViewLoading, setSharedViewLoading] = useState(false);
  const [sharedViewError, setSharedViewError] = useState("");
  const [sharedOpenedAt, setSharedOpenedAt] = useState("");
  const [lastSharedUrl, setLastSharedUrl] = useState("");
  const [galleryItems, setGalleryItems] = useState([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryError, setGalleryError] = useState("");
  const [gallerySearch, setGallerySearch] = useState("");
  const [reportingGalleryToken, setReportingGalleryToken] = useState("");
  const [galleryOffset, setGalleryOffset] = useState(0);
  const [galleryHasMore, setGalleryHasMore] = useState(false);
  const [isGalleryAdmin, setIsGalleryAdmin] = useState(false);
  const [adminQueue, setAdminQueue] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState("");
  const [adminOffset, setAdminOffset] = useState(0);
  const [adminHasMore, setAdminHasMore] = useState(false);
  const [moderationActionToken, setModerationActionToken] = useState("");
  const [versionHistory, setVersionHistory] = useState([]);
  const [loadingVersionHistory, setLoadingVersionHistory] = useState(false);
  const [restoringVersionId, setRestoringVersionId] = useState("");
  const [restoringAndSavingVersionId, setRestoringAndSavingVersionId] = useState("");
  const renderId = useRef(0);
  const mermaidRef = useRef(null);
  const mermaidInitialized = useRef(false);
  const codeSourceRef = useRef("form");
  const previousUserIdRef = useRef("");
  const lastSavedSnapshotRef = useRef(buildDiagramSnapshot(defaultDocumentTitle, defaultData, buildMermaidCode(defaultData)));
  const lastVersionSnapshotRef = useRef(buildDiagramSnapshot(defaultDocumentTitle, defaultData, buildMermaidCode(defaultData)));
  const mermaidCode = useMemo(() => buildMermaidCode(data), [data]);
  const t = translations[language] || translations[defaultLanguage];
  const savedDiagramSortOptions = useMemo(() => getSavedDiagramSortOptions(t), [t]);
  const savedDiagramScopeOptions = useMemo(() => getSavedDiagramScopeOptions(t), [t]);
  const savedDiagramSelectFields =
    "id, title, purpose_title, diagram_data, mermaid_code, thumbnail_svg, created_at, updated_at, last_opened_at, is_favorite, archived_at, share_id, shared_at, share_expires_at, share_revoked_at";
  const currentSnapshot = useMemo(
    () => buildDiagramSnapshot(documentTitle, data, codeInput),
    [documentTitle, data, codeInput]
  );
  const isAuthenticated = Boolean(currentUser?.id);
  const previewAuthEnabled = useMemo(
    () => !isAuthenticated && isPreviewAuthLayoutEnabled(),
    [isAuthenticated]
  );
  const authUiActive = isAuthenticated || previewAuthEnabled;
  const authUiEmail = currentUser?.email || session?.user?.email || (previewAuthEnabled ? "preview.user@example.com" : t.signedInUser);
  const isReadOnlySharedView = Boolean(sharedView);
  const isGalleryView = routeState.gallery && !routeState.shareId;
  const isAdminView = routeState.admin && !routeState.shareId;
  const ownedGalleryByShareToken = useMemo(
    () =>
      new Map(
        savedDiagrams
          .filter((item) => item.share_id)
          .map((item) => [item.share_id, item])
      ),
    [savedDiagrams]
  );
  const filteredSavedDiagrams = useMemo(() => {
    const search = savedSearch.trim().toLowerCase();
    const scoped = savedDiagrams.filter((item) => {
      if (savedScope === "archived") return Boolean(item.archived_at);
      if (savedScope === "all") return true;
      return !item.archived_at;
    });
    const filtered = search
      ? scoped.filter((item) =>
          `${item.title || ""}\n${item.purpose_title || ""}`.toLowerCase().includes(search)
        )
      : scoped;

    return sortSavedDiagrams(filtered, savedSort);
  }, [savedDiagrams, savedScope, savedSearch, savedSort]);
  const filteredGalleryItems = useMemo(() => {
    const search = gallerySearch.trim().toLowerCase();
    const items = [...galleryItems].sort(
      (a, b) => new Date(b.gallery_submitted_at || b.shared_at || 0).getTime() - new Date(a.gallery_submitted_at || a.shared_at || 0).getTime()
    );

    if (!search) return items;

    return items.filter((item) =>
      `${item.title || ""}\n${item.purpose_title || ""}\n${item.gallery_submitter_name || ""}`.toLowerCase().includes(search)
    );
  }, [galleryItems, gallerySearch]);
  const visibleAdminQueue = useMemo(
    () => adminQueue.filter((item) => item.report_count > 0 || item.gallery_hidden_at),
    [adminQueue]
  );
  const diagramStats = useMemo(() => {
    const primaryCount = data.primaryDrivers.length;
    const secondaryCount = data.primaryDrivers.reduce((total, primary) => total + primary.secondaryDrivers.length, 0);
    const changeCount = data.primaryDrivers.reduce(
      (total, primary) =>
        total + primary.secondaryDrivers.reduce((branchTotal, secondary) => branchTotal + secondary.changeIdeas.length, 0),
      0
    );

    return { primaryCount, secondaryCount, changeCount };
  }, [data]);

  const enrichSavedDiagramsWithGalleryState = async (rows) => {
    if (!supabase || !currentUser?.id || !Array.isArray(rows) || !rows.length) {
      return rows || [];
    }

    const { data: sharedRows, error } = await supabase
      .from("shared_driver_diagrams")
      .select("diagram_id, is_public_gallery, gallery_submitted_at, gallery_submitter_name")
      .eq("user_id", currentUser.id);

    if (error || !sharedRows?.length) {
      return rows;
    }

    const galleryByDiagramId = new Map(sharedRows.map((item) => [item.diagram_id, item]));
    return rows.map((row) => ({
      ...row,
      ...(galleryByDiagramId.get(row.id) || {}),
    }));
  };

  useEffect(() => {
    if (codeSourceRef.current === "form") {
      setCodeInput(mermaidCode);
    }
  }, [mermaidCode]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(GALLERY_DISPLAY_NAME_STORAGE_KEY, galleryDisplayName);
  }, [galleryDisplayName]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (galleryDisplayName.trim()) return;
    const nextName = buildGalleryDisplayName("", authUiEmail);
    if (nextName) {
      setGalleryDisplayName(nextName);
    }
  }, [authUiEmail, galleryDisplayName, isAuthenticated]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const syncRoute = () => setRouteState(readAppLocation());
    window.addEventListener("popstate", syncRoute);
    return () => window.removeEventListener("popstate", syncRoute);
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !currentUser?.id) {
      setIsGalleryAdmin(false);
      return;
    }

    let cancelled = false;

    const loadAdminState = async () => {
      const { data, error } = await supabase
        .from("gallery_admins")
        .select("user_id")
        .eq("user_id", currentUser.id)
        .maybeSingle();

      if (!cancelled) {
        setIsGalleryAdmin(Boolean(data?.user_id) && !error);
      }
    };

    loadAdminState();
    return () => {
      cancelled = true;
    };
  }, [currentUser?.id]);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      return;
    }
    const shareId = routeState.shareId;

    if (!shareId) {
      setSharedView(null);
      setSharedViewError("");
      setSharedViewLoading(false);
      setSharedOpenedAt("");
      return;
    }

    let cancelled = false;

    const loadSharedDiagram = async () => {
      setSharedViewLoading(true);
      setSharedViewError("");

      const response = await fetch(getSharedDiagramFunctionUrl(shareId), {
        headers: {
          apikey: supabasePublishableKey,
        },
      });

      let row = null;
      let errorMessage = "";

      try {
        const payload = await response.json();
        if (!response.ok) {
          errorMessage = payload?.error || "This shared link is unavailable.";
        } else {
          row = payload;
        }
      } catch (_error) {
        errorMessage = response.ok ? "Unable to read the shared diagram response." : "This shared link is unavailable.";
      }

      if (cancelled) return;

      if (!response.ok || !row) {
        setSharedView(null);
        setSharedViewError(errorMessage || "This shared link is unavailable.");
        setSharedViewLoading(false);
        return;
      }

      if (isExpiredTimestamp(row.share_expires_at)) {
        setSharedView(null);
        setSharedViewError("This shared link has expired.");
        setSharedViewLoading(false);
        return;
      }

      const normalizedData = normalizeStoredDiagramData(row.diagram_data);
      const nextTitle = row.title || defaultDocumentTitle;
      const nextCode = sanitizeMermaidCode(row.mermaid_code || buildMermaidCode(normalizedData));

      codeSourceRef.current = "code";
      setSharedView(row);
      setCurrentDiagramId("");
      setDocumentTitle(nextTitle);
      setData(normalizedData);
      setCodeInput(nextCode);
      setAutoSaveState("idle");
      setStorageMessage("");
      setStorageError("");
      setSharedOpenedAt(new Date().toISOString());
      setSharedViewLoading(false);
    };

    loadSharedDiagram();

    return () => {
      cancelled = true;
    };
  }, [routeState.shareId]);

  useEffect(() => {
    if (!isSupabaseConfigured || !routeState.gallery || routeState.shareId || routeState.admin) {
      setGalleryItems([]);
      setGalleryLoading(false);
      setGalleryError("");
      setGalleryOffset(0);
      setGalleryHasMore(false);
      return;
    }

    let cancelled = false;

    const loadGallery = async () => {
      setGalleryLoading(true);
      setGalleryError("");
      setGalleryOffset(0);

      try {
        const response = await fetch(`${getPublicGalleryFunctionUrl()}?offset=0&limit=12`, {
          headers: {
            apikey: supabasePublishableKey,
          },
        });

        const payload = await response.json();
        if (cancelled) return;

        if (!response.ok) {
          setGalleryItems([]);
          setGalleryError(payload?.error || "Unable to load the gallery right now.");
        } else {
          setGalleryItems(Array.isArray(payload?.items) ? payload.items : []);
          setGalleryHasMore(Boolean(payload?.hasMore));
        }
      } catch (_error) {
        if (!cancelled) {
          setGalleryItems([]);
          setGalleryError("Unable to load the gallery right now.");
          setGalleryHasMore(false);
        }
      }

      if (!cancelled) {
        setGalleryLoading(false);
      }
    };

    loadGallery();
    return () => {
      cancelled = true;
    };
  }, [routeState.admin, routeState.gallery, routeState.shareId]);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !routeState.admin || routeState.shareId || !isAuthenticated) {
      setAdminQueue([]);
      setAdminLoading(false);
      setAdminError("");
      setAdminOffset(0);
      setAdminHasMore(false);
      return;
    }

    let cancelled = false;

    const loadAdminQueue = async () => {
      setAdminLoading(true);
      setAdminError("");
      setAdminOffset(0);

      try {
        const { data: authData } = await supabase.auth.getSession();
        const accessToken = authData?.session?.access_token;
        const response = await fetch(`${getAdminModerationFunctionUrl()}?offset=0&limit=10`, {
          headers: {
            apikey: supabasePublishableKey,
            Authorization: `Bearer ${accessToken || ""}`,
          },
        });

        const payload = await response.json();
        if (cancelled) return;

        if (!response.ok) {
          setAdminQueue([]);
          setAdminError(payload?.error || t.adminAccessDenied);
        } else {
          setAdminQueue(Array.isArray(payload?.items) ? payload.items : []);
          setAdminHasMore(Boolean(payload?.hasMore));
        }
      } catch (_error) {
        if (!cancelled) {
          setAdminQueue([]);
          setAdminError(t.adminAccessDenied);
          setAdminHasMore(false);
        }
      }

      if (!cancelled) {
        setAdminLoading(false);
      }
    };

    loadAdminQueue();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, routeState.admin, routeState.shareId, t.adminAccessDenied]);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !isAuthenticated || !currentDiagramId) {
      setVersionHistory([]);
      setLoadingVersionHistory(false);
      return;
    }

    let cancelled = false;

    const loadVersions = async () => {
      setLoadingVersionHistory(true);
      const { data: rows, error } = await supabase
        .from("driver_diagram_versions")
        .select("id, diagram_id, title, mermaid_code, diagram_data, save_source, created_at")
        .eq("diagram_id", currentDiagramId)
        .order("created_at", { ascending: false })
        .limit(12);

      if (cancelled) return;

      if (error) {
        setStorageError(error.message || "Unable to load version history.");
      } else {
        setVersionHistory(rows || []);
      }
      setLoadingVersionHistory(false);
    };

    loadVersions();
    return () => {
      cancelled = true;
    };
  }, [currentDiagramId, isAuthenticated]);

  useEffect(() => {
    const sharedTitle = documentTitle || sharedView?.title || defaultDocumentTitle;

    if (sharedViewLoading) {
      updateDocumentPresentation({
        title: t.metaLoadingSharedTitle,
        description: t.metaLoadingSharedDescription,
      });
      return;
    }

    if (sharedViewError) {
      updateDocumentPresentation({
        title: t.metaUnavailableTitle,
        description: t.metaUnavailableDescription,
      });
      return;
    }

    if (isReadOnlySharedView) {
      updateDocumentPresentation({
        title: `${sharedTitle} | ${t.metaSharedTitleSuffix}`,
        description: t.metaSharedDescription,
      });
      return;
    }

    if (isGalleryView) {
      updateDocumentPresentation({
        title: t.galleryTitle,
        description: t.galleryDescription,
      });
      return;
    }

    if (isAdminView) {
      updateDocumentPresentation({
        title: t.adminModerationTitle,
        description: t.adminModerationDescription,
      });
      return;
    }

    updateDocumentPresentation({
      title: t.appTitle,
      description: t.metaAppDescription,
    });
  }, [documentTitle, isAdminView, isGalleryView, isReadOnlySharedView, sharedView, sharedViewError, sharedViewLoading, t]);

  useEffect(() => {
    if (!isSupabaseConfigured || !isAuthenticated || !currentDiagramId) {
      setAutoSaveState("idle");
      return;
    }

    if (currentSnapshot !== lastSavedSnapshotRef.current) {
      setAutoSaveState("dirty");
      return;
    }

    if (!savingDiagram) {
      setAutoSaveState("saved");
    }
  }, [currentSnapshot, currentDiagramId, isAuthenticated, savingDiagram]);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setAuthLoading(false);
      return;
    }

    let cancelled = false;

    const syncAuthState = (nextSession) => {
      if (cancelled) return;

      const nextUser = nextSession?.user ?? null;
      const nextUserId = nextUser?.id || "";
      const previousUserId = previousUserIdRef.current;

      previousUserIdRef.current = nextUserId;
      setSession(nextSession);
      setCurrentUser(nextUser);

      if (previousUserId && previousUserId !== nextUserId) {
        setCurrentDiagramId("");
        setSavedDiagrams([]);
        setAutoSaveState("idle");
        cancelRenamingDiagram();
        setStorageMessage("");
        setStorageError("");
      }

      if (!nextUserId) {
        setCurrentDiagramId("");
        setSavedDiagrams([]);
        setAutoSaveState("idle");
        cancelRenamingDiagram();
      }
    };

    const initializeAuth = async () => {
      setAuthLoading(true);

      const params = new URLSearchParams(window.location.search);
      const tokenHash = params.get("token_hash");
      const type = params.get("type");

      if (tokenHash) {
        setAuthVerifyingLink(true);
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type || "email",
        });

        if (cancelled) return;

        if (error) {
          setAuthError(error.message || "Unable to verify your sign-in link.");
        } else {
          setAuthError("");
          setAuthMessage("Signed in successfully.");
          const nextParams = new URLSearchParams(window.location.search);
          nextParams.delete("token_hash");
          nextParams.delete("type");
          replaceAppLocation(nextParams);
          setRouteState(readAppLocation());
        }

        setAuthVerifyingLink(false);
      }

      const { data: authData, error } = await supabase.auth.getSession();

      if (cancelled) return;

      if (error) {
        setAuthError(error.message || "Unable to restore your session.");
      } else {
        syncAuthState(authData.session);
      }

      setAuthLoading(false);
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      syncAuthState(nextSession);
      setAuthLoading(false);
      setAuthVerifyingLink(false);

      if (event === "SIGNED_IN") {
        setAuthError("");
        setAuthMessage("Signed in successfully.");
      }

      if (event === "SIGNED_OUT") {
        setAuthError("");
        setAuthMessage("Signed out.");
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !currentUser?.id) {
      setSavedDiagrams([]);
      setLoadingSavedDiagrams(false);
      return;
    }

    let cancelled = false;

    const loadSavedDiagrams = async () => {
      setLoadingSavedDiagrams(true);
      const { data: rows, error } = await supabase
        .from("driver_diagrams")
        .select(savedDiagramSelectFields)
        .order("updated_at", { ascending: false });

      if (cancelled) return;

      if (error) {
        setStorageError(error.message || "Unable to load saved diagrams.");
      } else {
        setSavedDiagrams(await enrichSavedDiagramsWithGalleryState(rows || []));
      }
      setLoadingSavedDiagrams(false);
    };

    loadSavedDiagrams();
    return () => {
      cancelled = true;
    };
  }, [currentUser?.id]);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !isAuthenticated || !currentDiagramId) {
      return;
    }
    if (currentSnapshot === lastSavedSnapshotRef.current) {
      return;
    }
    if (savingDiagram || loadingSavedDiagrams || openingDiagramId || deletingDiagramId) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      saveDiagram({ isAuto: true });
    }, 1500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [currentSnapshot, currentDiagramId, deletingDiagramId, isAuthenticated, loadingSavedDiagrams, openingDiagramId, savingDiagram]);

  useEffect(() => {
    let cancelled = false;
    const id = ++renderId.current;

    async function renderDiagram() {
      try {
        const sanitizedCode = sanitizeMermaidCode(codeInput);
        if (!mermaidRef.current) {
          const { default: mermaid } = await import("mermaid/dist/mermaid.esm.min.mjs");
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

        const result = await mermaidRef.current.render(`driver-diagram-${id}`, sanitizedCode);
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
  }, [codeInput]);

  useEffect(() => {
    if (!previewModalOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setPreviewModalOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewModalOpen]);

  const updatePurpose = (field, value) => {
    codeSourceRef.current = "form";
    setData((d) => ({ ...d, purpose: { ...d.purpose, [field]: value } }));
  };

  const resetStorageNotice = () => {
    setStorageError("");
    setStorageMessage("");
    setLastSharedUrl("");
  };

  const zoomPreviewIn = () => {
    setPreviewZoom((current) => Math.min(PREVIEW_ZOOM_MAX, Number((current + PREVIEW_ZOOM_STEP).toFixed(2))));
  };

  const zoomPreviewOut = () => {
    setPreviewZoom((current) => Math.max(PREVIEW_ZOOM_MIN, Number((current - PREVIEW_ZOOM_STEP).toFixed(2))));
  };

  const resetPreviewZoom = () => {
    setPreviewZoom(1);
  };

  const openPreviewModal = () => {
    setPreviewModalOpen(true);
  };

  const closePreviewModal = () => {
    setPreviewModalOpen(false);
  };

  const upsertSavedDiagram = (row) => {
    if (!row) return;

    setSavedDiagrams((items) => {
      const existing = items.find((item) => item.id === row.id) || {};
      const next = [{ ...existing, ...row }, ...items.filter((item) => item.id !== row.id)];
      return sortSavedDiagrams(next, "updated_desc");
    });
  };

  const refreshVersionHistory = async (diagramId = currentDiagramId) => {
    if (!supabase || !currentUser?.id || !diagramId) {
      setVersionHistory([]);
      return;
    }

    setLoadingVersionHistory(true);
    const { data: rows, error } = await supabase
      .from("driver_diagram_versions")
      .select("id, diagram_id, title, mermaid_code, diagram_data, save_source, created_at")
      .eq("diagram_id", diagramId)
      .order("created_at", { ascending: false })
      .limit(12);

    if (error) {
      setStorageError(error.message || "Unable to refresh version history.");
    } else {
      setVersionHistory(rows || []);
    }
    setLoadingVersionHistory(false);
  };

  const pruneDiagramVersions = async (diagramId) => {
    if (!supabase || !currentUser?.id || !diagramId) return null;

    const { data: extraAutosaves, error: autosaveError } = await supabase
      .from("driver_diagram_versions")
      .select("id")
      .eq("diagram_id", diagramId)
      .eq("save_source", "autosave")
      .order("created_at", { ascending: false })
      .range(MAX_AUTOSAVE_VERSIONS, MAX_AUTOSAVE_VERSIONS + 99);

    if (autosaveError) return autosaveError;

    if (extraAutosaves?.length) {
      const { error } = await supabase
        .from("driver_diagram_versions")
        .delete()
        .in("id", extraAutosaves.map((item) => item.id));

      if (error) return error;
    }

    const { data: extraVersions, error: totalError } = await supabase
      .from("driver_diagram_versions")
      .select("id")
      .eq("diagram_id", diagramId)
      .order("created_at", { ascending: false })
      .range(MAX_VERSION_HISTORY, MAX_VERSION_HISTORY + 199);

    if (totalError) return totalError;

    if (extraVersions?.length) {
      const { error } = await supabase
        .from("driver_diagram_versions")
        .delete()
        .in("id", extraVersions.map((item) => item.id));

      if (error) return error;
    }

    return null;
  };

  const createDiagramVersion = async ({ diagramId, title, diagramData, mermaidCode, saveSource }) => {
    if (!supabase || !currentUser?.id || !diagramId) return null;

    const { error } = await supabase.from("driver_diagram_versions").insert({
      diagram_id: diagramId,
      user_id: currentUser.id,
      title,
      diagram_data: normalizeStoredDiagramData(diagramData),
      mermaid_code: sanitizeMermaidCode(mermaidCode),
      save_source: saveSource,
    });

    if (error) return error;

    return pruneDiagramVersions(diagramId);
  };

  const syncSharedDiagramLink = async ({ diagramRow, diagramData, mermaidCode }) => {
    if (!supabase || !currentUser?.id || !diagramRow?.id || !diagramRow?.share_id) return null;

    const normalizedData = resolveDiagramDataForEditor(
      diagramData || diagramRow.diagram_data,
      mermaidCode || diagramRow.mermaid_code
    );
    const normalizedCode = sanitizeMermaidCode(mermaidCode || diagramRow.mermaid_code || buildMermaidCode(normalizedData));
    const thumbnailSvg = buildStoredThumbnailSvg(normalizedData, normalizedCode);

    const { error } = await supabase.from("shared_driver_diagrams").upsert(
      {
        diagram_id: diagramRow.id,
        user_id: currentUser.id,
        share_token: diagramRow.share_id,
        title: diagramRow.title || defaultDocumentTitle,
        purpose_title: diagramRow.purpose_title || normalizedData.purpose.title || "",
        diagram_data: normalizedData,
        mermaid_code: normalizedCode,
        thumbnail_svg: thumbnailSvg,
        shared_at: diagramRow.shared_at || new Date().toISOString(),
        expires_at: diagramRow.share_expires_at || null,
        revoked_at: diagramRow.share_revoked_at || null,
      },
      { onConflict: "diagram_id" }
    );

    return error || null;
  };

  const applyDiagramToEditor = ({ title, diagramData, mermaidCode }) => {
    const normalizedData = resolveDiagramDataForEditor(diagramData, mermaidCode);
    const nextTitle = title || defaultDocumentTitle;
    const nextCode = sanitizeMermaidCode(mermaidCode || buildMermaidCode(normalizedData));

    codeSourceRef.current = "code";
    setDocumentTitle(nextTitle);
    setData(normalizedData);
    setCodeInput(nextCode);
    setCodeSyncError("");
    setCodeSyncMessage("");

    return { normalizedData, nextTitle, nextCode };
  };

  const refreshSavedDiagrams = async () => {
    if (!isSupabaseConfigured || !supabase) {
      setStorageError("Add Supabase env vars before loading saved diagrams.");
      return;
    }
    if (!currentUser?.id) {
      setStorageError("Sign in before loading saved diagrams.");
      return;
    }

    setLoadingSavedDiagrams(true);
    const { data: rows, error } = await supabase
      .from("driver_diagrams")
      .select(savedDiagramSelectFields)
      .order("updated_at", { ascending: false });

    if (error) {
      setStorageError(error.message || "Unable to refresh saved diagrams.");
    } else {
      setSavedDiagrams(await enrichSavedDiagramsWithGalleryState(rows || []));
      setStorageError("");
    }
    setLoadingSavedDiagrams(false);
  };

  const startNewDiagram = () => {
    codeSourceRef.current = "form";
    lastSavedSnapshotRef.current = buildDiagramSnapshot(
      defaultDocumentTitle,
      defaultData,
      buildMermaidCode(defaultData)
    );
    lastVersionSnapshotRef.current = buildDiagramSnapshot(
      defaultDocumentTitle,
      defaultData,
      buildMermaidCode(defaultData)
    );
    setCurrentDiagramId("");
    setDocumentTitle(defaultDocumentTitle);
    setData(normalizeStoredDiagramData(defaultData));
    setCodeInput(buildMermaidCode(defaultData));
    setAutoSaveState("idle");
    setVersionHistory([]);
    cancelRenamingDiagram();
    resetStorageNotice();
    setCodeSyncError("");
    setCodeSyncMessage("");
  };

  const addPrimary = () => {
    codeSourceRef.current = "form";
    setData((d) => ({
      ...d,
      primaryDrivers: [
        ...d.primaryDrivers,
        { id: uid(), title: "Primary Driver ใหม่", kpi: "ระบุ KPI", secondaryDrivers: [] },
      ],
    }));
  };

  const updatePrimary = (pi, field, value) => {
    codeSourceRef.current = "form";
    setData((d) => ({
      ...d,
      primaryDrivers: d.primaryDrivers.map((p, i) => (i === pi ? { ...p, [field]: value } : p)),
    }));
  };

  const removePrimary = (pi) => {
    codeSourceRef.current = "form";
    setData((d) => ({ ...d, primaryDrivers: d.primaryDrivers.filter((_, i) => i !== pi) }));
  };

  const addSecondary = (pi) => {
    codeSourceRef.current = "form";
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
    codeSourceRef.current = "form";
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
    codeSourceRef.current = "form";
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
    codeSourceRef.current = "form";
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
    codeSourceRef.current = "form";
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
    codeSourceRef.current = "form";
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

  const saveDiagram = async ({ isAuto = false } = {}) => {
    if (!isSupabaseConfigured || !supabase) {
      setStorageError("Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY before saving.");
      return;
    }
    if (!currentUser?.id) {
      setStorageError("Sign in before saving to the database.");
      return;
    }

    const normalizedCode = sanitizeMermaidCode(codeInput);
    const normalizedData = normalizeStoredDiagramData(data);
    const title = documentTitle.trim() || normalizedData.purpose.title || defaultDocumentTitle;
    const snapshot = buildDiagramSnapshot(title, normalizedData, normalizedCode);
    const thumbnailSvg = buildStoredThumbnailSvg(normalizedData, normalizedCode);

    if (isAuto && (snapshot === lastSavedSnapshotRef.current || !currentDiagramId)) {
      return;
    }

    const payload = {
      user_id: currentUser.id,
      title,
      purpose_title: normalizedData.purpose.title,
      purpose_kpi: normalizedData.purpose.kpi,
      diagram_data: normalizedData,
      mermaid_code: normalizedCode,
      thumbnail_svg: thumbnailSvg,
    };

    setSavingDiagram(true);
    if (isAuto) {
      setAutoSaveState("saving");
    }
    setStorageError("");
    if (!isAuto) {
      setStorageMessage("");
    }

    const query = currentDiagramId
      ? supabase
          .from("driver_diagrams")
          .update(payload)
          .eq("id", currentDiagramId)
          .select(savedDiagramSelectFields)
          .single()
      : supabase
          .from("driver_diagrams")
          .insert(payload)
          .select(savedDiagramSelectFields)
          .single();

    const { data: row, error } = await query;

    if (error) {
      setStorageError(error.message || "Unable to save this diagram.");
      setAutoSaveState("dirty");
      setSavingDiagram(false);
      return;
    }

    if (row) {
      setCurrentDiagramId(row.id);
      lastSavedSnapshotRef.current = snapshot;
      if (!currentDiagramId || snapshot !== lastVersionSnapshotRef.current) {
        const versionError = await createDiagramVersion({
          diagramId: row.id,
          title: row.title,
          diagramData: normalizedData,
          mermaidCode: normalizedCode,
          saveSource: isAuto ? "autosave" : currentDiagramId ? "manual" : "create",
        });
        if (versionError) {
          setStorageError("Saved the diagram, but could not record version history.");
        } else {
          lastVersionSnapshotRef.current = snapshot;
          await refreshVersionHistory(row.id);
        }
      }
      if (hasActiveShareLink(row)) {
        const sharedError = await syncSharedDiagramLink({
          diagramRow: {
            ...row,
            shared_at: row.shared_at || new Date().toISOString(),
          },
          diagramData: normalizedData,
          mermaidCode: normalizedCode,
        });
        if (sharedError) {
          setStorageError("Saved the diagram, but could not refresh the shared link snapshot.");
        }
      }
      setDocumentTitle(row.title);
      upsertSavedDiagram(row);
    }

    setAutoSaveState("saved");
    setStorageMessage(
      isAuto ? "Draft auto-saved." : currentDiagramId ? "Saved changes to database." : "Saved to database."
    );
    setSavingDiagram(false);
  };

  const openDiagram = async (diagramId) => {
    if (!isSupabaseConfigured || !supabase) {
      setStorageError("Add Supabase env vars before opening saved diagrams.");
      return;
    }
    if (!currentUser?.id) {
      setStorageError("Sign in before opening saved diagrams.");
      return;
    }

    setOpeningDiagramId(diagramId);
    setStorageError("");
    setStorageMessage("");
    const openedAt = new Date().toISOString();
    const { data: row, error } = await supabase
      .from("driver_diagrams")
      .update({ last_opened_at: openedAt })
      .eq("id", diagramId)
      .select("*")
      .single();
    setOpeningDiagramId("");

    if (error || !row) {
      setStorageError(error?.message || "Unable to open this diagram.");
      return;
    }

    const { normalizedData, nextTitle, nextCode } = applyDiagramToEditor({
      title: row.title,
      diagramData: row.diagram_data,
      mermaidCode: row.mermaid_code,
    });

    setCurrentDiagramId(row.id);
    lastSavedSnapshotRef.current = buildDiagramSnapshot(nextTitle, normalizedData, nextCode);
    lastVersionSnapshotRef.current = buildDiagramSnapshot(nextTitle, normalizedData, nextCode);
    upsertSavedDiagram(row);
    setAutoSaveState("saved");
    setCodeSyncError("");
    setCodeSyncMessage("");
    setStorageMessage("Loaded diagram from database.");
  };

  const deleteDiagram = async (diagramId) => {
    if (!isSupabaseConfigured || !supabase) {
      setStorageError("Add Supabase env vars before deleting saved diagrams.");
      return;
    }
    if (!currentUser?.id) {
      setStorageError("Sign in before deleting saved diagrams.");
      return;
    }

    if (!window.confirm("Delete this saved diagram?")) {
      return;
    }

    setDeletingDiagramId(diagramId);
    setStorageError("");
    setStorageMessage("");
    const { error } = await supabase.from("driver_diagrams").delete().eq("id", diagramId);
    setDeletingDiagramId("");

    if (error) {
      setStorageError(error.message || "Unable to delete this diagram.");
      return;
    }

    setSavedDiagrams((items) => items.filter((item) => item.id !== diagramId));
    if (currentDiagramId === diagramId) {
      startNewDiagram();
    }
    setStorageMessage("Deleted diagram from database.");
  };

  const startRenamingDiagram = (item) => {
    setRenamingDiagramId(item.id);
    setRenameDraft(item.title || item.purpose_title || defaultDocumentTitle);
    setStorageError("");
    setStorageMessage("");
  };

  const cancelRenamingDiagram = () => {
    setRenamingDiagramId("");
    setRenameDraft("");
    setRenamingDiagram(false);
  };

  const renameDiagram = async (diagramId) => {
    if (!supabase || !currentUser?.id) {
      setStorageError("Sign in before renaming saved diagrams.");
      return;
    }

    const title = renameDraft.trim();
    if (!title) {
      setStorageError("Document title cannot be empty.");
      return;
    }

    setRenamingDiagram(true);
    setStorageError("");
    const { data: row, error } = await supabase
      .from("driver_diagrams")
      .update({ title })
      .eq("id", diagramId)
      .select(savedDiagramSelectFields)
      .single();
    setRenamingDiagram(false);

    if (error || !row) {
      setStorageError(error?.message || "Unable to rename this diagram.");
      return;
    }

    upsertSavedDiagram(row);
    if (currentDiagramId === diagramId) {
      setDocumentTitle(row.title);
      lastSavedSnapshotRef.current = buildDiagramSnapshot(row.title, data, codeInput);
    }
    if (hasActiveShareLink(row)) {
      const sharedError = await supabase
        .from("shared_driver_diagrams")
        .update({ title: row.title })
        .eq("diagram_id", diagramId);

      if (sharedError.error) {
        setStorageError("Renamed the diagram, but could not update the shared link title.");
        return;
      }
    }
    cancelRenamingDiagram();
    setStorageMessage("Renamed diagram.");
  };

  const duplicateDiagram = async (diagramId) => {
    if (!supabase || !currentUser?.id) {
      setStorageError("Sign in before duplicating saved diagrams.");
      return;
    }

    setDuplicatingDiagramId(diagramId);
    setStorageError("");
    const { data: sourceRow, error: sourceError } = await supabase
      .from("driver_diagrams")
      .select("*")
      .eq("id", diagramId)
      .single();

    if (sourceError || !sourceRow) {
      setDuplicatingDiagramId("");
      setStorageError(sourceError?.message || "Unable to load the diagram to duplicate.");
      return;
    }

    const duplicateTitle = `${sourceRow.title || sourceRow.purpose_title || defaultDocumentTitle} (Copy)`;
    const { data: row, error } = await supabase
      .from("driver_diagrams")
      .insert({
        user_id: currentUser.id,
        title: duplicateTitle,
        purpose_title: sourceRow.purpose_title || "",
        purpose_kpi: sourceRow.purpose_kpi || "",
        diagram_data: normalizeStoredDiagramData(sourceRow.diagram_data),
        mermaid_code: sanitizeMermaidCode(sourceRow.mermaid_code || buildMermaidCode(sourceRow.diagram_data || defaultData)),
        thumbnail_svg: buildStoredThumbnailSvg(
          normalizeStoredDiagramData(sourceRow.diagram_data),
          sanitizeMermaidCode(sourceRow.mermaid_code || buildMermaidCode(sourceRow.diagram_data || defaultData))
        ),
        is_favorite: false,
        archived_at: null,
      })
      .select(savedDiagramSelectFields)
      .single();
    setDuplicatingDiagramId("");

    if (error || !row) {
      setStorageError(error?.message || "Unable to duplicate this diagram.");
      return;
    }

    upsertSavedDiagram(row);
    const versionError = await createDiagramVersion({
      diagramId: row.id,
      title: row.title,
      diagramData: normalizeStoredDiagramData(sourceRow.diagram_data),
      mermaidCode: sanitizeMermaidCode(sourceRow.mermaid_code || buildMermaidCode(sourceRow.diagram_data || defaultData)),
      saveSource: "duplicate",
    });
    if (versionError) {
      setStorageError("Duplicated the diagram, but could not create the first version snapshot.");
    }
    setStorageMessage("Created a duplicate.");
  };

  const toggleFavoriteDiagram = async (item) => {
    if (!supabase || !currentUser?.id) {
      setStorageError("Sign in before updating favorites.");
      return;
    }

    setStorageError("");
    const { data: row, error } = await supabase
      .from("driver_diagrams")
      .update({ is_favorite: !item.is_favorite })
      .eq("id", item.id)
      .select(savedDiagramSelectFields)
      .single();

    if (error || !row) {
      setStorageError(error?.message || "Unable to update favorite status.");
      return;
    }

    upsertSavedDiagram(row);
    setStorageMessage(row.is_favorite ? "Pinned to favorites." : "Removed from favorites.");
  };

  const toggleArchiveDiagram = async (item) => {
    if (!supabase || !currentUser?.id) {
      setStorageError("Sign in before archiving diagrams.");
      return;
    }

    const nextArchivedAt = item.archived_at ? null : new Date().toISOString();
    setStorageError("");
    const { data: row, error } = await supabase
      .from("driver_diagrams")
      .update({ archived_at: nextArchivedAt })
      .eq("id", item.id)
      .select(savedDiagramSelectFields)
      .single();

    if (error || !row) {
      setStorageError(error?.message || "Unable to update archive status.");
      return;
    }

    upsertSavedDiagram(row);
    if (currentDiagramId === item.id && row.archived_at) {
      startNewDiagram();
    }
    setStorageMessage(row.archived_at ? "Archived diagram." : "Restored diagram.");
  };

  const shareDiagram = async (item, { regenerate = false } = {}) => {
    if (!supabase || !currentUser?.id) {
      setStorageError("Sign in before sharing diagrams.");
      return;
    }

    setSharingDiagramId(item.id);
    setStorageError("");
    let row = item;
    const needsNewShareLink = regenerate || !hasActiveShareLink(item);

    if (needsNewShareLink) {
      const { data, error } = await supabase
        .from("driver_diagrams")
        .update({
          share_id: regenerate || !item.share_id ? crypto.randomUUID() : item.share_id,
          shared_at: new Date().toISOString(),
          share_expires_at: getNextShareExpiry(),
          share_revoked_at: null,
        })
        .eq("id", item.id)
        .select(savedDiagramSelectFields)
        .single();

      if (error || !data) {
        setSharingDiagramId("");
        setStorageError(error?.message || "Unable to create a share link.");
        return;
      }

      row = data;
      upsertSavedDiagram(row);
    }

    const { data: sourceRow, error: sourceError } = await supabase
      .from("driver_diagrams")
      .select("*")
      .eq("id", item.id)
      .single();

    if (sourceError || !sourceRow) {
      setSharingDiagramId("");
      setStorageError(sourceError?.message || "Unable to load the diagram for sharing.");
      return;
    }

    const sharedError = await syncSharedDiagramLink({
      diagramRow: sourceRow,
      diagramData: sourceRow.diagram_data,
      mermaidCode: sourceRow.mermaid_code,
    });

    if (sharedError) {
      setSharingDiagramId("");
      setStorageError("Unable to publish the shared snapshot.");
      return;
    }

    const shareUrl = `${window.location.origin}${window.location.pathname}?share=${row.share_id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch (error) {
      setSharingDiagramId("");
      setStorageError(error?.message || "Unable to copy the share link.");
      return;
    }
    setSharingDiagramId("");
    setLastSharedUrl(shareUrl);
    setStorageMessage(
      needsNewShareLink
        ? "Read-only share link copied. It will expire in 7 days."
        : "Read-only share link copied. Anyone with the link can preview and export this diagram."
    );
  };

  const revokeShareDiagram = async (item) => {
    if (!supabase || !currentUser?.id) {
      setStorageError("Sign in before revoking share links.");
      return;
    }

    setSharingDiagramId(item.id);
    setStorageError("");
    const { data: row, error } = await supabase
      .from("driver_diagrams")
      .update({ share_revoked_at: new Date().toISOString() })
      .eq("id", item.id)
      .select(savedDiagramSelectFields)
      .single();
    setSharingDiagramId("");

    if (error || !row) {
      setStorageError(error?.message || "Unable to revoke this share link.");
      return;
    }

    const sharedRow = await supabase
      .from("shared_driver_diagrams")
      .update({ revoked_at: new Date().toISOString() })
      .eq("diagram_id", item.id);

    if (sharedRow.error) {
      setStorageError("Revoked the local share state, but could not revoke the published snapshot.");
      return;
    }

    upsertSavedDiagram(row);
    setLastSharedUrl("");
    setStorageMessage("Share link revoked.");
  };

  const toggleGallerySubmission = async (item, { publish }) => {
    if (!supabase || !currentUser?.id) {
      setStorageError("Sign in before sending diagrams to the gallery.");
      return;
    }

    setGallerySubmittingId(item.id);
    setStorageError("");

    let row = item;
    if (publish && !hasActiveShareLink(item)) {
      const { data, error } = await supabase
        .from("driver_diagrams")
        .update({
          share_id: item.share_id || crypto.randomUUID(),
          shared_at: new Date().toISOString(),
          share_expires_at: getNextShareExpiry(),
          share_revoked_at: null,
        })
        .eq("id", item.id)
        .select(savedDiagramSelectFields)
        .single();

      if (error || !data) {
        setGallerySubmittingId("");
        setStorageError(error?.message || "Unable to prepare this diagram for the gallery.");
        return;
      }

      row = data;
      upsertSavedDiagram(row);
    }

    const { data: sourceRow, error: sourceError } = await supabase
      .from("driver_diagrams")
      .select("*")
      .eq("id", item.id)
      .single();

    if (sourceError || !sourceRow) {
      setGallerySubmittingId("");
      setStorageError(sourceError?.message || "Unable to load the diagram for the gallery.");
      return;
    }

    const sharedError = await syncSharedDiagramLink({
      diagramRow: sourceRow,
      diagramData: sourceRow.diagram_data,
      mermaidCode: sourceRow.mermaid_code,
    });

    if (sharedError) {
      setGallerySubmittingId("");
      setStorageError("Unable to refresh the shared snapshot for the gallery.");
      return;
    }

    const nextSubmittedAt = publish ? new Date().toISOString() : null;
    const nextDisplayName = publish ? buildGalleryDisplayName(galleryDisplayName, currentUser.email || "") : "";
    const galleryPayload = {
      is_public_gallery: publish,
      gallery_submitted_at: nextSubmittedAt,
      gallery_submitter_name: nextDisplayName,
    };

    const { error: galleryError } = await supabase
      .from("shared_driver_diagrams")
      .update(galleryPayload)
      .eq("diagram_id", item.id);

    setGallerySubmittingId("");

    if (galleryError) {
      setStorageError(galleryError.message || "Unable to update gallery status.");
      return;
    }

    upsertSavedDiagram({
      ...row,
      ...galleryPayload,
    });
    setStorageMessage(publish ? "Submitted this diagram to the gallery." : "Removed this diagram from the gallery.");
  };

  const reportGalleryItem = async (item) => {
    if (!supabaseUrl || !item?.share_token) {
      setGalleryError(t.reportGalleryFailed);
      return;
    }

    const reason = window.prompt(t.reportGalleryPrompt, "");
    if (reason === null) {
      return;
    }

    setReportingGalleryToken(item.share_token);
    setGalleryError("");

    try {
      const response = await fetch(getReportGalleryFunctionUrl(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabasePublishableKey,
        },
        body: JSON.stringify({
          shareToken: item.share_token,
          reason: String(reason || "").trim(),
          reporterEmail: currentUser?.email || "",
        }),
      });

      let payload = {};
      try {
        payload = await response.json();
      } catch (_error) {
        payload = {};
      }

      if (!response.ok) {
        setGalleryError(payload?.error || t.reportGalleryFailed);
        return;
      }

      setStorageMessage(t.reportGallerySuccess);
    } catch (_error) {
      setGalleryError(t.reportGalleryFailed);
    } finally {
      setReportingGalleryToken("");
    }
  };

  const loadMoreGalleryItems = async () => {
    if (galleryLoading || !galleryHasMore) return;

    const nextOffset = galleryItems.length;
    setGalleryLoading(true);
    try {
      const response = await fetch(`${getPublicGalleryFunctionUrl()}?offset=${nextOffset}&limit=12`, {
        headers: {
          apikey: supabasePublishableKey,
        },
      });
      const payload = await response.json();

      if (!response.ok) {
        setGalleryError(payload?.error || "Unable to load the gallery right now.");
        return;
      }

      const nextItems = Array.isArray(payload?.items) ? payload.items : [];
      setGalleryItems((current) => [...current, ...nextItems]);
      setGalleryOffset(nextOffset);
      setGalleryHasMore(Boolean(payload?.hasMore));
    } catch (_error) {
      setGalleryError("Unable to load the gallery right now.");
    } finally {
      setGalleryLoading(false);
    }
  };

  const runModerationAction = async (shareToken, action) => {
    if (!supabase || !shareToken || !action) return;

    const note = window.prompt(t.moderationReasonPrompt, "");
    if (note === null) {
      return;
    }

    setModerationActionToken(shareToken);
    setAdminError("");
    try {
      const { data: authData } = await supabase.auth.getSession();
      const accessToken = authData?.session?.access_token;
      const response = await fetch(getAdminModerationFunctionUrl(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabasePublishableKey,
          Authorization: `Bearer ${accessToken || ""}`,
        },
        body: JSON.stringify({
          action,
          shareToken,
          note: String(note || "").trim(),
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        setAdminError(payload?.error || t.adminAccessDenied);
        return;
      }

      setStorageMessage(t.moderationUpdated);
      setAdminQueue((current) =>
        current.map((item) => {
          if (item.share_token !== shareToken) return item;
          if (action === "hide") {
            return {
              ...item,
              is_public_gallery: false,
              gallery_hidden_at: new Date().toISOString(),
              gallery_hidden_reason: String(note || "").trim(),
              report_count: 0,
              recent_reports: [],
            };
          }
          if (action === "restore") {
            return {
              ...item,
              is_public_gallery: true,
              gallery_hidden_at: null,
              gallery_hidden_reason: "",
            };
          }
          if (action === "resolve_reports") {
            return {
              ...item,
              report_count: 0,
              recent_reports: [],
            };
          }
          return item;
        })
      );
    } catch (_error) {
      setAdminError(t.adminAccessDenied);
    } finally {
      setModerationActionToken("");
    }
  };

  const loadMoreAdminQueue = async () => {
    if (!supabase || adminLoading || !adminHasMore) return;

    setAdminLoading(true);
    const nextOffset = adminQueue.length;

    try {
      const { data: authData } = await supabase.auth.getSession();
      const accessToken = authData?.session?.access_token;
      const response = await fetch(`${getAdminModerationFunctionUrl()}?offset=${nextOffset}&limit=10`, {
        headers: {
          apikey: supabasePublishableKey,
          Authorization: `Bearer ${accessToken || ""}`,
        },
      });
      const payload = await response.json();

      if (!response.ok) {
        setAdminError(payload?.error || t.adminAccessDenied);
        return;
      }

      const nextItems = Array.isArray(payload?.items) ? payload.items : [];
      setAdminQueue((current) => [...current, ...nextItems]);
      setAdminOffset(nextOffset);
      setAdminHasMore(Boolean(payload?.hasMore));
    } catch (_error) {
      setAdminError(t.adminAccessDenied);
    } finally {
      setAdminLoading(false);
    }
  };

  const restoreVersion = async (version, { saveImmediately = false } = {}) => {
    setRestoringVersionId(version.id);
    setStorageError("");
    try {
      const { normalizedData, nextTitle, nextCode } = applyDiagramToEditor({
        title: version.title,
        diagramData: version.diagram_data,
        mermaidCode: version.mermaid_code,
      });

      if (saveImmediately && currentDiagramId && supabase && currentUser?.id) {
        setRestoringAndSavingVersionId(version.id);
        const payload = {
          title: nextTitle,
          purpose_title: normalizedData.purpose.title,
          purpose_kpi: normalizedData.purpose.kpi,
          diagram_data: normalizedData,
          mermaid_code: nextCode,
        };

        const { data: row, error } = await supabase
          .from("driver_diagrams")
          .update(payload)
          .eq("id", currentDiagramId)
          .select(savedDiagramSelectFields)
          .single();

        if (error || !row) {
          setStorageError(error?.message || "Unable to restore this version to the database.");
          return;
        }

        lastSavedSnapshotRef.current = buildDiagramSnapshot(nextTitle, normalizedData, nextCode);
        const versionError = await createDiagramVersion({
          diagramId: row.id,
          title: row.title,
          diagramData: normalizedData,
          mermaidCode: nextCode,
          saveSource: "restore",
        });
        if (versionError) {
          setStorageError("Restored the diagram, but could not record the restore in version history.");
        } else {
          lastVersionSnapshotRef.current = buildDiagramSnapshot(nextTitle, normalizedData, nextCode);
          await refreshVersionHistory(row.id);
        }
        upsertSavedDiagram(row);
        setAutoSaveState("saved");
        setStorageMessage("Version restored and saved to the database.");
        return;
      }

      setStorageMessage("Version restored to the editor only. Save or wait for auto-save to make it the latest version.");
    } finally {
      setRestoringVersionId("");
      setRestoringAndSavingVersionId("");
    }
  };

  const openGalleryPage = () => {
    const params = new URLSearchParams(window.location.search);
    params.delete("share");
    params.delete("admin");
    params.delete("token_hash");
    params.delete("type");
    params.set("gallery", "1");
    replaceAppLocation(params);
    setRouteState(readAppLocation());
  };

  const openAdminPage = () => {
    const params = new URLSearchParams(window.location.search);
    params.delete("share");
    params.delete("gallery");
    params.set("admin", "1");
    replaceAppLocation(params);
    setRouteState(readAppLocation());
  };

  const exitGalleryPage = () => {
    const params = new URLSearchParams(window.location.search);
    params.delete("gallery");
    params.delete("share");
    replaceAppLocation(params);
    setRouteState(readAppLocation());
  };

  const exitAdminPage = () => {
    const params = new URLSearchParams(window.location.search);
    params.delete("admin");
    params.delete("share");
    replaceAppLocation(params);
    setRouteState(readAppLocation());
  };

  const exitSharedView = () => {
    const params = new URLSearchParams(window.location.search);
    params.delete("share");
    replaceAppLocation(params);
    setRouteState(readAppLocation());
    setSharedView(null);
    setSharedViewError("");
    startNewDiagram();
  };

  const copyMermaid = async () => {
    await navigator.clipboard.writeText("```mermaid\n" + sanitizeMermaidCode(codeInput) + "\n```");
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const triggerBlobDownload = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const saveBlobWithPicker = async (blob, filename, options = {}) => {
    if (typeof window.showSaveFilePicker !== "function") {
      triggerBlobDownload(blob, filename);
      return;
    }

    const handle = await window.showSaveFilePicker({
      suggestedName: filename,
      types: [
        {
          description: options.description || "File",
          accept: {
            [blob.type || "application/octet-stream"]: options.extensions || [`.${filename.split(".").pop()}`],
          },
        },
      ],
    });
    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();
  };

  const getExportableSvgMarkup = (svgMarkup) =>
    String(svgMarkup || "")
      .replace(/<br(\s[^>]*)?>/gi, (_match, attrs = "") => `<br${attrs.trim() ? attrs : ""}/>`); 

  const downloadMermaid = () => {
    const blob = new Blob([sanitizeMermaidCode(codeInput)], { type: "text/plain;charset=utf-8" });
    triggerBlobDownload(blob, buildExportFilename(documentTitle, "mmd"));
  };

  const downloadSvg = () => {
    let exportData = data;
    try {
      exportData = parseMermaidCode(sanitizeMermaidCode(codeInput));
    } catch (_error) {
      exportData = data;
    }
    const blob = new Blob([buildTemplateSvg(exportData)], { type: "image/svg+xml;charset=utf-8" });
    triggerBlobDownload(blob, buildExportFilename(documentTitle, "svg"));
  };

  const downloadDocx = async () => {
    try {
      setExportError("");
      setExportingDocx(true);
      const {
        AlignmentType,
        BorderStyle,
        Document,
        Packer,
        Paragraph,
        Table,
        TableCell,
        TableRow,
        TextRun,
        VerticalAlign,
        WidthType,
      } = await import("docx");

      const bodyFont = "TH SarabunPSK";
      const sizeBody = 32;
      const sizeHeading = 36;
      const purposeKpiLines = String(data.purpose.kpi || "")
        .split("\n")
        .filter((line) => line.trim());
      const borderAll = {
        top: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
        bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
        left: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
        right: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
      };

      const makeKpiRuns = (kpiText) => {
        const [first, ...rest] = String(kpiText || "").split("\n").filter((line) => line.trim());
        const lines = [first, ...rest].filter(Boolean);
        return lines.flatMap((line, index) => [
          new TextRun({
            text: index === 0 ? `KPI: ${line}` : line,
            italics: true,
            color: "666666",
            font: bodyFont,
            size: 28,
          }),
          ...(index < lines.length - 1 ? [new TextRun({ break: 1, font: bodyFont, size: 28 })] : []),
        ]);
      };

      const makeContentCell = (title, kpi, rowSpan = 1) =>
        new TableCell({
          rowSpan,
          verticalAlign: VerticalAlign.CENTER,
          width: { size: 33, type: WidthType.PERCENTAGE },
          margins: { top: 120, bottom: 120, left: 120, right: 120 },
          borders: borderAll,
          children: [
            new Paragraph({
              spacing: { after: 300 },
              children: [
                new TextRun({
                  text: title,
                  bold: true,
                  font: bodyFont,
                  size: sizeBody,
                }),
              ],
            }),
            new Paragraph({
              spacing: { after: 300 },
              children: makeKpiRuns(kpi),
            }),
          ],
        });

      const tableRows = [
        new TableRow({
          tableHeader: true,
          children: [
            "Primary Drivers & KPIs",
            "Secondary Drivers & KPIs",
            "Change Ideas & KPIs",
          ].map(
            (heading) =>
              new TableCell({
                width: { size: 33, type: WidthType.PERCENTAGE },
                borders: borderAll,
                shading: { fill: "F0F0F0" },
                margins: { top: 120, bottom: 120, left: 120, right: 120 },
                verticalAlign: VerticalAlign.CENTER,
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 300 },
                    children: [
                      new TextRun({
                        text: heading,
                        bold: true,
                        font: bodyFont,
                        size: sizeBody,
                      }),
                    ],
                  }),
                ],
              })
          ),
        }),
      ];

      data.primaryDrivers.forEach((primary) => {
        const secondaryGroups = primary.secondaryDrivers.length
          ? primary.secondaryDrivers
          : [{ title: "", kpi: "", changeIdeas: [{ title: "", kpi: "" }] }];
        const primarySpan = secondaryGroups.reduce(
          (sum, secondary) => sum + Math.max(secondary.changeIdeas.length, 1),
          0
        );
        let primaryPlaced = false;

        secondaryGroups.forEach((secondary) => {
          const changes = secondary.changeIdeas.length
            ? secondary.changeIdeas
            : [{ title: "", kpi: "" }];
          let secondaryPlaced = false;

          changes.forEach((change) => {
            const cells = [];

            if (!primaryPlaced) {
              cells.push(makeContentCell(primary.title, primary.kpi, primarySpan));
              primaryPlaced = true;
            }

            if (!secondaryPlaced) {
              cells.push(makeContentCell(secondary.title, secondary.kpi, changes.length));
              secondaryPlaced = true;
            }

            cells.push(makeContentCell(change.title, change.kpi));
            tableRows.push(new TableRow({ children: cells }));
          });
        });
      });

      const doc = new Document({
        sections: [
          {
            children: [
              new Paragraph({
                spacing: { after: 100 },
                children: [
                  new TextRun({
                    text: `เป้าหมาย: ${data.purpose.title}`,
                    bold: true,
                    font: bodyFont,
                    size: sizeHeading,
                  }),
                ],
              }),
              new Paragraph({
                spacing: { after: 120 },
                children: [
                  new TextRun({
                    text: "PURPOSE KPI:",
                    bold: true,
                    font: bodyFont,
                    size: sizeBody,
                  }),
                  ...purposeKpiLines.flatMap((line, index) => [
                      new TextRun({
                        text: index === 0 ? ` ${line}` : line,
                        font: bodyFont,
                        size: sizeBody,
                      }),
                      ...(index < purposeKpiLines.length - 1
                        ? [new TextRun({ break: 1, font: bodyFont, size: sizeBody })]
                        : []),
                    ]),
                ],
              }),
              new Paragraph({
                spacing: { after: 150 },
                children: [
                  new TextRun({
                    text: "1. Driver Diagram",
                    bold: true,
                    color: "333333",
                    font: bodyFont,
                    size: sizeHeading,
                  }),
                ],
              }),
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                columnWidths: [3259, 3062, 3023],
                rows: tableRows,
                margins: { top: 15, bottom: 15, left: 15, right: 15 },
                layout: "fixed",
              }),
              new Paragraph({
                spacing: { after: 150 },
                shading: { fill: "F0F0F0" },
                children: [new TextRun({ text: " ", font: bodyFont, size: 28, color: "777777" })],
              }),
            ],
          },
        ],
      });

      const docBlob = await Packer.toBlob(doc);
      const blob =
        docBlob.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          ? docBlob
          : new Blob([docBlob], {
              type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            });
      await saveBlobWithPicker(blob, buildExportFilename(documentTitle, "docx"), {
        description: "Word Document",
        extensions: [".docx"],
      });
    } catch (error) {
      if (error?.name !== "AbortError") {
        setExportError(error?.message || "Unable to export .docx right now.");
      }
    } finally {
      setExportingDocx(false);
    }
  };

  const applyCodeToForm = () => {
    try {
      const normalizedCode = sanitizeMermaidCode(codeInput);
      const parsed = parseMermaidCode(normalizedCode);
      codeSourceRef.current = "code";
      setData(parsed);
      setCodeInput(normalizedCode);
      setCodeSyncError("");
      setCodeSyncMessage("Form updated from Mermaid code.");
    } catch (error) {
      setCodeSyncMessage("");
      setCodeSyncError(error?.message || "Unable to parse Mermaid code into the form.");
    }
  };

  const handleCodeInputChange = (value) => {
    codeSourceRef.current = "code";
    setCodeInput(sanitizeMermaidCode(value));
    setCodeSyncMessage("");
    if (codeSyncError) {
      setCodeSyncError("");
    }
  };

  const requestMagicLink = async () => {
    if (!isSupabaseConfigured || !supabase) {
      setAuthError("Add Supabase env vars before signing in.");
      return false;
    }

    const email = authEmail.trim();
    if (!email) {
      setAuthError("Enter your email before requesting a sign-in link.");
      return false;
    }

    setAuthSubmitting(true);
    setAuthError("");
    setAuthMessage("");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}${window.location.pathname}`,
      },
    });

    if (error) {
      setAuthError(error.message || "Unable to send the sign-in link.");
      setAuthSubmitting(false);
      return false;
    } else {
      setAuthMessage(`Check ${email} for the sign-in link.`);
    }

    setAuthSubmitting(false);
    return true;
  };

  const handleSignIn = async (event) => {
    event.preventDefault();
    await requestMagicLink();
  };

  const handleSignOut = async () => {
    if (!supabase) return;

    setAuthSubmitting(true);
    setAuthError("");
    setAuthMessage("");

    const { error } = await supabase.auth.signOut();
    if (error) {
      setAuthError(error.message || "Unable to sign out right now.");
    }

    setAuthSubmitting(false);
  };

  if (sharedViewLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 text-slate-900">
        <div className="mx-auto max-w-5xl rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <div className="mb-4 flex justify-end">
            <LanguageToggle language={language} onChange={setLanguage} t={t} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{t.sharedViewTitle}</h1>
          <p className="mt-3 text-sm text-slate-500">{t.loadingSharedDiagram}</p>
        </div>
      </div>
    );
  }

  if (sharedViewError) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 text-slate-900">
        <div className="mx-auto max-w-5xl rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <div className="mb-4 flex justify-end">
            <LanguageToggle language={language} onChange={setLanguage} t={t} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{t.sharedViewTitle}</h1>
          <div className="mt-4 rounded-2xl bg-red-50 p-4 text-sm text-red-700">{sharedViewError}</div>
          {isAuthenticated ? (
            <button
              onClick={exitSharedView}
              className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <ExternalLink size={16} /> {t.backToWorkspace}
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  if (isReadOnlySharedView) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 text-slate-900">
        <div className="mx-auto max-w-6xl space-y-4">
          <header className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{documentTitle}</h1>
                <p className="mt-2 text-sm text-slate-500">{t.sharedReadOnlyDescription}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <LanguageToggle language={language} onChange={setLanguage} t={t} />
                {isAuthenticated ? (
                  <button
                    onClick={exitSharedView}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                  >
                    <ExternalLink size={16} /> {t.backToWorkspace}
                  </button>
                ) : null}
                <button onClick={copyMermaid} className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
                  <Copy size={16} /> {copied ? t.copied : t.copyMermaid}
                </button>
                <button onClick={downloadMermaid} className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800">
                  <Download size={16} /> .mmd
                </button>
                <button onClick={downloadSvg} className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700">
                  <Download size={16} /> .svg
                </button>
                <button
                  onClick={downloadDocx}
                  disabled={exportingDocx}
                  className="inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-wait disabled:opacity-70"
                >
                  <Download size={16} /> {exportingDocx ? t.exporting : ".docx"}
                </button>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
              <div className="rounded-full bg-blue-50 px-3 py-1.5 text-blue-700">{t.readOnlySharedLink}</div>
              {sharedView?.shared_at ? <div className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-600">{t.shared}: {formatSavedDateTime(sharedView.shared_at, language)}</div> : null}
              {sharedView?.share_expires_at ? <div className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-600">{t.expires}: {formatSavedDateTime(sharedView.share_expires_at, language)}</div> : null}
              {sharedOpenedAt ? <div className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-600">{t.opened}: {formatSavedDateTime(sharedOpenedAt, language)}</div> : null}
            </div>
            {renderError ? <div className="mt-3 rounded-2xl bg-red-50 p-3 text-sm text-red-700">{renderError}</div> : null}
            {exportError ? <div className="mt-3 rounded-2xl bg-red-50 p-3 text-sm text-red-700">{exportError}</div> : null}
          </header>

          <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-bold">{t.output}</h2>
                <p className="mt-1 text-sm text-slate-500">{t.sharedOutputDescription}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {view === "preview" ? (
                  <PreviewZoomControls
                    zoom={previewZoom}
                    onZoomOut={zoomPreviewOut}
                    onZoomIn={zoomPreviewIn}
                    onReset={resetPreviewZoom}
                    labels={t}
                  />
                ) : null}
                {view === "preview" ? (
                  <button
                    onClick={openPreviewModal}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                  >
                    <Maximize2 size={16} /> {t.expand}
                  </button>
                ) : null}
                <div className="inline-flex rounded-2xl bg-slate-100 p-1">
                <button
                  onClick={() => setView("preview")}
                  className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ${view === "preview" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
                >
                  <Eye size={16} /> {t.preview}
                </button>
                <button
                  onClick={() => setView("code")}
                  className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ${view === "code" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
                >
                  <Code2 size={16} /> {t.code}
                </button>
                </div>
              </div>
            </div>
            <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
              {view === "preview" ? (
                <PreviewCanvas svg={svg} renderError={renderError} zoom={previewZoom} />
              ) : (
                <textarea
                  value={codeInput}
                  readOnly
                  className="min-h-[420px] w-full resize-none rounded-2xl border border-slate-200 bg-white p-4 font-mono text-sm text-slate-800 outline-none"
                />
              )}
            </div>
          </section>
          <PreviewModal
            open={previewModalOpen}
            title={documentTitle}
            svg={svg}
            renderError={renderError}
            zoom={previewZoom}
            onClose={closePreviewModal}
            onZoomOut={zoomPreviewOut}
            onZoomIn={zoomPreviewIn}
            onReset={resetPreviewZoom}
            t={t}
          />
        </div>
      </div>
    );
  }

  if (isGalleryView) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 text-slate-900">
        <div className="mx-auto max-w-6xl space-y-4">
          <header className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{t.galleryTitle}</h1>
                <p className="mt-2 text-sm text-slate-500">{t.galleryDescription}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={exitGalleryPage}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                >
                  <ExternalLink size={16} /> {t.backToWorkspace}
                </button>
                <LanguageToggle language={language} onChange={setLanguage} t={t} />
              </div>
            </div>
            <div className="mt-4">
              <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                <Search size={16} className="text-slate-400" />
                <input
                  value={gallerySearch}
                  onChange={(e) => setGallerySearch(e.target.value)}
                  placeholder={t.gallerySearchPlaceholder}
                  data-testid="gallery-search-input"
                  className="min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none"
                />
              </label>
            </div>
          </header>

          {galleryError ? <div className="rounded-3xl bg-red-50 p-4 text-sm text-red-700">{galleryError}</div> : null}

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {galleryLoading ? (
              <div className="rounded-3xl bg-white p-4 text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">{t.galleryLoading}</div>
            ) : filteredGalleryItems.length ? (
              filteredGalleryItems.map((item) => (
                <article key={item.share_token} className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                  <DiagramThumbnail
                    title={item.title || item.purpose_title || t.untitledDiagram}
                    thumbnailSvg={item.thumbnail_svg}
                    diagramData={item.diagram_data}
                    mermaidCode={item.mermaid_code}
                    className="mb-4"
                  />
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-semibold text-slate-900">{item.title || t.untitledDiagram}</h2>
                      <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-500">
                        {item.gallery_submitted_at ? (
                          <span className="rounded-full bg-slate-100 px-2.5 py-1">{t.gallerySubmitted}: {formatSavedDateTime(item.gallery_submitted_at, language)}</span>
                        ) : null}
                        {item.gallery_submitter_name ? (
                          <span className="rounded-full bg-slate-100 px-2.5 py-1">{t.galleryOwnerLabel}: {item.gallery_submitter_name}</span>
                        ) : null}
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">{t.inGallery}</span>
                  </div>
                  <p className="mt-3 line-clamp-4 text-sm leading-6 text-slate-600">{item.purpose_title || item.title || t.untitledDiagram}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <a
                      href={`${window.location.pathname}?share=${item.share_token}`}
                      className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                    >
                      <ExternalLink size={16} /> {t.galleryOpenReadOnly}
                    </a>
                    {ownedGalleryByShareToken.get(item.share_token) ? (
                      <button
                        onClick={() =>
                          toggleGallerySubmission(ownedGalleryByShareToken.get(item.share_token), { publish: false })
                        }
                        disabled={gallerySubmittingId === ownedGalleryByShareToken.get(item.share_token)?.id}
                        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                      >
                        <Upload size={16} /> {t.removeFromGallery}
                      </button>
                    ) : null}
                    <button
                      onClick={() => reportGalleryItem(item)}
                      disabled={reportingGalleryToken === item.share_token}
                      className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                    >
                      <Flag size={16} /> {reportingGalleryToken === item.share_token ? t.reporting : t.reportGallery}
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-3xl bg-white p-4 text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">{t.galleryEmpty}</div>
            )}
          </section>
          {galleryHasMore ? (
            <div className="flex justify-center">
              <button
                onClick={loadMoreGalleryItems}
                disabled={galleryLoading}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                <RefreshCw size={16} className={galleryLoading ? "animate-spin" : ""} /> {t.loadMore}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  if (isAdminView) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 text-slate-900">
        <div className="mx-auto max-w-6xl space-y-4">
          <header className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{t.adminModerationTitle}</h1>
                <p className="mt-2 text-sm text-slate-500">{t.adminModerationDescription}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={exitAdminPage}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                >
                  <ExternalLink size={16} /> {t.backToWorkspace}
                </button>
                <LanguageToggle language={language} onChange={setLanguage} t={t} />
              </div>
            </div>
          </header>

          {adminError ? <div className="rounded-3xl bg-red-50 p-4 text-sm text-red-700">{adminError}</div> : null}

          <section className="space-y-4">
            {adminLoading && !adminQueue.length ? (
              <div className="rounded-3xl bg-white p-4 text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">{t.adminQueueLoading}</div>
            ) : visibleAdminQueue.length ? (
              visibleAdminQueue.map((item) => (
                <article key={item.share_token} className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                  <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
                    <DiagramThumbnail
                      title={item.title || item.purpose_title || t.untitledDiagram}
                      thumbnailSvg={item.thumbnail_svg}
                      diagramData={item.diagram_data}
                      mermaidCode={item.mermaid_code}
                    />
                    <div className="min-w-0 space-y-3">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <h2 className="truncate text-base font-semibold text-slate-900">{item.title || t.untitledDiagram}</h2>
                          <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-500">
                            <span className="rounded-full bg-slate-100 px-2.5 py-1">{t.reportCount}: {item.report_count || 0}</span>
                            {item.gallery_hidden_at ? (
                              <span className="rounded-full bg-amber-50 px-2.5 py-1 font-medium text-amber-700">{t.hiddenFromGallery}</span>
                            ) : null}
                            {item.gallery_submitter_name ? (
                              <span className="rounded-full bg-slate-100 px-2.5 py-1">{t.galleryOwnerLabel}: {item.gallery_submitter_name}</span>
                            ) : null}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => runModerationAction(item.share_token, item.gallery_hidden_at ? "restore" : "hide")}
                            disabled={moderationActionToken === item.share_token}
                            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                          >
                            {item.gallery_hidden_at ? <Undo2 size={16} /> : <EyeOff size={16} />}
                            {item.gallery_hidden_at ? t.restoreToGallery : t.hideFromGallery}
                          </button>
                          <button
                            onClick={() => runModerationAction(item.share_token, "resolve_reports")}
                            disabled={moderationActionToken === item.share_token || !item.report_count}
                            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                          >
                            <Shield size={16} /> {t.resolveReports}
                          </button>
                        </div>
                      </div>
                      {item.gallery_hidden_reason ? (
                        <div className="rounded-2xl bg-amber-50 px-3 py-2 text-sm text-amber-800">{item.gallery_hidden_reason}</div>
                      ) : null}
                      {Array.isArray(item.recent_reports) && item.recent_reports.length ? (
                        <div className="space-y-2">
                          {item.recent_reports.map((report) => (
                            <div key={report.id} className="rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-700 ring-1 ring-slate-200">
                              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                <span>{formatSavedDateTime(report.reported_at, language)}</span>
                                {report.reporter_email ? <span>{report.reporter_email}</span> : null}
                              </div>
                              <div className="mt-1">{report.reason || "-"}</div>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-3xl bg-white p-4 text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">{t.adminQueueEmpty}</div>
            )}
          </section>

          {adminHasMore ? (
            <div className="flex justify-center">
              <button
                onClick={loadMoreAdminQueue}
                disabled={adminLoading}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                <RefreshCw size={16} className={adminLoading ? "animate-spin" : ""} /> {t.loadMore}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-4">
        <header className="rounded-[28px] bg-white/95 p-5 shadow-sm ring-1 ring-slate-200 backdrop-blur">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {t.appEyebrow}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {isGalleryAdmin ? (
                      <button
                        onClick={openAdminPage}
                        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                      >
                        <Shield size={16} /> {t.openModeration}
                      </button>
                    ) : null}
                    <button
                      onClick={openGalleryPage}
                      className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                    >
                      <LayoutGrid size={16} /> {t.openGallery}
                    </button>
                    <LanguageToggle language={language} onChange={setLanguage} t={t} />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-slate-950">{t.appTitle}</h1>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                    {t.appDescription}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{t.document}</div>
                  <div className="mt-2 text-base font-semibold text-slate-900">{documentTitle.trim() || defaultDocumentTitle}</div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                    <span className="rounded-full bg-white px-2.5 py-1 ring-1 ring-slate-200">{diagramStats.primaryCount} {t.primary}</span>
                    <span className="rounded-full bg-white px-2.5 py-1 ring-1 ring-slate-200">{diagramStats.secondaryCount} {t.secondary}</span>
                    <span className="rounded-full bg-white px-2.5 py-1 ring-1 ring-slate-200">{diagramStats.changeCount} {t.changeIdeas}</span>
                  </div>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{t.workspace}</div>
                  <div className="mt-2 text-base font-semibold text-slate-900">
                    {authUiActive ? authUiEmail : t.privateCloudSave}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {authUiActive
                      ? t.privateCloudSaveSummaryActive
                      : t.privateCloudSaveSummaryInactive}
                  </p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{t.session}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <StatusPill
                      tone={isSupabaseConfigured ? "success" : "warning"}
                      icon={<Database size={15} />}
                    >
                      {isSupabaseConfigured ? t.supabaseConnected : t.supabaseEnvMissing}
                    </StatusPill>
                    <StatusPill tone={authUiActive ? "info" : "neutral"}>
                      {authUiActive
                        ? t.privateWorkspaceActive
                        : authVerifyingLink
                          ? t.verifyingLink
                          : authLoading
                            ? t.checkingSessionShort
                            : t.signInForCloudSave}
                    </StatusPill>
                    {isSupabaseConfigured && currentDiagramId ? (
                      <StatusPill
                        tone={autoSaveState === "saving" ? "info" : autoSaveState === "dirty" ? "warning" : "neutral"}
                      >
                        {autoSaveState === "saving"
                          ? t.autoSaving
                          : autoSaveState === "dirty"
                            ? t.unsavedChanges
                            : t.allChangesSaved}
                      </StatusPill>
                    ) : null}
                  </div>
                  <div className="mt-3 text-xs text-slate-500">
                    {currentDiagramId ? `${t.currentId}: ${currentDiagramId.slice(0, 8)}` : t.newUnsavedDocument}
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="space-y-3">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{t.privateCloudSaveTitle}</div>
                    <p className="mt-1 text-sm text-slate-500">
                      {authUiActive
                        ? t.privateCloudSaveActive
                        : t.privateCloudSaveInactive}
                    </p>
                  </div>

                  {authUiActive ? (
                    <div className="space-y-2">
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <div className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{t.signedInAs}</div>
                          <div className="mt-1 truncate text-sm font-medium text-slate-900">
                            {authUiEmail}
                          </div>
                        </div>
                        <button
                          onClick={handleSignOut}
                          disabled={authSubmitting || !isAuthenticated}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-100 disabled:cursor-wait disabled:opacity-70"
                        >
                          <LogOut size={16} /> {authSubmitting ? t.signingOut : t.signOut}
                        </button>
                      </div>
                      <label className="block rounded-2xl border border-slate-200 bg-white px-4 py-3">
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{t.galleryDisplayName}</div>
                        <input
                          value={galleryDisplayName}
                          onChange={(e) => setGalleryDisplayName(e.target.value)}
                          placeholder={t.galleryDisplayNamePlaceholder}
                          className="mt-2 w-full bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
                        />
                        <div className="mt-2 text-xs text-slate-500">{t.galleryDisplayNameHint}</div>
                      </label>
                    </div>
                  ) : (
                    <form className="space-y-3" onSubmit={handleSignIn}>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <input
                          type="email"
                          value={authEmail}
                          onChange={(e) => {
                            setAuthEmail(e.target.value);
                            if (authError) {
                              setAuthError("");
                            }
                          }}
                          placeholder="you@example.com"
                          className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                        />
                        <button
                          type="submit"
                          disabled={authSubmitting || authLoading}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:cursor-wait disabled:opacity-70"
                        >
                          <Mail size={16} /> {authSubmitting ? t.sending : t.emailSignInLink}
                        </button>
                      </div>
                    </form>
                  )}

                  {authVerifyingLink ? (
                    <div className="rounded-2xl bg-blue-50 p-3 text-sm text-blue-700">{t.verifyingSignInLink}</div>
                  ) : authLoading ? (
                    <div className="rounded-2xl bg-slate-100 p-3 text-sm text-slate-600">{t.checkingSession}</div>
                  ) : null}

                  {!authUiActive && authMessage ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={requestMagicLink}
                        disabled={authSubmitting}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-100 disabled:cursor-wait disabled:opacity-70"
                      >
                        <RefreshCw size={16} className={authSubmitting ? "animate-spin" : ""} /> {t.resendLink}
                      </button>
                      <span className="text-xs text-slate-400">{t.resendHint}</span>
                    </div>
                  ) : null}

                  <p className="text-xs text-slate-400">{t.redirectHint}</p>
                  {previewAuthEnabled ? (
                    <div className="rounded-2xl bg-amber-50 p-3 text-sm text-amber-700">
                      {t.previewAuthOnly}
                    </div>
                  ) : null}
                </div>
                {authError ? <div className="mt-3 rounded-2xl bg-red-50 p-3 text-sm text-red-700">{authError}</div> : null}
                {!authError && authMessage ? <div className="mt-3 rounded-2xl bg-blue-50 p-3 text-sm text-blue-700">{authMessage}</div> : null}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{t.documentTitle}</div>
                <label className="mt-2 block space-y-2">
                  <span className="sr-only">{t.documentTitle}</span>
                <input
                  value={documentTitle}
                  onChange={(e) => {
                    setDocumentTitle(e.target.value);
                    resetStorageNotice();
                  }}
                  data-testid="document-title-input"
                  placeholder={t.documentTitlePlaceholder}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                />
                </label>
                <p className="mt-2 text-xs leading-5 text-slate-500">{t.documentTitleHint}</p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{t.primaryActions}</div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <button
                    onClick={saveDiagram}
                    data-testid="save-diagram-button"
                    disabled={savingDiagram || !isAuthenticated}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:cursor-wait disabled:opacity-70"
                  >
                    <Save size={16} /> {savingDiagram ? t.saving : isAuthenticated ? t.saveDiagram : t.signInToSave}
                  </button>
                  <button
                    onClick={startNewDiagram}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                  >
                    <FilePlus2 size={16} /> {t.newDiagram}
                  </button>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{t.exportAndCode}</div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <button onClick={copyMermaid} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
                    <Copy size={16} /> {copied ? t.copiedMermaid : t.copyMermaid}
                  </button>
                  <button onClick={downloadMermaid} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
                    <Download size={16} /> {t.exportMmd}
                  </button>
                  <button onClick={downloadSvg} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700">
                    <Download size={16} /> {t.exportSvg}
                  </button>
                  <button
                    onClick={downloadDocx}
                    disabled={exportingDocx}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-wait disabled:opacity-70"
                  >
                    <Download size={16} /> {exportingDocx ? t.exporting : t.exportDocx}
                  </button>
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-500">{t.exportHint}</p>
              </div>
            </div>
          </div>
          {storageError ? <div className="mt-3 rounded-2xl bg-red-50 p-3 text-sm text-red-700">{storageError}</div> : null}
          {!storageError && storageMessage ? (
            <div className="mt-3 rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-700">
              <div>{storageMessage}</div>
              {lastSharedUrl ? (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <a
                    href={lastSharedUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                  >
                    <ExternalLink size={14} /> {t.openSharedView}
                  </a>
                  <span className="truncate text-xs text-emerald-800">{lastSharedUrl}</span>
                </div>
              ) : null}
            </div>
          ) : null}
          {exportError ? <div className="mt-3 rounded-2xl bg-red-50 p-3 text-sm text-red-700">{exportError}</div> : null}
        </header>

        <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="space-y-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 lg:h-[82vh] lg:overflow-auto">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">{t.savedDiagrams}</h2>
                  <p className="text-sm text-slate-500">{t.savedDiagramsDescription}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-500 ring-1 ring-slate-200">
                    {filteredSavedDiagrams.length} {t.shown}
                  </div>
                  <button
                    onClick={refreshSavedDiagrams}
                    disabled={!isSupabaseConfigured || !isAuthenticated || loadingSavedDiagrams}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <RefreshCw size={16} className={loadingSavedDiagrams ? "animate-spin" : ""} /> {t.refresh}
                  </button>
                </div>
              </div>
              {isAuthenticated ? (
                <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_150px_150px]">
                  <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2">
                    <Search size={16} className="text-slate-400" />
                    <input
                      value={savedSearch}
                      onChange={(e) => setSavedSearch(e.target.value)}
                      placeholder={t.searchPlaceholder}
                      className="min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none"
                    />
                  </label>
                  <select
                    value={savedScope}
                    onChange={(e) => setSavedScope(e.target.value)}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  >
                    {savedDiagramScopeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={savedSort}
                    onChange={(e) => setSavedSort(e.target.value)}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  >
                    {savedDiagramSortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
              <div className="mt-3 space-y-2">
                {!isSupabaseConfigured ? (
                  <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                    {t.envMissingHelp}
                  </div>
                ) : !isAuthenticated ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-3 text-sm text-slate-600">
                    {t.signInFirstSaved}
                  </div>
                ) : loadingSavedDiagrams ? (
                  <div className="rounded-2xl bg-white p-3 text-sm text-slate-500">{t.loadingSavedDiagrams}</div>
                ) : filteredSavedDiagrams.length ? (
                  filteredSavedDiagrams.map((item) => (
                    <div key={item.id} data-testid={`saved-diagram-card-${item.id}`} className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200 transition hover:ring-slate-300">
                      <DiagramThumbnail
                        title={item.title || item.purpose_title || t.untitledDiagram}
                        thumbnailSvg={item.thumbnail_svg}
                        diagramData={item.diagram_data}
                        mermaidCode={item.mermaid_code}
                        className="mb-3"
                      />
                      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0 flex-1">
                        {renamingDiagramId === item.id ? (
                          <div className="space-y-2">
                            <input
                              value={renameDraft}
                              onChange={(e) => setRenameDraft(e.target.value)}
                              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                            />
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => renameDiagram(item.id)}
                                disabled={renamingDiagram}
                                className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-wait disabled:opacity-70"
                              >
                              <Check size={15} /> {renamingDiagram ? t.saving : t.save}
                              </button>
                              <button
                                onClick={cancelRenamingDiagram}
                                disabled={renamingDiagram}
                                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-70"
                              >
                                <X size={15} /> {t.cancel}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => openDiagram(item.id)}
                            className="min-w-0 w-full text-left"
                          >
                            <div className="flex min-w-0 items-center gap-2">
                              {item.is_favorite ? <Star size={14} className="fill-amber-400 text-amber-500" /> : null}
                              <div className="truncate font-semibold text-slate-900">{item.title || item.purpose_title || t.untitledDiagram}</div>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-medium">
                              {item.archived_at ? <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">{t.archived}</span> : null}
                              {hasActiveShareLink(item) ? <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-600">{t.shared}</span> : null}
                              {item.is_public_gallery ? <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">{t.inGallery}</span> : null}
                              {item.share_id && !hasActiveShareLink(item) && !item.share_revoked_at ? (
                                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">{t.shareExpired}</span>
                              ) : null}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-500">
                              <span className="rounded-full bg-slate-100 px-2.5 py-1">{t.updated}: {formatSavedDateTime(item.updated_at || item.created_at, language)}</span>
                              <span className="rounded-full bg-slate-100 px-2.5 py-1">
                                {t.lastOpened}: {item.last_opened_at ? formatSavedDateTime(item.last_opened_at, language) : t.notOpenedYet}
                              </span>
                              {hasActiveShareLink(item) ? (
                                <span className="rounded-full bg-slate-100 px-2.5 py-1">{t.sharedUntil}: {formatSavedDateTime(item.share_expires_at, language)}</span>
                              ) : null}
                              {item.gallery_submitted_at ? (
                                <span className="rounded-full bg-slate-100 px-2.5 py-1">{t.gallerySubmitted}: {formatSavedDateTime(item.gallery_submitted_at, language)}</span>
                              ) : null}
                            </div>
                          </button>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center justify-end gap-1 xl:max-w-[320px]">
                        <button
                          onClick={() => openDiagram(item.id)}
                          disabled={openingDiagramId === item.id}
                          className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                          title={t.open}
                        >
                          <FolderOpen size={16} />
                        </button>
                        <button
                          onClick={() => shareDiagram(item)}
                          data-testid={`share-diagram-button-${item.id}`}
                          disabled={sharingDiagramId === item.id}
                          className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                          title={hasActiveShareLink(item) ? t.copyShareLink : t.createShareLink}
                        >
                          <Link2 size={16} />
                        </button>
                        <button
                          onClick={() => shareDiagram(item, { regenerate: true })}
                          disabled={sharingDiagramId === item.id}
                          className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                          title={t.regenerateShareLink}
                        >
                          <RefreshCw size={16} />
                        </button>
                        <button
                          onClick={() => {
                            const shareUrl = `${window.location.origin}${window.location.pathname}?share=${item.share_id}`;
                            window.open(shareUrl, "_blank", "noopener,noreferrer");
                          }}
                          disabled={!hasActiveShareLink(item)}
                          className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                          title={t.openSharedView}
                        >
                          <ExternalLink size={16} />
                        </button>
                        <button
                          onClick={() => revokeShareDiagram(item)}
                          disabled={sharingDiagramId === item.id || !item.share_id || Boolean(item.share_revoked_at)}
                          className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                          title={t.revokeShareLink}
                        >
                          <X size={16} />
                        </button>
                        <button
                          onClick={() => toggleGallerySubmission(item, { publish: !item.is_public_gallery })}
                          data-testid={`toggle-gallery-button-${item.id}`}
                          disabled={gallerySubmittingId === item.id || sharingDiagramId === item.id}
                          className={`rounded-xl p-2 hover:bg-slate-100 disabled:opacity-50 ${item.is_public_gallery ? "text-emerald-600" : "text-slate-600"}`}
                          title={item.is_public_gallery ? t.removeFromGallery : t.submitToGallery}
                        >
                          <Upload size={16} />
                        </button>
                        <button
                          onClick={() => toggleFavoriteDiagram(item)}
                          className={`rounded-xl p-2 hover:bg-slate-100 ${item.is_favorite ? "text-amber-500" : "text-slate-600"}`}
                          title={item.is_favorite ? t.unfavorite : t.favorite}
                        >
                          <Star size={16} className={item.is_favorite ? "fill-amber-400" : ""} />
                        </button>
                        <button
                          onClick={() => startRenamingDiagram(item)}
                          disabled={renamingDiagramId === item.id || duplicatingDiagramId === item.id}
                          className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                          title={t.rename}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => duplicateDiagram(item.id)}
                          disabled={duplicatingDiagramId === item.id}
                          className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                          title={t.duplicate}
                        >
                          <Copy size={16} />
                        </button>
                        <button
                          onClick={() => toggleArchiveDiagram(item)}
                          disabled={duplicatingDiagramId === item.id}
                          className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                          title={item.archived_at ? t.restore : t.archive}
                        >
                          {item.archived_at ? <ArchiveRestore size={16} /> : <Archive size={16} />}
                        </button>
                        <button
                          onClick={() => deleteDiagram(item.id)}
                          disabled={deletingDiagramId === item.id || duplicatingDiagramId === item.id}
                          className="rounded-xl p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                          title={t.deletePermanently}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    </div>
                  ))
                ) : savedSearch.trim() ? (
                  <div className="rounded-2xl bg-white p-4 text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
                    <div className="font-semibold text-slate-900">{t.noSearchResultsTitle}</div>
                    <p className="mt-1">{t.noSearchResultsBody}</p>
                  </div>
                ) : (
                  <div className="rounded-2xl bg-white p-4 text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
                    <div className="font-semibold text-slate-900">
                      {savedScope === "archived" ? t.noArchivedTitle : t.noSavedTitle}
                    </div>
                    <p className="mt-1">
                      {savedScope === "archived"
                        ? t.noArchivedBody
                        : t.noSavedBody}
                    </p>
                    <button
                      onClick={() => saveDiagram()}
                      disabled={savingDiagram}
                      className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-wait disabled:opacity-70"
                    >
                      <Save size={16} /> {savingDiagram ? t.saving : t.saveCurrentDiagram}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-slate-900">{t.versionHistory}</h2>
                  <p className="mt-0.5 line-clamp-2 text-sm leading-5 text-slate-500">{t.versionHistoryDescription}</p>
                </div>
                <div className="shrink-0 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-500">
                  {currentDiagramId ? `${versionHistory.length} ${t.versions}` : t.openSavedDiagram}
                </div>
              </div>
              <div className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
                {!isAuthenticated ? (
                  <div className="rounded-2xl bg-white p-3 text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
                    {t.signInForVersionHistory}
                  </div>
                ) : !currentDiagramId ? (
                  <div className="rounded-2xl bg-white p-3 text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
                    {t.openSavedFirst}
                  </div>
                ) : loadingVersionHistory ? (
                  <div className="rounded-2xl bg-white p-3 text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
                    {t.loadingVersionHistory}
                  </div>
                ) : versionHistory.length ? (
                  versionHistory.map((version) => (
                    <div key={version.id} className="flex flex-col gap-2 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <History size={14} className="text-slate-400" />
                          <div className="truncate font-semibold text-slate-900">{version.title || documentTitle || defaultDocumentTitle}</div>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium uppercase text-slate-600">
                            {version.save_source}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {t.saved}: {formatSavedDateTime(version.created_at, language)}
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <button
                          onClick={() => restoreVersion(version)}
                          disabled={restoringVersionId === version.id || restoringAndSavingVersionId === version.id}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
                        >
                          <History size={14} /> {restoringVersionId === version.id ? t.restoring : t.loadToEditor}
                        </button>
                        <button
                          onClick={() => restoreVersion(version, { saveImmediately: true })}
                          disabled={restoringVersionId === version.id || restoringAndSavingVersionId === version.id}
                          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:cursor-wait disabled:opacity-60"
                        >
                          <Save size={14} /> {restoringAndSavingVersionId === version.id ? t.saving : t.restoreAndSave}
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl bg-white p-3 text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
                    {t.noVersions}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-pink-100 bg-pink-50 p-4">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-pink-950">{t.purposeOutcomeKpi}</h2>
                  <p className="mt-1 text-sm text-pink-800/75">{t.purposeDescription}</p>
                </div>
                <div className="rounded-full bg-white/80 px-3 py-1.5 text-xs font-semibold text-pink-700 ring-1 ring-pink-100">
                  {t.topLevelGoal}
                </div>
              </div>
              <TextAreaField label={t.purpose} value={data.purpose.title} onChange={(v) => updatePurpose("title", v)} icon={<Target size={16} />} testId="purpose-title-input" />
              <div className="mt-3">
                <TextAreaField label={t.purposeKpi} value={data.purpose.kpi} onChange={(v) => updatePurpose("kpi", v)} icon={<BarChart3 size={16} />} testId="purpose-kpi-input" />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-950">{t.primaryDrivers}</h2>
                <p className="text-sm text-slate-500">{t.primaryDriversDescription}</p>
              </div>
              <button onClick={addPrimary} data-testid="add-primary-button" className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                <Plus size={16} /> {t.addPrimary}
              </button>
            </div>

            {data.primaryDrivers.map((pd, pi) => (
              <div key={pd.id} className="space-y-3 rounded-3xl border border-blue-100 bg-blue-50 p-4 shadow-sm ring-1 ring-blue-100/70">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="font-bold text-blue-900">{t.primaryDriver} {pi + 1}</div>
                    <div className="text-xs text-blue-800/70">{t.primaryDriverHelp}</div>
                  </div>
                  <button onClick={() => removePrimary(pi)} className="rounded-xl p-2 text-red-600 hover:bg-red-50">
                    <Trash2 size={16} />
                  </button>
                </div>
                <TextAreaField label={t.primaryDriverName} value={pd.title} onChange={(v) => updatePrimary(pi, "title", v)} icon={<Layers size={16} />} testId={pi === 0 ? "primary-title-input-0" : ""} />
                <TextAreaField label={t.primaryKpi} value={pd.kpi} onChange={(v) => updatePrimary(pi, "kpi", v)} icon={<BarChart3 size={16} />} />

                <button onClick={() => addSecondary(pi)} className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                  <Plus size={16} /> {t.addSecondary}
                </button>

                {pd.secondaryDrivers.map((sd, si) => (
                  <div key={sd.id} className="ml-0 space-y-3 rounded-3xl border border-amber-100 bg-amber-50 p-4 shadow-sm ring-1 ring-amber-100/70 md:ml-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-amber-900">{t.secondaryDriver} {si + 1}</div>
                        <div className="text-xs text-amber-800/70">{t.secondaryDriverHelp}</div>
                      </div>
                      <button onClick={() => removeSecondary(pi, si)} className="rounded-xl p-2 text-red-600 hover:bg-red-50">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <TextAreaField label={t.secondaryDriverName} value={sd.title} onChange={(v) => updateSecondary(pi, si, "title", v)} icon={<GitBranch size={16} />} />
                    <TextAreaField label={t.secondaryKpi} value={sd.kpi} onChange={(v) => updateSecondary(pi, si, "kpi", v)} icon={<BarChart3 size={16} />} />

                    <button onClick={() => addChange(pi, si)} className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-600">
                      <Plus size={16} /> {t.addChangeIdea}
                    </button>

                    {sd.changeIdeas.map((ci, cii) => (
                      <div key={ci.id} className="ml-0 space-y-3 rounded-3xl border border-orange-100 bg-white p-4 shadow-sm ring-1 ring-orange-100/80 md:ml-5">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-bold text-orange-900">{t.changeIdea} {cii + 1}</div>
                            <div className="text-xs text-orange-800/70">{t.changeIdeaHelp}</div>
                          </div>
                          <button onClick={() => removeChange(pi, si, cii)} className="rounded-xl p-2 text-red-600 hover:bg-red-50">
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <TextAreaField label={t.changeIdeaName} value={ci.title} onChange={(v) => updateChange(pi, si, cii, "title", v)} icon={<Lightbulb size={16} />} />
                        <TextAreaField label={t.changeKpi} value={ci.kpi} onChange={(v) => updateChange(pi, si, cii, "kpi", v)} icon={<BarChart3 size={16} />} />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </section>

          <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 lg:h-[82vh]">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-950">{t.output}</h2>
                <p className="mt-1 text-sm text-slate-500">{t.outputDescription}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {view === "preview" ? (
                  <PreviewZoomControls
                    zoom={previewZoom}
                    onZoomOut={zoomPreviewOut}
                    onZoomIn={zoomPreviewIn}
                    onReset={resetPreviewZoom}
                    labels={t}
                  />
                ) : null}
                {view === "preview" ? (
                  <button
                    onClick={openPreviewModal}
                    data-testid="open-preview-modal-button"
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                  >
                    <Maximize2 size={16} /> {t.expand}
                  </button>
                ) : null}
                <div className="flex rounded-2xl bg-slate-100 p-1">
                <button
                  onClick={() => setView("preview")}
                  data-testid="preview-tab-button"
                  className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ${view === "preview" ? "bg-white shadow-sm" : "text-slate-500"}`}
                >
                  <Eye size={16} /> {t.preview}
                </button>
                <button
                  onClick={() => setView("code")}
                  data-testid="code-tab-button"
                  className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ${view === "code" ? "bg-white shadow-sm" : "text-slate-500"}`}
                >
                  <Code2 size={16} /> {t.code}
                </button>
                </div>
              </div>
            </div>

            {view === "preview" ? (
              <div data-testid="preview-panel" className="min-h-[20rem] overflow-auto rounded-3xl border border-slate-200 bg-slate-50 p-4 lg:h-[73vh]">
                <PreviewCanvas svg={svg} renderError={renderError} zoom={previewZoom} />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-500">{t.editMermaidHint}</p>
                  <button
                    onClick={applyCodeToForm}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    {t.applyToForm}
                  </button>
                </div>
                {codeSyncError ? <div className="rounded-2xl bg-red-50 p-3 text-sm text-red-700">{codeSyncError}</div> : null}
                {!codeSyncError && codeSyncMessage ? <div className="rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-700">{codeSyncMessage}</div> : null}
                <textarea
                  value={codeInput}
                  onChange={(e) => handleCodeInputChange(e.target.value)}
                  spellCheck={false}
                  data-testid="mermaid-code-input"
                  className="min-h-[20rem] w-full overflow-auto rounded-3xl bg-slate-950 p-4 font-mono text-xs leading-relaxed text-slate-100 outline-none ring-1 ring-slate-800 lg:h-[73vh]"
                />
              </div>
            )}
          </section>
        </div>
        <PreviewModal
          open={previewModalOpen}
          title={documentTitle}
          svg={svg}
          renderError={renderError}
          zoom={previewZoom}
          onClose={closePreviewModal}
          onZoomOut={zoomPreviewOut}
          onZoomIn={zoomPreviewIn}
          onReset={resetPreviewZoom}
          t={t}
        />
      </div>
    </div>
  );
}

export default App;
