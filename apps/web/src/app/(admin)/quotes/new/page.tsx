'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Save, Building2, User, Package, Eye, Check } from 'lucide-react';
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

export default function NewQuotePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [quoteData, setQuoteData] = useState({
    firm_id: '',
    template_id: '',
    quote_date: new Date().toISOString().split('T')[0],
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

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  const handleSave = async () => {
    if (!quoteData.firm_id) {
      alert('Please select a firm before saving.');
      return;
    }
    if (!quoteData.template_id) {
      alert('Please select a template before saving.');
      return;
    }
    if (!quoteData.bill_to.name?.trim()) {
      alert('Please enter client name before saving.');
      return;
    }
    if (!quoteData.items?.length) {
      alert('Please add at least one item before saving.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...quoteData,
        ship_to: {
          name: quoteData.bill_to.name,
          address: quoteData.ship_to.sameAsBilling ? quoteData.bill_to.address : quoteData.ship_to.address,
        },
        items: quoteData.items.map((item: any) => ({
          ...item,
          qty: Number(item.qty) || 0,
          rate: Number(item.rate) || 0,
          cgst_rate: Number(item.cgst_rate) || 0,
          sgst_rate: Number(item.sgst_rate) || 0,
          igst_rate: Number(item.igst_rate) || 0,
          cgst_amount: Number(item.cgst_amount) || 0,
          sgst_amount: Number(item.sgst_amount) || 0,
          igst_amount: Number(item.igst_amount) || 0,
          taxable_amount: Number(item.taxable_amount) || 0,
          total: Number(item.total_amount ?? item.total) || 0,
        })),
        subtotal: Number(quoteData.subtotal) || 0,
        total_cgst: Number(quoteData.total_cgst) || 0,
        total_sgst: Number(quoteData.total_sgst) || 0,
        total_igst: Number(quoteData.total_igst) || 0,
        grand_total: Number(quoteData.grand_total) || 0,
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/quotes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        let message = 'Failed to create quotation';
        const rawBody = await response.text();
        if (rawBody) {
          try {
            const errorBody = JSON.parse(rawBody);
            if (errorBody?.details?.length) {
              const formatted = errorBody.details
                .map((d: any) => `${Array.isArray(d.path) ? d.path.join('.') : d.path}: ${d.message}`)
                .join('\n');
              message = `${errorBody.error || 'Validation failed'}\n${formatted}`;
            } else {
              message = errorBody.error || errorBody.message || rawBody;
            }
          } catch {
            message = rawBody;
          }
        }
        throw new Error(message);
      }
      
      router.push('/admin/quotes');
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error saving quotation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ChevronLeft className="w-4 h-4" /> Back
          </Button>
          <h1 className="text-2xl font-bold text-slate-900">Create New Quotation</h1>
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
            <Button onClick={handleSave} isLoading={loading} className="gap-2">
              <Save className="w-4 h-4" /> Finish & Save
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
          <Button onClick={handleSave} isLoading={loading}>Save Quote</Button>
        ) : (
          <Button onClick={nextStep}>Next</Button>
        )}
      </div>
    </div>
  );
}
