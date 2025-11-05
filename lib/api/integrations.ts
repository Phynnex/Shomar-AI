import { get, post } from "@/lib/api/http";

export type PlatformSummary = {
  id?: string;
  platform_id?: string;
  platform_type?: string;
  platform_name?: string;
  status?: string;
  connected_at?: string;
  [key: string]: unknown;
};

export type ListPlatformsResponse = PlatformSummary[] | { data?: PlatformSummary[] };

export async function listPlatforms(): Promise<PlatformSummary[]> {
  const res = await post<ListPlatformsResponse, Record<string, never>>(
    "/api/v2/integrations/platforms",
    {}
  );
  if (Array.isArray(res)) return res;
  if (res?.data && Array.isArray(res.data)) return res.data;
  return [];
}

export type ConnectPlatformRequest = {
  platform_type: string;
  platform_name: string;
  credentials: {
    access_token: string;
    [key: string]: unknown;
  };
  settings: {
    default_branch: string;
    auto_discovery?: boolean;
    [key: string]: unknown;
  };
};

export type ConnectPlatformResponse = {
  id?: string;
  platform_id?: string;
  message?: string;
  [key: string]: unknown;
};

export async function connectPlatform(body: ConnectPlatformRequest) {
  return post<ConnectPlatformResponse, ConnectPlatformRequest>("/api/v2/integrations/platforms", body);
}

export type DiscoverProjectsParams = {
  platformId: string;
  page?: number;
  limit?: number;
  language?: string;
};

export type DiscoveredProject = {
  repository_id: string;
  name: string;
  full_name?: string;
  clone_url?: string;
  ssh_url?: string;
  default_branch?: string;
  language?: string;
  languages?: string[];
  private?: boolean;
  description?: string;
  [key: string]: unknown;
};

export type DiscoverProjectsResponse = {
  platform_id?: string;
  platform_name?: string;
  total_projects?: number;
  accessible_projects?: number;
  last_discovery?: string;
  data?: DiscoveredProject[];
  items?: DiscoveredProject[];
  projects?: DiscoveredProject[];
  total?: number;
  [key: string]: unknown;
};

export async function discoverProjects({ platformId, page, limit, language }: DiscoverProjectsParams) {
  const params = new URLSearchParams();
  if (page) params.set("page", String(page));
  if (limit) params.set("limit", String(limit));
  if (language) params.set("language", language);
  const query = params.toString();
  const path = `/api/v2/integrations/platforms/${platformId}/projects${query ? `?${query}` : ""}`;
  const res = await get<DiscoverProjectsResponse | DiscoveredProject[]>(path);

  const extractProjects = (): DiscoveredProject[] => {
    if (Array.isArray(res)) return res;
    const payload = (res ?? {}) as DiscoverProjectsResponse;
    if (Array.isArray(payload.data)) return payload.data;
    if (Array.isArray(payload.items)) return payload.items;
    if (Array.isArray(payload.projects)) return payload.projects;
    return [];
  };

  const normalizeProjects = (projects: DiscoveredProject[]): DiscoveredProject[] =>
    projects.map((project) => {
      const languages =
        project.languages && project.languages.length > 0
          ? project.languages
          : project.language
          ? [project.language]
          : [];
      return {
        ...project,
        languages,
      };
    });

  const projects = normalizeProjects(extractProjects());
  if (Array.isArray(res)) {
    return { data: projects };
  }
  return {
    ...res,
    data: projects,
  };
}

export type ImportProject = {
  repository_id: string;
  name: string;
  full_name?: string;
  clone_url?: string;
  default_branch?: string;
  languages?: string[];
  private?: boolean;
  description?: string;
  [key: string]: unknown;
};

export type ImportProjectsRequest = {
  platform_id: string;
  projects: ImportProject[];
};

export type ImportProjectsResponse = {
  platform_id?: string;
  platform_name?: string;
  projects_requested?: number;
  projects_imported?: number;
  projects_failed?: number;
  imported_projects?: Array<{
    project_id?: string;
    database_id?: string | null;
    name?: string;
    full_name?: string;
    status?: string;
    [key: string]: unknown;
  }>;
  message?: string;
  [key: string]: unknown;
};

export async function importProjects(body: ImportProjectsRequest) {
  return post<ImportProjectsResponse, ImportProjectsRequest>("/api/v2/integrations/projects/import", body);
}

