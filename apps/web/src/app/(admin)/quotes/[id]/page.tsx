'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Download, Send, CheckCircle, XCircle, Loader2, Printer } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { QuotationDocument } from '@/components/Shared/QuotationDocument';
import { supabase } from '@/lib/supabase';
import { generatePDF } from '@/lib/pdf';

export default function ViewQuotePage() {
  const { id } = useParams();
  const router = useRouter();
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    fetchQuote();
  }, [id]);

  const fetchQuote = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/quotes/${id}`, {
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch quote');
      const data = await response.json();
      setQuote(data);
    } catch (err) {
      console.error(err);
      alert('Error loading quotation');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (status: string) => {
    setUpdating(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/quotes/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error('Failed to update status');
      await fetchQuote();
    } catch (err) {
      console.error(err);
      alert('Error updating status');
    } finally {
      setUpdating(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/quotes/${id}/pdf`, {
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to generate PDF');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Quotation_${quote.quote_number.replace(/\//g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error(err);
      alert('Error generating PDF');
    } finally {
      setDownloading(false);
    }
  };

  const handleSendEmail = async () => {
    setSendingEmail(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/quotes/${id}/send-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send email');
      }
      alert('Email sent successfully!');
      await fetchQuote(); // Refresh status
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSendingEmail(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!quote) return <div>Quotation not found</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* Action Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-4 z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ChevronLeft className="w-4 h-4" /> Back
          </Button>
          <div>
            <h1 className="text-lg font-bold text-slate-900">{quote.quote_number}</h1>
            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">{quote.status}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2" 
            onClick={handleDownload}
            isLoading={downloading}
          >
            <Download className="w-4 h-4" /> PDF
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50" 
            onClick={handleSendEmail}
            isLoading={sendingEmail}
          >
            <Send className="w-4 h-4" /> Email
          </Button>
          
          <div className="h-8 w-px bg-slate-100 mx-2" />

          {['draft', 'sent'].includes(quote.status.toLowerCase()) && (
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2" 
              onClick={() => router.push(`/admin/quotes/${id}/edit`)}
            >
              Edit
            </Button>
          )}

          {quote.status.toLowerCase() === 'draft' && (
            <Button size="sm" className="gap-2" onClick={() => updateStatus('Sent')} isLoading={updating}>
              <Send className="w-4 h-4" /> Mark as Sent
            </Button>
          )}
          
          {quote.status.toLowerCase() === 'sent' && (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2 text-rose-600 hover:text-rose-700 border-rose-200 hover:bg-rose-50" 
                onClick={() => updateStatus('Rejected')} 
                isLoading={updating}
              >
                <XCircle className="w-4 h-4" /> Reject
              </Button>
              <Button 
                size="sm" 
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200" 
                onClick={() => updateStatus('Accepted')} 
                isLoading={updating}
              >
                <CheckCircle className="w-4 h-4" /> Accept
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Document View */}
      <div className="flex justify-center bg-slate-50 p-12 rounded-3xl border border-slate-200 overflow-auto">
        <div className="bg-white shadow-2xl">
          <QuotationDocument 
            firm={quote.firms}
            template={quote.templates}
            client={{
              name: quote.bill_to.name,
              address: quote.bill_to.address,
              gstin: quote.bill_to.gstin,
              phone: quote.bill_to.phone,
              ship_to_address: quote.ship_to.address
            }}
            items={quote.items}
            summary={{
              subtotal: quote.subtotal,
              total_cgst: quote.total_cgst,
              total_sgst: quote.total_sgst,
              total_igst: quote.total_igst,
              grand_total: quote.grand_total
            }}
            quoteDate={quote.quote_date}
            quoteNo={quote.quote_number}
          />
        </div>
      </div>

      {/* History/Notes (Optional enhancement) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100">
        <h3 className="font-bold text-slate-900 mb-4">Notes & Remarks</h3>
        <p className="text-slate-600 text-sm italic">
          {quote.notes || 'No internal notes provided for this quotation.'}
        </p>
      </div>
    </div>
  );
}
