'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { buttonClasses } from '@/components/ui/button';
import type { ApiError } from '@/lib/api/http';
import { register } from '@/lib/api/auth';

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  phone: string;
  password: string;
  confirmPassword: string;
  marketing: boolean;
  termsAccepted: boolean;
};

const initialState: FormState = {
  firstName: '',
  lastName: '',
  email: '',
  company: '',
  phone: '',
  password: '',
  confirmPassword: '',
  marketing: false,
  termsAccepted: false
};

export default function SignUpPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialState);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function updateField<TKey extends keyof FormState>(key: TKey, value: FormState[TKey]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!form.firstName || !form.lastName) {
      setError('Add your first and last name.');
      return;
    }
    if (!form.email || !form.email.includes('@')) {
      setError('Enter a valid work email address.');
      return;
    }
    if (!form.company) {
      setError('Tell us the company or team you represent.');
      return;
    }
    if (!form.phone) {
      setError('Add a phone number so our team can reach you during onboarding.');
      return;
    }
    if (!form.password || form.password.length < 8) {
      setError('Passwords need at least 8 characters.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!form.termsAccepted) {
      setError('Please accept the terms of service.');
      return;
    }

    setLoading(true);
    try {
      await register({
        email: form.email,
        password: form.password,
        confirm_password: form.confirmPassword,
        first_name: form.firstName,
        last_name: form.lastName,
        company_name: form.company,
        phone: form.phone,
        terms_accepted: form.termsAccepted,
        marketing_consent: form.marketing
      });
      type VerifyRoute = `/auth/verify-email?email=${string}`;
      const verifyUrl = `/auth/verify-email?email=${encodeURIComponent(form.email)}` as VerifyRoute;
      router.push(verifyUrl);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen grid-cols-1 bg-[#f5f7ff] text-slate-900 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="relative hidden flex-col justify-between bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-600 px-12 py-14 text-white lg:flex">
        <div className="space-y-6">
          <Link
            href="/"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-lg font-semibold text-blue-600 shadow"
          >
            S
          </Link>
          <h1 className="mt-10 text-4xl font-semibold leading-tight">
            Secure every release with AI-assisted SAST built for African engineering teams.
          </h1>
          <p className="text-sm text-blue-100/90">
            Shomar pairs instant detections with compliance intelligence for POPIA, PCI-DSS, GDPR, and the payment rails
            that power mobile-first businesses across the continent.
          </p>
        </div>

        <div className="rounded-3xl border border-white/30 bg-white/10 p-6 backdrop-blur">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-100">What you get</p>
          <ul className="mt-4 space-y-3 text-sm text-blue-50">
            {[
              'Instant AI triage with fix suggestions for 25+ languages',
              'Regional compliance reporting (POPIA, NDPR, Kenya DPA)',
              'CI/CD hooks with role-based approvals and audit history'
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-200" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="flex items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-lg space-y-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-500">Start free</p>
            <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">Create your Shomar workspace</h2>
            <p className="mt-4 text-sm text-slate-600">
              No credit card required. Invite your team and run your first AI scan in minutes.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="firstName" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  First name
                </label>
                <input
                  id="firstName"
                  value={form.firstName}
                  onChange={(event) => updateField('firstName', event.target.value)}
                  placeholder="Amahle"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="lastName" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Last name
                </label>
                <input
                  id="lastName"
                  value={form.lastName}
                  onChange={(event) => updateField('lastName', event.target.value)}
                  placeholder="Kamau"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

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
              <label htmlFor="company" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Company or team name
              </label>
              <input
                id="company"
                value={form.company}
                onChange={(event) => updateField('company', event.target.value)}
                placeholder="M-Pesa Platform Team"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="phone" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Phone number
              </label>
              <input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(event) => updateField('phone', event.target.value)}
                placeholder="+27 10 500 1234"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(event) => updateField('password', event.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={form.confirmPassword}
                  onChange={(event) => updateField('confirmPassword', event.target.value)}
                  placeholder="Repeat password"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <label className="flex items-start gap-3 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={form.marketing}
                onChange={(event) => updateField('marketing', event.target.checked)}
                className="mt-1 h-4 w-4 rounded border border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Send me onboarding guides and product updates. We respect inboxes and only send what matters.</span>
            </label>

            <label className="flex items-start gap-3 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={form.termsAccepted}
                onChange={(event) => updateField('termsAccepted', event.target.checked)}
                className="mt-1 h-4 w-4 rounded border border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>
                I agree to the{' '}
                <Link href="/legal" className="text-blue-600 hover:text-blue-700">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-blue-600 hover:text-blue-700">
                  Privacy Policy
                </Link>
                .
              </span>
            </label>

            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={buttonClasses({
                size: 'lg',
                className: 'w-full justify-center bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-70'
              })}
            >
              {loading ? 'Creating workspace...' : 'Create workspace'}
            </button>
          </form>

          <p className="text-sm text-slate-600">
            Already have an account?{' '}
            <Link href="/auth/login" className="font-semibold text-blue-600 hover:text-blue-700">
              Sign in here
            </Link>
            .
          </p>
        </div>
      </section>
    </main>
  );
}
