'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { buttonClasses } from '@/components/ui/button';
import { discoverProjects, listPlatforms, type DiscoveredProject, type ImportProject, type PlatformSummary } from '@/lib/api/integrations';
import type { ApiError } from '@/lib/api/http';
import { readCachedPlatforms, writeCachedPlatforms } from '@/lib/storage/platforms';

type SelectionRecord = {
  platformId: string;
  projects: ImportProject[];
};

const STORAGE_KEY = 'shomar-selected-projects';

export default function DiscoverPage() {
  const router = useRouter();
  const [platforms, setPlatforms] = useState<PlatformSummary[]>([]);
  const [platformId, setPlatformId] = useState<string>('');
  const [language, setLanguage] = useState<string>('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [projects, setProjects] = useState<DiscoveredProject[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<Record<string, DiscoveredProject>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const lastAutoFetchedPlatform = useRef<string | null>(null);

  useEffect(() => {
    const cached = readCachedPlatforms();
    if (cached.length > 0) {
      setPlatforms(cached);
      const defaultId = cached[0]?.platform_id ?? cached[0]?.id ?? '';
      setPlatformId((prev) => (prev ? prev : defaultId));
    }
    void loadPlatforms();
    restoreSelection();
  }, []);

  async function loadPlatforms() {
    try {
      const response = await listPlatforms();
      setPlatforms(response);
      if (response.length > 0) {
        const defaultId = response[0]?.platform_id ?? response[0]?.id ?? '';
        setPlatformId((prev) => (prev ? prev : defaultId));
      }
      writeCachedPlatforms(response);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr?.message || 'Unable to load platforms.');
    }
  }

  function restoreSelection() {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as SelectionRecord;
      if (parsed?.platformId && parsed?.projects?.length) {
        setPlatformId(parsed.platformId);
        const keyed: Record<string, DiscoveredProject> = {};
        parsed.projects.forEach((project) => {
          if (project.repository_id) keyed[project.repository_id] = project;
        });
        setSelectedProjects(keyed);
      }
    } catch (_) {
      // ignore malformed storage
    }
  }

  const platformOptions = useMemo(() => {
    return platforms.map((platform) => ({
      id: platform.platform_id ?? platform.id ?? '',
      name: platform.platform_name ?? platform.platform_type ?? 'Platform'
    }));
  }, [platforms]);

  async function runDiscovery(source: 'manual' | 'auto' = 'manual') {
    if (!platformId) {
      if (source === 'manual') {
        setError('Select a platform to run discovery.');
      }
      return;
    }

    try {
      if (source === 'manual') {
        setError(null);
        setMessage(null);
      } else {
        setMessage('Loading repositories from your connected platform...');
      }
      setLoading(true);
      const response = await discoverProjects({ platformId, page, limit, language: language || undefined });
      const items =
        (response.data ?? response.items ?? response.projects ?? response['repos']) as DiscoveredProject[] | undefined;
      setProjects(items ?? []);
      if ((items?.length ?? 0) === 0) {
        setMessage('No projects found for the selected filters.');
      } else if (source === 'auto') {
        const providerName =
          platforms.find((platform) => (platform.platform_id ?? platform.id) === platformId)?.platform_name ??
          'platform';
        setMessage(`Loaded ${items?.length ?? 0} repositories from ${providerName}.`);
      }
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr?.message || 'Unable to discover projects. Try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDiscover(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runDiscovery('manual');
  }

  function toggleProject(project: DiscoveredProject) {
    setSelectedProjects((prev) => {
      const next = { ...prev };
      const repoId = project.repository_id?.trim();
      if (!repoId) {
        return next;
      }
      if (next[repoId]) {
        delete next[repoId];
      } else {
        next[repoId] = project;
      }
      return next;
    });
  }

  function proceedToImport() {
    const selected = Object.values(selectedProjects);
    if (!platformId || selected.length === 0) {
      setError('Select at least one project to import.');
      return;
    }
    if (typeof window !== 'undefined') {
      const toImportProject = (project: DiscoveredProject): ImportProject => ({
        repository_id: project.repository_id ?? project.full_name ?? project.name ?? '',
        name: project.name ?? project.full_name ?? 'Repository',
        full_name: project.full_name ?? '',
        clone_url: project.clone_url ?? '',
        default_branch: project.default_branch ?? 'main',
        languages: project.languages ?? [],
        private: project.private ?? false,
        description: project.description ?? ''
      });

      const record: SelectionRecord = {
        platformId,
        projects: selected.map(toImportProject)
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    }
    router.push('/dashboard/import');
  }

  return (
    <main className="min-h-screen bg-[#f5f7ff] px-4 py-12 text-slate-900 sm:px-6 lg:px-12">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <header className="rounded-3xl border border-slate-200 bg-white px-8 py-10 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-500">Step 2: Discover projects</p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
            Map your repositories automatically
          </h1>
          <p className="mt-4 text-sm text-slate-600">
            Once integrations are connected, Shomar inventories services and infrastructure so you can prioritise
            high-sensitivity projects for AI-powered scanning.
          </p>
        </header>

        {error && (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 px-6 py-4 text-sm text-rose-600">
            {error}
          </div>
        )}
        {message && (
          <div className="rounded-3xl border border-slate-200 bg-white px-6 py-4 text-sm text-slate-600">
            {message}
          </div>
        )}

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <form className="grid gap-4 md:grid-cols-4" onSubmit={handleDiscover}>
            <div className="space-y-2 md:col-span-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Platform
              </label>
              <select
                value={platformId}
                onChange={(event) => setPlatformId(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                {platformOptions.length === 0 && <option value="">No platforms connected</option>}
                {platformOptions.map((platform) => (
                  <option key={platform.id} value={platform.id}>
                    {platform.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Language</label>
              <input
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
                placeholder="Optional filter (e.g. javascript)"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Page</label>
              <input
                type="number"
                min={1}
                value={page}
                onChange={(event) => setPage(Number(event.target.value) || 1)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Limit</label>
              <input
                type="number"
                min={1}
                max={100}
                value={limit}
                onChange={(event) => setLimit(Number(event.target.value) || 20)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="md:col-span-4 flex items-center justify-end">
              <button
                type="submit"
                disabled={loading || !platformId}
                className={buttonClasses({
                  size: 'lg',
                  className: 'justify-center bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-70'
                })}
              >
                {loading ? 'Discovering...' : 'Discover projects'}
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Discovered projects</h2>
              <p className="text-xs text-slate-500">
                Select the repositories you want to import for continuous scanning.
              </p>
            </div>
            <span className="text-xs font-semibold text-blue-600">
              Selected {Object.keys(selectedProjects).length}
            </span>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">Project</th>
                  <th className="px-4 py-3 text-left">Default branch</th>
                  <th className="px-4 py-3 text-left">Languages</th>
                  <th className="px-4 py-3 text-right">Select</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white text-slate-600">
                {projects.map((project) => {
                  const key = project.repository_id ?? project.full_name ?? project.name;
                  const selected = !!(key && selectedProjects[key]);
                  return (
                    <tr key={key}>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{project.name}</div>
                        <div className="text-xs text-slate-500">{project.full_name}</div>
                      </td>
                      <td className="px-4 py-3 text-sm">{project.default_branch ?? '-'}</td>
                      <td className="px-4 py-3 text-sm">
                        {project.languages?.join(', ') ?? 'Unknown'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => toggleProject(project)}
                          className={buttonClasses({
                            variant: selected ? 'primary' : 'outline',
                            size: 'sm',
                            className: selected
                              ? 'justify-center bg-blue-600 text-white hover:bg-blue-700'
                              : 'justify-center border-slate-200 text-slate-600 hover:border-blue-300'
                          })}
                        >
                          {selected ? 'Selected' : 'Select'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {projects.length === 0 && !loading && (
                  <tr>
                    <td className="px-4 py-6 text-center text-sm text-slate-500" colSpan={4}>
                      {platformId
                        ? 'No repositories available for this platform yet.'
                        : 'Connect a platform to view repositories.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <footer className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white px-8 py-6 text-sm shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Ready to import?</h2>
            <p className="mt-1 text-sm text-slate-600">
              Selected projects will move into the import step where you can configure scanning.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/dashboard/integrations"
              className={buttonClasses({
                variant: 'ghost',
                size: 'sm',
                className: 'justify-center text-slate-600 hover:text-slate-900'
              })}
            >
              Back to integrations
            </Link>
            <button
              type="button"
              onClick={proceedToImport}
              className={buttonClasses({
                size: 'sm',
                className: 'justify-center bg-blue-600 text-white hover:bg-blue-700'
              })}
            >
              Continue to import
            </button>
          </div>
        </footer>
      </div>
    </main>
  );
}
  useEffect(() => {
    if (!platformId) return;
    if (lastAutoFetchedPlatform.current === platformId) return;
    lastAutoFetchedPlatform.current = platformId;
    void runDiscovery('auto');
  }, [platformId, page, limit, language]);
