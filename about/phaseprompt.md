# phaseprompt.md — QuoteForge Development Phases
## Prompts for Antigravity + Cursor AI-Assisted Development

> Each phase contains a **Context Block** (what's been built), a **Cursor/Antigravity Prompt** (paste directly into AI), and **Acceptance Criteria** (definition of done).

---

## ⚡ PHASE 0 — Project Scaffolding & Environment Setup

### Context
Starting from scratch. Need to scaffold Next.js frontend, Node.js backend, connect Supabase, and configure environment variables.

### Cursor Prompt
```
Scaffold a full-stack project with the following structure:

FRONTEND (Next.js 14 App Router):
- Create /apps/web with Next.js 14, TypeScript, Tailwind CSS
- Install: @supabase/supabase-js, @tanstack/react-query, zustand, react-hook-form, zod, lucide-react, @radix-ui/react-dialog, @radix-ui/react-dropdown-menu
- Create /apps/web/lib/supabase.ts with client + server supabase clients
- Create /apps/web/middleware.ts for route protection (redirect unauthenticated users)
- Create layout files: /app/layout.tsx, /app/(auth)/layout.tsx, /app/(admin)/layout.tsx, /app/(sales)/layout.tsx

BACKEND (Node.js + Express):
- Create /apps/api with Express, TypeScript, ts-node-dev
- Install: express, @supabase/supabase-js, cors, helmet, express-rate-limit, multer, sharp, zod, jsonwebtoken, resend
- Create /apps/api/src/index.ts entry point
- Create /apps/api/src/config/supabase.ts
- Create /apps/api/src/middleware/auth.ts (JWT verification via Supabase)
- Create /apps/api/src/middleware/rbac.ts (role check: admin | user)

SUPABASE:
- Create /supabase/migrations/001_initial_schema.sql with all tables from System Design
- Create /supabase/migrations/002_rls_policies.sql with all RLS policies
- Create /supabase/migrations/003_functions.sql with increment_quote_number function

Environment files:
- /apps/web/.env.local.example
- /apps/api/.env.example

Use a monorepo structure with /apps/web and /apps/api at root level.
```

### Acceptance Criteria
- [ ] `npm run dev` starts both frontend and backend
- [ ] Supabase connection verified (test query works)
- [ ] Auth middleware rejects requests without valid JWT
- [ ] Migrations run on Supabase without errors

---

## ⚡ PHASE 1 — Authentication System

### Context
Project scaffolded. Supabase connected. Need login, signup for admin, invite flow for sales users.

### Cursor Prompt
```
Build the complete authentication system for QuoteForge:

PAGES TO CREATE:
1. /app/(auth)/login/page.tsx
   - Email + password form
   - "Remember me" checkbox
   - Forgot password link
   - On success: check role from JWT → redirect to /admin/dashboard OR /sales/dashboard
   - Show loading spinner during auth
   - Show error toast on wrong credentials

2. /app/(auth)/signup/page.tsx (Admin self-register)
   - Fields: Full Name, Email, Password, Confirm Password, Business Name
   - On success: creates tenant + admin user → redirect to /admin/dashboard
   - Use supabase.auth.signUp()

3. /app/(auth)/invite/[token]/page.tsx (Sales user accepting invite)
   - Show "You've been invited to QuoteForge"
   - Fields: Full Name, Password, Confirm Password
   - On submit: supabase.auth.verifyOtp() to set password
   - Redirect to /sales/dashboard after success

BACKEND:
4. POST /api/auth/invite (Admin invites user)
   - Protected: admin only
   - Body: { email, name }
   - Calls supabase.auth.admin.inviteUserByEmail()
   - Creates user record in users table with role='user' and tenant_id from admin JWT
   - Sends invite via Resend email template

5. Supabase trigger (SQL):
   - On auth.users INSERT → auto-create users table record
   - On first signup → auto-create tenants record

MIDDLEWARE:
6. /apps/web/middleware.ts
   - Routes starting with /admin → require role='admin'
   - Routes starting with /sales → require role='user' OR 'admin'
   - /login, /signup, /invite → public

STATE:
7. /lib/stores/authStore.ts (Zustand)
   - user, role, tenant_id, isLoading
   - login(), logout(), getSession() actions

Use Tailwind + shadcn/ui for all UI components. Show field validation errors inline.
```

### Acceptance Criteria
- [ ] Admin can sign up and reach /admin/dashboard
- [ ] Admin can invite a user by email
- [ ] Invited user receives email, sets password, reaches /sales/dashboard
- [ ] Unauthenticated access to /admin redirects to /login
- [ ] Sales user accessing /admin gets "Access Denied"

---

## ⚡ PHASE 2 — Firm Management (Admin)

### Context
Auth working. Admin is logged in. Need to create and manage multiple firms with logo/signature uploads.

### Cursor Prompt
```
Build the Firm Management module for QuoteForge admin:

PAGES:
1. /app/(admin)/firms/page.tsx — Firm List
   - Cards grid showing all firms for this tenant
   - Each card shows: Logo thumbnail, Firm Name, GSTIN, City
   - Buttons: Edit, Delete (with confirm dialog), Set as Default
   - "Add New Firm" button top right
   - Empty state with illustration when no firms

2. /app/(admin)/firms/new/page.tsx — Create Firm
   - Multi-section form:
     SECTION 1: Basic Info
       - Business Name*, Address*, City*, State* (dropdown), PIN*
       - GSTIN*, PAN, MSME Number
       - Phone, Email, Website
     SECTION 2: Branding
       - Logo Upload: drag-and-drop zone, shows preview, max 2MB PNG/JPG
       - Signature Upload: drag-and-drop zone, shows preview, max 2MB
     SECTION 3: Bank Details
       - Account Holder Name, Bank Name, Account Number, IFSC Code, Branch
     SECTION 4: Quote Settings  
       - Quote Number Prefix (e.g., "QT"), Starting Number
       - Place of Supply (State dropdown)
       - Jurisdiction text (e.g., "Subject to Mumbai Jurisdiction")
   - Save and Cancel buttons

3. /app/(admin)/firms/[id]/page.tsx — Edit Firm
   - Same form as create, pre-filled
   - "Replace Logo" and "Replace Signature" with current preview shown

BACKEND ROUTES:
4. GET    /api/firms           → list all firms for tenant
5. POST   /api/firms           → create firm (body: firm details)
6. PUT    /api/firms/:id       → update firm
7. DELETE /api/firms/:id       → soft delete
8. POST   /api/firms/:id/logo  → upload logo (multipart/form-data, use multer + sharp to resize to max 400x200px, upload to Supabase Storage)
9. POST   /api/firms/:id/signature → upload signature (max 300x150px)

VALIDATION (zod):
- GSTIN: must match /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
- IFSC: must match /^[A-Z]{4}0[A-Z0-9]{6}$/
- Phone: 10 digits

After upload, store the Supabase Storage public URL in firms.logo_url / firms.signature_url.
```

### Acceptance Criteria
- [ ] Admin can create a firm with all fields
- [ ] Logo upload shows preview immediately
- [ ] GSTIN validation works
- [ ] Firm list shows all created firms
- [ ] Edit pre-fills all fields
- [ ] Delete shows confirm dialog

---

## ⚡ PHASE 3 — Item Master (Admin)

### Context
Firms created. Need item catalogue management so sales users can select items for quotes.

### Cursor Prompt
```
Build the Item Master management module for QuoteForge admin:

PAGES:
1. /app/(admin)/items/page.tsx — Item List
   - Table with columns: SKU, Item Name, HSN/SAC, Unit, Rate (₹), CGST%, SGST%, Status
   - Search bar (searches name and SKU)
   - Filter by: Active/Inactive
   - "Add Item" button
   - Inline edit rate (click to edit)
   - Bulk actions: Activate, Deactivate, Delete (admin only)
   - Pagination (20 per page)

2. /app/(admin)/items/new/page.tsx — Create Item
   - Fields:
     - Item Name* (text)
     - Item Code / SKU (text, auto-suggested)
     - Description (textarea, multi-line)
     - HSN/SAC Code* (text, 6-8 digits)
     - Unit* (dropdown: Nos, Pcs, Kg, Ltr, Mtr, Set, Box, Pair)
     - Default Rate* (₹, number with 2 decimal)
     - Condition (dropdown: NEW, USED, REFURBISHED)
     - Tax Configuration:
       - CGST % (default 9)
       - SGST % (default 9)  
       - IGST % (auto = CGST + SGST, read-only)
     - Active toggle
   - Show live tax preview: "For rate ₹34,000 → Taxable: ₹28,813.56 | CGST: ₹2,593.22 | SGST: ₹2,593.22 | Total: ₹34,000"

3. /app/(admin)/items/[id]/page.tsx — Edit Item
   - Same form, pre-filled

BACKEND ROUTES:
4. GET    /api/items        → list (with search query param, pagination)
5. POST   /api/items        → create
6. PUT    /api/items/:id    → update
7. DELETE /api/items/:id    → soft delete (set is_active = false)
8. POST   /api/items/bulk   → bulk import from CSV (Phase 2, scaffold route now)

TAX SERVICE:
9. Create /apps/api/src/services/tax.service.ts
   - calculateItemTax(rate, qty, cgst_rate, sgst_rate, supply_state, firm_state): TaxResult
   - numberToWords(amount): string  ← for "Indian Rupee X Only"
   - Both intra-state (CGST+SGST) and inter-state (IGST) logic

```

### Acceptance Criteria
- [ ] Admin can add items with HSN and tax rates
- [ ] Tax preview calculates correctly (match sample: ₹34000 → ₹28813.56 taxable)
- [ ] Search finds items by name and SKU
- [ ] Items persist across sessions

---

## ⚡ PHASE 4 — Quote Template Editor (Admin)

### Context
Items ready. Now admin needs to configure how quotes look — columns, layout, colors, footer.

### Cursor Prompt
```
Build the Quote Template Editor for QuoteForge admin:

PAGES:
1. /app/(admin)/templates/page.tsx — Template List
   - List templates grouped by firm
   - Each shows: template name, firm name, "Default" badge if default
   - Actions: Edit, Duplicate, Delete, Set as Default for Firm

2. /app/(admin)/templates/[id]/page.tsx — Template Editor
   - TWO-PANEL LAYOUT:
     LEFT PANEL (settings): 
       Tab 1 - Columns
         - Drag-to-reorder list of all columns
         - Toggle visibility per column (eye icon)
         - Edit column label text
         - Adjust column width %
       Tab 2 - Header
         - Toggle: Show Logo, Logo Position (left/center/right)
         - Toggle: Show GSTIN, Show MSME, Show Sales Person
         - Quote watermark label text (e.g., "Quote", "Quotation", "Estimate")
       Tab 3 - Bill/Ship
         - Toggle show/hide Bill To, Ship To sections
         - Toggle show customer GSTIN, Phone, Email
       Tab 4 - Footer
         - Toggle: Bank Details, Notes, Signature, Jurisdiction, Page Numbers
         - Editable default notes textarea
       Tab 5 - Theme
         - Accent color picker
         - Font family dropdown (Arial, Times New Roman, Helvetica, Georgia)
         - Font size (Small/Medium/Large)
         - Paper size (A4, Letter)
     
     RIGHT PANEL (live preview):
         - Renders a SAMPLE quote using the current template config
         - Updates in real-time as settings change
         - Shows dummy data to illustrate layout
         - "This is how your quote will look"

TEMPLATE OPERATIONS:
   - "Save Template" button
   - "Duplicate" creates a copy with name "Copy of X"
   - "Set as Default" for a firm
   - Templates stored as JSONB (see config schema in System Design)

BACKEND:
3. GET    /api/templates              → list by tenant
4. GET    /api/templates/:id          → get single template with config
5. POST   /api/templates              → create (body: name, firm_id, config)
6. PUT    /api/templates/:id          → update config
7. POST   /api/templates/:id/duplicate → create copy
8. DELETE /api/templates/:id          → delete

Create a shared React component /components/QuotePreview.tsx that:
- Accepts: firm data, template config, sample/real quote data
- Renders the complete quote layout as HTML
- Used in: template editor (live preview) AND quote print page
- Matches exactly the layout from the sample image provided (see PRD section 7)
```

### Acceptance Criteria
- [ ] Admin can toggle columns on/off and see live preview update
- [ ] Dragging reorders columns in preview
- [ ] Quote preview matches the sample quotation format
- [ ] Template saved and reloaded correctly
- [ ] Duplicate creates independent copy

---

## ⚡ PHASE 5 — Quote Creation (Sales User Flow)

### Context
Templates ready. Sales users can now log in and create quotes. This is the core user-facing flow.

### Cursor Prompt
```
Build the Quote Creation flow for sales users in QuoteForge:

PAGE: /app/(sales)/quotes/new/page.tsx
Build a multi-step wizard with these steps:

STEP 1 — SETUP (header bar, always visible)
  - Firm selector (dropdown, only firms user has access to)
  - Template selector (based on chosen firm)
  - Quote Date (date picker, default today)
  - Shipping Method (text field: "Surface Shipping" etc.)
  - Order From (text: "Direct" etc.)
  - Sales Person (pre-filled from user profile, editable)

STEP 2 — CUSTOMER
  - Bill To Section:
    - Customer/Firm Name*
    - Address* (textarea)
    - State* (dropdown, for GST determination)
    - PIN Code
    - GSTIN (optional)
    - Phone, Email
  - Ship To Section:
    - "Same as Bill To" checkbox (default checked)
    - If unchecked: same fields as above

STEP 3 — ITEMS (main area)
  - Search bar to find items from Item Master
  - Search results dropdown with: Item Name, SKU, Rate, HSN
  - Click item to add to quote
  - Quote line items table:
    - Sr#, Item Name + Description, Condition, HSN, Qty (editable), Rate (editable if admin-allowed), Amount, Taxable, CGST%/Amt, SGST%/Amt, Total
    - Each row: delete button
    - Qty/Rate editing recalculates tax instantly
  - Running totals at bottom:
    - Sub Total, Total CGST, Total SGST, Grand Total
    - Amount in Words (Indian Rupee X Only)
  
STEP 4 — PREVIEW & PRINT
  - Full-page quote preview using <QuotePreview /> component
  - Render with actual firm data (logo, signature, bank details)
  - Apply selected template config
  - Buttons:
    - "Print" → window.print() (hide all except #quote-print-area)
    - "Download PDF" → GET /api/quotes/:id/pdf → open in new tab
    - "Save Draft" → saves without printing
    - "Back to Edit" → go back to item selection

STATE MANAGEMENT:
  - Use zustand quoteBuilderStore (defined in Phase 0)
  - Persist draft in localStorage (warn on page refresh)
  
BACKEND:
  POST /api/quotes
  - Body: { firm_id, template_id, bill_to, ship_to, items[], quote_date, notes, shipping_method }
  - Server recalculates all taxes (never trust client tax values)
  - Generates quote number via increment_quote_number()
  - Saves to DB, returns full quote object

  GET /api/quotes/:id/pdf
  - Returns signed URL for PDF
  - Generates PDF if not cached
```

### Acceptance Criteria
- [ ] Sales user can select firm, template, and date
- [ ] Item search finds and adds items to quote
- [ ] Tax calculates correctly per line and total
- [ ] Amount in words generates correctly ("Thirty-Four Thousand Only")
- [ ] Quote preview matches sample format pixel-accurately
- [ ] Print opens browser print dialog with clean layout
- [ ] PDF download works

---

## ⚡ PHASE 6 — Admin Quote Management & User Management

### Context
Sales users creating quotes. Admin needs full oversight, editing capability, and user management.

### Cursor Prompt
```
Build Admin management screens for QuoteForge:

1. /app/(admin)/quotes/page.tsx — All Quotes
   - Data table with: Quote#, Date, Firm, Customer, Amount, Status, Created By, Actions
   - Filters: Firm, Date Range, Sales Person, Status (Draft/Sent/Accepted/Rejected)
   - Search by quote number or customer name
   - Bulk export to Excel (Phase 2 — scaffold button)
   - Click row → open quote detail
   - Status badge with colors: Draft(gray), Sent(blue), Accepted(green), Rejected(red)

2. /app/(admin)/quotes/[id]/page.tsx — Quote Detail (Admin)
   - Show full quote preview
   - Edit mode: can change any field (items, customer, date, notes)
   - Change Status dropdown
   - "Regenerate PDF" button
   - Quote history/audit log (who changed what, when)
   - Delete quote (with confirm)
   - Duplicate quote

3. /app/(admin)/users/page.tsx — User Management
   - Table: Name, Email, Role, Status (Active/Revoked), Invited By, Date Joined
   - "Invite User" button → opens modal with email + name fields
   - Per user: Assign Firms access (multi-select of firm names)
   - Revoke access (sets is_active = false, JWT invalidated on next request)
   - Cannot delete own account

BACKEND ROUTES:
4. GET  /api/quotes              → all quotes for tenant (admin), own quotes (user)
5. GET  /api/quotes/:id          → get single quote (admin: any, user: own only)
6. PUT  /api/quotes/:id          → full update (admin only)
7. PATCH /api/quotes/:id/status  → change status (admin only)
8. DELETE /api/quotes/:id        → delete (admin only)
9. GET  /api/quotes/:id/pdf      → get/generate PDF

10. GET    /api/users            → list tenant users (admin only)
11. POST   /api/users/invite     → invite user (admin only)
12. PUT    /api/users/:id        → update user (assign firms, change name)
13. DELETE /api/users/:id        → revoke access (admin only)

QUOTE AUDIT LOG:
14. Create quote_audit_log table:
    - id, quote_id, user_id, action (created/updated/status_changed/deleted), changes (JSONB), created_at
15. Log every quote mutation automatically via service layer
```

### Acceptance Criteria
- [ ] Admin sees ALL quotes from all users
- [ ] Admin can edit any quote
- [ ] Status changes update badge color
- [ ] Admin can invite and revoke users
- [ ] Revoked user cannot login

---

## ⚡ PHASE 7 — Dashboard & Analytics

### Context
Full CRUD working. Add dashboards for quick insights.

### Cursor Prompt
```
Build dashboard screens for QuoteForge:

1. /app/(admin)/dashboard/page.tsx
   - Stats cards: Total Quotes This Month, Total Value (₹), Active Users, Firms
   - Chart: Quotes per day (last 30 days) — line chart using recharts
   - Chart: Quote value by firm (bar chart)
   - Recent quotes table (last 10, linkable)
   - Pending (Draft) quotes that are older than 3 days — alert list

2. /app/(sales)/dashboard/page.tsx
   - Stats: My Quotes Today, My Quotes This Month, Total Value Quoted
   - Quick action: "Create New Quote" prominent button
   - My recent quotes (last 10)
   - Firm selector shortcut

Use recharts for all charts.
Use @tanstack/react-query for data fetching with 60s cache.

BACKEND:
3. GET /api/analytics/summary    → admin: overall stats, user: own stats
4. GET /api/analytics/daily      → quotes per day last 30d
5. GET /api/analytics/by-firm    → quote count + value grouped by firm
```

### Acceptance Criteria
- [ ] Dashboard loads in < 2s
- [ ] Stats are accurate
- [ ] Charts render correctly
- [ ] Sales user only sees own stats

---

## ⚡ PHASE 8 — Print Optimization & PDF Polish

### Context
Everything works. Now make print output match the sample invoice exactly, pixel-perfect.

### Cursor Prompt
```
Polish the print/PDF output for QuoteForge to match the provided sample quotation (QTMH2627-1052):

1. Update /components/QuotePreview.tsx:
   - Add @media print CSS: hide all navigation, buttons, sidebar
   - Only #quote-print-area visible during print
   - Font: match professional invoice look (Arial or similar)
   - Table borders: thin black lines matching sample
   - Header: Logo left, Company details center, "Quote" label right (large, light gray)
   - Quote meta info: two-column grid (Quote#, Date | Place of Supply, Order From, Shipping, Sales Person)
   - Bill To / Ship To: two-column layout with borders
   - Items table: match column widths from sample exactly
   - Sub Total row: right-aligned values
   - Total in Words: bold italic, left side
   - Notes: below total words
   - Bank details: left column (below notes)
   - Authorized Signature: right column (signature image, "Authorized Signature" text)
   - Footer: "Subject to [Jurisdiction]" left, "Page 1 of 1" right

2. CSS Print Stylesheet:
   - page-break-inside: avoid on table rows
   - @page { margin: 15mm; size: A4 }
   - All colors use pure black for text (no gray that looks faded in print)

3. Server-side Puppeteer PDF (upgrade from React-PDF):
   - /apps/api/src/services/pdf.service.ts
   - Launch puppeteer with { headless: true, args: ['--no-sandbox'] }
   - Set viewport to A4 pixel dimensions
   - Call page.pdf({ format: 'A4', printBackground: true, margin: { top: '15mm'... } })
   - Cache generated PDF in Supabase Storage

4. Number-to-Words service (Indian format):
   - "Indian Rupee Thirty-Four Thousand Only"
   - Handle Lakhs and Crores (Indian numbering system)
   - Handle paise (if any)
```

### Acceptance Criteria
- [ ] Printed quote matches sample format
- [ ] PDF downloads correctly
- [ ] "Indian Rupee X Only" generates accurately for any amount
- [ ] Multi-page quotes have proper page breaks
- [ ] Logo and signature appear in PDF

---

## ⚡ PHASE 9 — Security Hardening & Production Prep

### Context
Feature complete. Prepare for production deployment.

### Cursor Prompt
```
Harden QuoteForge for production:

1. SECURITY:
   - Add helmet() to Express with CSP headers
   - Rate limit: 100 req/min per IP globally, 10/min on /auth routes
   - Rate limit: 20 PDF generations per hour per tenant
   - Validate all file uploads: whitelist MIME types, max 2MB
   - Sanitize all text inputs (strip HTML)
   - Add CORS: only allow FRONTEND_URL origin
   - Rotate Supabase service role key handling (never log it)

2. VALIDATION:
   - All API inputs validated with Zod schemas
   - Frontend forms validated with React Hook Form + Zod resolvers
   - GSTIN format check on firm creation and quote creation

3. ERROR HANDLING:
   - Global Express error handler with structured JSON errors
   - React Error Boundary wrapping all major pages
   - Toast notifications for all async operations (success + error)
   - 404 page for invalid routes

4. LOGGING:
   - Add pino logger to Express
   - Log: request method, path, response code, duration
   - Never log: passwords, tokens, API keys

5. DEPLOYMENT:
   - Add Dockerfile for /apps/api
   - Add vercel.json for /apps/web
   - Add GitHub Actions workflow: lint + test on PR, deploy on main push
   - Add health check endpoint: GET /api/health → { status: 'ok', version }

6. ENVIRONMENT:
   - Validate all required env vars on startup (throw if missing)
   - Add .env.example files with all required variables documented
```

### Acceptance Criteria
- [ ] Security headers present in production (verify with securityheaders.com)
- [ ] Rate limiting blocks abuse
- [ ] App deploys successfully on Vercel + Railway
- [ ] /api/health returns 200

---

## 📋 Phase Summary Table

| Phase | What Gets Built | Duration Est. |
|-------|----------------|--------------|
| 0 | Scaffolding + DB setup | 1 day |
| 1 | Auth (login, signup, invite) | 2 days |
| 2 | Firm management + logo/sig upload | 2 days |
| 3 | Item Master CRUD | 1.5 days |
| 4 | Template editor + live preview | 3 days |
| 5 | Quote creation (core flow) | 3 days |
| 6 | Admin management + user control | 2 days |
| 7 | Dashboards + analytics | 1.5 days |
| 8 | Print/PDF polish | 2 days |
| 9 | Security + production | 1.5 days |
| **Total** | | **~19 days** |

---

## 🗒 Notes for Antigravity / Cursor Usage

- **Always paste the full Context + Prompt together** into Cursor's composer
- **Reference files**: When Cursor generates a file, mention it by path in your next prompt so it has context
- **Iterative approach**: After each phase, run the acceptance criteria tests manually before moving to the next phase
- **Don't skip phases**: Each phase builds on the last — Phase 5 requires Phase 3 items and Phase 4 templates to exist
- **Use Cursor's `@codebase`** context when asking it to extend existing functionality
- **Database migrations**: Run each SQL file in Supabase SQL editor in order (001, 002, 003)
