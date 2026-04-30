import { Response } from 'express';
import { supabase } from '../config/supabase';
import { AuthRequest } from '../middleware/auth';
import { uploadToSupabase } from '../services/storage.service';
import sharp from 'sharp';

export const getFirms = async (req: AuthRequest, res: Response) => {
  const adminUser = req.user;

  try {
    // Get tenant_id from user metadata or custom table
    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id, role')
      .eq('id', adminUser.id)
      .single();

    if (!userData) return res.status(404).json({ error: 'User not found' });

    let query = supabase
      .from('firms')
      .select('*')
      .eq('tenant_id', userData.tenant_id)
      .eq('is_active', true);

    if (userData.role === 'user') {
      const { data: assigned } = await supabase
        .from('user_firms')
        .select('firm_id')
        .eq('user_id', adminUser.id);
      
      const firmIds = assigned?.map(a => a.firm_id) || [];
      query = query.in('id', firmIds);
    }

    const { data: firms, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    return res.status(200).json(firms);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const createFirm = async (req: AuthRequest, res: Response) => {
  const adminUser = req.user;
  const firmData = req.body;

  try {
    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', adminUser.id)
      .single();

    if (!userData) return res.status(404).json({ error: 'User not found' });

    const {
      quote_prefix,
      starting_number,
      ...firmInsertData
    } = firmData;

    const { data: firm, error } = await supabase
      .from('firms')
      .insert([{ ...firmInsertData, tenant_id: userData.tenant_id }])
      .select()
      .single();

    if (error) throw error;

    // Initialize sequence for the new firm
    await supabase.from('quote_sequences').insert([{
      firm_id: firm.id,
      prefix: quote_prefix || 'QT',
      last_number: starting_number || 0
    }]);

    return res.status(201).json(firm);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const updateFirm = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const firmData = req.body;

  try {
    const { data: firm, error } = await supabase
      .from('firms')
      .update(firmData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json(firm);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const deleteFirm = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const { error } = await supabase
      .from('firms')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;

    return res.status(200).json({ message: 'Firm deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const uploadLogo = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const file = req.file;

  if (!file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    // Process image with Sharp (resize to max 400x200)
    const processedImage = await sharp(file.buffer)
      .resize(400, 200, { fit: 'inside', withoutEnlargement: true })
      .toBuffer();

    const fileName = `${id}/logo-${Date.now()}.png`;
    const publicUrl = await uploadToSupabase('branding', fileName, processedImage, 'image/png');

    const { error } = await supabase
      .from('firms')
      .update({ logo_url: publicUrl })
      .eq('id', id);

    if (error) throw error;

    return res.status(200).json({ url: publicUrl });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const uploadSignature = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const file = req.file;

  if (!file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    // Process image with Sharp (resize to max 300x150)
    const processedImage = await sharp(file.buffer)
      .resize(300, 150, { fit: 'inside', withoutEnlargement: true })
      .toBuffer();

    const fileName = `${id}/signature-${Date.now()}.png`;
    const publicUrl = await uploadToSupabase('branding', fileName, processedImage, 'image/png');

    const { error } = await supabase
      .from('firms')
      .update({ signature_url: publicUrl })
      .eq('id', id);

    if (error) throw error;

    return res.status(200).json({ url: publicUrl });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
