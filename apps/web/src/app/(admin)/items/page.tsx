'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Package, Edit3, Trash2, Search, Filter, Upload } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { supabase } from '@/lib/supabase';
import BulkImportModal from '@/components/items/BulkImportModal';

interface Item {
  id: string;
  name: string;
  sku: string;
  hsn_sac: string;
  rate: number;
  igst_rate: number;
  unit: string;
  is_active: boolean;
}

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (err) {
      console.error('Error fetching items:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const { error } = await supabase
        .from('items')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      setItems(items.filter(i => i.id !== id));
    } catch (err) {
      console.error('Error deleting item:', err);
    }
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.hsn_sac?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Item Master</h1>
          <p className="text-slate-500">Manage your product and service catalog.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2" onClick={() => setShowImportModal(true)}>
            <Upload className="w-4 h-4" /> Import CSV
          </Button>
          <Link href="/admin/items/new">
            <Button className="gap-2 w-full sm:w-auto">
              <Plus className="w-4 h-4" /> Add New Item
            </Button>
          </Link>
        </div>
      </div>

      {showImportModal && (
        <BulkImportModal 
          onClose={() => setShowImportModal(false)} 
          onSuccess={fetchItems} 
        />
      )}

      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Search by name, SKU or HSN..." 
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" /> Filters
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-3 px-4 text-sm font-semibold text-slate-600">Item Name</th>
                  <th className="py-3 px-4 text-sm font-semibold text-slate-600">SKU / HSN</th>
                  <th className="py-3 px-4 text-sm font-semibold text-slate-600">Unit</th>
                  <th className="py-3 px-4 text-sm font-semibold text-slate-600 text-right">Rate</th>
                  <th className="py-3 px-4 text-sm font-semibold text-slate-600 text-right">Tax (GST)</th>
                  <th className="py-3 px-4 text-sm font-semibold text-slate-600 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [1, 2, 3, 4, 5].map(i => (
                    <tr key={i} className="border-b border-slate-100 animate-pulse">
                      <td colSpan={6} className="py-4 px-4 h-12 bg-slate-50/50"></td>
                    </tr>
                  ))
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      <Package className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                      <p>No items found matching your search.</p>
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="font-medium text-slate-900">{item.name}</div>
                      </td>
                      <td className="py-4 px-4 text-sm text-slate-500">
                        <div>SKU: {item.sku || 'N/A'}</div>
                        <div className="text-xs">HSN: {item.hsn_sac || 'N/A'}</div>
                      </td>
                      <td className="py-4 px-4 text-sm text-slate-600">{item.unit}</td>
                      <td className="py-4 px-4 text-sm text-slate-900 text-right font-medium">
                        ₹{item.rate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-4 text-sm text-slate-600 text-right">
                        {item.igst_rate}%
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/admin/items/${item.id}`}>
                            <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                              <Edit3 className="w-4 h-4" />
                            </button>
                          </Link>
                          <button 
                            onClick={() => handleDelete(item.id)}
                            className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
