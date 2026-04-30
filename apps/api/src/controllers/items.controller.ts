import { Response } from 'express';
import { supabase } from '../config/supabase';
import { AuthRequest } from '../middleware/auth';

export const getItems = async (req: AuthRequest, res: Response) => {
  const user = req.user;

  try {
    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!userData) return res.status(404).json({ error: 'User not found' });

    const { data: items, error } = await supabase
      .from('items')
      .select('*')
      .eq('tenant_id', userData.tenant_id)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) throw error;

    return res.status(200).json(items);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const createItem = async (req: AuthRequest, res: Response) => {
  const user = req.user;
  const itemData = req.body;

  try {
    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!userData) return res.status(404).json({ error: 'User not found' });

    const { data: item, error } = await supabase
      .from('items')
      .insert([{ ...itemData, tenant_id: userData.tenant_id }])
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json(item);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const updateItem = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const itemData = req.body;

  try {
    const { data: item, error } = await supabase
      .from('items')
      .update(itemData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json(item);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const deleteItem = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const { error } = await supabase
      .from('items')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;

    return res.status(200).json({ message: 'Item deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
export const bulkCreateItems = async (req: AuthRequest, res: Response) => {
  const user = req.user;
  const itemsData = req.body; // Expecting an array of items

  if (!Array.isArray(itemsData)) {
    return res.status(400).json({ error: 'Data must be an array' });
  }

  try {
    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!userData) return res.status(404).json({ error: 'User not found' });

    const itemsToInsert = itemsData.map(item => ({
      ...item,
      tenant_id: userData.tenant_id,
      is_active: true
    }));

    const { data: items, error } = await supabase
      .from('items')
      .insert(itemsToInsert)
      .select();

    if (error) throw error;

    return res.status(201).json(items);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
