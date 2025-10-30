'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { buttonClasses } from '@/components/ui/button';
import { FaGithub, FaGitlab, FaBitbucket } from 'react-icons/fa';
import type { ApiError } from '@/lib/api/http';
import {
  connectPlatform,
  type PlatformSummary
} from '@/lib/api/integrations';
import { readCachedPlatforms, writeCachedPlatforms } from '@/lib/storage/platforms';

type Provider = {
  key: string;
  label: string;
  description: string;
  accent: string;
  icon: typeof FaGithub;
};

const PROVIDERS: Provider[] = [
  {
    key: 'github',
    label: 'GitHub',
    description: 'Sync organisations, repos, and branch protections.',
    accent: '#181717',
    icon: FaGithub
  },
  {
    key: 'gitlab',
    label: 'GitLab',
    description: 'Bring in self-hosted or SaaS GitLab groups.',
    accent: '#FC6D26',
    icon: FaGitlab
  },
  {
    key: 'bitbucket',
    label: 'Bitbucket',
    description: 'Join the waitlist for early access.',
    accent: '#2684FF',
    icon: FaBitbucket
  }
] as const;

type ConnectFormState = {
  platformName: string;
  accessToken: string;
  defaultBranch: string;
  autoDiscovery: boolean;
};

const initialConnectForm: ConnectFormState = {
  platformName: '',
  accessToken: '',
  defaultBranch: 'main',
  autoDiscovery: true
};

