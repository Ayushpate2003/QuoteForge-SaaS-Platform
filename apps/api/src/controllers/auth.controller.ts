import { Response } from 'express';
import { supabase } from '../config/supabase';
import { AuthRequest } from '../middleware/auth';

export const inviteUser = async (req: AuthRequest, res: Response) => {
  const { email, name } = req.body;
  const adminUser = req.user;

  if (!email || !name) {
    return res.status(400).json({ error: 'Email and name are required' });
  }

  try {
    // 1. Get the admin's tenant_id from our custom users table
    const { data: adminData, error: adminError } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', adminUser.id)
      .single();

    if (adminError || !adminData) {
      return res.status(404).json({ error: 'Admin user not found' });
    }

    // 2. Invite the user via Supabase Auth Admin API
    // We pass the tenant_id and name in metadata
    const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: {
        full_name: name,
        tenant_id: adminData.tenant_id,
        role: 'user'
      },
      redirectTo: `${process.env.FRONTEND_URL}/invite/complete`
    });

    if (inviteError) throw inviteError;

    // The SQL trigger on auth.users INSERT will handle creating the public.users record
    // because inviteUserByEmail creates a record in auth.users.

    return res.status(200).json({ 
      message: 'Invitation sent successfully',
      user: inviteData.user 
    });
  } catch (error: any) {
    console.error('Invite error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

export const getUsers = async (req: AuthRequest, res: Response) => {
  const user = req.user;

  try {
    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!userData) return res.status(404).json({ error: 'User not found' });

    const { data: users, error } = await supabase
      .from('users')
      .select('*, user_firms(firm_id)')
      .eq('tenant_id', userData.tenant_id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return res.status(200).json(users);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const assignFirms = async (req: AuthRequest, res: Response) => {
  const { userId } = req.params;
  const { firmIds } = req.body;

  try {
    // 1. Delete existing assignments
    const { error: deleteError } = await supabase
      .from('user_firms')
      .delete()
      .eq('user_id', userId);

    if (deleteError) throw deleteError;

    // 2. Insert new assignments
    if (firmIds && firmIds.length > 0) {
      const assignments = firmIds.map((firmId: string) => ({
        user_id: userId,
        firm_id: firmId
      }));

      const { error: insertError } = await supabase
        .from('user_firms')
        .insert(assignments);

      if (insertError) throw insertError;
    }

    return res.status(200).json({ message: 'Firms assigned successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
