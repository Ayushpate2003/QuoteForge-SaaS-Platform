# System Design.md — QuoteForge

---

## 1. High-Level System Design

```
┌─────────────────────────────────────────────────────────────────────┐
│                            INTERNET                                 │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
              ┌───────────▼───────────┐
              │       Vercel CDN      │
              │   (Next.js Frontend)  │
              └───────────┬───────────┘
                          │ API calls
              ┌───────────▼───────────┐
              │   Railway / Render    │
              │  (Node.js + Express)  │
              │                       │
              │  ┌─────────────────┐  │
              │  │  Auth Middleware │  │
              │  │  RBAC Middleware │  │
              │  │  Rate Limiter   │  │
              │  └────────┬────────┘  │
              │           │           │
              │  ┌────────▼────────┐  │
              │  │   Controllers   │  │
              │  │   Services      │  │
              └──┴────────┬────────┴──┘
                          │
        ┌─────────────────┼──────────────────┐
        │                 │                  │
┌───────▼──────┐  ┌───────▼──────┐  ┌───────▼──────┐
│  Supabase    │  │  Supabase    │  │  Supabase    │
│  PostgreSQL  │  │   Storage    │  │   Realtime   │
│              │  │              │  │              │
│  RLS enabled │  │  logos/      │  │  quote sync  │
│  per tenant  │  │  signatures/ │  │              │
└──────────────┘  └──────────────┘  └──────────────┘
```

---

## 2. Database Design (Detailed ERD)

```
┌──────────────┐         ┌─────────────────┐
│   tenants    │◄────────│     users        │
│──────────────│  1:N    │─────────────────│
│ id (PK)      │         │ id (PK, FK auth)│
│ name         │         │ tenant_id (FK)  │
│ created_at   │         │ role            │
└──────┬───────┘         │ name            │
       │                 │ email           │
       │ 1:N             │ created_at      │
       ▼                 └────────┬────────┘
┌──────────────┐                  │ created_by
│    firms     │◄─────────────────┘
│──────────────│
│ id (PK)      │◄──────────────────────────┐
│ tenant_id(FK)│                           │
│ name         │         ┌─────────────────┴───┐
│ address      │  1:N    │     templates        │
│ gstin        │◄────────│─────────────────────│
│ pan          │         │ id (PK)             │
│ msme_no      │         │ tenant_id (FK)      │
│ phone        │         │ firm_id (FK)        │
│ email        │         │ name                │
│ logo_url     │         │ config (JSONB)      │
│ signature_url│         │ is_default          │
│ bank_*       │         └─────────────────────┘
│ jurisdiction │
└──────┬───────┘
       │ 1:N
       ▼
┌───────────────────────────────────────────────┐
│                    quotes                      │
│───────────────────────────────────────────────│
│ id (PK)                                       │
│ tenant_id (FK)                                │
│ firm_id (FK)                                  │
│ template_id (FK)                              │
│ quote_number                                  │
│ quote_date                                    │
│ bill_to (JSONB)  ← {name, addr, gstin, ...}  │
│ ship_to (JSONB)  ← {name, addr, ...}         │
│ items (JSONB)    ← [array of line items]      │
│ subtotal                                      │
│ total_cgst                                    │
│ total_sgst                                    │
│ total_igst                                    │
│ grand_total                                   │
│ notes                                         │
│ shipping_method                               │
│ status                                        │
│ created_by (FK → users)                       │
│ created_at                                    │
└───────────────────────────────────────────────┘

┌───────────────────────────────────────┐
│              items                    │
│───────────────────────────────────────│
│ id (PK)                              │
│ tenant_id (FK)                        │
│ name                                  │
│ description                           │
│ sku                                   │
│ hsn_sac                               │
│ unit                                  │
│ rate                                  │
│ cgst_rate                             │
│ sgst_rate                             │
│ igst_rate                             │
│ condition                             │
│ is_active                             │
└───────────────────────────────────────┘
```

---

## 3. Quote Line Items JSONB Structure