export default function IntegrationsPage() {
  const [platforms, setPlatforms] = useState<PlatformSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeProvider, setActiveProvider] = useState<Provider | null>(null);
  const [form, setForm] = useState<ConnectFormState>(initialConnectForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const cached = readCachedPlatforms();
    if (cached.length > 0) {
      setPlatforms(cached);
    }
  }, []);

  function openConnectModal(provider: Provider) {
    setActiveProvider(provider);
    setForm({
      platformName: `${provider.label} Workspace`,
      accessToken: '',
      defaultBranch: 'main',
      autoDiscovery: true
    });
    setError(null);
    setSuccess(null);
  }

  function closeConnectModal() {
    setActiveProvider(null);
    setForm(initialConnectForm);
    setSubmitting(false);
  }

  function updateField<TKey extends keyof ConnectFormState>(key: TKey, value: ConnectFormState[TKey]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleConnect(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeProvider) return;

    const provider = activeProvider;

    if (!form.accessToken.trim()) {
      setError('Provide an access token generated for this platform.');
      return;
    }
    if (!form.platformName.trim()) {
      setError('Give this connection a display name.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const response = await connectPlatform({
        platform_type: provider.key,
        platform_name: form.platformName.trim(),
        credentials: {
          access_token: form.accessToken.trim()
        },
        settings: {
          default_branch: form.defaultBranch.trim() || 'main',
          auto_discovery: form.autoDiscovery
        }
      });
      const summary: PlatformSummary = {
        platform_type: provider.key,
        platform_name: form.platformName.trim(),
        status: (response as PlatformSummary)?.status ?? 'connected',
        connected_at: (response as PlatformSummary)?.connected_at ?? new Date().toISOString(),
        ...response
      };
      setPlatforms((prev) => {
        const newId = summary.platform_id ?? summary.id;
        const providerKey = provider.key.toLowerCase();
        const filtered = prev.filter((platform) => {
          const platformId = platform.platform_id ?? platform.id;
          if (newId && platformId) {
            return platformId !== newId;
          }
          return (platform.platform_type ?? '').toLowerCase() !== providerKey;
        });
        const next = [...filtered, summary];
        writeCachedPlatforms(next);
        return next;
      });
      setSuccess(`${provider.label} connected successfully.`);
      closeConnectModal();
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr?.message || 'Unable to connect platform. Please try again.');
      setSubmitting(false);
    }
  }

  const connectedTypes = useMemo(() => {
    return new Set(
      platforms
        .map((platform) => (platform.platform_type ?? '').toLowerCase())
        .filter(Boolean)
    );
  }, [platforms]);

  return (
    <main className="min-h-screen bg-[#f5f7ff] px-4 py-12 text-slate-900 sm:px-6 lg:px-12">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <header className="rounded-3xl border border-slate-200 bg-white px-8 py-10 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-500">Step 1: Integrate platforms</p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
            Connect your code pipelines
          </h1>
          <p className="mt-4 max-w-3xl text-sm text-slate-600">
            Link the Git providers your teams rely on. Shomar uses read-only access to map repositories,
            understand branch protections, and schedule AI SAST scans without slowing down deploys.
          </p>
        </header>

        {success && (
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-6 py-4 text-sm text-emerald-700">
            {success}
          </div>
        )}
        {error && (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 px-6 py-4 text-sm text-rose-600">
            {error}
          </div>
        )}

        <section className="grid gap-6 md:grid-cols-3">
          {PROVIDERS.map((provider) => {
            const Icon = provider.icon;
            const isConnected = connectedTypes.has(provider.key);
            const isComingSoon = provider.key === 'bitbucket';

            return (
              <article
                key={provider.key}
                className={`flex flex-col gap-6 rounded-3xl border px-6 py-8 text-center shadow-sm ${
                  isComingSoon
                    ? 'border-dashed border-blue-200 bg-white/70 text-slate-400'
                    : 'border-blue-100 bg-white'
                }`}
              >
                <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
                  <Icon size={28} color={provider.accent} />
                </span>
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold text-slate-900">{provider.label}</h2>
                  <p className="text-xs uppercase tracking-widest text-blue-500">
                    {isComingSoon ? 'Coming soon' : isConnected ? 'Connected' : 'Available'}
                  </p>
                  <p className="text-sm text-slate-600">{provider.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => openConnectModal(provider)}
                  disabled={isComingSoon}
                  className={buttonClasses({
                    variant: isComingSoon ? 'outline' : 'primary',
                    size: 'lg',
                    className: `w-full justify-center ${
                      isComingSoon
                        ? 'border-blue-300 text-blue-500 hover:bg-blue-50 disabled:cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`
                  })}
                >
                  {isConnected ? 'Reconnect' : `Connect ${provider.label}`}
                </button>
              </article>
            );
          })}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white px-8 py-6 text-sm shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Connected platforms</h2>
          {platforms.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">
              You have not connected any platforms yet. Connect GitHub or GitLab to continue.
            </p>
          ) : (
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              {platforms.map((platform) => (
                <li
                  key={platform.id ?? platform.platform_id ?? platform.platform_name}
                  className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {platform.platform_name ?? platform.platform_type}
                    </p>
                    <p className="text-xs text-slate-500">
                      Type: {platform.platform_type ?? 'Unknown'} |{' '}
                      Status: {platform.status ?? 'connected'}
                    </p>
                  </div>
                  <span className="text-xs text-slate-400">
                    {platform.connected_at
                      ? `Connected ${new Date(platform.connected_at).toLocaleString()}`
                      : 'Active'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <footer className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white px-8 py-6 text-sm shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Integrations connected?</h2>
            <p className="mt-1 text-sm text-slate-600">
              Proceed to automatic discovery so Shomar can inventory your services.
            </p>
          </div>
          <Link
            href="/dashboard/discover"
            className={buttonClasses({
              size: 'lg',
              className: 'justify-center bg-blue-600 px-6 text-white hover:bg-blue-700'
            })}
          >
            Continue to discovery
          </Link>
        </footer>
      </div>

      {activeProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-8">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Connect {activeProvider.label}
                </h3>
                <p className="text-xs text-slate-500">
                  Provide a name and an access token with the scopes required for repository access.
                </p>
              </div>
              <button
                type="button"
                onClick={closeConnectModal}
                className="text-sm font-semibold text-slate-400 hover:text-slate-600"
              >
                Close
              </button>
            </div>

            <form className="mt-6 space-y-5" onSubmit={handleConnect}>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Connection name
                </label>
                <input
                  value={form.platformName}
                  onChange={(event) => updateField('platformName', event.target.value)}
                  placeholder={`${activeProvider.label} workspace`}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Access token
                </label>
                <input
                  value={form.accessToken}
                  onChange={(event) => updateField('accessToken', event.target.value)}
                  placeholder="Paste a personal access token with repo read permissions"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Default branch
                  </label>
                  <input
                    value={form.defaultBranch}
                    onChange={(event) => updateField('defaultBranch', event.target.value)}
                    placeholder="main"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <label className="flex items-center gap-3 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={form.autoDiscovery}
                    onChange={(event) => updateField('autoDiscovery', event.target.checked)}
                    className="h-4 w-4 rounded border border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Enable automatic project discovery after connecting</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeConnectModal}
                  className={buttonClasses({
                    variant: 'ghost',
                    size: 'sm',
                    className: 'justify-center text-slate-500 hover:text-slate-700'
                  })}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={buttonClasses({
                    size: 'sm',
                    className: 'justify-center bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-70'
                  })}
                >
                  {submitting ? 'Connecting...' : 'Connect platform'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
