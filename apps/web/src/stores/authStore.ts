import { create } from 'zustand';
import { supabase } from '../lib/supabase';

// Emails that are always treated as admin
const ADMIN_EMAILS = ['ayushpatel7869595243@gmail.com'];

interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
  tenant_id: string;
  name: string;
}

interface AuthState {
  user: User | null;
  role: 'admin' | 'user' | null;
  tenant_id: string | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => Promise<void>;
  getSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  role: null,
  tenant_id: null,
  isLoading: true,
  setUser: (user) => set({ 
    user, 
    role: user?.role || null, 
    tenant_id: user?.tenant_id || null 
  }),
  setLoading: (loading) => set({ isLoading: loading }),
  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, role: null, tenant_id: null });
  },
  getSession: async () => {
    set({ isLoading: true });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const authUser = session.user;
        const email = authUser.email || '';

        // Try to fetch user profile from our users table
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (userData && !error) {
          // Happy path: user found in public.users
          set({ 
            user: userData as User, 
            role: userData.role, 
            tenant_id: userData.tenant_id 
          });
        } else {
          // User is authenticated in Supabase Auth but NOT in public.users.
          // This happens when the DB trigger didn't fire (e.g. user created
          // before the trigger existed, or via Google OAuth before signup).
          console.warn('[authStore] User not found in public.users, auto-provisioning...');
          
          const role: 'admin' | 'user' = ADMIN_EMAILS.includes(email) ? 'admin' : 'user';
          const name = authUser.user_metadata?.full_name ||
                       authUser.user_metadata?.name ||
                       email.split('@')[0];

          // Attempt to create a tenant + user record
          let tenant_id: string | null = null;
          if (role === 'admin') {
            const { data: tenant } = await supabase
              .from('tenants')
              .insert({ name: `${name}'s Organization` })
              .select('id')
              .single();
            tenant_id = tenant?.id || null;
          }

          const { data: newUser } = await supabase
            .from('users')
            .upsert({
              id: authUser.id,
              email,
              name,
              role,
              tenant_id,
            })
            .select()
            .single();

          if (newUser) {
            set({ user: newUser as User, role: newUser.role, tenant_id: newUser.tenant_id });
          } else {
            // Last resort: use auth metadata so the user isn't stuck on login
            const fallback: User = { id: authUser.id, email, name, role, tenant_id: tenant_id || '' };
            set({ user: fallback, role, tenant_id });
          }
        }
      }
    } catch (error) {
      console.error('[authStore] Error fetching session:', error);
    } finally {
      set({ isLoading: false });
    }
  },
}));
