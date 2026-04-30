# QuoteForge SaaS Platform

QuoteForge is a multi-tenant quotation management platform for businesses to manage firms, items, templates, users, and GST-ready quotations with PDF export.

## Monorepo Structure

- `apps/web` - Next.js 16 frontend (admin/sales portal)
- `apps/api` - Express + TypeScript backend API
- `supabase` - SQL migrations and manual SQL helpers
- `about` - architecture and planning documents

## Tech Stack

- Frontend: Next.js, React, Tailwind CSS, Zustand
- Backend: Express, TypeScript, Zod
- Database/Auth/Storage: Supabase
- PDF: html2canvas + jsPDF (frontend), Puppeteer (backend services)

## Prerequisites

- Node.js 20+ recommended
- npm
- Supabase project (URL, anon key, service role key)

## Setup

1. Install dependencies:

```bash
npm run install:all
```

2. Create environment files:

- API: copy `apps/api/.env.example` to `apps/api/.env`
- Web: copy `apps/web/.env.local.example` to `apps/web/.env.local`

3. Fill environment variables.

### API env (`apps/api/.env`)

```env
PORT=4000
FRONTEND_URL=http://localhost:3000
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
RESEND_API_KEY=your-resend-api-key
```

### Web env (`apps/web/.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_API_URL=http://localhost:4000
```

> Important: `NEXT_PUBLIC_API_URL` should be `http://localhost:4000` (without `/api`) because frontend requests already append `/api/...`.

## Database Setup (Supabase)

Run migrations in order from `supabase/migrations` using Supabase SQL Editor.

If you already have existing data and face schema mismatch errors, use helper SQL files:

- `supabase/manual_fix_firms_schema.sql`
- `supabase/manual_admin_update.sql`

## Development

Run both API and Web together:

```bash
npm run dev
```

Or run separately:

```bash
npm run dev:api
npm run dev:web
```

Default local URLs:

- Web: `http://localhost:3000`
- API: `http://localhost:4000`

## Build

Web:

```bash
npm run build --prefix apps/web
```

API:

```bash
npm run build --prefix apps/api
```

## Common Issues

- **Unauthorized / Forbidden on dashboard or APIs**
  - Verify Supabase keys and user role in `public.users`.
- **Firm logo/signature not visible**
  - Ensure branding upload succeeds and firm has `logo_url`/`signature_url`.
- **Supabase schema cache errors (missing columns)**
  - Apply latest migrations and run `manual_fix_firms_schema.sql` when needed.
- **PDF style differences in downloaded files**
  - Use latest preview/export code and re-check firm branding data.

## Notes

- This repository ignores `.env*` files to avoid leaking secrets.
- `apps/web/README.md` contains default Next.js app notes; this root README is the project-level source of truth.
