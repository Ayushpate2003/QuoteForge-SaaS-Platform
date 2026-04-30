'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Building2, MapPin, Edit3, Trash2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/Card';
import { supabase } from '@/lib/supabase';

interface Firm {
  id: string;
  name: string;
  gstin: string;
  city: string;
  logo_url?: string;
  is_active: boolean;
}

export default function FirmsPage() {
  const [firms, setFirms] = useState<Firm[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFirms();
  }, []);

  const fetchFirms = async () => {
    try {
      const { data, error } = await supabase
        .from('firms')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFirms(data || []);
    } catch (err) {
      console.error('Error fetching firms:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this firm?')) return;

    try {
      const { error } = await supabase
        .from('firms')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      setFirms(firms.filter(f => f.id !== id));
    } catch (err) {
      console.error('Error deleting firm:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Firms</h1>
          <p className="text-slate-500">Manage your business entities and branding.</p>
        </div>
        <Link href="/admin/firms/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" /> Add New Firm
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-slate-100 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : firms.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4">
            <Building2 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-medium text-slate-900">No firms added yet</h3>
          <p className="text-slate-500 max-w-xs mt-2">Add your first business entity to start creating quotations.</p>
          <Link href="/admin/firms/new" className="mt-6">
            <Button variant="outline">Create your first firm</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {firms.map((firm) => (
            <Card key={firm.id} className="flex flex-col">
              <CardContent className="flex-1 pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden border border-slate-200">
                    {firm.logo_url ? (
                      <img src={firm.logo_url} alt={firm.name} className="object-contain" />
                    ) : (
                      <Building2 className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/admin/firms/${firm.id}`}>
                      <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </Link>
                    <button 
                      onClick={() => handleDelete(firm.id)}
                      className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-900 leading-tight">{firm.name}</h3>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center text-sm text-slate-500 gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>GSTIN: {firm.gstin || 'Not provided'}</span>
                  </div>
                  <div className="flex items-center text-sm text-slate-500 gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{firm.city || 'City not set'}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button variant="outline" className="flex-1 text-xs py-1.5 h-auto">Set Default</Button>
                <Link href={`/admin/firms/${firm.id}`} className="flex-1">
                  <Button variant="ghost" className="w-full text-xs py-1.5 h-auto">View Details</Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
