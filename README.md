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

## Authenticated E2E tests

The authenticated gallery flow test is optional and only runs when you provide a real Supabase browser session.

Required environment variables:

```bash
E2E_SUPABASE_URL=https://<project-ref>.supabase.co
E2E_SUPABASE_SESSION='{"access_token":"...","refresh_token":"...","user":{...}}'
```

Optional override:

```bash
E2E_SUPABASE_STORAGE_KEY=sb-<project-ref>-auth-token
```

Run:

```bash
npm run test:e2e-auth
```

## Supabase

Schema and Edge Functions live in:

- [supabase/schema.sql](/Users/tpromson/Desktop/Diverdiagram/supabase/schema.sql)
- [supabase/functions/shared-driver-diagram/index.ts](/Users/tpromson/Desktop/Diverdiagram/supabase/functions/shared-driver-diagram/index.ts)
- [supabase/functions/public-gallery/index.ts](/Users/tpromson/Desktop/Diverdiagram/supabase/functions/public-gallery/index.ts)
- [supabase/functions/report-gallery-item/index.ts](/Users/tpromson/Desktop/Diverdiagram/supabase/functions/report-gallery-item/index.ts)
- [supabase/functions/gallery-admin-moderation/index.ts](/Users/tpromson/Desktop/Diverdiagram/supabase/functions/gallery-admin-moderation/index.ts)

Recent production-side database additions:

- `shared_driver_diagrams.is_public_gallery`
- `shared_driver_diagrams.gallery_submitted_at`
- `shared_driver_diagrams.gallery_submitter_name`
- `shared_driver_diagrams.gallery_hidden_at`
- `shared_driver_diagrams.gallery_hidden_reason`
- `shared_driver_diagrams.gallery_hidden_by`
- `gallery_item_reports`
- `gallery_admins`

If you are deploying Supabase changes manually, apply the SQL in `supabase/schema.sql`, then deploy the edge functions above.

### Moderation access

Admin moderation is backed by the `gallery_admins` table. Add a row for each moderator:

- `user_id`: authenticated Supabase user id
- `email`: optional convenience field for lookup

The moderation page and function both check this table.

### Recommended deploy order

1. Apply `supabase/schema.sql`
2. Deploy `shared-driver-diagram`
3. Deploy `public-gallery`
4. Deploy `report-gallery-item`
5. Deploy `gallery-admin-moderation`
6. Deploy Vercel production

### Rollback notes

If a frontend deploy causes issues:

1. Roll Vercel back to the previous production deployment
2. Keep the newer schema in place unless the change is known to break reads or writes
3. If an edge function is the problem, redeploy the previous function source for that single function
4. Re-run smoke tests after rollback

### Environment variables

App:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Testing:

- `E2E_SUPABASE_URL`
- `E2E_SUPABASE_SESSION`
- `E2E_SUPABASE_STORAGE_KEY` (optional)

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
- Moderate reported gallery items
