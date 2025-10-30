'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { getStoredAccessToken, redirectToLogin } from '@/lib/auth/session';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getStoredAccessToken();
    if (!token) {
      const next = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/';
      redirectToLogin(next);
      return;
    }
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#f5f7ff] text-slate-900">
        <span className="text-sm text-slate-500">Checking your session...</span>
      </div>
    );
  }

  return <div className="min-h-screen w-full bg-[#f5f7ff] text-slate-900">{children}</div>;
}