```json
{
  "items": [
    {
      "item_id": "uuid",
      "name": "Creality CR-Falcon 10W Laser Engraver",
      "description": "3IDEA-CRE-CV30-LSR-ENGRVR-10W",
      "condition": "NEW",
      "hsn_sac": "84779000",
      "qty": 1,
      "unit": "Nos",
      "rate": 34000.00,
      "amount": 34000.00,
      "taxable_amount": 28813.56,
      "cgst_rate": 9,
      "cgst_amount": 2593.22,
      "sgst_rate": 9,
      "sgst_amount": 2593.22,
      "igst_rate": 0,
      "igst_amount": 0,
      "total": 34000.00
    }
  ]
}
```

---

## 4. Template Config JSONB Structure

```json
{
  "columns": {
    "sr_no":          { "visible": true,  "order": 1,  "label": "#",                "width": "5%" },
    "item_name":      { "visible": true,  "order": 2,  "label": "Item & Description","width": "25%" },
    "condition":      { "visible": true,  "order": 3,  "label": "Condition",         "width": "8%" },
    "hsn_sac":        { "visible": true,  "order": 4,  "label": "HSN/SAC",           "width": "8%" },
    "qty":            { "visible": true,  "order": 5,  "label": "Qty",               "width": "5%" },
    "rate":           { "visible": true,  "order": 6,  "label": "Rate",              "width": "8%" },
    "amount":         { "visible": true,  "order": 7,  "label": "Amount",            "width": "8%" },
    "taxable_amount": { "visible": true,  "order": 8,  "label": "Taxable Amount",    "width": "10%" },
    "cgst":           { "visible": true,  "order": 9,  "label": "CGST",              "width": "7%" },
    "sgst":           { "visible": true,  "order": 10, "label": "SGST",              "width": "7%" },
    "igst":           { "visible": false, "order": 11, "label": "IGST",              "width": "7%" },
    "total":          { "visible": true,  "order": 12, "label": "Total",             "width": "8%" }
  },
  "header": {
    "show_logo":        true,
    "logo_position":    "left",
    "logo_size":        "medium",
    "show_gstin":       true,
    "show_msme":        true,
    "show_quote_label": true,
    "quote_label_text": "Quote",
    "show_sales_person":true
  },
  "bill_ship": {
    "show_bill_to":     true,
    "show_ship_to":     true,
    "show_customer_gstin": true,
    "show_customer_phone": true,
    "show_customer_email": true
  },
  "footer": {
    "show_bank_details":    true,
    "show_notes":           true,
    "show_jurisdiction":    true,
    "show_signature":       true,
    "show_authorized_text": true,
    "show_page_number":     true,
    "custom_note":          "Looking forward for your business."
  },
  "theme": {
    "accent_color":  "#1a1a1a",
    "header_bg":     "#ffffff",
    "table_header_bg": "#f5f5f5",
    "font_family":   "Arial, sans-serif",
    "font_size_body": "10px",
    "paper_size":    "A4"
  }
}
```

---

## 5. Authentication Flow Design

```
┌─────────────────────────────────────────────────────────┐
│                   ADMIN REGISTRATION                     │
│                                                         │
│  1. Admin visits /signup                                │
│  2. Supabase Auth creates auth.users record             │
│  3. Trigger creates: tenant + users record              │
│  4. JWT issued with custom claims:                      │
│     { role: "admin", tenant_id: "uuid" }               │
│  5. Redirected to /admin/dashboard                      │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                   USER INVITE FLOW                       │
│                                                         │
│  1. Admin enters email at /admin/users → Invite         │
│  2. Backend calls supabase.auth.admin.inviteUserByEmail │
│  3. Supabase sends email with magic link                │
│  4. User clicks link → /invite/[token]                  │
│  5. User sets password                                   │
│  6. Backend webhook triggers: create users record       │
│     { role: "user", tenant_id: admin.tenant_id }        │
│  7. User JWT: { role: "user", tenant_id: "uuid" }       │
│  8. Redirected to /sales/dashboard                      │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│               API REQUEST AUTH MIDDLEWARE                │
│                                                         │
│  Request → Extract Bearer token from Authorization      │
│          → supabase.auth.getUser(token)                 │
│          → If invalid → 401 Unauthorized                │
│          → If valid → attach user to req.user           │
│          → RBAC check for route                         │
│          → Proceed to controller                        │
└─────────────────────────────────────────────────────────┘
```

---

## 6. Frontend State Management

