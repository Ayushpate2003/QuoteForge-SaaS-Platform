import { Response } from 'express';
import { supabase } from '../config/supabase';
import { AuthRequest } from '../middleware/auth';

export const getTemplates = async (req: AuthRequest, res: Response) => {
  const user = req.user;

  try {
    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!userData) return res.status(404).json({ error: 'User not found' });

    const { data: templates, error } = await supabase
      .from('templates')
      .select('*')
      .eq('tenant_id', userData.tenant_id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return res.status(200).json(templates);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const createTemplate = async (req: AuthRequest, res: Response) => {
  const user = req.user;
  const templateData = req.body;

  try {
    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!userData) return res.status(404).json({ error: 'User not found' });

    // If setting as default, unset others
    if (templateData.is_default) {
      await supabase
        .from('templates')
        .update({ is_default: false })
        .eq('tenant_id', userData.tenant_id);
    }

    const { data: template, error } = await supabase
      .from('templates')
      .insert([{ ...templateData, tenant_id: userData.tenant_id }])
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json(template);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const updateTemplate = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const templateData = req.body;
  const user = req.user;

  try {
    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!userData) return res.status(404).json({ error: 'User not found' });

    // If setting as default, unset others
    if (templateData.is_default) {
      await supabase
        .from('templates')
        .update({ is_default: false })
        .eq('tenant_id', userData.tenant_id);
    }

    const { data: template, error } = await supabase
      .from('templates')
      .update(templateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json(template);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const deleteTemplate = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const { error } = await supabase
      .from('templates')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return res.status(200).json({ message: 'Template deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
