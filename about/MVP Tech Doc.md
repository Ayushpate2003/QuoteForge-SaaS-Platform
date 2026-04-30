# MVP Tech Doc.md — QuoteForge

## MVP Scope Definition

The MVP delivers a **working multi-firm quotation platform** with:
- Admin full control (firms, items, templates, users)
- Sales user: item selection + quote print only
- GST-compliant quote generation (CGST/SGST/IGST)
- PDF export and browser print
- Logo and signature upload per firm

---

## Tech Stack — Detailed Choices

### Frontend: Next.js 14 (App Router)

```
/app
 ├── (auth)/
 │    ├── login/page.tsx
 │    └── invite/[token]/page.tsx
 │
 ├── (admin)/
 │    ├── dashboard/page.tsx
 │    ├── firms/
 │    │    ├── page.tsx              ← List firms
 │    │    ├── new/page.tsx          ← Create firm
 │    │    └── [id]/page.tsx         ← Edit firm (logo, sig, bank)
 │    ├── items/
 │    │    ├── page.tsx              ← Item master list
 │    │    └── [id]/page.tsx         ← Edit item
 │    ├── templates/
 │    │    ├── page.tsx              ← Template list
 │    │    └── [id]/page.tsx         ← Template format editor
 │    ├── quotes/
 │    │    ├── page.tsx              ← All quotes
 │    │    └── [id]/page.tsx         ← View/Edit quote
 │    └── users/page.tsx             ← Manage invited users
 │
 ├── (sales)/
 │    ├── dashboard/page.tsx
 │    └── quotes/
 │         ├── new/page.tsx          ← Create quote (item selector)
 │         └── [id]/print/page.tsx  ← Print preview
 │
 └── api/                            ← Next.js API routes (proxy to Node backend)
```

**Key Frontend Libraries:**

| Package | Version | Use |
|---------|---------|-----|
| next | 14.x | Framework |
| tailwindcss | 3.x | Styling |
| @radix-ui/react-* | latest | Accessible UI primitives |
| react-hook-form | 7.x | Form management |
| zod | 3.x | Schema validation |
| @tanstack/react-query | 5.x | Server state management |
| react-dropzone | 14.x | Logo/signature upload |
| @react-pdf/renderer | 3.x | Client-side PDF generation |
| lucide-react | latest | Icons |
| date-fns | 3.x | Date formatting |
| zustand | 4.x | Client state (cart/quote builder) |

---

### Backend: Node.js + Express.js

```
/server
 ├── src/
 │    ├── index.ts                   ← Entry point
 │    ├── config/
 │    │    ├── supabase.ts           ← Supabase client init
 │    │    └── env.ts                ← Environment validation (zod)
 │    │
 │    ├── middleware/
 │    │    ├── auth.ts               ← JWT verification
 │    │    ├── rbac.ts               ← Role check (admin/user)
 │    │    ├── rateLimiter.ts        ← express-rate-limit
 │    │    └── errorHandler.ts       ← Global error handler
 │    │
 │    ├── routes/
 │    │    ├── auth.routes.ts
 │    │    ├── firms.routes.ts
 │    │    ├── items.routes.ts
 │    │    ├── templates.routes.ts
 │    │    ├── quotes.routes.ts
 │    │    └── users.routes.ts
 │    │
 │    ├── controllers/
 │    │    ├── firms.controller.ts
 │    │    ├── items.controller.ts
 │    │    ├── templates.controller.ts
 │    │    ├── quotes.controller.ts
 │    │    └── users.controller.ts
 │    │
 │    ├── services/
 │    │    ├── pdf.service.ts        ← Puppeteer PDF generation
 │    │    ├── tax.service.ts        ← GST calculation logic
 │    │    ├── quote-number.service.ts ← Sequential numbering
 │    │    └── storage.service.ts    ← Supabase file uploads
 │    │
 │    └── types/
 │         └── index.ts              ← Shared TypeScript types
 │
 ├── package.json
 └── tsconfig.json
```

