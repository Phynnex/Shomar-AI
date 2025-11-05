'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { useRouter, useSearchParams } from 'next/navigation';
import { buttonClasses } from '@/components/ui/button';

type AuthStatus = 'unknown' | 'authed' | 'guest';

const suspenseFallback = (
  <div className="flex min-h-screen items-center justify-center bg-[#F6F7FF] text-sm text-slate-600">
    Loading welcome experience...
  </div>
);

export default function WelcomePage() {
  return (
    <Suspense fallback={suspenseFallback}>
      <WelcomeContent />
    </Suspense>
  );
}

function WelcomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? '';

  const [status, setStatus] = useState<AuthStatus>('unknown');
  const [agree, setAgree] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await fetch('/api/auth/me', { credentials: 'include' });
        if (!cancelled) setStatus(response.ok ? 'authed' : 'guest');
      } catch {
        if (!cancelled) setStatus('guest');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function resendVerification() {
    if (!email) return;
    setResending(true);
    setMessage(null);

    try {
      const redirectUrl = `${window.location.origin}/auth/welcome?email=${encodeURIComponent(email)}`;
      const response = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          verification_type: 'registration',
          redirect_url: redirectUrl,
          expires_in_hours: 24
        })
      });

      setMessage(
        response.ok
          ? 'Verification email resent. Check your inbox.'
          : 'We could not resend the email. Try again later.'
      );
    } catch {
      setMessage('We hit a network snag. Try again soon.');
    } finally {
      setResending(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F6F7FF] text-foreground">
      <header className="border-b border-[#DCE1FF] bg-white/80 px-6 py-4">
        <div className="mx-auto flex w-full max-w-4xl items-center gap-2 text-lg font-semibold text-primary">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
            S
          </span>
          Shomar
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-4xl flex-col items-center px-4 py-16">
        <div className="w-full max-w-lg rounded-3xl border border-[#E2E6FF] bg-white px-10 py-12 text-center shadow-[0_40px_90px_-60px_rgba(15,23,42,0.4)]">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-3xl text-primary">
            AI
          </div>
          <h1 className="mt-6 text-2xl font-semibold text-foreground sm:text-3xl">
            Welcome to Shomar
          </h1>
          {email && (
            <p className="mt-3 text-sm text-foreground/70">
              We&apos;ve sent a verification link to{' '}
              <span className="font-medium text-foreground">{email}</span>.
            </p>
          )}

          <label className="mx-auto mt-8 flex max-w-sm items-center justify-center gap-3 text-xs text-foreground/70">
            <input
              type="checkbox"
              checked={agree}
              onChange={(event) => setAgree(event.target.checked)}
              className="h-4 w-4 rounded border border-primary/40 text-primary focus:ring-primary"
            />
            <span>
              By proceeding, I agree to Shomar&apos;s{' '}
              <Link href={'/legal' as Route} className="text-primary hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href={'/privacy' as Route} className="text-primary hover:underline">
                Privacy Policy
              </Link>
              .
            </span>
          </label>

          <button
            type="button"
            disabled={!agree}
            onClick={() => router.push('/dashboard' as Route)}
            className={buttonClasses({
              size: 'lg',
              className: 'mt-6 w-full justify-center bg-primary text-white hover:bg-primary-hover',
              variant: 'primary'
            })}
          >
            Continue to setup
          </button>

          <div className="mt-6 text-xs text-foreground/60">
            {status === 'unknown'
              ? 'Checking your session...'
              : status === 'authed'
              ? 'Session active - you are signed in.'
              : 'You are browsing as a guest.'}
          </div>

          <div className="mt-6 space-y-2 text-xs text-foreground/60">
            <button
              type="button"
              onClick={resendVerification}
              disabled={resending || !email}
              className="text-primary hover:underline disabled:text-primary/60"
            >
              {resending ? 'Resending...' : 'Resend verification email'}
            </button>
            {message && <p>{message}</p>}
          </div>
        </div>
      </section>
    </main>
  );
}
