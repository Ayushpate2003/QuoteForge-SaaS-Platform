'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Redirect if already logged in
  const { user, getSession } = useAuthStore();
  const [checkingSession, setCheckingSession] = useState(true);
  
  useEffect(() => {
    // Check for existing session on mount (handles page refresh or PKCE callback)
    const handleAuthCallback = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await getSession();
      }
      setCheckingSession(false);
    };
    handleAuthCallback();

    // Listen for auth state changes — fires when Supabase processes an OAuth
    // token from the URL hash (implicit flow fallback)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        await getSession();
        setCheckingSession(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [getSession]);

  useEffect(() => {
    if (!checkingSession && user) {
      // NOTE: Next.js route groups like (admin) are NOT part of the URL
      // (admin)/dashboard/page.tsx → /dashboard
      // (sales)/layout.tsx         → /sales/...
      if (user.role === 'admin') {
        router.push('/dashboard');
      } else {
        router.push('/sales/dashboard');
      }
    }
  }, [user, checkingSession, router]);

  if (checkingSession) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (data.user) {
        // Let getSession handle users-table lookup + auto-provisioning.
        // It's resilient to missing rows and sets the Zustand store correctly.
        await getSession();

        // Read role from store after getSession
        const { user: storeUser } = useAuthStore.getState();
        const role = storeUser?.role || 'user';

        // NOTE: (admin) is a Next.js route group — /dashboard is the correct URL
        if (role === 'admin') {
          router.push('/dashboard');
        } else {
          router.push('/sales/dashboard');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      if (authError) throw authError;
    } catch (err: any) {
      setError(err.message || 'Error connecting to Google');
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome back</h1>
        <p className="text-sm text-slate-500 mt-1">Please enter your details to sign in.</p>
      </div>

      <div className="space-y-4">
        <Button 
          type="button" 
          variant="outline" 
          className="w-full flex items-center justify-center gap-2"
          onClick={handleGoogleLogin}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
            <path d="M1 1h22v22H1z" fill="none" />
          </svg>
          Continue with Google
        </Button>
        
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-slate-500">Or continue with email</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          placeholder="admin@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        
        <div className="flex items-center justify-between">
          <label className="flex items-center text-sm text-slate-600">
            <input type="checkbox" className="mr-2 rounded border-slate-300 text-indigo-600" />
            Remember me
          </label>
          <Link href="/forgot-password" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
            Forgot password?
          </Link>
        </div>

        {error && (
          <div className="p-3 text-sm text-red-500 bg-red-50 rounded-lg border border-red-100">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full" isLoading={loading}>
          Sign In
        </Button>
      </form>

      <div className="text-center text-sm text-slate-500">
        Don't have an account?{' '}
        <Link href="/signup" className="font-medium text-indigo-600 hover:text-indigo-500">
          Create admin account
        </Link>
      </div>
    </div>
  );
}