**Key Backend Libraries:**

| Package | Version | Use |
|---------|---------|-----|
| express | 4.x | HTTP server |
| @supabase/supabase-js | 2.x | DB + Auth + Storage |
| puppeteer | 21.x | Server-side PDF |
| multer | 1.x | File upload middleware |
| sharp | 0.x | Image resize/optimize |
| zod | 3.x | Input validation |
| express-rate-limit | 7.x | Rate limiting |
| cors | 2.x | CORS middleware |
| helmet | 7.x | Security headers |
| resend | 2.x | Email delivery |
| jsonwebtoken | 9.x | JWT utilities |

---

### Database: Supabase (PostgreSQL)

#### Core Tables

```sql
-- Tenants (top-level account)
CREATE TABLE tenants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Firms (multiple per tenant)
CREATE TABLE firms (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  address         TEXT,
  gstin           TEXT,
  msme_no         TEXT,
  pan             TEXT,
  phone           TEXT,
  email           TEXT,
  logo_url        TEXT,
  signature_url   TEXT,
  bank_name       TEXT,
  bank_ac_no      TEXT,
  bank_ifsc       TEXT,
  bank_branch     TEXT,
  bank_ac_holder  TEXT,
  place_of_supply TEXT,
  jurisdiction    TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Users
CREATE TABLE users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id),
  tenant_id   UUID REFERENCES tenants(id),
  role        TEXT CHECK (role IN ('admin', 'user')) DEFAULT 'user',
  name        TEXT,
  email       TEXT UNIQUE,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Item Master
CREATE TABLE items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID REFERENCES tenants(id),
  name         TEXT NOT NULL,
  description  TEXT,
  sku          TEXT,
  hsn_sac      TEXT,
  unit         TEXT DEFAULT 'Nos',
  rate         NUMERIC(12,2) NOT NULL,
  cgst_rate    NUMERIC(5,2) DEFAULT 9,
  sgst_rate    NUMERIC(5,2) DEFAULT 9,
  igst_rate    NUMERIC(5,2) DEFAULT 18,
  condition    TEXT DEFAULT 'NEW',
  is_active    BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Quote Templates
CREATE TABLE templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID REFERENCES tenants(id),
  firm_id     UUID REFERENCES firms(id),
  name        TEXT NOT NULL,
  config      JSONB NOT NULL DEFAULT '{}',
  is_default  BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Quotes
CREATE TABLE quotes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID REFERENCES tenants(id),
  firm_id          UUID REFERENCES firms(id),
  template_id      UUID REFERENCES templates(id),
  quote_number     TEXT NOT NULL,
  quote_date       DATE NOT NULL,
  bill_to          JSONB NOT NULL,
  ship_to          JSONB,
  items            JSONB NOT NULL,
  subtotal         NUMERIC(12,2),
  total_cgst       NUMERIC(12,2),
  total_sgst       NUMERIC(12,2),
  total_igst       NUMERIC(12,2),
  grand_total      NUMERIC(12,2),
  notes            TEXT,
  shipping_method  TEXT,
  order_from       TEXT,
  status           TEXT DEFAULT 'draft',
  created_by       UUID REFERENCES users(id),
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- Quote number sequences per firm
CREATE TABLE quote_sequences (
  firm_id     UUID PRIMARY KEY REFERENCES firms(id),
  prefix      TEXT DEFAULT 'QT',
  last_number INTEGER DEFAULT 0
);
```

#### Row Level Security (RLS) Policies

