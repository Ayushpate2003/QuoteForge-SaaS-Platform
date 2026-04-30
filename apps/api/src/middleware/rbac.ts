import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { supabase } from '../config/supabase';

export const authorize = (allowedRoles: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Prefer role from public.users because metadata claims can be stale
    // until the user signs out/in again.
    let userRole = req.user.user_metadata?.role || req.user.app_metadata?.role;

    if (!userRole) {
      const { data: dbUser, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', req.user.id)
        .single();

      if (error) {
        return res.status(403).json({ error: 'Forbidden: Unable to verify role' });
      }

      userRole = dbUser?.role;
    }

    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }

    next();
  };
};
