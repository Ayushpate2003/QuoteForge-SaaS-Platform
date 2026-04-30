'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Save, Layout, Palette, Type, Table, FileText, Plus, X } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { TemplatePreview } from './Preview';
import { supabase } from '@/lib/supabase';

interface EditorProps {
  initialData?: any;
  id?: string;
}

export const TemplateEditor: React.FC<EditorProps> = ({ initialData, id }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'design' | 'content' | 'columns'>('design');

  const [name, setName] = useState(initialData?.name || 'Standard Quotation');
  const [isDefault, setIsDefault] = useState(initialData?.is_default || false);
  const [config, setConfig] = useState(initialData?.config || {
    accentColor: '#4f46e5',
    fontFamily: 'Inter, sans-serif',
    columns: {
      sr_no: { visible: true, label: '#' },
      item_name: { visible: true, label: 'Item & Description' },
      condition: { visible: false, label: 'Cond' },
      hsn_sac: { visible: true, label: 'HSN' },
      qty: { visible: true, label: 'Qty' },
      rate: { visible: true, label: 'Rate' },
      amount: { visible: true, label: 'Amount' },
      taxable_amount: { visible: false, label: 'Taxable' },
      cgst: { visible: true, label: 'CGST' },
      sgst: { visible: true, label: 'SGST' },
      igst: { visible: false, label: 'IGST' },
      total: { visible: true, label: 'Total' }
    },
    showDescription: true,
    headerText: '',
    footerText: 'Thank you for your business!',
    terms: [
      '100% payment against delivery',
      'Delivery within 2-3 working days',
      'Goods once sold will not be taken back',
      'Subject to Mumbai Jurisdiction'
    ]
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = {
        name,
        is_default: isDefault,
        config
      };

      const url = id 
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/templates/${id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/templates`;
      
      const method = id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Failed to save template');

      router.push('/admin/templates');
    } catch (err) {
      console.error(err);
      alert('Error saving template');
    } finally {
      setLoading(false);
    }
  };

  const addTerm = () => {
    setConfig({ ...config, terms: [...config.terms, 'New term...'] });
  };

  const removeTerm = (index: number) => {
    setConfig({ ...config, terms: config.terms.filter((_: any, i: number) => i !== index) });
  };

  const updateTerm = (index: number, value: string) => {
    const newTerms = [...config.terms];
    newTerms[index] = value;
    setConfig({ ...config, terms: newTerms });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/templates">
            <button className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-slate-200">
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
          </Link>
          <div className="flex flex-col">
            <input 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-xl font-bold text-slate-900 bg-transparent border-none focus:ring-0 p-0 w-64"
            />
            <div className="flex items-center gap-2 mt-1">
              <input 
                type="checkbox" 
                id="isDefault" 
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="isDefault" className="text-xs text-slate-500 cursor-pointer">Set as default template</label>
            </div>
          </div>
        </div>
        <Button onClick={handleSave} isLoading={loading} className="gap-2">
          <Save className="w-4 h-4" /> Save Template
        </Button>
      </div>

      <div className="flex flex-1 gap-8 overflow-hidden">
        {/* Settings Panel */}
        <div className="w-80 flex flex-col gap-4 overflow-y-auto pr-2">
          <div className="flex gap-1 p-1 bg-slate-100 rounded-lg">
            <button 
              onClick={() => setActiveTab('design')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-md transition-all ${activeTab === 'design' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Palette className="w-3.5 h-3.5" /> Design
            </button>
            <button 
              onClick={() => setActiveTab('columns')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-md transition-all ${activeTab === 'columns' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Table className="w-3.5 h-3.5" /> Columns
            </button>
            <button 
              onClick={() => setActiveTab('content')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-md transition-all ${activeTab === 'content' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <FileText className="w-3.5 h-3.5" /> Content
            </button>
          </div>

          <Card className="flex-1">
            <CardContent className="p-4 space-y-6">
              {activeTab === 'design' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Accent Color</label>
                    <div className="flex flex-wrap gap-2">
                      {['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#18181b'].map(color => (
                        <button 
                          key={color}
                          onClick={() => setConfig({ ...config, accentColor: color })}
                          className={`w-8 h-8 rounded-full border-2 transition-all ${config.accentColor === color ? 'border-white ring-2 ring-indigo-500 scale-110' : 'border-transparent hover:scale-105'}`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                      <input 
                        type="color" 
                        value={config.accentColor}
                        onChange={(e) => setConfig({ ...config, accentColor: e.target.value })}
                        className="w-8 h-8 rounded-full bg-white border border-slate-200 cursor-pointer overflow-hidden p-0"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Typography</label>
                    <select 
                      value={config.fontFamily}
                      onChange={(e) => setConfig({ ...config, fontFamily: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="Inter, sans-serif">Inter (Modern)</option>
                      <option value="'Roboto', sans-serif">Roboto (Clean)</option>
                      <option value="'Outfit', sans-serif">Outfit (Premium)</option>
                      <option value="serif">Times New Roman (Classic)</option>
                    </select>
                  </div>
                </div>
              )}

              {activeTab === 'columns' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Column Name</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Visible</span>
                  </div>
                  {Object.entries(config.columns || {
                    sr_no: { visible: true, label: '#' },
                    item_name: { visible: true, label: 'Item & Description' },
                    condition: { visible: false, label: 'Cond' },
                    hsn_sac: { visible: true, label: 'HSN' },
                    qty: { visible: true, label: 'Qty' },
                    rate: { visible: true, label: 'Rate' },
                    amount: { visible: true, label: 'Amount' },
                    taxable_amount: { visible: false, label: 'Taxable' },
                    cgst: { visible: true, label: 'CGST' },
                    sgst: { visible: true, label: 'SGST' },
                    igst: { visible: false, label: 'IGST' },
                    total: { visible: true, label: 'Total' }
                  }).map(([key, col]: [string, any]) => (
                    <div key={key} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-lg ${col.visible ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-400'}`}>
                          <Table className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-700">{col.label}</span>
                          <span className="text-[10px] text-slate-400 font-medium font-mono uppercase">{key.replace(/_/g, ' ')}</span>
                        </div>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={col.visible}
                        onChange={(e) => {
                          const newColumns = { ...(config.columns || {}) };
                          if (!newColumns[key]) {
                            // Initialize if not present
                            newColumns[key] = { ...col };
                          }
                          newColumns[key] = { ...newColumns[key], visible: e.target.checked };
                          setConfig({ ...config, columns: newColumns });
                        }}
                        className="w-5 h-5 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'content' && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Terms & Conditions</label>
                    <div className="space-y-2">
                      {config.terms.map((term: string, i: number) => (
                        <div key={i} className="group relative">
                          <input 
                            value={term}
                            onChange={(e) => updateTerm(i, e.target.value)}
                            className="w-full pr-8 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/20"
                          />
                          <button 
                            onClick={() => removeTerm(i)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-all"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      <Button variant="ghost" size="sm" onClick={addTerm} className="w-full text-xs gap-2 border border-dashed border-slate-200 h-9">
                        <Plus className="w-3 h-3" /> Add Term
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Footer Note</label>
                    <textarea 
                      value={config.footerText}
                      onChange={(e) => setConfig({ ...config, footerText: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/20"
                      rows={2}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Preview Area */}
        <div className="flex-1 bg-slate-200/50 rounded-2xl overflow-hidden flex items-center justify-center p-8 relative group">
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-white/80 backdrop-blur px-3 py-1.5 rounded-full text-[10px] font-bold text-slate-500 border border-slate-200 shadow-sm z-10">
            <Layout className="w-3 h-3 text-indigo-500" /> Live Preview (A4 Paper)
          </div>
          <div className="h-full w-full overflow-auto flex items-start justify-center custom-scrollbar pt-12">
             <TemplatePreview config={config} />
          </div>
        </div>
      </div>
    </div>
  );
};
