# Architecture.md — QuoteForge SaaS Platform

## Overview

QuoteForge is a multi-tenant SaaS quotation management platform. It supports **Admin** users who manage firm configurations, templates, logos, signatures, and items — and **Invited Users** (sales agents) who can only select items and generate/print quotations.

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│                                                                 │
│   ┌──────────────────┐         ┌──────────────────────────┐    │
│   │   Admin Portal   │         │  Sales User Portal        │    │
│   │  (Next.js App)   │         │  (Next.js App)            │    │
│   │                  │         │                           │    │
│   │ - Firm Manager   │         │ - Item Selector           │    │
│   │ - Template Editor│         │ - Quote Builder           │    │
│   │ - Logo/Signature │         │ - Print / PDF Export      │    │
│   │ - User Invites   │         │ - View Past Quotes        │    │
│   │ - Quote History  │         │                           │    │
│   └────────┬─────────┘         └────────────┬─────────────┘    │
└────────────┼─────────────────────────────────┼─────────────────┘
             │ HTTPS / REST + Realtime          │
             ▼                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API LAYER (Node.js + Express)            │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Auth Service │  │ Firm Service │  │  Quote Service       │  │
│  │  (Supabase   │  │              │  │                      │  │
│  │   Auth JWT)  │  │ - CRUD Firms │  │ - Create/Update/     │  │
│  └──────────────┘  │ - Logo Upload│  │   Delete Quotes      │  │
│                    │ - Sig Upload │  │ - Generate PDF       │  │
│  ┌──────────────┐  └──────────────┘  │ - Number Sequences   │  │
│  │ User Service │                    └──────────────────────┘  │
│  │              │  ┌──────────────┐  ┌──────────────────────┐  │
│  │ - Invite     │  │ Item Service │  │  Template Service    │  │
│  │ - Roles RBAC │  │              │  │                      │  │
│  │ - Permissions│  │ - CRUD Items │  │ - CRUD Templates     │  │
│  └──────────────┘  │ - HSN/SAC    │  │ - Format Builder     │  │
│                    │ - Tax Rates  │  │ - Column Config      │  │
│                    └──────────────┘  └──────────────────────┘  │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                     DATA LAYER (Supabase)                       │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  PostgreSQL  │  │  Storage     │  │  Realtime            │  │
│  │  Database    │  │  Buckets     │  │  Subscriptions       │  │
│  │              │  │              │  │                      │  │
│  │ - tenants    │  │ - logos/     │  │ - Quote status sync  │  │
│  │ - firms      │  │ - signatures/│  │ - Live notifications │  │
│  │ - users      │  │ - templates/ │  │                      │  │
│  │ - items      │  │              │  │                      │  │
│  │ - quotes     │  │              │  │                      │  │
│  │ - templates  │  │              │  │                      │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Multi-Tenancy Model

Each **Tenant** (business owner) can manage:
- Multiple **Firms** (e.g., GST-separate entities)
- Multiple **Users** per Tenant (with role-based access)
- Multiple **Quote Templates** per Firm
- Shared **Item Master** per Tenant

```
Tenant
 ├── Firm A (GSTIN: XXXXXXX)
 │    ├── Logo, Signature
 │    ├── Templates (Format 1, Format 2)
 │    ├── Quote Series (QT-A-001, QT-A-002...)
 │    └── Bank Details
 ├── Firm B (GSTIN: YYYYYYY)
 │    └── ...
 ├── Item Master (shared across firms)
 └── Users
      ├── Admin (full access)
      └── Sales User (select items → print quote only)
```

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 14 (App Router) | SSR + CSR hybrid UI |
| Styling | Tailwind CSS + shadcn/ui | Component system |
| PDF Generation | React-PDF / Puppeteer | Server-side PDF render |
| Backend | Node.js + Express.js | REST API server |
| Auth | Supabase Auth (JWT) | Auth + invite tokens |
| Database | Supabase (PostgreSQL) | Relational data |
| File Storage | Supabase Storage | Logo, signature files |
| Realtime | Supabase Realtime | Live quote updates |
| Email | Resend / Nodemailer | Invite emails |
| Hosting | Vercel (Frontend) + Railway/Render (Backend) | Deployment |

