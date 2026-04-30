'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function InvitePage() {
  const router = useRouter();
  const { token } = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCompleteInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      // Step 1: Verify the token and set the session
      // In Supabase, if the user clicks a link, they might already have a session 
      // or we might need to use verifyOtp if the token is a code.
      // If it's a URL token, Supabase Auth often handles it via the redirect.
      
      // Update the user's password and name
      const { error: updateError } = await supabase.auth.updateUser({
        password: formData.password,
        data: { full_name: formData.fullName }
      });

      if (updateError) throw updateError;

      router.push('/sales/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to complete invite');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-slate-900">Welcome to QuoteForge</h2>
        <p className="text-sm text-slate-500 mt-1">Please complete your profile to get started.</p>
      </div>

      <form onSubmit={handleCompleteInvite} className="space-y-4">
        <Input
          label="Full Name"
          name="fullName"
          placeholder="Jane Doe"
          value={formData.fullName}
          onChange={handleChange}
          required
        />
        <Input
          label="Set Password"
          name="password"
          type="password"
          placeholder="••••••••"
          value={formData.password}
          onChange={handleChange}
          required
        />
        <Input
          label="Confirm Password"
          name="confirmPassword"
          type="password"
          placeholder="••••••••"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
        />

        {error && (
          <div className="p-3 text-sm text-red-500 bg-red-50 rounded-lg border border-red-100">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full" isLoading={loading}>
          Accept Invite
        </Button>
      </form>
    </div>
  );
}
