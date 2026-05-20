---
version: alpha
name: Diverdiagram Workspace
description: Design system for a Thai-first driver diagram workspace focused on planning, documentation, and read-only sharing.
colors:
  primary: "#0F172A"
  secondary: "#475569"
  tertiary: "#2563EB"
  neutral: "#F8FAFC"
  surface: "#FFFFFF"
  surface-muted: "#F8FAFC"
  border: "#E2E8F0"
  info: "#2563EB"
  success: "#047857"
  warning: "#92400E"
  danger: "#B91C1C"
  accent-violet: "#7C3AED"
  purpose: "#9D174D"
  purpose-soft: "#FCE4EC"
  primary-driver: "#1565C0"
  primary-driver-soft: "#DBEAFE"
  secondary-driver: "#92400E"
  secondary-driver-soft: "#FEF3C7"
  change-idea: "#C2410C"
  change-idea-soft: "#FFEDD5"
typography:
  headline-lg:
    fontFamily: IBM Plex Sans Thai, Noto Sans Thai, Inter, sans-serif
    fontSize: 28px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: 0px
  headline-md:
    fontFamily: IBM Plex Sans Thai, Noto Sans Thai, Inter, sans-serif
    fontSize: 20px
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: 0px
  body-md:
    fontFamily: IBM Plex Sans Thai, Noto Sans Thai, Inter, sans-serif
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: 0px
  body-sm:
    fontFamily: IBM Plex Sans Thai, Noto Sans Thai, Inter, sans-serif
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0px
  label-md:
    fontFamily: IBM Plex Sans Thai, Noto Sans Thai, Inter, sans-serif
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 0px
  code-sm:
    fontFamily: ui-monospace, SFMono-Regular, Menlo, monospace
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: 0px
rounded:
  sm: 12px
  md: 16px
  lg: 24px
  xl: 28px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 20px
  2xl: 24px
  3xl: 32px
components:
  page-shell:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.primary}"
    rounded: "{rounded.lg}"
    padding: 16px
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    rounded: "{rounded.lg}"
    padding: 20px
  divider:
    backgroundColor: "{colors.border}"
    textColor: "{colors.primary}"
    rounded: "{rounded.full}"
    padding: 4px
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    rounded: "{rounded.md}"
    padding: 12px
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: 12px
  button-accent:
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: 12px
  button-success:
    backgroundColor: "{colors.success}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: 12px
  button-violet:
    backgroundColor: "{colors.accent-violet}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: 12px
  pill-status:
    backgroundColor: "{colors.surface-muted}"
    textColor: "{colors.secondary}"
    rounded: "{rounded.full}"
    padding: 8px
  field-outline:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    rounded: "{rounded.md}"
    padding: 12px
  alert-info:
    backgroundColor: "{colors.surface-muted}"
    textColor: "{colors.info}"
    rounded: "{rounded.md}"
    padding: 12px
  alert-warning:
    backgroundColor: "{colors.secondary-driver-soft}"
    textColor: "{colors.warning}"
    rounded: "{rounded.md}"
    padding: 12px
  alert-danger:
    backgroundColor: "{colors.purpose-soft}"
    textColor: "{colors.danger}"
    rounded: "{rounded.md}"
    padding: 12px
  diagram-purpose-card:
    backgroundColor: "{colors.purpose-soft}"
    textColor: "{colors.purpose}"
    rounded: "{rounded.lg}"
    padding: 16px
  diagram-primary-card:
    backgroundColor: "{colors.primary-driver-soft}"
    textColor: "{colors.primary-driver}"
    rounded: "{rounded.lg}"
    padding: 16px
  diagram-secondary-card:
    backgroundColor: "{colors.secondary-driver-soft}"
    textColor: "{colors.secondary-driver}"
    rounded: "{rounded.lg}"
    padding: 16px
  diagram-change-card:
    backgroundColor: "{colors.change-idea-soft}"
    textColor: "{colors.change-idea}"
    rounded: "{rounded.lg}"
    padding: 16px
---

# Diverdiagram Workspace

## Overview

Diverdiagram should feel like a focused clinical planning workspace rather than a marketing page or a playful canvas. The product helps users capture structured improvement ideas, inspect Mermaid output, export documentation, and reopen saved work with confidence. The interface should feel calm, dependable, and highly legible, especially for Thai text and mixed Thai-English KPI language.

