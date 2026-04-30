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
