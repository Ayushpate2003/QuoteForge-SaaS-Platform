# PRD (Product Requirements Document).md — QuoteForge

**Version:** 1.0  
**Date:** April 2026  
**Product:** QuoteForge — Multi-Firm GST Quotation Platform  
**Stack:** Next.js + Node.js + Supabase

---

## 1. Product Vision

QuoteForge empowers Indian SMBs to create professional, GST-compliant quotations under multiple firm identities — with a strict role separation between admins who configure everything and sales users who simply select items and print.

---

## 2. Target Users

| Persona | Description | Key Need |
|---------|------------|----------|
| **Business Owner / Admin** | Manages multiple GST firms, hires sales staff | Control over templates, items, branding |
| **Sales Agent / Invited User** | Creates quotes for customers | Fast item selection, instant print |
| **Customer (recipient)** | Receives the quote PDF | Professional, clear quote |

---

## 3. User Roles & Permissions

### 3.1 Admin Role

| Feature | Access |
|---------|--------|
| Create / Edit / Delete Firms | ✅ Full |
| Upload Logo per Firm | ✅ Full |
| Upload Signature per Firm | ✅ Full |
| Add / Edit / Delete Items (Item Master) | ✅ Full |
| Create / Edit / Delete Quote Templates | ✅ Full |
| Change template format / layout | ✅ Full |
| Insert / Update template columns | ✅ Full |
| View all quotes (all users) | ✅ Full |
| Edit any quote | ✅ Full |
| Delete any quote | ✅ Full |
| Invite users | ✅ Full |
| Remove users | ✅ Full |
| Assign firm access to users | ✅ Full |
| Generate & Print Quote | ✅ Full |
| Change quote number prefix | ✅ Full |
| Manage bank details per firm | ✅ Full |

### 3.2 Invited User (Sales) Role

| Feature | Access |
|---------|--------|
| View Item Master (read-only) | ✅ |
| Select Items for Quote | ✅ |
| Enter customer Bill To / Ship To | ✅ |
| Choose firm (from allowed list) | ✅ |
| Generate Quote | ✅ |
| Print Quote / Export PDF | ✅ |
| View own past quotes | ✅ |
| Edit own quote (within same day) | ✅ (configurable by admin) |
| Edit another user's quote | ❌ |
| Delete quote | ❌ |
| Access firm settings | ❌ |
| Upload logo / signature | ❌ |
| Add / edit items | ❌ |
| Invite users | ❌ |
| View other users' quotes | ❌ |
| Access template editor | ❌ |

---

## 4. Feature Requirements

### FR-01: Multi-Firm Management

**Priority:** P0 (Must Have)

- Admin can create unlimited firms
- Each firm has:
  - Business Name
  - Full Address
  - GSTIN
  - PAN
  - MSME Number (optional)
  - Phone / Email
  - Logo image (PNG/JPG, max 2MB)
  - Authorized Signature image (PNG/JPG, max 2MB)
  - Bank details (Account Holder, Bank Name, A/c No, IFSC, Branch)
  - Place of Supply (State)
  - Jurisdiction text (e.g., "Subject to Mumbai Jurisdiction")
- Admin can set one firm as default
- Admin can deactivate a firm (soft delete)

---

### FR-02: Logo & Signature Upload

**Priority:** P0

- Drag-and-drop or click-to-upload interface
- Supported formats: PNG, JPG, JPEG, WEBP
- Max size: 2MB
- Preview shown immediately after upload
- Cropper tool to adjust positioning (Phase 2)
- Signature shown bottom-right of quote (as per sample)
- Logo shown top-left of quote

---

### FR-03: Item Master

**Priority:** P0

- Admin manages a shared item catalogue for the tenant
- Each item has:
  - Item Name
  - SKU / Item Code
  - Description (multi-line)
  - HSN / SAC Code
  - Unit (Nos, Kg, Ltr, Set, Pcs, etc.)
  - Default Rate (₹)
  - CGST % (default 9%)
  - SGST % (default 9%)
  - IGST % (default 18%)
  - Condition (NEW / USED / REFURBISHED)
- Bulk import via CSV (Phase 2)
- Search and filter by name, HSN, category

---

### FR-04: Quote Template System

**Priority:** P0

**4.1 Template Features:**
- Multiple templates per firm
- Template stores:
  - Column visibility (show/hide: HSN, Condition, CGST, SGST, IGST, etc.)
  - Column order
  - Quote header format (logo position, font size)
  - Footer text (notes, bank details, jurisdiction)
  - Color theme (accent color)
  - Paper size (A4 default, Letter)
  - Font family selection

**4.2 Format Operations:**
- **Change format**: Switch active template for a firm
- **Update format**: Edit existing template settings inline
- **Insert format**: Create new template from blank or clone existing

