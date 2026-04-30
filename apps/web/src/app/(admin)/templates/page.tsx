'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Layout, Edit3, Trash2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { supabase } from '@/lib/supabase';

interface Template {
  id: string;
  name: string;
  is_default: boolean;
  created_at: string;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (err) {
      console.error('Error fetching templates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const { error } = await supabase
        .from('templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setTemplates(templates.filter(t => t.id !== id));
    } catch (err) {
      console.error('Error deleting template:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quote Templates</h1>
          <p className="text-slate-500">Customize how your quotations look and feel.</p>
        </div>
        <Link href="/admin/templates/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" /> New Template
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2].map(i => (
            <div key={i} className="h-48 bg-slate-100 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4">
            <Layout className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-medium text-slate-900">No templates created yet</h3>
          <p className="text-slate-500 max-w-xs mt-2">Create a professional template to start generating quotations.</p>
          <Link href="/admin/templates/new" className="mt-6">
            <Button variant="outline">Create your first template</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card key={template.id} className={`group hover:border-indigo-200 transition-all ${template.is_default ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg ${template.is_default ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                    <Layout className="w-6 h-6" />
                  </div>
                  <div className="flex gap-1">
                    <Link href={`/admin/templates/${template.id}`}>
                      <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </Link>
                    <button 
                      onClick={() => handleDelete(template.id)}
                      className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-bold text-slate-900">{template.name}</h3>
                  {template.is_default && (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">Default</span>
                  )}
                </div>
                <p className="text-sm text-slate-500">Created on {new Date(template.created_at).toLocaleDateString()}</p>
                
                <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
                  <Link href={`/admin/templates/${template.id}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
                    Edit Configuration
                  </Link>
                  {template.is_default && (
                    <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Active Template
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
