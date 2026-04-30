'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { getSession } = useAuthStore();

  useEffect(() => {
    getSession();
  }, [getSession]);

  return <>{children}</>;
}
