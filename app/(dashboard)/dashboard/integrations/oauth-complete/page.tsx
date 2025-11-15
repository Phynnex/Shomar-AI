'use client';

import { Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { buttonClasses } from '@/components/ui/button';

const fallback = (
  <div className="flex min-h-screen items-center justify-center bg-[#f5f7ff] text-sm text-slate-600">
    Finalising integration...
  </div>
);

export default function OAuthCompletePage() {
  return (
    <Suspense fallback={fallback}>
      <OAuthCompleteContent />
    </Suspense>
  );
}

function OAuthCompleteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const provider = searchParams.get('provider') ?? 'your platform';
  const status = searchParams.get('status') ?? 'success';
  const message = searchParams.get('message');

  useEffect(() => {
    const timer = window.setTimeout(() => {
      router.replace('/dashboard/integrations');
    }, 4000);
    return () => window.clearTimeout(timer);
  }, [router]);

  const isSuccess = status !== 'error';

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f7ff] px-4 py-16 text-slate-900">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${
          isSuccess ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
        }`}>
          {isSuccess ? '?' : '!'}
        </div>
        <h1 className="mt-6 text-2xl font-semibold">
          {isSuccess ? 'OAuth flow completed' : 'OAuth flow failed'}
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          {message ||
            (isSuccess
              ? `You can return to the integrations dashboard to finish connecting ${provider}.`
              : 'We could not finalise the authorization. Please try again.')}
        </p>
        {/* <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
          <Link
            href="/dashboard/integrations"
            className={buttonClasses({
              size: 'lg',
              className: 'justify-center bg-blue-600 text-white hover:bg-blue-700'
            })}
          >
            Back to integrations
          </Link>
        </div> */}
        <p className="mt-4 text-xs text-slate-400">This page will redirect automatically once everything is synced.</p>
      </div>
    </main>
  );
}
