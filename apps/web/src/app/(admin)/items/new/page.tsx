'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Package, Info, IndianRupee, Percent } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { GST_RATES, ITEM_UNITS } from '@/lib/constants';
import { supabase } from '@/lib/supabase';

export default function NewItemPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku: '',
    hsn_sac: '',
    unit: 'Nos',
    rate: '',
    igst_rate: '18',
    cgst_rate: '9',
    sgst_rate: '9',
    condition: 'NEW',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'igst_rate') {
      const rate = parseFloat(value);
      setFormData(prev => ({ 
        ...prev, 
        igst_rate: value,
        cgst_rate: (rate / 2).toString(),
        sgst_rate: (rate / 2).toString()
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          ...formData,
          rate: parseFloat(formData.rate) || 0,
          igst_rate: parseFloat(formData.igst_rate) || 0,
          cgst_rate: parseFloat(formData.cgst_rate) || 0,
          sgst_rate: parseFloat(formData.sgst_rate) || 0,
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create item');
      }

      router.push('/admin/items');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex items-center gap-4">
        <Link href="/admin/items">
          <button className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-slate-200">
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Add New Item</h1>
          <p className="text-slate-500">Add a product or service to your catalogue.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: Item Details */}
        <Card>
          <CardHeader title="Item Details" subtitle="Basic information about your product or service." />
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Input 
                label="Item Name*" 
                name="name" 
                placeholder="e.g. Dell Latitude 5420 Laptop" 
                value={formData.name} 
                onChange={handleChange} 
                required 
              />
            </div>
            <div className="md:col-span-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Description</label>
                <textarea 
                  name="description" 
                  rows={3}
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                  placeholder="Additional details, specifications, etc."
                  value={formData.description}
                  onChange={handleChange}
                ></textarea>
              </div>
            </div>
            <Input label="SKU / Part Number" name="sku" value={formData.sku} onChange={handleChange} />
            <Input label="HSN / SAC Code*" name="hsn_sac" value={formData.hsn_sac} onChange={handleChange} required />
            <Select 
              label="Unit*" 
              name="unit" 
              options={ITEM_UNITS.map(u => ({ label: u, value: u }))} 
              value={formData.unit} 
              onChange={handleChange} 
              required 
            />
            <Select 
              label="Condition" 
              name="condition" 
              options={[
                { label: 'New', value: 'NEW' },
                { label: 'Refurbished', value: 'REFURBISHED' },
                { label: 'Used', value: 'USED' }
              ]} 
              value={formData.condition} 
              onChange={handleChange} 
            />
          </CardContent>
        </Card>

        {/* SECTION 2: Pricing & Tax */}
        <Card>
          <CardHeader title="Pricing & Tax" subtitle="Set your base rate and GST configuration." />
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative">
              <IndianRupee className="absolute left-3 top-[38px] w-4 h-4 text-slate-400" />
              <Input 
                label="Base Rate (Excl. Tax)*" 
                name="rate" 
                type="number" 
                step="0.01"
                className="pl-10" 
                placeholder="0.00"
                value={formData.rate} 
                onChange={handleChange} 
                required 
              />
            </div>
            <Select 
              label="GST Rate (IGST)*" 
              name="igst_rate" 
              options={GST_RATES} 
              value={formData.igst_rate} 
              onChange={handleChange} 
              required 
            />
            
            <div className="md:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col sm:flex-row gap-6 sm:items-center">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Percent className="w-4 h-4 text-indigo-500" />
                <span className="font-medium">Tax Breakdown:</span>
              </div>
              <div className="flex gap-8">
                <div className="text-sm">
                  <span className="text-slate-500 mr-2 text-xs uppercase tracking-wider">CGST</span>
                  <span className="font-bold text-slate-900">{formData.cgst_rate}%</span>
                </div>
                <div className="text-sm">
                  <span className="text-slate-500 mr-2 text-xs uppercase tracking-wider">SGST</span>
                  <span className="font-bold text-slate-900">{formData.sgst_rate}%</span>
                </div>
                <div className="text-sm">
                  <span className="text-slate-500 mr-2 text-xs uppercase tracking-wider">IGST</span>
                  <span className="font-bold text-slate-900">{formData.igst_rate}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-4">
          <Link href="/admin/items">
            <Button variant="outline" type="button">Cancel</Button>
          </Link>
          <Button type="submit" isLoading={loading} className="px-8">Create Item</Button>
        </div>
      </form>
    </div>
  );
}
