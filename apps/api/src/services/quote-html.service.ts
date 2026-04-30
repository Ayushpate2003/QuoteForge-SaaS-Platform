import { numberToWords } from './tax.service';

const money = (value: unknown) =>
  `₹${(Number(value) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const text = (value: unknown) => (value ?? '').toString();

export function buildQuoteHTML(quote: any, firm: any, templateConfig: any = {}): string {
  const items = Array.isArray(quote.items) ? quote.items : [];
  const terms: string[] = Array.isArray(templateConfig?.terms) && templateConfig.terms.length
    ? templateConfig.terms
    : [
        '100% payment against delivery',
        'Delivery within 2-3 working days',
        'Goods once sold will not be taken back',
      ];

  const accent = templateConfig?.accentColor || '#3b5bdb';
  const quoteNo = text(quote.quote_number || 'DRAFT');
  const quoteDate = quote.quote_date
    ? new Date(quote.quote_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #1a1a1a; background: white; }
    .page { padding: 10px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; gap: 14px; }
    .logo { width: 56px; height: 56px; border-radius: 50%; border: 2px solid #ddd; object-fit: contain; }
    .quotation-label { font-size: 24px; font-weight: 900; color: ${accent}; text-transform: uppercase; letter-spacing: .4px; }
    .firm-title { font-size: 20px; font-weight: 800; margin-top: 8px; margin-bottom: 3px; }
    .firm-meta { font-size: 10px; color: #374151; line-height: 1.35; }
    .firm-meta strong { color: #111827; }
    .meta-row { display: flex; justify-content: flex-end; gap: 8px; margin-bottom: 2px; font-size: 10px; }
    .meta-row .label { font-weight: 700; text-transform: uppercase; color: #4b5563; min-width: 92px; text-align: right; }
    .meta-row .value { font-weight: 700; color: #111827; }
    .divider { border: none; border-top: 2px solid ${accent}; margin: 10px 0 10px 0; }
    .address-row { display: flex; gap: 16px; margin: 6px 0 10px 0; }
    .address-box { flex: 1; }
    .address-box .label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #6b7280; border-bottom: 1px solid #e5e7eb; padding-bottom: 3px; margin-bottom: 5px; letter-spacing: .5px; }
    .address-box h3 { font-size: 14px; font-weight: 700; margin-bottom: 3px; }
    .address-box p { font-size: 10px; color: #374151; line-height: 1.3; }
    .address-box .gstin { font-weight: 700; color: #111827; }
    table.items { width: 100%; border-collapse: collapse; margin: 8px 0; table-layout: fixed; }
    table.items thead tr { background-color: ${accent}; color: white; }
    table.items thead th {
      padding: 6px 4px;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      text-align: center;
      border: 1px solid #2d4bc4;
      white-space: normal;
      word-break: break-word;
    }
    table.items tbody tr { border-bottom: 1px solid #e8e8e8; }
    table.items tbody td {
      padding: 5px 4px;
      font-size: 9px;
      text-align: center;
      border: 1px solid #e8e8e8;
      vertical-align: middle;
      white-space: normal;
      word-break: break-word;
      overflow-wrap: anywhere;
    }
    table.items tbody td.item-name { text-align: left; font-weight: 700; }
    table.items tbody td.amount { font-family: monospace; }
    .totals-section { display: flex; gap: 16px; margin-top: 8px; align-items: flex-start; }
    .bank-details { flex: 1; font-size: 10px; line-height: 1.45; border: 1px solid #e5e7eb; border-radius: 8px; padding: 9px; background: #f9fafb; }
    .bank-details h4 { font-size: 10px; font-weight: 800; text-transform: uppercase; margin-bottom: 7px; color: #4b5563; letter-spacing: .5px; }
    .bank-row { display: flex; justify-content: space-between; gap: 10px; }
    .bank-label { color: #6b7280; }
    .bank-value { font-weight: 700; }
    .totals-box { flex: 1; font-size: 10px; }
    .total-row { display: flex; justify-content: space-between; padding: 3px 0; border-bottom: 1px solid #f0f0f0; color: #374151; }
    .total-row span:last-child { font-weight: 700; color: #111827; }
    .total-row.grand { font-size: 14px; font-weight: 900; color: ${accent}; border-top: 2px solid ${accent}; border-bottom: none; padding-top: 6px; margin-top: 2px; }
    .amount-words { margin: 8px 0; font-size: 10px; background: #f9fafb; padding: 8px; border-radius: 6px; }
    .amount-words .label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: #6b7280; }
    .amount-words p { font-style: italic; font-weight: 700; margin-top: 4px; }
    .footer-row { display: flex; justify-content: space-between; margin-top: 14px; padding-top: 12px; gap: 16px; align-items: flex-end; }
    .terms { flex: 1; font-size: 10px; }
    .terms h4 { font-size: 10px; font-weight: 800; text-transform: uppercase; margin-bottom: 6px; color: #4b5563; letter-spacing: .5px; }
    .terms ul { padding-left: 16px; line-height: 1.45; color: #374151; }
    .signatory { text-align: right; min-width: 220px; }
    .signatory .for-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .8px; color: #6b7280; margin-bottom: 6px; }
    .signatory img { width: 105px; height: 52px; object-fit: contain; border-bottom: 2px solid #333; padding-bottom: 4px; }
    .signatory .auth-label { font-size: 11px; font-weight: 700; margin-top: 5px; color: #111827; }
    .page-footer { text-align: center; margin-top: 8px; font-size: 9px; color: #6b7280; font-style: italic; }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div>
        ${firm.logo_url ? `<img class="logo" src="${firm.logo_url}" />` : ''}
        <div class="firm-title">${text(firm.name)}</div>
        <div class="firm-meta">
          <p>${text(firm.address)}</p>
          <p><strong>GSTIN: ${text(firm.gstin)}</strong> &nbsp;&nbsp; <strong>MSME: ${text(firm.msme_no)}</strong></p>
          <p>Phone: ${text(firm.phone)} &nbsp; Email: ${text(firm.email)}</p>
        </div>
      </div>
      <div style="text-align:right;">
        <div class="quotation-label">QUOTATION</div>
        <div class="meta-row"><span class="label">NO:</span><span class="value">${quoteNo}</span></div>
        <div class="meta-row"><span class="label">DATE:</span><span class="value">${quoteDate}</span></div>
        <div class="meta-row"><span class="label">PLACE OF SUPPLY:</span><span class="value">${text(firm.place_of_supply || quote.place_of_supply)}</span></div>
      </div>
    </div>

    <hr class="divider" />

    <div class="address-row">
      <div class="address-box">
        <div class="label">Bill To</div>
        <h3>${text(quote.bill_to?.name)}</h3>
        <p>${text(quote.bill_to?.address)}</p>
        ${quote.bill_to?.gstin ? `<p class="gstin">GSTIN: ${text(quote.bill_to.gstin)}</p>` : ''}
        ${quote.bill_to?.phone ? `<p>Phone: ${text(quote.bill_to.phone)}</p>` : ''}
      </div>
      <div class="address-box">
        <div class="label">Ship To</div>
        <h3>${text(quote.ship_to?.name || quote.bill_to?.name)}</h3>
        <p>${text(quote.ship_to?.address || quote.bill_to?.address)}</p>
      </div>
    </div>

    <table class="items">
      <colgroup>
        <col style="width: 8%" />
        <col style="width: 13%" />
        <col style="width: 13%" />
        <col style="width: 13%" />
        <col style="width: 5%" />
        <col style="width: 14%" />
        <col style="width: 14%" />
        <col style="width: 9%" />
        <col style="width: 11%" />
      </colgroup>
      <thead>
        <tr>
          <th>#</th>
          <th style="text-align:left">Item & Description</th>
          <th>HSN</th>
          <th>Amount</th>
          <th>Total</th>
          <th>SGST</th>
          <th>Rate</th>
          <th>CGST</th>
          <th>Qty</th>
        </tr>
      </thead>
      <tbody>
        ${items.map((item: any, i: number) => {
          const qty = Number(item.qty) || 0;
          const rate = Number(item.rate) || 0;
          const taxable = Number(item.taxable_amount ?? item.amount) || qty * rate;
          const total = Number(item.total ?? item.total_amount) || 0;
          return `
            <tr>
              <td>${i + 1}</td>
              <td class="item-name">${text(item.name)}${item.description ? `<br/><small style="color:#777;font-weight:400">${text(item.description)}</small>` : ''}</td>
              <td>${text(item.hsn_sac)}</td>
              <td class="amount">${money(taxable)}</td>
              <td class="amount">${money(total)}</td>
              <td>${Number(item.sgst_rate) || 0}%<br/>${money(item.sgst_amount)}</td>
              <td class="amount">${money(rate)}</td>
              <td>${Number(item.cgst_rate) || 0}%<br/>${money(item.cgst_amount)}</td>
              <td>${qty.toFixed(2)}</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>

    <div class="totals-section">
      <div class="bank-details">
        <h4>Bank Payment Details</h4>
        <div class="bank-row"><span class="bank-label">Account Name:</span><span class="bank-value">${text(firm.bank_ac_holder)}</span></div>
        <div class="bank-row"><span class="bank-label">Bank Name:</span><span class="bank-value">${text(firm.bank_name)}</span></div>
        <div class="bank-row"><span class="bank-label">Account No:</span><span class="bank-value">${text(firm.bank_ac_no)}</span></div>
        <div class="bank-row"><span class="bank-label">IFSC Code:</span><span class="bank-value">${text(firm.bank_ifsc)}</span></div>
      </div>
      <div class="totals-box">
        <div class="total-row"><span>Subtotal</span><span>${money(quote.subtotal)}</span></div>
        <div class="total-row"><span>Total CGST</span><span>${money(quote.total_cgst)}</span></div>
        <div class="total-row"><span>Total SGST</span><span>${money(quote.total_sgst)}</span></div>
        <div class="total-row"><span>Total IGST</span><span>${money(quote.total_igst)}</span></div>
        <div class="total-row grand"><span>GRAND TOTAL</span><span>${money(quote.grand_total)}</span></div>
        <div class="amount-words">
          <div class="label">Amount in Words</div>
          <p>${numberToWords(Number(quote.grand_total) || 0)}</p>
        </div>
      </div>
    </div>

    <div class="footer-row">
      <div class="terms">
        <h4>Terms & Conditions</h4>
        <ul>
          ${terms.map((t) => `<li>${text(t)}</li>`).join('')}
        </ul>
      </div>
      <div class="signatory">
        <div class="for-label">For ${text(firm.name)}</div>
        ${firm.signature_url ? `<img src="${firm.signature_url}" />` : '<div style="height:60px;border-bottom:2px solid #333;width:150px;"></div>'}
        <div class="auth-label">Authorized Signatory</div>
      </div>
    </div>

    <div class="page-footer">Subject to ${text(firm.jurisdiction)} | Thank you for your business!</div>
  </div>
</body>
</html>`;
}
