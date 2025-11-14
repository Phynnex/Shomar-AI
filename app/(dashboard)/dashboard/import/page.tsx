'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { buttonClasses } from '@/components/ui/button';
import type { ApiError } from '@/lib/api/http';
import {
  importProjects,
  listPlatforms,
  type ImportProject,
  type PlatformSummary
} from '@/lib/api/integrations';
import { readCachedPlatforms, writeCachedPlatforms } from '@/lib/storage/platforms';
import { writeLastImport } from '@/lib/storage/imports';

type StoredSelection = {
  platformId: string;
  projects: ImportProject[];
};

type EditableProject = ImportProject & { id: string };

const STORAGE_KEY = 'shomar-selected-projects';

const generateId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `proj-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const initialManualProject: EditableProject = {
  id: generateId(),
  repository_id: '',
  name: '',
  full_name: '',
  clone_url: '',
  default_branch: 'main',
  languages: [],
  description: '',
  private: false
};

export default function ImportPage() {
  const router = useRouter();
  const [platforms, setPlatforms] = useState<PlatformSummary[]>([]);
  const [platformId, setPlatformId] = useState<string>('');
  const [projects, setProjects] = useState<EditableProject[]>([]);
  const [manualProject, setManualProject] = useState<EditableProject>(initialManualProject);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
      const parsed = JSON.parse(raw) as StoredSelection;
      if (!parsed?.platformId || !parsed?.projects?.length) return;

      setPlatformId(parsed.platformId);
      setProjects(
        parsed.projects.map((project) => ({
          id: project.repository_id || generateId(),
          repository_id: project.repository_id ?? '',
          name: project.name ?? '',
          full_name: project.full_name ?? '',
          clone_url: project.clone_url ?? '',
          default_branch: project.default_branch ?? 'main',
          languages: project.languages ?? [],
          description: project.description ?? '',
          private: project.private ?? false
        }))
      );
    } catch {
      // Ignore malformed storage values.
    }
  }

  const platformOptions = useMemo(() => {
    return platforms.map((platform) => ({
      id: platform.platform_id ?? platform.id ?? '',
      name: platform.platform_name ?? platform.platform_type ?? 'Platform'
    }));
  }, [platforms]);

  function removeProject(id: string) {
    setProjects((prev) => prev.filter((project) => project.id !== id));
  }

  function handleManualChange<TKey extends keyof EditableProject>(key: TKey, value: EditableProject[TKey]) {
    setManualProject((prev) => ({ ...prev, [key]: value }));
  }

  function addManualProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const repositoryId = manualProject.repository_id?.trim() ?? '';
    const projectName = manualProject.name?.trim() ?? '';
    if (!repositoryId || !projectName) {
      setError('Provide both a repository ID and a project name.');
      return;
    }

    const normalisedProject: EditableProject = {
      ...manualProject,
      id: manualProject.id || generateId(),
      repository_id: repositoryId,
      name: projectName,
      languages: manualProject.languages ?? []
    };
    setProjects((prev) => [...prev, normalisedProject]);
    setManualProject({ ...initialManualProject, id: generateId() });
    setError(null);
  }

  async function handleImport() {
    if (!platformId) {
      setError('Select the platform these projects belong to.');
      return;
    }
    if (projects.length === 0) {
      setError('Choose at least one project to import.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const payloadProjects = projects.map(({ id, ...project }) => project);
      const response = await importProjects({
        platform_id: platformId,
        projects: payloadProjects
      });
      const selectedPlatform = platforms.find(
        (platform) => (platform.platform_id ?? platform.id ?? '') === platformId
      );
      setSuccess('Projects imported successfully. Redirecting to the dashboard to start your scan...');
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
        writeLastImport({
          platform_id: response.platform_id ?? platformId,
          platform_name:
            selectedPlatform?.platform_name ?? selectedPlatform?.platform_type ?? selectedPlatform?.id ?? platformId,
          timestamp: new Date().toISOString(),
          projects: payloadProjects,
          imported_projects: response.imported_projects ?? undefined,
          totals: {
            requested: response.projects_requested,
            imported: response.projects_imported,
            failed: response.projects_failed
          }
        });
      }
      setProjects([]);
      setManualProject({ ...initialManualProject, id: generateId() });
      setTimeout(() => router.push('/dashboard'), 1600);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr?.message || 'Import failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f7ff] px-4 py-12 text-slate-900 sm:px-6 lg:px-12">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <header className="rounded-3xl border border-slate-200 bg-white px-8 py-10 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-500">Step 3: Import projects</p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
            Bring services into continuous coverage
          </h1>
          <p className="mt-4 text-sm text-slate-600">
            Select the repositories that matter most. Shomar will create secure snapshots for analysis while respecting
            existing branch protections.
          </p>
        </header>

        {error && (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 px-6 py-4 text-sm text-rose-600">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-6 py-4 text-sm text-emerald-700">
            {success}
          </div>
        )}

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Platform
              </label>
              <select
                value={platformId}
                onChange={(event) => setPlatformId(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                {platformOptions.length === 0 && <option value="">No platforms connected yet</option>}
                {platformOptions.map((platform) => (
                  <option key={platform.id} value={platform.id}>
                    {platform.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2 text-sm text-slate-500">
              Choose the platform these projects belong to. You can adjust this later from the integrations settings.
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Projects to import</h2>
            <span className="text-xs text-blue-600">{projects.length} selected</span>
          </div>
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">Repository</th>
                  <th className="px-4 py-3 text-left">Default branch</th>
                  <th className="px-4 py-3 text-left">Languages</th>
                  <th className="px-4 py-3 text-right">Remove</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white text-slate-600">
                {projects.map((project) => (
                  <tr key={project.id}>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{project.name}</div>
                      <div className="text-xs text-slate-500">{project.full_name || project.repository_id}</div>
                    </td>
                    <td className="px-4 py-3">{project.default_branch || 'main'}</td>
                    <td className="px-4 py-3">{project.languages?.join(', ') || 'Unknown'}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => removeProject(project.id)}
                        className={buttonClasses({
                          variant: 'outline',
                          size: 'sm',
                          className: 'justify-center border-rose-200 text-rose-600 hover:border-rose-300'
                        })}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
                {projects.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-sm text-slate-500">
                      Select repositories during discovery or add them manually below.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">Add project manually</h3>
          <p className="mt-1 text-xs text-slate-500">
            Paste repository details for projects that were not discovered automatically.
          </p>
          <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={addManualProject}>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Repository ID
              </label>
              <input
                value={manualProject.repository_id}
                onChange={(event) => handleManualChange('repository_id', event.target.value)}
                placeholder="713357034"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Project name</label>
              <input
                value={manualProject.name}
                onChange={(event) => handleManualChange('name', event.target.value)}
                placeholder="devops-nodejs"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Full name
              </label>
              <input
                value={manualProject.full_name}
                onChange={(event) => handleManualChange('full_name', event.target.value)}
                placeholder="github-org/devops-nodejs"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Clone URL
              </label>
              <input
                value={manualProject.clone_url}
                onChange={(event) => handleManualChange('clone_url', event.target.value)}
                placeholder="https://github.com/org/devops-nodejs.git"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Default branch
              </label>
              <input
                value={manualProject.default_branch}
                onChange={(event) => handleManualChange('default_branch', event.target.value)}
                placeholder="main"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Languages (comma separated)
              </label>
              <input
                value={manualProject.languages?.join(', ') ?? ''}
                onChange={(event) =>
                  handleManualChange(
                    'languages',
                    event.target.value
                      .split(',')
                      .map((lang) => lang.trim())
                      .filter(Boolean)
                  )
                }
                placeholder="python, javascript"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="md:col-span-2 flex items-center justify-end">
              <button
                type="submit"
                className={buttonClasses({
                  variant: 'outline',
                  size: 'sm',
                  className: 'justify-center border-slate-200 text-slate-600 hover:border-blue-300'
                })}
              >
                Add project
              </button>
            </div>
          </form>
        </section>

        <footer className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white px-8 py-6 text-sm shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Wrap up this onboarding step</h2>
            <p className="mt-1 text-sm text-slate-600">
              Import the selected projects. Once they are in, head to the dashboard to start an AI-powered scan.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/dashboard/discover"
              className={buttonClasses({
                variant: 'ghost',
                size: 'sm',
                className: 'justify-center text-slate-600 hover:text-slate-900'
              })}
            >
              Back to discovery
            </Link>
            <button
              type="button"
              onClick={handleImport}
              disabled={loading}
              className={buttonClasses({
                size: 'sm',
                className: 'justify-center bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-70'
              })}
            >
              {loading ? 'Importing...' : 'Import projects'}
            </button>
          </div>
        </footer>
      </div>
    </main>
  );
}
