import { get, post } from '@/lib/api/http';
import type { ApiError } from '@/lib/api/http';

const PLATFORM_PATH = '/api/v2/integrations/platforms';
const DISCOVER_PATH = '/api/v2/integrations/projects/discover';
const IMPORT_PATH = '/api/v2/integrations/projects/import';
const OAUTH_ROOT_PATH = '/api/v2/oauth';
const OAUTH_PROVIDER_PATH = `${OAUTH_ROOT_PATH}/providers`;
const OAUTH_SESSION_PATH = `${OAUTH_ROOT_PATH}/sessions`;

type Primitive = string | number | boolean;

export type PlatformSummary = {
  id?: string;
  platform_id?: string;
  platform_type?: string;
  platform_name?: string;
  status?: string;
  connected_at?: string;
  last_sync_at?: string;
  [key: string]: unknown;
};

export type OAuthProvider = {
  provider: string;
  label?: string;
  description?: string;
  accent?: string;
  authorization_url?: string;
  scope?: string[];
  icon?: string;
  status?: string;
  comingSoon?: boolean;
  coming_soon?: boolean;
  [key: string]: unknown;
};

export type ListPlatformsFilters = {
  status?: string;
  provider?: string;
  search?: string;
  page?: number;
  limit?: number;
  [key: string]: unknown;
};

type ListPlatformsPayload = {
  status?: string;
  provider?: string;
  search?: string;
  page?: number;
  limit?: number;
  [key: string]: unknown;
};

export async function listPlatforms(filters?: ListPlatformsFilters): Promise<PlatformSummary[]> {
  const payload = normaliseListPlatformsPayload(filters);
  try {
    return await post<PlatformSummary[], ListPlatformsPayload>(PLATFORM_PATH, payload);
  } catch (error) {
    if (shouldRetryWithGet(error)) {
      return get<PlatformSummary[]>(PLATFORM_PATH, { params: payload });
    }
    throw error;
  }
}

type OAuthProvidersEnvelope = {
  providers?: OAuthProvider[];
  data?: OAuthProvider[];
  items?: OAuthProvider[];
  [key: string]: unknown;
};

type OAuthProvidersResponse = OAuthProvider[] | OAuthProvidersEnvelope | null | undefined;

export async function listOAuthProviders(): Promise<OAuthProvider[]> {
  const response = await get<OAuthProvidersResponse>(OAUTH_PROVIDER_PATH);

  if (Array.isArray(response)) {
    return response;
  }

  const envelope = (response ?? {}) as OAuthProvidersEnvelope;
  const providers = Array.isArray(envelope.providers)
    ? envelope.providers
    : Array.isArray(envelope.data)
    ? envelope.data
    : Array.isArray(envelope.items)
    ? envelope.items
    : [];

  return providers;
}

export type StartOAuthOptions = {
  mode?: 'popup' | 'redirect';
  params?: Record<string, Primitive | undefined>;
};

export type StartOAuthResponse = {
  authorization_url?: string;
  provider?: string;
  expires_at?: string;
  session_id?: string;
  sessionId?: string;
  state?: string;
  [key: string]: unknown;
};

export async function startOAuth(
  provider: string,
  returnTo?: string,
  options?: StartOAuthOptions
): Promise<StartOAuthResponse> {
  if (!provider) {
    throw new Error('A provider is required to start OAuth.');
  }

  const params: Record<string, Primitive> = {};
  if (returnTo) params.return_to = returnTo;
  if (options?.mode) params.mode = options.mode;
  if (options?.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params[key] = value as Primitive;
      }
    });
  }

  const encodedProvider = encodeURIComponent(provider);
  return get<StartOAuthResponse>(`${OAUTH_ROOT_PATH}/${encodedProvider}/start`, {
    params
  });
}

export type OAuthSessionStatus = 'pending' | 'authorized' | 'completed' | 'failed' | 'expired';

export type OAuthSession = {
  session_id?: string;
  provider?: string;
  status?: OAuthSessionStatus;
  success?: boolean;
  completed?: boolean;
  platform?: PlatformSummary;
  user_info?: Record<string, unknown>;
  error?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
};

export async function getOAuthSession(sessionId: string): Promise<OAuthSession> {
  if (!sessionId) {
    throw new Error('A session id is required to poll OAuth progress.');
  }
  const encoded = encodeURIComponent(sessionId);
  return get<OAuthSession>(`${OAUTH_SESSION_PATH}/${encoded}`);
}

export type DiscoveredProject = {
  repository_id?: string;
  project_id?: string;
  name?: string;
  full_name?: string;
  platform_id?: string;
  platform_name?: string;
  clone_url?: string;
  ssh_url?: string;
  default_branch?: string;
  languages?: string[];
  language?: string;
  description?: string;
  private?: boolean;
  archived?: boolean;
  size?: number;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
};

export type DiscoverProjectsRequest = {
  platformId: string;
  page?: number;
  limit?: number;
  language?: string;
  [key: string]: unknown;
};

export type DiscoverProjectsResponse = {
  platform_id?: string;
  total_projects?: number;
  accessible_projects?: number;
  page?: number;
  limit?: number;
  data?: DiscoveredProject[];
  items?: DiscoveredProject[];
  projects?: DiscoveredProject[];
  [key: string]: unknown;
};

export async function discoverProjects(request: DiscoverProjectsRequest): Promise<DiscoverProjectsResponse> {
  if (!request.platformId) {
    throw new Error('platformId is required to discover projects.');
  }

  const payload: Record<string, unknown> = {
    platform_id: request.platformId,
    page: request.page ?? 1,
    limit: request.limit ?? 20
  };

  if (request.language) {
    payload.language = request.language;
  }

  Object.entries(request)
    .filter(([key]) => !['platformId', 'page', 'limit', 'language'].includes(key))
    .forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        payload[key] = value;
      }
    });

  return post<DiscoverProjectsResponse, Record<string, unknown>>(DISCOVER_PATH, payload);
}

export type ImportProject = {
  repository_id: string;
  project_id?: string;
  name?: string;
  full_name?: string;
  clone_url?: string;
  ssh_url?: string;
  default_branch?: string;
  languages?: string[];
  description?: string;
  private?: boolean;
  [key: string]: unknown;
};

export type ImportProjectsRequest = {
  platform_id: string;
  projects: ImportProject[];
  [key: string]: unknown;
};

export type ImportProjectsResponse = {
  platform_id?: string;
  projects_requested?: number;
  projects_imported?: number;
  projects_failed?: number;
  imported_projects?: Array<{
    project_id?: string;
    name?: string;
    full_name?: string;
    status?: string;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
};

export async function importProjects(payload: ImportProjectsRequest): Promise<ImportProjectsResponse> {
  if (!payload?.platform_id) {
    throw new Error('platform_id is required to import projects.');
  }
  if (!Array.isArray(payload.projects) || payload.projects.length === 0) {
    throw new Error('Provide at least one project to import.');
  }
  return post<ImportProjectsResponse, ImportProjectsRequest>(IMPORT_PATH, payload);
}

function normaliseListPlatformsPayload(filters?: ListPlatformsFilters): ListPlatformsPayload {
  if (!filters) return {};
  const payload: ListPlatformsPayload = {};
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    const normalisedKey = key === 'platformId' ? 'platform_id' : key;
    payload[normalisedKey] = value;
  });
  return payload;
}

function shouldRetryWithGet(error: unknown): boolean {
  const apiError = error as ApiError;
  const status = apiError?.response?.status;
  return status === 404 || status === 405;
}
