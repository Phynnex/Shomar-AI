'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { useSearchParams } from 'next/navigation';
import { buttonClasses } from '@/components/ui/button';

function maskEmail(email: string | null): string {
  if (!email) return 'your inbox';
  const [user, domain] = email.split('@');
  if (!domain || user.length < 3) return email;
  return `${user.slice(0, 2)}***@${domain}`;
}

const suspenseFallback = (
  <div className="flex min-h-screen items-center justify-center bg-[#f5f7ff] text-sm text-slate-600">
    Loading verification details…
  </div>
);

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={suspenseFallback}>
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const emailParam = useSearchParams().get('email');

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f7ff] px-4 py-16 text-slate-900">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="h-1 bg-gradient-to-r from-blue-500 via-sky-400 to-indigo-500" />
        <div className="space-y-8 px-8 py-12 sm:px-12">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-500">Step 2: Verify email</p>
            <h1 className="text-3xl font-semibold sm:text-4xl">Confirm your work email address</h1>
            <p className="text-sm text-slate-600">
              We&apos;ve sent a secure verification link to{' '}
              <span className="font-semibold text-slate-900">{maskEmail(emailParam)}</span>. Click it to activate your
              workspace and start mapping integrations.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
            <p className="text-sm font-semibold text-slate-900">Didn&apos;t see the email?</p>
            <ul className="mt-3 space-y-2">
              {[
                'Check promotion or spam folders - security filters sometimes reroute automated emails.',
                'Confirm you entered the correct work email during signup.',
                'Still nothing? Request a new link or email support@shomarsec.com.'
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-400" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href={'/auth/signup' as Route}
              className={buttonClasses({
                variant: 'ghost',
                size: 'lg',
                className: 'justify-center text-slate-600 hover:text-slate-900'
              })}
            >
              Use a different email
            </Link>
            <Link
              href={'/auth/login' as Route}
              className={buttonClasses({
                size: 'lg',
                className: 'justify-center bg-blue-600 text-white hover:bg-blue-700'
              })}
            >
              I&apos;ve verified - take me to login
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
