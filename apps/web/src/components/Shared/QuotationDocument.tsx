import React from 'react';
import { numberToWords } from '@/lib/tax';

interface Item {
  id: string;
  name: string;
  description?: string;
  hsn_code?: string;
  qty: number;
  rate: number;
  cgst_rate: number;
  sgst_rate: number;
  taxable_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  total_amount: number;
}

interface QuotationDocumentProps {
  firm: any;
  template: any;
  client: any;
  items: Item[];
  summary: {
    subtotal: number;
    total_cgst: number;
    total_sgst: number;
    total_igst: number;
    grand_total: number;
  };
  quoteDate: string;
  quoteNo?: string;
}

export const QuotationDocument: React.FC<QuotationDocumentProps> = ({
  firm,
  template,
  client,
  items,
  summary,
  quoteDate,
  quoteNo = 'DRAFT'
}) => {
  const toNumber = (value: unknown): number => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  };

  const config = template?.config || {};
  const accentColor = config.accentColor || '#4f46e5';
  const fontFamily = config.fontFamily || 'Inter';
  const logoUrl = typeof firm?.logo_url === 'string' ? firm.logo_url.trim() : '';
  const signatureUrl = typeof firm?.signature_url === 'string' ? firm.signature_url.trim() : '';
  
  // Default columns matching backend pdf.service.ts
  const columns = config.columns || {
    sr_no: { visible: true, label: '#' },
    item_name: { visible: true, label: 'Item & Description' },
    condition: { visible: config.showCondition ?? false, label: 'Cond' },
    hsn_sac: { visible: config.showHSN ?? true, label: 'HSN' },
    qty: { visible: true, label: 'Qty' },
    rate: { visible: true, label: 'Rate' },
    amount: { visible: true, label: 'Amount' },
    taxable_amount: { visible: false, label: 'Taxable' },
    cgst: { visible: true, label: 'CGST' },
    sgst: { visible: true, label: 'SGST' },
    igst: { visible: false, label: 'IGST' },
    total: { visible: true, label: 'Total' }
  };

  const visibleCols = Object.entries(columns)
    .filter(([_, col]: any) => col.visible)
    .sort((a: any, b: any) => (a[1].order || 0) - (b[1].order || 0));

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div 
      id="quotation-document"
      className="bg-white text-slate-900 shadow-2xl mx-auto min-h-[842px] w-[595px] p-8 border border-slate-100 origin-top"
      style={{ fontFamily, color: '#0f172a' }}
    >
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 pb-6" style={{ borderColor: accentColor }}>
        <div>
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={firm.name || 'Firm logo'}
              className="h-16 object-contain mb-2"
              crossOrigin="anonymous"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-32 h-16 bg-slate-100 rounded flex items-center justify-center text-slate-400 text-xs mb-2">Logo</div>
          )}
          <h1 className="text-xl font-bold text-slate-900">{firm?.name || 'Your Business Name'}</h1>
          <p className="text-[10px] max-w-[250px] whitespace-pre-wrap" style={{ color: '#334155' }}>
            {firm?.address || 'Firm Address'}
          </p>
          <div className="flex gap-4 mt-1">
            <p className="text-[10px] font-semibold text-slate-800">GSTIN: {firm?.gstin || 'N/A'}</p>
            {firm?.msme_no && <p className="text-[10px] font-semibold text-slate-800">MSME: {firm.msme_no}</p>}
          </div>
          {firm?.phone && <p className="text-[10px]" style={{ color: '#334155' }}>Phone: {firm.phone}</p>}
          {firm?.email && <p className="text-[10px]" style={{ color: '#334155' }}>Email: {firm.email}</p>}
        </div>
        <div className="text-right">
          <h2 className="text-3xl font-black uppercase tracking-tighter" style={{ color: accentColor }}>Quotation</h2>
          <div className="mt-4 space-y-1 text-[10px]">
            <p><span className="text-slate-700 uppercase font-bold mr-2">No:</span> <span className="font-bold text-slate-900">{quoteNo}</span></p>
            <p><span className="text-slate-700 uppercase font-bold mr-2">Date:</span> <span className="font-bold text-slate-900">{formatDate(quoteDate)}</span></p>
            <p><span className="text-slate-700 uppercase font-bold mr-2">Place of Supply:</span> <span className="font-bold text-slate-900">{firm?.place_of_supply || 'N/A'}</span></p>
          </div>
        </div>
      </div>

      {/* Addresses */}
      <div className="grid grid-cols-2 gap-8 py-6">
        <div>
          <h3 className="text-[10px] font-bold uppercase tracking-wider mb-2 border-b border-slate-100 pb-1" style={{ color: '#334155' }}>Bill To</h3>
          <p className="text-xs font-bold text-slate-900">{client?.name || 'Client Name'}</p>
          <p className="text-[10px] mt-1 whitespace-pre-wrap" style={{ color: '#334155' }}>{client?.address || 'Client Address'}</p>
          {client?.gstin && <p className="text-[10px] font-semibold text-slate-800 mt-1">GSTIN: {client.gstin}</p>}
          {client?.phone && <p className="text-[10px]" style={{ color: '#334155' }}>Phone: {client.phone}</p>}
        </div>
        <div>
          <h3 className="text-[10px] font-bold uppercase tracking-wider mb-2 border-b border-slate-100 pb-1" style={{ color: '#334155' }}>Ship To</h3>
          <p className="text-xs font-bold text-slate-900">{client?.ship_to_name || client?.name || 'Client Name'}</p>
          <p className="text-[10px] mt-1 whitespace-pre-wrap" style={{ color: '#334155' }}>
            {client?.ship_to_address || client?.address || 'N/A'}
          </p>
        </div>
      </div>

      {/* Items Table */}
      <div className="mt-4">
        <table className="w-full text-left border-collapse overflow-hidden rounded-t-lg">
          <thead>
            <tr className="text-white text-[10px] font-bold uppercase tracking-wider" style={{ backgroundColor: accentColor }}>
              {visibleCols.map(([key, col]: any) => (
                <th key={key} className={`py-2 px-3 ${['qty', 'rate', 'amount', 'taxable_amount', 'cgst', 'sgst', 'igst', 'total'].includes(key) ? 'text-right' : 'text-left'}`}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-[10px]" style={{ color: '#0f172a' }}>
            {items.map((item: any, index) => (
              <tr key={index} className={`border-b border-slate-100 ${index % 2 === 1 ? 'bg-slate-50/30' : ''}`}>
                {visibleCols.map(([key, _]: any) => {
                  let content: React.ReactNode = '-';
                  let align = 'text-left';
                  const qty = toNumber(item.qty);
                  const rate = toNumber(item.rate);
                  const taxableAmount = toNumber(item.taxable_amount);
                  const cgstAmount = toNumber(item.cgst_amount);
                  const sgstAmount = toNumber(item.sgst_amount);
                  const igstAmount = toNumber(item.igst_amount);
                  const totalAmount = toNumber(item.total_amount || item.total);

                  switch (key) {
                    case 'sr_no':
                      content = index + 1;
                      break;
                    case 'item_name':
                      content = (
                        <div>
                          <p className="font-bold">{item.name}</p>
                          {(config.showDescription ?? true) && item.description && (
                            <p className="text-[9px] mt-0.5" style={{ color: '#334155' }}>{item.description}</p>
                          )}
                        </div>
                      );
                      break;
                    case 'condition':
                      content = item.condition || 'NEW';
                      break;
                    case 'hsn_sac':
                      content = <span style={{ color: '#334155' }}>{item.hsn_code || item.hsn_sac || '-'}</span>;
                      break;
                    case 'qty':
                      align = 'text-right';
                      content = <span className="text-slate-800">{qty.toFixed(2)}</span>;
                      break;
                    case 'rate':
                      align = 'text-right';
                      content = <span className="text-slate-800">₹{rate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>;
                      break;
                    case 'amount':
                      align = 'text-right';
                      content = <span className="text-slate-800">₹{(qty * rate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>;
                      break;
                    case 'taxable_amount':
                      align = 'text-right';
                      content = <span className="text-slate-800">₹{(taxableAmount || (qty * rate)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>;
                      break;
                    case 'cgst':
                      align = 'text-right';
                      content = (
                        <div>
                          <p className="text-[8px]" style={{ color: '#475569' }}>{item.cgst_rate}%</p>
                          <p className="font-semibold">₹{cgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                        </div>
                      );
                      break;
                    case 'sgst':
                      align = 'text-right';
                      content = (
                        <div>
                          <p className="text-[8px]" style={{ color: '#475569' }}>{item.sgst_rate}%</p>
                          <p className="font-semibold">₹{sgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                        </div>
                      );
                      break;
                    case 'igst':
                      align = 'text-right';
                      content = (
                        <div>
                          <p className="text-[8px]" style={{ color: '#475569' }}>{item.igst_rate}%</p>
                          <p className="font-semibold">₹{igstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                        </div>
                      );
                      break;
                    case 'total':
                      align = 'text-right';
                      content = <span className="font-bold text-slate-900">₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>;
                      break;
                  }

                  return (
                    <td key={key} className={`py-3 px-3 ${align}`}>
                      {content}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="mt-8 flex justify-between items-start">
        <div className="w-1/2">
           <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
             <h4 className="text-[10px] font-bold uppercase tracking-wider mb-2 border-b border-slate-200 pb-1" style={{ color: '#334155' }}>Bank Payment Details</h4>
             <div className="text-[10px] space-y-1">
               <div className="flex justify-between"><span style={{ color: '#475569' }}>Account Name:</span> <span className="font-bold" style={{ color: '#0f172a' }}>{firm?.bank_ac_holder || firm?.name}</span></div>
               <div className="flex justify-between"><span style={{ color: '#475569' }}>Bank Name:</span> <span className="font-bold" style={{ color: '#0f172a' }}>{firm?.bank_name || 'N/A'}</span></div>
               <div className="flex justify-between"><span style={{ color: '#475569' }}>Account No:</span> <span className="font-bold font-mono tracking-tighter" style={{ color: '#0f172a' }}>{firm?.bank_ac_no || 'N/A'}</span></div>
               <div className="flex justify-between"><span style={{ color: '#475569' }}>IFSC Code:</span> <span className="font-bold font-mono" style={{ color: '#0f172a' }}>{firm?.bank_ifsc || 'N/A'}</span></div>
             </div>
           </div>
        </div>
        <div className="w-[280px] space-y-2" style={{ color: '#334155' }}>
          <div className="flex justify-between text-xs">
            <span>Subtotal</span>
            <span className="text-slate-900 font-bold">
              ₹{summary.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
          
          {summary.total_cgst > 0 && (
            <div className="flex justify-between text-[10px]">
              <span>Total CGST</span>
              <span className="text-slate-900 font-bold">
                ₹{summary.total_cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}
          
          {summary.total_sgst > 0 && (
            <div className="flex justify-between text-[10px]">
              <span>Total SGST</span>
              <span className="text-slate-900 font-bold">
                ₹{summary.total_sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}

          {summary.total_igst > 0 && (
            <div className="flex justify-between text-[10px]">
              <span>Total IGST</span>
              <span className="text-slate-900 font-bold">
                ₹{summary.total_igst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}

          <div className="flex justify-between text-sm pt-2 border-t-2 mt-2" style={{ borderColor: accentColor }}>
            <span className="font-bold uppercase tracking-wider">Grand Total</span>
            <span className="font-black text-xl" style={{ color: accentColor }}>
              ₹{summary.grand_total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="bg-slate-50 p-2 rounded mt-2">
            <p className="text-[8px] uppercase font-bold mb-1" style={{ color: '#334155' }}>Amount in Words</p>
            <p className="text-[10px] text-slate-900 font-bold italic leading-tight">
              {numberToWords(summary.grand_total)}
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-10 flex justify-between items-end">
        <div className="flex-1 max-w-[320px]">
          <h4 className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: '#475569' }}>Terms & Conditions</h4>
          <ul className="text-[9px] space-y-1 list-disc pl-4 leading-relaxed" style={{ color: '#334155' }}>
            {config.terms?.length > 0 ? config.terms.map((term: string, i: number) => (
              <li key={i}>{term}</li>
            )) : (
              <li>Goods once sold will not be taken back.</li>
            )}
          </ul>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-slate-500 mb-10 uppercase tracking-widest">For {firm?.name || 'Your Business'}</p>
          <div className="inline-block border-t border-slate-200 pt-2 min-w-[180px]">
            {signatureUrl && (
              <img
                src={signatureUrl}
                className="h-10 mx-auto mb-1 object-contain"
                alt="Signature"
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
              />
            )}
            <p className="text-[10px] font-bold text-slate-900">Authorized Signatory</p>
          </div>
        </div>
      </div>

      {/* Fixed Footer Note */}
      <div className="mt-auto pt-8 text-center border-t border-slate-50 mt-8">
        <p className="text-[9px] text-slate-400 font-medium italic">Subject to {firm?.jurisdiction || 'Mumbai Jurisdiction'}</p>
        <p className="text-[8px] text-slate-300 mt-1">{config.footerText}</p>
      </div>
    </div>
  );
};