The mood is professional and supportive. It should communicate that the tool is safe for real work: drafting, reviewing, exporting, and sharing driver diagrams. Visual polish matters, but clarity matters more than expressiveness.

## Colors

The palette is anchored in cool slate neutrals, with purposeful accents that mark action types and diagram levels.

- **Primary (`#0F172A`)** is the default text and high-emphasis control color.
- **Secondary (`#475569`)** supports metadata, helper copy, and lower-emphasis labels.
- **Tertiary (`#2563EB`)** is the main action blue for sync, navigation, and information states.
- **Neutral (`#F8FAFC`)** keeps the application bright and quiet.
- **Surface (`#FFFFFF`)** is used for cards, panels, editors, and control groups.
- **Success (`#059669`)**, **Warning (`#D97706`)**, and **Danger (`#DC2626`)** should stay functional and not become decorative.

The diagram editor itself has semantic accent colors:

- **Purpose** uses pink tones for the top-level goal.
- **Primary Driver** uses blue tones.
- **Secondary Driver** uses amber tones.
- **Change Idea** uses warm orange tones.

These colors should remain soft enough for long editing sessions, with stronger stroke or text colors carrying contrast.

## Typography

The product is Thai-first and should always prefer highly legible sans-serif text. The core stack is `IBM Plex Sans Thai`, `Noto Sans Thai`, then `Inter`. Headings should feel compact and direct. Body copy should avoid excessive size swings and keep a steady rhythm for mixed Thai and English content.

Monospace is reserved for Mermaid code, exported code previews, and technical snippets. Code surfaces should clearly separate themselves from prose UI while still feeling integrated with the rest of the workspace.

## Layout

The layout should behave like a structured workbench:

- a clear page shell
- strong card boundaries for major tools
- dense but breathable control clusters
- large enough editing targets for repeated daily use

Desktop layouts can use side-by-side editing and output panels. On smaller screens, the experience should stack cleanly and reduce fixed-height behaviors when possible. Panels should scroll internally only when it clearly improves usability.

Spacing should feel tidy and repeatable. The UI already leans on a 12-16-20-24 rhythm, and new additions should stay on that track instead of introducing arbitrary gaps.

## Elevation & Depth

Depth should stay restrained. Use light card shadows and subtle rings instead of dramatic blur or floating layers. Most hierarchy should come from spacing, borders, and contrast rather than heavy elevation.

Panels that contain important work areas can have a soft ring and a low shadow. Temporary status messages can use tinted backgrounds rather than stronger elevation.

## Shapes

The shape language is soft and modern, with rounded corners used generously but consistently. Inputs, pills, buttons, and cards can all be rounded, but they should still feel like part of the same system.

Use:

- medium rounding for controls
- larger rounding for main panels
- full rounding for pills, filters, and status badges

Avoid mixing sharp rectangular elements into core product UI unless the content itself is code or exported diagram geometry.

## Components

### Buttons

Buttons should be compact, confident, and icon-friendly. Primary actions can use dark slate, blue, emerald, or violet depending on meaning, but each surface should keep one clearly dominant action. Buttons should not feel oversized or marketing-like.

### Inputs

Text inputs and textareas should feel quiet and reliable:

- white or light-slate surfaces
- subtle borders
- clear focus ring
- enough padding for Thai text to breathe

Document title, auth email input, and Mermaid editing controls should all feel related even when they vary in size.

### Status Pills

Use pills for lightweight state:

- read-only
- shared
- archived
- timestamps
- saved state

Pills should stay low-drama: muted backgrounds, concise labels, and strong readability.

### Workspace Cards

Saved diagram rows, version history items, and control sections should read as work objects. They should support scanning first, then action. Actions belong at the edge of the row, while titles and metadata remain the visual anchor.

## Do's and Don'ts

- Do keep the interface optimized for repeated work, not presentation flair.
- Do preserve strong readability for Thai text, metadata, and KPI statements.
- Do use color semantically so driver levels and statuses are easy to scan.
- Do keep one dominant call to action per cluster of controls.
- Don't introduce gradient-heavy or decorative hero styling into the workspace.
- Don't use overly dark backgrounds except where code editing clearly benefits from it.
- Don't let status colors overpower document content.
- Don't make cards, buttons, or pills grow in size unpredictably as content changes.
