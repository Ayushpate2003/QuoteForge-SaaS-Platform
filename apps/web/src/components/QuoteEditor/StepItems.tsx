'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { calculateItemTax } from '@/lib/tax';

export const StepItems = ({ data, setData }: any) => {
  const [itemsMaster, setItemsMaster] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [firms, setFirms] = useState<any[]>([]);

  useEffect(() => {
    fetchItems();
    fetchFirms();
  }, []);

  const fetchItems = async () => {
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const token = session?.access_token;

      if (token) {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/items`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const items = await response.json();
          setItemsMaster(items || []);
          return;
        }
      }
    } catch (error) {
      console.error('[StepItems] API items fetch failed, falling back to direct read', error);
    }

    const { data: items } = await supabase.from('items').select('*').eq('is_active', true);
    setItemsMaster(items || []);
  };

  const fetchFirms = async () => {
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const token = session?.access_token;

      if (token) {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/firms`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const firmsData = await response.json();
          setFirms(firmsData || []);
          return;
        }
      }
    } catch (error) {
      console.error('[StepItems] API firms fetch failed, falling back to direct read', error);
    }

    const { data: firmsData } = await supabase.from('firms').select('*');
    setFirms(firmsData || []);
  };

  const addItem = (masterItem: any) => {
    const selectedFirm = firms.find(f => f.id === data.firm_id);
    const isInterState = selectedFirm?.state !== data.bill_to.state;

    const tax = calculateItemTax(
      masterItem.rate,
      1,
      masterItem.cgst_rate,
      masterItem.sgst_rate,
      isInterState
    );

    const newItem = {
      id: masterItem.id,
      name: masterItem.name,
      hsn_sac: masterItem.hsn_sac,
      sku: masterItem.sku,
      unit: masterItem.unit,
      qty: 1,
      rate: masterItem.rate,
      cgst_rate: masterItem.cgst_rate,
      sgst_rate: masterItem.sgst_rate,
      ...tax
    };

    const newItems = [...data.items, newItem];
    updateTotals(newItems);
    setSearchQuery('');
    setShowResults(false);
  };

  const removeItem = (index: number) => {
    const newItems = data.items.filter((_: any, i: number) => i !== index);
    updateTotals(newItems);
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...data.items];
    const parsedValue =
      field === 'qty' || field === 'rate'
        ? Number.parseFloat(value)
        : value;
    const safeValue =
      Number.isNaN(parsedValue) && (field === 'qty' || field === 'rate')
        ? 0
        : parsedValue;
    const item = { ...newItems[index], [field]: safeValue };
    
    const selectedFirm = firms.find(f => f.id === data.firm_id);
    const isInterState = selectedFirm?.state !== data.bill_to.state;

    const tax = calculateItemTax(
      field === 'rate' ? parseFloat(value) : item.rate,
      field === 'qty' ? parseFloat(value) : item.qty,
      item.cgst_rate,
      item.sgst_rate,
      isInterState
    );

    newItems[index] = { ...item, ...tax };
    updateTotals(newItems);
  };

  const updateTotals = (items: any[]) => {
    const subtotal = items.reduce((sum, item) => sum + item.taxable_amount, 0);
    const total_cgst = items.reduce((sum, item) => sum + item.cgst_amount, 0);
    const total_sgst = items.reduce((sum, item) => sum + item.sgst_amount, 0);
    const total_igst = items.reduce((sum, item) => sum + item.igst_amount, 0);
    const grand_total = items.reduce((sum, item) => sum + item.total_amount, 0);

    setData({
      ...data,
      items,
      subtotal,
      total_cgst,
      total_sgst,
      total_igst,
      grand_total
    });
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredMaster = itemsMaster.filter((item: any) => {
    if (!normalizedQuery) return true;
    return (
      item.name.toLowerCase().includes(normalizedQuery) ||
      item.sku?.toLowerCase().includes(normalizedQuery)
    );
  }).slice(0, 20);

  return (
    <div className="space-y-6">
      {/* Item Search */}
      <div className="relative max-w-2xl">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text"
            placeholder="Search items by name or SKU..."
            className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-100 rounded-2xl shadow-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
          />
        </div>

        <p className="mt-2 text-xs text-slate-500">
          {itemsMaster.length} items available. Start typing or click the search box.
        </p>

        {showResults && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden max-h-80 overflow-y-auto">
            {filteredMaster.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No items found.</div>
            ) : (
              filteredMaster.map((item: any) => (
                <button 
                  key={item.id}
                  onClick={() => addItem(item)}
                  className="w-full text-left p-4 hover:bg-indigo-50 border-b border-slate-50 last:border-0 flex items-center justify-between transition-colors"
                >
                  <div>
                    <p className="font-bold text-slate-900">{item.name}</p>
                    <p className="text-xs text-slate-500">HSN: {item.hsn_sac} • SKU: {item.sku || 'N/A'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-indigo-600">₹{item.rate.toLocaleString()}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{item.igst_rate}% GST</p>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Items Table */}
      <Card>
        <CardContent className="p-0">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="py-4 px-6 text-xs font-bold uppercase tracking-widest text-slate-400">Item</th>
                <th className="py-4 px-4 text-xs font-bold uppercase tracking-widest text-slate-400 w-24">Qty</th>
                <th className="py-4 px-4 text-xs font-bold uppercase tracking-widest text-slate-400 w-32">Rate</th>
                <th className="py-4 px-4 text-xs font-bold uppercase tracking-widest text-slate-400 text-right">Taxable</th>
                <th className="py-4 px-4 text-xs font-bold uppercase tracking-widest text-slate-400 text-right">GST</th>
                <th className="py-4 px-6 text-xs font-bold uppercase tracking-widest text-slate-400 text-right">Total</th>
                <th className="py-4 px-4 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <Plus className="w-8 h-8" />
                      </div>
                      <p className="font-medium">Search and add items to your quotation</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.items.map((item: any, index: number) => (
                  <tr key={index} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <p className="font-bold text-slate-900">{item.name}</p>
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">HSN: {item.hsn_sac}</p>
                    </td>
                    <td className="py-4 px-4">
                      <input 
                        type="number" 
                        value={item.qty}
                        onChange={(e) => updateItem(index, 'qty', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 outline-none"
                      />
                    </td>
                    <td className="py-4 px-4">
                      <input 
                        type="number" 
                        value={item.rate}
                        onChange={(e) => updateItem(index, 'rate', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 outline-none"
                      />
                    </td>
                    <td className="py-4 px-4 text-right text-sm font-medium text-slate-600">
                      ₹{item.taxable_amount.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <p className="text-sm font-medium text-slate-600">₹{(item.cgst_amount + item.sgst_amount + item.igst_amount).toLocaleString()}</p>
                      <p className="text-[10px] text-slate-400 font-bold">{item.igst_rate}%</p>
                    </td>
                    <td className="py-4 px-6 text-right font-bold text-slate-900">
                      ₹{item.total_amount.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => removeItem(index)}
                        className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Table Footer / Summary */}
          {data.items.length > 0 && (
            <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex flex-col md:flex-row justify-between gap-8">
              <div className="flex-1 max-w-md">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 block">Notes & Special Instructions</label>
                <textarea 
                  className="w-full bg-white border border-slate-200 rounded-xl p-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 outline-none min-h-[100px]"
                  placeholder="Will be visible on the quotation..."
                  value={data.notes}
                  onChange={(e) => setData({ ...data, notes: e.target.value })}
                ></textarea>
              </div>
              
              <div className="w-full md:w-80 space-y-3">
                <div className="flex justify-between text-sm text-slate-500">
                  <span>Subtotal</span>
                  <span className="font-bold text-slate-900">₹{data.subtotal.toLocaleString()}</span>
                </div>
                {data.total_igst > 0 ? (
                  <div className="flex justify-between text-sm text-slate-500">
                    <span>IGST</span>
                    <span className="font-bold text-slate-900">₹{data.total_igst.toLocaleString()}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-sm text-slate-500">
                      <span>CGST</span>
                      <span className="font-bold text-slate-900">₹{data.total_cgst.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm text-slate-500">
                      <span>SGST</span>
                      <span className="font-bold text-slate-900">₹{data.total_sgst.toLocaleString()}</span>
                    </div>
                  </>
                )}
                <div className="h-px bg-slate-200 my-4" />
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900 uppercase tracking-widest text-xs">Grand Total</span>
                  <span className="text-2xl font-black text-indigo-600">₹{data.grand_total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
