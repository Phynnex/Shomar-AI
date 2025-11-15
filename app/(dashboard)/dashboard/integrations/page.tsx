'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import type { ReadonlyURLSearchParams } from 'next/navigation';
import type { Route } from 'next';
import { buttonClasses } from '@/components/ui/button';
import { FaGithub, FaGitlab, FaBitbucket } from 'react-icons/fa';
import type { ApiError } from '@/lib/api/http';
import {
  getOAuthSession,
  listPlatforms,
  listOAuthProviders,
  startOAuth,
  type OAuthProvider,
  type OAuthSession,
  type PlatformSummary
} from '@/lib/api/integrations';
import { readCachedPlatforms, writeCachedPlatforms } from '@/lib/storage/platforms';

type ProviderDisplay = {
  provider: string;
  label: string;
  description: string;
  accent: string;
  icon: typeof FaGithub;
  scope?: string[];
  comingSoon?: boolean;
  status?: string;
};

const PROVIDER_DEFAULTS: Record<
  string,
  Omit<ProviderDisplay, 'status'>
> = {
  github: {
    provider: 'github',
    label: 'GitHub',
    description: 'Sync organisations, repos, and branch protections.',
    accent: '#181717',
    icon: FaGithub,
    scope: ['repo', 'read:org']
  },
  gitlab: {
    provider: 'gitlab',
    label: 'GitLab',
    description: 'Bring in self-hosted or SaaS GitLab groups.',
    accent: '#FC6D26',
    icon: FaGitlab,
    scope: ['api']
  },
  bitbucket: {
    provider: 'bitbucket',
    label: 'Bitbucket',
    description: 'Join the waitlist for early access.',
    accent: '#2684FF',
    icon: FaBitbucket,
    comingSoon: true
  }
};

const SESSION_POLL_INTERVAL_MS = 1500;
const SESSION_POLL_TIMEOUT_MS = 2 * 60 * 1000;
const TERMINAL_SESSION_STATUSES = new Set(['authorized', 'completed', 'failed', 'expired']);
const DEFAULT_RETURN_TO_URL = 'https://shomar-production.up.railway.app/dashboard/integrations/oauth-complete';
const DEFAULT_OAUTH_ORIGIN = 'https://shomar-production.up.railway.app';

function extractSessionIdFromParams(params: ReadonlyURLSearchParams | null): string | null {
  if (!params) return null;
  const keys = ['oauthSessionId', 'session_id', 'sessionId', 'state'];
  for (const key of keys) {
    const value = params.get(key);
    if (value && value.trim() !== '') {
      return value.trim();
    }
  }
  return null;
}

function extractProviderFromParams(params: ReadonlyURLSearchParams | null): string | null {
  if (!params) return null;
  const value = params.get('provider') ?? params.get('provider_label');
  return value && value.trim() !== '' ? value.trim() : null;
}

function decodeParamValue(value?: string | null): string | null {
  if (!value) return null;
  try {
    return decodeURIComponent(value.replace(/\+/g, ' '));
  } catch {
    return value;
  }
}

