'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { TemplateEditor } from '@/components/TemplateEditor/Editor';
import { supabase } from '@/lib/supabase';

export default function EditTemplatePage() {
  const { id } = useParams();
  const [template, setTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const { data, error } = await supabase
          .from('templates')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setTemplate(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplate();
  }, [id]);

  if (loading) return <div className="p-8">Loading template editor...</div>;
  if (!template) return <div className="p-8 text-red-500">Template not found.</div>;

  return <TemplateEditor initialData={template} id={id as string} />;
}
