import React, { useEffect, useState } from 'react';
import { QuotationDocument } from '@/components/Shared/QuotationDocument';
import { supabase } from '@/lib/supabase';
import { Loader2, Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { generatePDF } from '@/lib/pdf';

interface StepPreviewProps {
  data: any;
}

export const StepPreview: React.FC<StepPreviewProps> = ({ data }) => {
  const [firm, setFirm] = useState<any>(null);
  const [template, setTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const session = (await supabase.auth.getSession()).data.session;
        const headers = {
          'Authorization': `Bearer ${session?.access_token}`
        };

        // API currently exposes list endpoints for firms/templates, not /:id.
        const [firmsRes, templatesRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/firms`, { headers, cache: 'no-store' }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/templates`, { headers, cache: 'no-store' }),
        ]);

        let selectedFirm: any = null;
        let selectedTemplate: any = null;

        if (firmsRes.ok) {
          const firms = await firmsRes.json();
          selectedFirm = firms.find((f: any) => f.id === data.firm_id) || null;
        }

        if (templatesRes.ok) {
          const templates = await templatesRes.json();
          selectedTemplate = templates.find((t: any) => t.id === data.template_id) || null;
        }

        // Fallback to direct Supabase reads if API lookup misses.
        if (!selectedFirm && data.firm_id) {
          const { data: firmData } = await supabase
            .from('firms')
            .select('*')
            .eq('id', data.firm_id)
            .single();
          selectedFirm = firmData || null;
        }

        if (!selectedTemplate && data.template_id) {
          const { data: templateData } = await supabase
            .from('templates')
            .select('*')
            .eq('id', data.template_id)
            .single();
          selectedTemplate = templateData || null;
        }

        // Force-refresh branding URLs to avoid stale browser/CDN cache
        if (selectedFirm) {
          const stamp = Date.now();
          if (selectedFirm.logo_url) {
            selectedFirm.logo_url = `${selectedFirm.logo_url}${selectedFirm.logo_url.includes('?') ? '&' : '?'}v=${stamp}`;
          }
          if (selectedFirm.signature_url) {
            selectedFirm.signature_url = `${selectedFirm.signature_url}${selectedFirm.signature_url.includes('?') ? '&' : '?'}v=${stamp}`;
          }
        }

        setFirm(selectedFirm);
        setTemplate(selectedTemplate);
      } catch (err) {
        console.error('Error fetching preview data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [data.firm_id, data.template_id]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await generatePDF('quotation-document', `Quotation_${new Date().getTime()}`);
    } catch (err) {
      alert('Error generating PDF');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    // ... same loading block ...
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-xl border border-dashed border-slate-200">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Generating Preview...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="w-full flex justify-end">
        <Button 
          variant="outline" 
          onClick={handleDownload} 
          isLoading={downloading}
          className="gap-2"
        >
          <Download className="w-4 h-4" /> Download PDF Preview
        </Button>
      </div>

      {firm && (!firm.logo_url || !firm.signature_url) && (
        <div className="w-full bg-blue-50 border border-blue-100 text-blue-800 text-xs rounded-lg px-3 py-2">
          {`Preview uses firm profile branding. `}
          {!firm.logo_url ? 'Logo is missing. ' : ''}
          {!firm.signature_url ? 'Signature is missing. ' : ''}
          Please upload them in Firm details to show in PDF.
        </div>
      )}
      
      <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200 w-full flex justify-center overflow-auto max-h-[800px]">
        <div className="scale-[0.8] origin-top md:scale-100">
          <QuotationDocument 
            firm={firm}
            template={template}
            client={{
              name: data.bill_to.name,
              address: data.bill_to.address,
              gstin: data.bill_to.gstin,
              phone: data.bill_to.phone,
              ship_to_address: data.ship_to.sameAsBilling ? data.bill_to.address : data.ship_to.address
            }}
            items={data.items}
            summary={{
              subtotal: data.subtotal,
              total_cgst: data.total_cgst,
              total_sgst: data.total_sgst,
              total_igst: data.total_igst,
              grand_total: data.grand_total
            }}
            quoteDate={data.quote_date}
          />
        </div>
      </div>
      
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex items-start gap-3 max-w-2xl">
        <div className="bg-amber-100 p-1 rounded">
          <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h4 className="text-sm font-bold text-amber-900">Review carefully</h4>
          <p className="text-xs text-amber-700 mt-1">
            Please verify all item prices, quantities, and GST details before saving. Once saved, the quotation number will be generated automatically.
          </p>
        </div>
      </div>
    </div>
  );
};