function enforceHttps(url: string | undefined | null): string | undefined {
  if (!url) return url || undefined;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'http:') {
      parsed.protocol = 'https:';
      return parsed.toString();
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

function resolveReturnToUrl(win: Window | null): string {
  const configured = (process.env.NEXT_PUBLIC_OAUTH_RETURN_TO ?? '').trim();
  if (configured) {
    try {
      // Allow full URLs or bases; append default path only when a base is provided.
      const maybeUrl = new URL(configured);
      if (maybeUrl.pathname === '/' || maybeUrl.pathname === '') {
        maybeUrl.pathname = '/dashboard/integrations/oauth-complete';
      }
      return enforceHttps(maybeUrl.toString()) ?? DEFAULT_RETURN_TO_URL;
    } catch {
      // Fall through to other strategies if the configured value is invalid.
    }
  }

  if (win) {
    const origin = win.location.origin;
    const isLocalHost = /^https?:\/\/(localhost|127\.0\.0\.1)/i.test(origin);
    if (!isLocalHost) {
      try {
        const resolved = new URL('/dashboard/integrations/oauth-complete', origin).toString();
        return enforceHttps(resolved) ?? DEFAULT_RETURN_TO_URL;
      } catch {
        // Ignore origin parsing issues and fall back to default.
      }
    }
  }

  return enforceHttps(DEFAULT_RETURN_TO_URL) ?? DEFAULT_RETURN_TO_URL;
}

function resolveOAuthOrigin(win: Window | null): string {
  const configured = (process.env.NEXT_PUBLIC_OAUTH_ORIGIN ?? '').trim();
  if (configured) {
    try {
      const origin = new URL(configured).origin;
      return enforceHttps(origin) ?? DEFAULT_OAUTH_ORIGIN;
    } catch {
      // Ignore invalid custom values.
    }
  }

  if (win) {
    const origin = win.location.origin;
    const isLocalHost = /^https?:\/\/(localhost|127\.0\.0\.1)/i.test(origin);
    if (!isLocalHost) {
      return enforceHttps(origin) ?? DEFAULT_OAUTH_ORIGIN;
    }
  }

  return enforceHttps(DEFAULT_OAUTH_ORIGIN) ?? DEFAULT_OAUTH_ORIGIN;
}

function sanitizeAuthorizationUrl(url?: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const redirectUri = parsed.searchParams.get('redirect_uri');
    const secureRedirect = enforceHttps(redirectUri);
    if (secureRedirect && secureRedirect !== redirectUri) {
      parsed.searchParams.set('redirect_uri', secureRedirect);
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

function mapToProviderDisplay(provider?: OAuthProvider | null): ProviderDisplay | null {
  const providerId = provider?.provider?.toLowerCase();
  if (!providerId) {
    return null;
  }

  const defaults = PROVIDER_DEFAULTS[providerId];
  const label = provider?.label ?? defaults?.label ?? providerId;
  const descriptionFromApi =
    typeof provider?.description === 'string' ? provider.description.trim() : '';
  const accentFromApi = typeof provider?.accent === 'string' ? provider.accent.trim() : '';
  const scopeFromApi = Array.isArray(provider?.scope) ? provider.scope : undefined;
  const status = provider?.status;
  const statusValue = typeof status === 'string' ? status.toLowerCase() : undefined;
  const apiComingSoon = provider?.comingSoon || provider?.coming_soon;

  return {
    provider: providerId,
    label,
    description: descriptionFromApi || defaults?.description || `Connect ${label}.`,
    accent: accentFromApi || defaults?.accent || '#0f172a',
    icon: defaults?.icon ?? FaGithub,
    scope: scopeFromApi && scopeFromApi.length > 0 ? scopeFromApi : defaults?.scope,
    comingSoon: Boolean(
      apiComingSoon ||
        statusValue === 'coming_soon' ||
        statusValue === 'waitlist' ||
        defaults?.comingSoon
    ),
    status
  };
}

function isTerminalOAuthSession(session?: OAuthSession | null): boolean {
  if (!session?.status) return false;
  return TERMINAL_SESSION_STATUSES.has(session.status.toLowerCase());
}

function isSuccessfulOAuthSession(session?: OAuthSession | null): boolean {
  if (!session) return false;
  if (session.success === false) return false;
  if (session.error) return false;
  const status = session.status?.toLowerCase();
  return status === 'authorized' || status === 'completed';
}

async function waitForOAuthSession(
  sessionId: string,
  timeoutMs = SESSION_POLL_TIMEOUT_MS,
  intervalMs = SESSION_POLL_INTERVAL_MS
): Promise<OAuthSession> {
  if (!sessionId) {
    throw new Error('Missing OAuth session identifier.');
  }

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const session = await getOAuthSession(sessionId);
      if (isTerminalOAuthSession(session)) {
        return session;
      }
    } catch (error) {
      const apiErr = error as ApiError;
      const status = apiErr?.response?.status ?? 0;
      const detail =
        (apiErr?.response?.data as { detail?: string; message?: string } | undefined)?.detail ??
        (apiErr?.response?.data as { message?: string } | undefined)?.message ??
        apiErr?.message;
      const detailLower = detail?.toLowerCase() ?? '';
      const recoverableMissingSession =
        status === 404 || status === 409 || status === 425 || status === 429 || detailLower.includes('session not found');
      if (!recoverableMissingSession) {
        throw error;
      }
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error('Timed out while finalising OAuth session.');
}

export default function IntegrationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const processedRedirectRef = useRef<string | null>(null);
  const [platforms, setPlatforms] = useState<PlatformSummary[]>([]);
  const [platformsLoading, setPlatformsLoading] = useState(false);
  const [providers, setProviders] = useState<ProviderDisplay[]>([]);
  const [providersLoading, setProvidersLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  function clearOAuthQueryParams() {
    if (!searchParams) return;
    const keys = [
      'oauthSessionId',
      'session_id',
      'sessionId',
      'state',
      'status',
      'provider',
      'provider_label',
      'error',
      'error_description',
      'message'
    ];
    const shouldClear = keys.some((key) => searchParams.get(key));
    if (!shouldClear) return;
    const remaining = new URLSearchParams(searchParams.toString());
    keys.forEach((key) => remaining.delete(key));
    const query = remaining.toString();
    const href = query ? `/dashboard/integrations?${query}` : '/dashboard/integrations';
    router.replace(href as Route, { scroll: false });
  }

  useEffect(() => {
    if (!searchParams) return;
    const sessionId = extractSessionIdFromParams(searchParams);
    const providerHint = extractProviderFromParams(searchParams);
    const errorParam = decodeParamValue(searchParams.get('error') ?? searchParams.get('error_description'));
    const key = `${sessionId ?? ''}|${errorParam ?? ''}|${providerHint ?? ''}`;

    if (!sessionId && !errorParam) {
      processedRedirectRef.current = null;
      return;
    }

    if (processedRedirectRef.current === key) {
      return;
    }
    processedRedirectRef.current = key;

    async function finalizeRedirect() {
      if (errorParam && !sessionId) {
        setError(errorParam);
        setInfo(null);
        clearOAuthQueryParams();
        return;
      }
      if (!sessionId) return;

      try {
        setInfo('Finishing OAuth connection...');
        setError(null);
        setOauthLoading(providerHint ?? 'oauth');
        const session = await waitForOAuthSession(sessionId);
        if (!isSuccessfulOAuthSession(session)) {
          throw new Error(session?.error || `Unable to complete ${session?.provider ?? 'OAuth'} connection.`);
        }
        const providerLabel = session.provider ?? providerHint ?? 'your platform';
        await refreshPlatforms(`Connected ${providerLabel}. Continue with project discovery.`);
        setInfo(`Connected ${providerLabel}. Continue with project discovery.`);
      } catch (err) {
        const apiErr = err as ApiError;
        const responseMessage =
          (apiErr?.response?.data as { message?: string } | undefined)?.message ?? apiErr?.message;
        setError(responseMessage || (err instanceof Error ? err.message : 'Unable to finalise OAuth session.'));
        setInfo(null);
      } finally {
        setOauthLoading(null);
        clearOAuthQueryParams();
      }
    }

    void finalizeRedirect();
  }, [searchParams]);

  useEffect(() => {
    const cached = readCachedPlatforms();
    if (cached.length > 0) {
      setPlatforms(cached);
    }
    void refreshPlatforms();
    void loadProviders();
  }, []);

  async function loadProviders() {
    try {
      setProvidersLoading(true);
      const response = await listOAuthProviders();
      const mapped = response
        .map((provider) => mapToProviderDisplay(provider))
        .filter((provider): provider is ProviderDisplay => Boolean(provider));
      if (mapped.length === 0) {
        setError('No OAuth providers are currently available. Please try again later.');
      }
      setProviders(mapped);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr?.message || 'Unable to load OAuth providers.');
      if (providers.length === 0) {
        setProviders([]);
      }
    } finally {
      setProvidersLoading(false);
    }
  }

  async function refreshPlatforms(message?: string) {
    try {
      setPlatformsLoading(true);
      const response = await listPlatforms();
      setPlatforms(response);
      writeCachedPlatforms(response);
      if (message) {
        setInfo(message);
      }
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr?.message || 'Unable to load connected platforms.');
    } finally {
      setPlatformsLoading(false);
    }
  }

  async function handleStartOAuth(provider: ProviderDisplay) {
    if (provider.comingSoon || typeof window === 'undefined') return;
    try {
      setOauthLoading(provider.provider);
      setError(null);
      setInfo('Redirecting to provider...');

      const returnToUrl = resolveReturnToUrl(window);
      const oauthOrigin = resolveOAuthOrigin(window);
      const response = await startOAuth(provider.provider, returnToUrl, {
        mode: 'redirect',
        params: { origin: oauthOrigin }
      });

      const authorizationUrl = sanitizeAuthorizationUrl(response.authorization_url);
      if (!authorizationUrl) {
        throw new Error('Authorization URL not returned by server.');
      }

      window.location.assign(authorizationUrl);
    } catch (err) {
      const apiErr = err as ApiError;
      const responseMessage =
        (apiErr?.response?.data as { message?: string } | undefined)?.message ?? apiErr?.message;
      setError(
        responseMessage || (err instanceof Error ? err.message : `Unable to connect ${provider.label}.`)
      );
      setInfo(null);
      setOauthLoading(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f7ff] px-4 py-12 text-slate-900 sm:px-6 lg:px-12">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <header className="rounded-3xl border border-slate-200 bg-white px-8 py-10 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-500">Step 1: Integrate platforms</p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Connect your code pipelines</h1>
          <p className="mt-4 max-w-3xl text-sm text-slate-600">
            Launch an OAuth handshake with your Git provider. Once connected, Shomar inventories repositories and keeps
            discovery in sync without manual tokens.
          </p>
        </header>

        {info && (
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-6 py-4 text-sm text-emerald-700">
            {info}
          </div>
        )}
        {error && (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 px-6 py-4 text-sm text-rose-600">
            {error}
          </div>
        )}

        {providersLoading ? (
          <section className="rounded-3xl border border-slate-200 bg-white px-8 py-6 text-sm text-slate-500 shadow-sm">
            Loading OAuth providers...
          </section>
        ) : providers.length === 0 ? (
          <section className="rounded-3xl border border-dashed border-slate-300 bg-white px-8 py-6 text-sm text-slate-500 shadow-sm">
            No OAuth providers are currently available. Please try again in a few minutes or contact support.
          </section>
        ) : (
          <section className="grid gap-6 md:grid-cols-3">
            {providers.map((provider) => {
              const Icon = provider.icon;
              const status = provider.status?.toLowerCase();
              const comingSoon = provider.comingSoon || status === 'coming_soon' || status === 'waitlist';
              const isConnected = status === 'connected' || status === 'active';
              const buttonBusy = oauthLoading === provider.provider;
              const disabled = comingSoon || buttonBusy;

              return (
                <article
                  key={provider.provider}
                  className={`flex flex-col gap-6 rounded-3xl border px-6 py-8 text-center shadow-sm ${
                    comingSoon
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
                      {comingSoon ? 'Coming soon' : isConnected ? 'Connected' : 'Available'}
                    </p>
                    <p className="text-sm text-slate-600">{provider.description}</p>
                    {provider.scope && provider.scope.length > 0 && (
                      <p className="text-xs text-slate-400">Scopes: {provider.scope.join(', ')}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => handleStartOAuth(provider)}
                    className={buttonClasses({
                      variant: comingSoon ? 'outline' : 'primary',
                      size: 'lg',
                      className: `w-full justify-center ${
                        comingSoon
                          ? 'border-blue-300 text-blue-500 hover:bg-blue-50 disabled:cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`
                    })}
                  >
                    {comingSoon
                      ? 'Coming soon'
                      : buttonBusy
                      ? 'Authorizing...'
                      : isConnected
                      ? 'Reconnect'
                      : `Connect ${provider.label}`}
                  </button>
                </article>
              );
            })}
          </section>
        )}

        <section className="rounded-3xl border border-slate-200 bg-white px-8 py-6 text-sm shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Connected platforms</h2>
            <button
              type="button"
              onClick={() => refreshPlatforms()}
              className={buttonClasses({
                variant: 'ghost',
                size: 'sm',
                className: 'justify-center text-slate-500 hover:text-slate-900'
              })}
            >
              Refresh
            </button>
          </div>
          {platformsLoading ? (
            <p className="mt-3 text-sm text-slate-500">Loading connected platforms...</p>
          ) : platforms.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">
              You have not connected any platforms yet. Start with GitHub or GitLab to continue.
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
                      Type: {platform.platform_type ?? 'Unknown'} | Status: {platform.status ?? 'connected'}
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
    </main>
  );
}