```
Zustand Store Structure:
│
├── authStore
│    ├── user: User | null
│    ├── role: 'admin' | 'user' | null
│    └── tenant_id: string | null
│
├── quoteBuilderStore   ← Used during quote creation
│    ├── selectedFirm: Firm | null
│    ├── selectedTemplate: Template | null
│    ├── billTo: CustomerInfo
│    ├── shipTo: CustomerInfo
│    ├── lineItems: LineItem[]
│    ├── quoteDate: Date
│    ├── notes: string
│    ├── addItem(item): void
│    ├── removeItem(id): void
│    ├── updateQty(id, qty): void
│    ├── updateRate(id, rate): void
│    └── calculateTotals(): TaxSummary
│
└── firmStore
     ├── firms: Firm[]
     └── activeFirm: Firm | null
```

---

## 7. PDF Generation Flow (Server-Side)

```
GET /api/quotes/:id/pdf

Step 1: Fetch quote by ID + verify tenant access
Step 2: Fetch firm details (logo, signature as base64)
Step 3: Fetch template config
Step 4: Render HTML string using Handlebars template
Step 5: Launch Puppeteer
Step 6: page.setContent(html)
Step 7: page.pdf({ format: 'A4', printBackground: true })
Step 8: Upload PDF buffer to Supabase Storage
Step 9: Return signed URL (valid 24h) to client
Step 10: Frontend opens in new tab / triggers download
```

---

## 8. Realtime Features (Supabase Realtime)

```typescript
// Admin dashboard — live quote feed
const channel = supabase
  .channel('quotes-feed')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'quotes',
    filter: `tenant_id=eq.${tenant_id}`
  }, (payload) => {
    // New quote created by any sales user
    addQuoteToFeed(payload.new);
  })
  .subscribe();
```

---

## 9. File Storage Design

```
Supabase Storage Policies:

Bucket: "firm-assets"
Path pattern: {tenant_id}/{firm_id}/{type}/{filename}
Examples:
  abc123/xyz789/logo/logo.png
  abc123/xyz789/signature/sig.png

Policy: 
  SELECT: auth.jwt()->>'tenant_id' = tenant_id segment of path
  INSERT: role = 'admin' AND same tenant
  UPDATE: role = 'admin' AND same tenant
  DELETE: role = 'admin' AND same tenant

Bucket: "quote-pdfs" 
Path: {tenant_id}/{quote_id}/quote.pdf
Policy: SELECT via signed URL only (30min expiry)
```

---

## 10. Error Handling Strategy

```typescript
// Global error types
enum AppError {
  UNAUTHORIZED      = 'UNAUTHORIZED',       // 401
  FORBIDDEN         = 'FORBIDDEN',          // 403
  NOT_FOUND         = 'NOT_FOUND',          // 404
  VALIDATION_ERROR  = 'VALIDATION_ERROR',   // 422
  CONFLICT          = 'CONFLICT',           // 409
  INTERNAL          = 'INTERNAL_ERROR',     // 500
}

// Error response shape
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "GST number format is invalid",
    "field": "gstin",
    "statusCode": 422
  }
}

// Frontend: React Query handles errors
// - 401 → redirect to login
// - 403 → show "Access Denied" component
// - 422 → show inline field errors
// - 500 → show toast "Something went wrong"
```

---

## 11. Performance Design

| Concern | Solution |
|---------|---------|
| Item search in large catalogs | Postgres full-text search index on items.name |
| Quote list loading | Pagination (20 per page) + cursor-based |
| PDF generation delay | Background job queue (BullMQ Phase 2), sync for MVP |
| Logo/signature load in quote | Base64 embed in PDF, CDN for preview |
| Template switching | Cached in React Query (5min TTL) |
| Tenant data isolation | RLS at DB level — no cross-tenant leakage possible |

---

## 12. Scalability Path

```
MVP (0–100 tenants):
  Vercel Free + Railway Starter + Supabase Free
  
Growth (100–1000 tenants):
  Vercel Pro + Railway Pro + Supabase Pro
  Add: Redis cache for sessions
  Add: BullMQ for PDF queue
  
Scale (1000+ tenants):
  Consider: Separate PDF microservice
  Consider: Read replicas for quote history
  Consider: CDN for logos (Cloudflare)
```