---

## Authentication & RBAC Flow

```
User visits /login
     │
     ▼
Supabase Auth (email/password or magic link)
     │
     ▼
JWT Token issued → stored in httpOnly cookie
     │
     ▼
Every API request → Backend middleware verifies JWT
     │
     ▼
Role extracted from JWT claims:
  ├── role: "admin"   → Full access to all routes
  └── role: "user"    → Read items + Create/Print quotes only

Invite Flow:
Admin sends invite email → Supabase Auth invite link
→ User sets password → assigned role: "user" 
→ Linked to tenant_id of admin
```

---

## Data Flow — Quote Creation

```
Sales User selects items
        │
        ▼
POST /api/quotes/draft  (items[], firm_id, template_id)
        │
        ▼
Backend:
  1. Fetch firm details (logo, signature, bank, GSTIN)
  2. Fetch template layout
  3. Calculate taxes (CGST/SGST/IGST based on supply state)
  4. Generate quote number (sequential per firm)
  5. Save quote to DB
        │
        ▼
Return quote_id + rendered data to frontend
        │
        ▼
Frontend renders Quote Preview (React component)
        │
        ├── Print via browser window.print()
        └── Download PDF via /api/quotes/:id/pdf
                │
                ▼
            Puppeteer renders HTML → returns PDF buffer
```

---

## File Storage Architecture

```
Supabase Storage Buckets:
│
├── /logos/{tenant_id}/{firm_id}/logo.png
├── /signatures/{tenant_id}/{firm_id}/signature.png
└── /quotes/{tenant_id}/{quote_id}/quote.pdf  (cached)

Access Policy:
- Logos/Signatures: Private (only same tenant)
- Quote PDFs: Tenant-scoped signed URLs (expire in 24h)
```

---

## API Route Structure

```
/api
 ├── /auth
 │    ├── POST /login
 │    ├── POST /logout
 │    └── POST /invite
 │
 ├── /firms
 │    ├── GET    /                  (list firms for tenant)
 │    ├── POST   /                  (create firm)
 │    ├── PUT    /:id               (update firm)
 │    ├── DELETE /:id               (delete firm)
 │    ├── POST   /:id/logo          (upload logo)
 │    └── POST   /:id/signature     (upload signature)
 │
 ├── /items
 │    ├── GET    /                  (list items)
 │    ├── POST   /                  (create item)
 │    ├── PUT    /:id               (update item)
 │    └── DELETE /:id               (delete item)
 │
 ├── /templates
 │    ├── GET    /                  (list templates)
 │    ├── POST   /                  (create template)
 │    ├── PUT    /:id               (update template)
 │    └── DELETE /:id               (delete template)
 │
 ├── /quotes
 │    ├── GET    /                  (list quotes)
 │    ├── POST   /                  (create quote)
 │    ├── PUT    /:id               (update quote — admin only)
 │    ├── DELETE /:id               (delete — admin only)
 │    └── GET    /:id/pdf           (generate PDF)
 │
 └── /users
      ├── GET    /                  (list tenant users — admin only)
      ├── POST   /invite            (invite user — admin only)
      └── DELETE /:id               (remove user — admin only)
```

---

## Security Considerations

- All API routes protected by JWT middleware
- Row-Level Security (RLS) enabled on all Supabase tables
- Tenant isolation enforced at DB level via `tenant_id` foreign keys
- File uploads: type validation (PNG/JPG only), max size 2MB
- Rate limiting on invite and quote generation endpoints
- CORS restricted to known frontend domains
- Quote PDFs served via signed URLs (time-limited)
