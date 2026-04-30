import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;

  // If no code, the OAuth used implicit flow – redirect to login so the
  // client-side Supabase listener can pick up the session from the URL hash.
  if (!code) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  // Exchange the auth code for a session (PKCE flow)
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    console.error('[auth/callback] exchangeCodeForSession error:', error);
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  // Fetch the user's role from our custom users table
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', data.user.id)
    .single();

  if (userError || !userData) {
    // User authenticated in Supabase Auth but not in our users table yet.
    // This can happen if the DB trigger hasn't run or the user isn't provisioned.
    console.error('[auth/callback] users table lookup error:', userError);
    // Still redirect to dashboard – the client-side store will handle the
    // missing profile gracefully.
    return NextResponse.redirect(`${origin}/dashboard`);
  }

  // NOTE: (admin) and (sales) are Next.js route groups — NOT part of the URL.
  // (admin)/dashboard/page.tsx → /dashboard
  // (sales)/layout.tsx wraps routes starting with /sales/
  const redirectPath = userData.role === 'admin' ? '/dashboard' : '/sales/dashboard';
  return NextResponse.redirect(`${origin}${redirectPath}`);
}
