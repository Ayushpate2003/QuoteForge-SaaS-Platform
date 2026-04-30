'use client';

import { useState, useEffect } from 'react';
import { Building2, Layout, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { supabase } from '@/lib/supabase';

export const StepFirm = ({ data, setData }: any) => {
  const [firms, setFirms] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: firmsData } = await supabase.from('firms').select('*').eq('is_active', true);
      const { data: templatesData } = await supabase.from('templates').select('*');
      
      setFirms(firmsData || []);
      setTemplates(templatesData || []);

      // Auto-select first firm and default template if not set
      if (!data.firm_id && firmsData?.length) {
        setData((prev: any) => ({ ...prev, firm_id: firmsData[0].id }));
      }
      if (!data.template_id && templatesData?.length) {
        const defaultTemplate = templatesData.find(t => t.is_default) || templatesData[0];
        setData((prev: any) => ({ ...prev, template_id: defaultTemplate.id }));
      }
    };
    fetchData();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="space-y-6">
        <Card>
          <CardHeader title="Select Issuing Firm" subtitle="Choose the business entity for this quote." icon={Building2} />
          <CardContent className="space-y-4">
            <Select 
              label="Firm*" 
              options={firms.map((f: any) => ({ label: f.name, value: f.id }))} 
              value={data.firm_id}
              onChange={(e) => setData({ ...data, firm_id: e.target.value })}
            />
            {data.firm_id && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Firm Details</p>
                {firms.find((f: any) => f.id === data.firm_id) && (
                  <div className="text-sm">
                    <p className="font-bold text-slate-900">{(firms.find((f: any) => f.id === data.firm_id) as any).name}</p>
                    <p className="text-slate-500 mt-1">{(firms.find((f: any) => f.id === data.firm_id) as any).address}</p>
                    <p className="text-indigo-600 font-medium mt-2">GSTIN: {(firms.find((f: any) => f.id === data.firm_id) as any).gstin}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Quote Settings" subtitle="Set date and design template." icon={Calendar} />
          <CardContent className="space-y-4">
            <Input 
              label="Quotation Date*" 
              type="date" 
              value={data.quote_date}
              onChange={(e) => setData({ ...data, quote_date: e.target.value })}
            />
            <Select 
              label="Design Template*" 
              options={templates.map((t: any) => ({ label: t.name, value: t.id }))} 
              value={data.template_id}
              onChange={(e) => setData({ ...data, template_id: e.target.value })}
            />
          </CardContent>
        </Card>
      </div>

      <div className="hidden md:block">
        <div className="bg-slate-100 rounded-3xl p-8 h-full flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6">
            <Layout className="w-10 h-10 text-indigo-500" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Phase 1: Foundation</h3>
          <p className="text-slate-500 mt-2 max-w-xs text-sm">
            Start by choosing which of your firms is issuing this quotation and which professional template to use.
          </p>
        </div>
      </div>
    </div>
  );
};