**4.3 Column Configuration (JSONB stored):**
```json
{
  "columns": {
    "sr_no": { "visible": true, "order": 1, "label": "#" },
    "item_name": { "visible": true, "order": 2, "label": "Item & Description" },
    "condition": { "visible": true, "order": 3, "label": "Condition" },
    "hsn_sac": { "visible": true, "order": 4, "label": "HSN/SAC" },
    "qty": { "visible": true, "order": 5, "label": "Qty" },
    "rate": { "visible": true, "order": 6, "label": "Rate" },
    "amount": { "visible": true, "order": 7, "label": "Amount" },
    "taxable_amount": { "visible": true, "order": 8, "label": "Taxable Amount" },
    "cgst": { "visible": true, "order": 9, "label": "CGST" },
    "sgst": { "visible": true, "order": 10, "label": "SGST" },
    "igst": { "visible": false, "order": 11, "label": "IGST" },
    "total": { "visible": true, "order": 12, "label": "Total" }
  },
  "header": {
    "show_logo": true,
    "logo_position": "left",
    "show_gstin": true,
    "show_msme": true
  },
  "footer": {
    "show_bank_details": true,
    "show_notes": true,
    "show_jurisdiction": true,
    "show_signature": true,
    "custom_note": "Looking forward for your business."
  },
  "theme": {
    "accent_color": "#000000",
    "font_family": "Arial"
  }
}
```

---

### FR-05: Quote Creation (Sales User Flow)

**Priority:** P0

**Step 1: Select Firm**
- Dropdown of firms the user has access to

**Step 2: Select Template**
- Template options for chosen firm

**Step 3: Enter Customer Details**
- Bill To: Name, Address, State, GSTIN, Phone, Email
- Ship To: Same as Bill To (checkbox) or different address

**Step 4: Add Items**
- Search/filter item master
- Click to add item to quote
- Adjust quantity inline
- Override rate per line (if allowed by admin)
- Real-time tax calculations shown per line

**Step 5: Quote Details**
- Quote Date (default today)
- Shipping Method
- Order From
- Notes (editable)

**Step 6: Preview & Print**
- Full-page live preview of quote
- Print button (browser print dialog)
- Download PDF button
- Share via WhatsApp (Phase 2)

---

### FR-06: User Invite System

**Priority:** P0

- Admin enters email address + name
- System sends invite email via Resend
- Email contains secure signup link (Supabase magic link)
- New user sets password on first login
- New user gets role: "user" and linked to admin's tenant
- Admin can assign which firms the user can access
- Admin can revoke access at any time

---

### FR-07: Quote History & Management

**Priority:** P1

**Admin View:**
- See all quotes across all users and firms
- Filter by: firm, date range, user, status
- Edit any quote
- Mark quote as: Draft, Sent, Accepted, Rejected
- Duplicate a quote
- Convert to Invoice (Phase 2)

**Sales User View:**
- See only own quotes
- Re-print past quotes
- Duplicate a quote as new

---

## 5. Non-Functional Requirements

| Requirement | Target |
|------------|--------|
| Page Load (LCP) | < 2.5 seconds |
| PDF Generation | < 3 seconds |
| Uptime | 99.5% |
| Mobile Responsive | Yes (view + print) |
| Browser Support | Chrome, Firefox, Safari, Edge |
| Data Isolation | Strict tenant isolation via RLS |
| File Upload Speed | < 5 seconds for 2MB image |
| Concurrent Users | 100+ per tenant (Supabase handles) |

---

## 6. UI/UX Requirements

- **Language:** English (Hindi support Phase 3)
- **Theme:** Clean business SaaS — light mode default, dark mode Phase 2
- **Quote Preview:** WYSIWYG — what you see = what prints
- **Print Layout:** Exactly matches the uploaded sample quote format
- **Mobile:** Create and print quotes from phone
- **Accessibility:** WCAG 2.1 AA compliant buttons and forms

---

## 7. Quote Format Reference (from uploaded sample)

Based on the provided quotation (QTMH2627-1052 from 3Idea Technology Limited):

```
[LOGO]          Company Name (bold, large)
                Address Line 1
                Address Line 2
                GSTIN: XXXXX
                MSME No: XXXXX                    [Quote]  ← large watermark style

Quote#:    QTMH2627-1052     Place of Supply: Maharashtra
Quote Date: 27/04/2026       Order From:      Direct
                             Shipping:        Surface Shipping
                             Sales Person:    Anushri Devendra

[Bill To]                    [Ship To]
Firm Name                    Firm Name
Address...                   Address...
GSTIN                        
Phone                        

#  | Item & Description | Cond | HSN/SAC | Qty | Rate | Amount | Taxable | CGST% | CGST Amt | SGST% | SGST Amt | Total
1  | Creality CR-Falcon  | NEW  | 84779000 | 1  | 34000 | 34000 | 28813.56 | 9% | 2593.22 | 9% | 2593.22 | 34000

Sub Total  |  34000  |  28813.56  | 2593.22 | 2593.22 | ₹34000

Total in Words: Indian Rupee Thirty-Four Thousand Only

Notes: Looking forward for your business.

Bank Details:
A/c Holder: 3 Idea Technology Limited
Bank: UCO Bank
A/c No: 10400510000809
IFSC: UCBA0001040 | Branch: Mulund

                                    [Authorized Signature]

Subject to Mumbai Jurisdiction                          Page 1 of 1
```

---

## 8. Out of Scope for MVP

- Invoice generation (separate module)
- Payment tracking / ledger
- Inventory management
- Customer CRM
- Email quote directly to customer
- WhatsApp integration
- Multi-currency support
- E-way bill generation
- Mobile app (native)
- Offline support

---

## 9. Success Metrics

| Metric | Target (Month 3) |
|--------|-----------------|
| Registered Tenants | 50 |
| Quotes Generated | 500/month |
| PDF Downloads | 300/month |
| User Invites Sent | 100 |
| Avg Quote Creation Time | < 2 minutes |
| Support Tickets | < 5/month |