```sql
-- Enable RLS
ALTER TABLE firms ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- Firms: only own tenant
CREATE POLICY "tenant_isolation_firms"
ON firms FOR ALL
USING (tenant_id = auth.jwt() ->> 'tenant_id');

-- Items: only own tenant
CREATE POLICY "tenant_isolation_items"
ON items FOR ALL
USING (tenant_id = auth.jwt() ->> 'tenant_id');

-- Quotes: admin full access, user can only insert/read own
CREATE POLICY "quotes_admin_full"
ON quotes FOR ALL
USING (
  tenant_id = auth.jwt() ->> 'tenant_id'
  AND (
    auth.jwt() ->> 'role' = 'admin'
    OR created_by = auth.uid()
  )
);
```

---

## Environment Variables

### Frontend (.env.local)
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### Backend (.env)
```env
PORT=4000
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Never expose to frontend
SUPABASE_ANON_KEY=eyJ...
RESEND_API_KEY=re_...
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

---

## GST Calculation Service

```typescript
// server/src/services/tax.service.ts

interface QuoteItem {
  rate: number;
  qty: number;
  cgst_rate: number;
  sgst_rate: number;
  igst_rate: number;
}

interface TaxResult {
  taxable_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  total: number;
  is_igst: boolean;
}

export function calculateItemTax(
  item: QuoteItem,
  supply_state: string,
  firm_state: string
): TaxResult {
  const amount = item.rate * item.qty;
  const is_igst = supply_state !== firm_state; // Interstate = IGST

  if (is_igst) {
    const igst = (amount * item.igst_rate) / (100 + item.igst_rate);
    const taxable = amount - igst;
    return {
      taxable_amount: taxable,
      cgst_amount: 0,
      sgst_amount: 0,
      igst_amount: igst,
      total: amount,
      is_igst: true,
    };
  } else {
    const total_gst_rate = item.cgst_rate + item.sgst_rate;
    const taxable = (amount * 100) / (100 + total_gst_rate);
    const cgst = (taxable * item.cgst_rate) / 100;
    const sgst = (taxable * item.sgst_rate) / 100;
    return {
      taxable_amount: taxable,
      cgst_amount: cgst,
      sgst_amount: sgst,
      igst_amount: 0,
      total: amount,
      is_igst: false,
    };
  }
}
```

---

## PDF Generation Strategy

Two approaches available, choose per use case:

### Option A: Puppeteer (Server-side) — Recommended for production
- Backend renders the quote HTML template
- Puppeteer headless Chrome generates pixel-perfect PDF
- Stored in Supabase Storage with signed URL

### Option B: @react-pdf/renderer (Client-side) — Fast prototyping
- React components define PDF layout
- Generates in browser, no server needed
- Less fidelity for complex layouts

**MVP uses Option B** for speed, Phase 2 upgrades to Puppeteer.

---

## Quote Number Generation

```typescript
// Atomic sequence generation to avoid duplicates
export async function generateQuoteNumber(
  supabase: SupabaseClient,
  firm_id: string
): Promise<string> {
  const { data } = await supabase.rpc('increment_quote_number', {
    p_firm_id: firm_id,
  });
  // PostgreSQL function ensures atomicity
  return data; // e.g., "QTMH2627-1053"
}
```

```sql
-- Supabase SQL function
CREATE OR REPLACE FUNCTION increment_quote_number(p_firm_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_prefix TEXT;
  v_next INTEGER;
  v_year TEXT;
BEGIN
  v_year := to_char(now(), 'YY');
  
  UPDATE quote_sequences
  SET last_number = last_number + 1
  WHERE firm_id = p_firm_id
  RETURNING prefix, last_number INTO v_prefix, v_next;
  
  RETURN v_prefix || v_year || LPAD(v_next::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;
```

---

## Deployment Architecture (MVP)

```
Frontend (Vercel)
  └── next.js app → auto-deploy from GitHub main branch
  
Backend (Railway / Render)
  └── node.js server → Docker container
  └── env vars set in Railway dashboard

Database (Supabase Cloud)
  └── Free tier → upgrade to Pro for production

Storage (Supabase Storage)
  └── logos, signatures, quote PDFs
```
