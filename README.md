# Diverdiagram

Driver Diagram workspace built with React, Vite, Mermaid, and Supabase.

## Local setup

1. Install dependencies

```bash
npm install
```

2. Create `.env.local`

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

3. Start the app

```bash
npm run dev
```

## Smoke tests

This repo includes Playwright smoke tests for the editor shell, Mermaid sync, preview modal, and language toggle.

```bash
npm run test:smoke
```

## Supabase

Schema and Edge Functions live in:

- [supabase/schema.sql](/Users/tpromson/Desktop/Diverdiagram/supabase/schema.sql)
- [supabase/functions/shared-driver-diagram/index.ts](/Users/tpromson/Desktop/Diverdiagram/supabase/functions/shared-driver-diagram/index.ts)
- [supabase/functions/public-gallery/index.ts](/Users/tpromson/Desktop/Diverdiagram/supabase/functions/public-gallery/index.ts)
- [supabase/functions/report-gallery-item/index.ts](/Users/tpromson/Desktop/Diverdiagram/supabase/functions/report-gallery-item/index.ts)

Recent production-side database additions:

- `shared_driver_diagrams.is_public_gallery`
- `shared_driver_diagrams.gallery_submitted_at`
- `shared_driver_diagrams.gallery_submitter_name`
- `gallery_item_reports`

If you are deploying Supabase changes manually, apply the SQL in `supabase/schema.sql`, then deploy the edge functions above.

## Vercel deploy

Production deploy is done from the project root:

```bash
npx vercel deploy --prod --yes
```

The current production URL is:

- [https://diverdiagram.vercel.app](https://diverdiagram.vercel.app)

## Main flows

- Edit purpose, KPI, primary, secondary, and change ideas
- Preview and edit Mermaid both ways
- Save diagrams per authenticated user
- Auto-save and version history
- Share read-only links
- Publish selected diagrams into the gallery
- Report gallery items

