'use client';

import { Suspense, FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { useRouter, useSearchParams } from 'next/navigation';
import { buttonClasses } from '@/components/ui/button';
import { login } from '@/lib/api/auth';
import { setTokens, type ApiError } from '@/lib/api/http';
import { getStoredAccessToken } from '@/lib/auth/session';

type LoginForm = {
  email: string;
  password: string;
  rememberMe: boolean;
};

const initialForm: LoginForm = {
  email: '',
  password: '',
  rememberMe: false
};

const REMEMBER_KEY = 'shomar_remember_me';

const suspenseFallback = (
  <div className="flex min-h-screen items-center justify-center bg-[#f5f7ff] text-sm text-slate-600">
    Loading login…
  </div>
);

export default function LoginPage() {
  return (
    <Suspense fallback={suspenseFallback}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState<LoginForm>(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const nextUrlParam = searchParams.get('next') ?? '/dashboard/integrations';
  const nextUrl = useMemo<Route>(() => {
    if (typeof nextUrlParam === 'string' && nextUrlParam.startsWith('/')) {
      const pathOnly = nextUrlParam.split('?')[0] || '/dashboard/integrations';
      return pathOnly as Route;
    }
    return '/dashboard/integrations';
  }, [nextUrlParam]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const remembered = localStorage.getItem(REMEMBER_KEY);
    if (remembered) {
      setForm((prev) => ({ ...prev, email: remembered, rememberMe: true }));
    }
  }, []);

  useEffect(() => {
    const token = getStoredAccessToken();
    if (token) {
      router.replace(nextUrl);
    }
  }, [router, nextUrl]);

  function updateField<TKey extends keyof LoginForm>(key: TKey, value: LoginForm[TKey]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!form.email || !form.email.includes('@')) {
      setError('Enter the work email you used during signup.');
      return;
    }
    if (!form.password) {
      setError('Add your password to continue.');
      return;
    }

    setLoading(true);
    try {
      const response = await login({ email: form.email, password: form.password });
      const accessToken = response.access_token ?? response.accessToken ?? response.token;
      const refreshToken = response.refresh_token ?? response.refreshToken;

      if (!accessToken) {
        setError('Login succeeded but no access token was returned.');
        return;
      }

      setTokens(accessToken, refreshToken ?? undefined);

      if (typeof window !== 'undefined') {
        if (form.rememberMe) {
          localStorage.setItem(REMEMBER_KEY, form.email);
        } else {
          localStorage.removeItem(REMEMBER_KEY);
        }
        if (response.user_info) {
          localStorage.setItem('user_info', JSON.stringify(response.user_info));
        }
      }

      router.push(nextUrl);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr?.message || 'Login failed. Double-check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen grid-cols-1 bg-[#f5f7ff] text-slate-900 lg:grid-cols-2">
      <section className="hidden flex-col justify-between bg-white px-12 py-14 lg:flex">
        <div>
          <Link
            href="/"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-lg font-semibold text-white shadow"
          >
            S
          </Link>
          <h1 className="mt-12 text-4xl font-semibold leading-tight text-slate-900">
            Welcome back. Your security posture is evolving every minute, so let&apos;s keep it sharp.
          </h1>
          <p className="mt-5 max-w-lg text-sm text-slate-600">
            Track AI-generated remediation steps, compliance status, and pipeline coverage for every service from one
            place.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-500">What&apos;s new</p>
          <ul className="mt-3 space-y-3 text-sm text-slate-600">
            {[
              'Improved AI trainability for languages common across African fintech teams.',
              'Compliance snapshots mapped to PCI-DSS v4 and POPIA controls.',
              'Deeper GitHub integration with branch-level policies.'
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="flex items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-md space-y-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-500">Sign in</p>
            <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">Access your workspace</h2>
            <p className="mt-4 text-sm text-slate-600">
              Use the credentials you created during signup. Need help?{' '}
              <Link href="mailto:support@shomarsec.com" className="font-semibold text-blue-600 hover:text-blue-700">
                Contact support
              </Link>
              .
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <div className="space-y-2">
              <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Work email
              </label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(event) => updateField('email', event.target.value)}
                placeholder="security@yourcompany.africa"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500">
                <label htmlFor="password">Password</label>
                <p className="text-blue-600 hover:text-blue-700">
                  Forgot?
                </p>
              </div>
              <input
                id="password"
                type="password"
                value={form.password}
                onChange={(event) => updateField('password', event.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <label className="flex items-center gap-3 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={form.rememberMe}
                onChange={(event) => updateField('rememberMe', event.target.checked)}
                className="h-4 w-4 rounded border border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Keep me signed in on this device</span>
            </label>

            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={buttonClasses({
                size: 'lg',
                className: 'w-full justify-center bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-70'
              })}
            >
              {loading ? 'Signing in...' : 'Sign in to dashboard'}
            </button>
          </form>

          <p className="text-sm text-slate-600">
            New to Shomar?{' '}
            <Link href={'/auth/signup' as Route} className="font-semibold text-blue-600 hover:text-blue-700">
              Create an account
            </Link>
            .
          </p>
        </div>
      </section>
    </main>
  );
}
