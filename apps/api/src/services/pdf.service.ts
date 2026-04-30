import puppeteer from 'puppeteer';

export class PdfService {
  static async generateQuotePdf(quoteData: any): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    const html = this.getQuoteHtml(quoteData);

    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdf = await page.pdf({
      format: 'A4',
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      },
      printBackground: true
    });

    await browser.close();
    return Buffer.from(pdf);
  }

  private static getQuoteHtml(quote: any): string {
    const { firms, bill_to, ship_to, items, quote_number, quote_date, notes, grand_total, total_cgst, total_sgst, total_igst, subtotal, templates } = quote;
    
    const config = templates?.config || {};
    const accentColor = config.accentColor || '#4f46e5';
    const fontFamily = config.fontFamily || 'Inter, sans-serif';
    const columns = config.columns || {
      sr_no: { visible: true, label: '#' },
      item_name: { visible: true, label: 'Item & Description' },
      condition: { visible: true, label: 'Cond' },
      hsn_sac: { visible: true, label: 'HSN' },
      qty: { visible: true, label: 'Qty' },
      rate: { visible: true, label: 'Rate' },
      amount: { visible: true, label: 'Amount' },
      taxable_amount: { visible: true, label: 'Taxable' },
      cgst: { visible: true, label: 'CGST' },
      sgst: { visible: true, label: 'SGST' },
      igst: { visible: false, label: 'IGST' },
      total: { visible: true, label: 'Total' }
    };

    // Filter visible columns
    const visibleCols = Object.entries(columns)
      .filter(([_, col]: any) => col.visible)
      .sort((a: any, b: any) => (a[1].order || 0) - (b[1].order || 0));

    const tableHeaderHtml = visibleCols.map(([key, col]: any) => {
      let width = '80px';
      if (key === 'sr_no') width = '30px';
      if (key === 'item_name') width = '25%';
      if (key === 'qty') width = '40px';
      if (key === 'condition') width = '50px';
      if (key === 'total') width = '90px';
      
      return `<th style="width: ${width};">${col.label}</th>`;
    }).join('');

    const itemsHtml = items.map((item: any, index: number) => {
      const rowCells = visibleCols.map(([key, _]: any) => {
        let content = '';
        let align = 'center';
        let weight = 'normal';
        let color = '#475569';
        let bg = 'transparent';

        switch (key) {
          case 'sr_no':
            content = (index + 1).toString();
            color = '#64748b';
            break;
          case 'item_name':
            align = 'left';
            content = `
              <div style="font-weight: 700; color: #1e293b; font-size: 13px;">${item.name}</div>
              <div style="font-size: 11px; color: #64748b; margin-top: 2px; line-height: 1.4;">${item.description || ''}</div>
            `;
            break;
          case 'condition':
            content = item.condition || 'NEW';
            break;
          case 'hsn_sac':
            content = item.hsn_sac || '';
            break;
          case 'qty':
            content = item.qty.toString();
            weight = '600';
            break;
          case 'rate':
            align = 'right';
            content = item.rate.toLocaleString('en-IN', { minimumFractionDigits: 2 });
            break;
          case 'amount':
            align = 'right';
            content = (item.qty * item.rate).toLocaleString('en-IN', { minimumFractionDigits: 2 });
            break;
          case 'taxable_amount':
            align = 'right';
            content = (item.taxable_amount || (item.qty * item.rate)).toLocaleString('en-IN', { minimumFractionDigits: 2 });
            break;
          case 'cgst':
            align = 'right';
            content = `
              <div style="font-size: 10px; color: #94a3b8;">${item.cgst_rate}%</div>
              <div style="font-weight: 600;">${(item.cgst_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            `;
            break;
          case 'sgst':
            align = 'right';
            content = `
              <div style="font-size: 10px; color: #94a3b8;">${item.sgst_rate}%</div>
              <div style="font-weight: 600;">${(item.sgst_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            `;
            break;
          case 'igst':
            align = 'right';
            content = `
              <div style="font-size: 10px; color: #94a3b8;">${item.igst_rate}%</div>
              <div style="font-weight: 600;">${(item.igst_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            `;
            break;
          case 'total':
            align = 'right';
            weight = '700';
            color = '#0f172a';
            bg = '#f8fafc';
            content = (item.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
            break;
        }

        return `<td style="border: 1px solid #e2e8f0; padding: 10px 8px; text-align: ${align}; font-weight: ${weight}; color: ${color}; background-color: ${bg};">${content}</td>`;
      }).join('');

      return `<tr style="page-break-inside: avoid;">${rowCells}</tr>`;
    }).join('');

    const amountInWords = this.numberToWords(grand_total);

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <style>
          @page { size: A4; margin: 0; }
          body { 
            font-family: ${fontFamily}; 
            color: #1e293b; 
            margin: 0; 
            padding: 40px;
            background: white;
            -webkit-print-color-adjust: exact;
          }
          .container { width: 100%; position: relative; }
          .watermark {
            position: absolute;
            top: 0;
            right: 0;
            font-size: 100px;
            font-weight: 900;
            color: #f1f5f9;
            z-index: -1;
            line-height: 1;
            opacity: 0.5;
          }
          .header { display: flex; justify-content: space-between; margin-bottom: 40px; align-items: flex-start; }
          .firm-info { flex: 1; }
          .quote-meta { text-align: right; margin-top: 20px; }
          .meta-item { display: flex; justify-content: flex-end; gap: 10px; font-size: 13px; margin-bottom: 4px; }
          .meta-label { color: #64748b; font-weight: 600; }
          .meta-value { color: #1e293b; font-weight: 700; }
          
          .address-section { display: flex; gap: 40px; margin-bottom: 40px; }
          .address-box { flex: 1; }
          .section-title { 
            font-weight: 800; 
            font-size: 11px; 
            text-transform: uppercase; 
            color: ${accentColor}; 
            margin-bottom: 10px; 
            letter-spacing: 0.05em;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .section-title::after {
            content: '';
            height: 1px;
            background: #e2e8f0;
            flex: 1;
          }
          
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; table-layout: fixed; }
          th { 
            background-color: #f1f5f9; 
            border: 1px solid #e2e8f0; 
            padding: 12px 8px; 
            text-align: center; 
            color: #475569; 
            font-weight: 800;
            text-transform: uppercase;
            font-size: 10px;
            letter-spacing: 0.025em;
          }
          
          .totals-section { display: flex; justify-content: flex-end; margin-top: 30px; }
          .totals-table { width: 320px; }
          .totals-table td { padding: 6px 12px; font-size: 13px; }
          .grand-total-row { 
            background-color: ${accentColor}; 
            color: white; 
            font-weight: 800; 
            font-size: 16px; 
          }
          .grand-total-row td { padding: 12px !important; }
          
          .footer { margin-top: 60px; padding-top: 30px; border-top: 2px solid #f1f5f9; }
          .footer-top { display: flex; justify-content: space-between; align-items: flex-end; }
          .bank-card { 
            background: #f8fafc; 
            padding: 15px; 
            border-radius: 8px; 
            border: 1px solid #e2e8f0;
            width: 320px;
          }
          .signature-box { text-align: right; min-width: 200px; }
          
          .jurisdiction { 
            margin-top: 40px; 
            text-align: center; 
            color: #94a3b8; 
            font-size: 10px; 
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.1em;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="watermark">QUOTE</div>
          
          <div class="header">
            <div class="firm-info">
              ${firms.logo_url ? `<img src="${firms.logo_url}" style="max-height: 70px; margin-bottom: 15px;" />` : ''}
              <div style="font-size: 22px; font-weight: 900; color: #0f172a; margin-bottom: 4px;">${firms.name}</div>
              <div style="font-size: 12px; color: #64748b; line-height: 1.5; max-width: 350px;">${firms.address || ''}</div>
              <div style="display: flex; gap: 15px; margin-top: 10px; font-size: 12px;">
                <div><span style="color: #94a3b8; font-weight: 600;">GSTIN</span> <span style="font-weight: 700;">${firms.gstin || 'N/A'}</span></div>
                ${firms.msme_no ? `<div><span style="color: #94a3b8; font-weight: 600;">MSME</span> <span style="font-weight: 700;">${firms.msme_no}</span></div>` : ''}
              </div>
            </div>
            
            <div class="quote-meta">
              <div class="meta-item">
                <span class="meta-label">QUOTATION NO</span>
                <span class="meta-value" style="color: ${accentColor};">${quote_number}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">DATE</span>
                <span class="meta-value">${new Date(quote_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">PLACE OF SUPPLY</span>
                <span class="meta-value">${firms.place_of_supply || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div class="address-section">
            <div class="address-box" style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
              <div class="section-title">Bill To</div>
              <div style="font-size: 14px; font-weight: 800; color: #0f172a; margin-bottom: 4px;">${bill_to.name}</div>
              <div style="font-size: 11px; color: #475569; line-height: 1.5;">${bill_to.address || ''}</div>
              <div style="font-size: 11px; margin-top: 10px; display: flex; gap: 10px;">
                <span style="color: #94a3b8; font-weight: 600; text-transform: uppercase; font-size: 9px;">GSTIN</span> 
                <span style="font-weight: 700; color: #1e293b;">${bill_to.gstin || 'N/A'}</span>
              </div>
            </div>
            <div class="address-box" style="padding: 15px;">
              <div class="section-title">Ship To</div>
              <div style="font-size: 14px; font-weight: 800; color: #0f172a; margin-bottom: 4px;">${ship_to?.name || bill_to.name}</div>
              <div style="font-size: 11px; color: #475569; line-height: 1.5;">${ship_to?.address || bill_to.address || ''}</div>
              <div style="font-size: 11px; margin-top: 10px; display: flex; gap: 10px;">
                <span style="color: #94a3b8; font-weight: 600; text-transform: uppercase; font-size: 9px;">Contact</span> 
                <span style="font-weight: 700; color: #1e293b;">${ship_to?.phone || bill_to.phone || 'N/A'}</span>
              </div>
            </div>
          </div>

          <table style="width: 100%;">
            <thead>
              <tr>
                ${tableHeaderHtml}
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="totals-section">
            <table class="totals-table">
              <tr>
                <td style="color: #64748b; font-weight: 600;">Sub Total</td>
                <td style="text-align: right; font-weight: 700;">₹${(subtotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
              ${total_cgst ? `<tr><td style="color: #64748b; font-weight: 600;">Total CGST</td><td style="text-align: right; font-weight: 700;">₹${total_cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>` : ''}
              ${total_sgst ? `<tr><td style="color: #64748b; font-weight: 600;">Total SGST</td><td style="text-align: right; font-weight: 700;">₹${total_sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>` : ''}
              ${total_igst ? `<tr><td style="color: #64748b; font-weight: 600;">Total IGST</td><td style="text-align: right; font-weight: 700;">₹${total_igst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>` : ''}
              <tr class="grand-total-row">
                <td>Grand Total</td>
                <td style="text-align: right;">₹${grand_total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
            </table>
          </div>

          <div style="margin-top: 30px; background: #f1f5f9; padding: 15px; border-radius: 8px;">
            <div style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 5px; letter-spacing: 0.05em;">Amount in Words</div>
            <div style="font-size: 14px; font-weight: 700; color: #1e293b;">${amountInWords}</div>
          </div>

          <div style="margin-top: 25px;">
            <div style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 5px; letter-spacing: 0.05em;">Notes & Terms</div>
            <div style="font-size: 12px; color: #475569; line-height: 1.6; white-space: pre-line;">${notes || '1. Goods once sold will not be taken back.\n2. Interest @18% will be charged if payment is not made within due date.\n3. Looking forward for your business.'}</div>
          </div>

          <div class="footer">
            <div class="footer-top">
              <div class="bank-card">
                <div style="font-size: 10px; font-weight: 800; color: ${accentColor}; text-transform: uppercase; margin-bottom: 10px; letter-spacing: 0.05em;">Bank Payment Details</div>
                <div style="font-size: 12px; line-height: 1.6;">
                  <div style="display: flex; margin-bottom: 2px;"><span style="width: 80px; color: #64748b; font-weight: 600;">A/c Name</span> <span style="font-weight: 700;">${firms.bank_ac_holder || firms.name}</span></div>
                  <div style="display: flex; margin-bottom: 2px;"><span style="width: 80px; color: #64748b; font-weight: 600;">Bank</span> <span style="font-weight: 700;">${firms.bank_name || 'N/A'}</span></div>
                  <div style="display: flex; margin-bottom: 2px;"><span style="width: 80px; color: #64748b; font-weight: 600;">A/c No</span> <span style="font-weight: 700; font-family: monospace; letter-spacing: 0.05em;">${firms.bank_ac_no || 'N/A'}</span></div>
                  <div style="display: flex;"><span style="width: 80px; color: #64748b; font-weight: 600;">IFSC</span> <span style="font-weight: 700; font-family: monospace;">${firms.bank_ifsc || 'N/A'}</span></div>
                </div>
              </div>
              
              <div class="signature-box">
                <div style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 15px; letter-spacing: 0.05em;">For ${firms.name}</div>
                ${firms.signature_url ? `<img src="${firms.signature_url}" style="max-height: 60px; margin-bottom: 5px;" />` : '<div style="height: 60px;"></div>'}
                <div style="font-size: 12px; font-weight: 800; color: #1e293b; border-top: 1px solid #e2e8f0; display: inline-block; padding-top: 5px; min-width: 180px;">Authorized Signatory</div>
              </div>
            </div>
            
            <div class="jurisdiction">
              Subject to ${firms.jurisdiction || 'Mumbai Jurisdiction'} | Page 1 of 1
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private static numberToWords(num: number): string {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const inWords = (n: any): string => {
      if ((n = n.toString()).length > 9) return 'overflow';
      let n_arr: any = ('000000000' + n).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
      if (!n_arr) return '';
      let str = '';
      str += (Number(n_arr[1]) != 0) ? (a[Number(n_arr[1])] || b[n_arr[1][0]] + ' ' + a[n_arr[1][1]]) + 'Crore ' : '';
      str += (Number(n_arr[2]) != 0) ? (a[Number(n_arr[2])] || b[n_arr[2][0]] + ' ' + a[n_arr[2][1]]) + 'Lakh ' : '';
      str += (Number(n_arr[3]) != 0) ? (a[Number(n_arr[3])] || b[n_arr[3][0]] + ' ' + a[n_arr[3][1]]) + 'Thousand ' : '';
      str += (Number(n_arr[4]) != 0) ? (a[Number(n_arr[4])] || b[n_arr[4][0]] + ' ' + a[n_arr[4][1]]) + 'Hundred ' : '';
      str += (Number(n_arr[5]) != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n_arr[5])] || b[n_arr[5][0]] + ' ' + a[n_arr[5][1]]) + 'Only' : 'Only';
      return str;
    };

    return `Indian Rupee ${inWords(Math.floor(num))}`;
  }
}
