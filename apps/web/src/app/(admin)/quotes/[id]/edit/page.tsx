'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, Save, Building2, User, Package, Eye, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StepFirm } from '@/components/QuoteEditor/StepFirm';
import { StepClient } from '@/components/QuoteEditor/StepClient';
import { StepItems } from '@/components/QuoteEditor/StepItems';
import { StepPreview } from '@/components/QuoteEditor/StepPreview';
import { supabase } from '@/lib/supabase';

const STEPS = [
  { id: 'firm', title: 'Firm', icon: Building2 },
  { id: 'client', title: 'Client', icon: User },
  { id: 'items', title: 'Items', icon: Package },
  { id: 'preview', title: 'Preview', icon: Eye }
];

export default function EditQuotePage() {
  const router = useRouter();
  const { id } = useParams();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [quoteData, setQuoteData] = useState<any>({
    firm_id: '',
    template_id: '',
    quote_date: '',
    bill_to: {
      name: '',
      email: '',
      phone: '',
      address: '',
      gstin: '',
      state: ''
    },
    ship_to: {
      address: '',
      sameAsBilling: true
    },
    items: [],
    subtotal: 0,
    total_cgst: 0,
    total_sgst: 0,
    total_igst: 0,
    grand_total: 0,
    notes: '',
    shipping_method: '',
    order_from: ''
  });

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/quotes/${id}`, {
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          }
        });
        if (!response.ok) throw new Error('Failed to fetch quote');
        const data = await response.json();
        
        // Strip out read-only or join data if necessary, though the backend update ignores extra fields usually
        // But let's be clean
        setQuoteData({
          firm_id: data.firm_id,
          template_id: data.template_id,
          quote_date: data.quote_date.split('T')[0],
          bill_to: data.bill_to,
          ship_to: data.ship_to || { address: '', sameAsBilling: true },
          items: data.items,
          subtotal: data.subtotal,
          total_cgst: data.total_cgst,
          total_sgst: data.total_sgst,
          total_igst: data.total_igst,
          grand_total: data.grand_total,
          notes: data.notes,
          shipping_method: data.shipping_method,
          order_from: data.order_from
        });
      } catch (err) {
        console.error(err);
        alert('Error loading quotation');
      } finally {
        setLoading(false);
      }
    };

    fetchQuote();
  }, [id]);

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  const handleUpdate = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/quotes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify(quoteData)
      });

      if (!response.ok) throw new Error('Failed to update quotation');
      
      router.push(`/admin/quotes/${id}`);
    } catch (err) {
      console.error(err);
      alert('Error updating quotation');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ChevronLeft className="w-4 h-4" /> Back
          </Button>
          <h1 className="text-2xl font-bold text-slate-900">Edit Quotation</h1>
        </div>
        
        {/* Step Indicator */}
        <div className="hidden md:flex items-center gap-8">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${index <= currentStep ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                {index < currentStep ? <Check className="w-4 h-4" /> : index + 1}
              </div>
              <span className={`text-sm font-medium ${index <= currentStep ? 'text-slate-900' : 'text-slate-400'}`}>{step.title}</span>
              {index < STEPS.length - 1 && <div className="w-8 h-px bg-slate-200" />}
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          {currentStep === STEPS.length - 1 ? (
            <Button onClick={handleUpdate} isLoading={saving} className="gap-2">
              <Save className="w-4 h-4" /> Save Changes
            </Button>
          ) : (
            <Button onClick={nextStep} className="gap-2">
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Step Content */}
      <div className="mt-8">
        {currentStep === 0 && <StepFirm data={quoteData} setData={setQuoteData} />}
        {currentStep === 1 && <StepClient data={quoteData} setData={setQuoteData} />}
        {currentStep === 2 && <StepItems data={quoteData} setData={setQuoteData} />}
        {currentStep === 3 && <StepPreview data={quoteData} />}
      </div>

      {/* Mobile Navigation */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 flex justify-between md:hidden">
        <Button variant="outline" onClick={prevStep} disabled={currentStep === 0}>Previous</Button>
        {currentStep === STEPS.length - 1 ? (
          <Button onClick={handleUpdate} isLoading={saving}>Save Quote</Button>
        ) : (
          <Button onClick={nextStep}>Next</Button>
        )}
      </div>
    </div>
  );
}
