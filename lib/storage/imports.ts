import type { ImportProject } from "@/lib/api/integrations";

export type LastImportRecord = {
  platform_id: string;
  platform_name?: string;
  timestamp: string;
  projects: ImportProject[];
  imported_projects?: Array<{
    project_id?: string;
    name?: string;
    full_name?: string;
    status?: string;
  }>;
  totals?: {
    requested?: number;
    imported?: number;
    failed?: number;
  };
};

const LAST_IMPORT_KEY = "shomar_last_import";

export function writeLastImport(record: LastImportRecord): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LAST_IMPORT_KEY, JSON.stringify(record));
  } catch {
    // Ignore storage failures (quota, privacy mode, etc.)
  }
}

export function readLastImport(): LastImportRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LAST_IMPORT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LastImportRecord;
    if (!parsed || !parsed.platform_id || !Array.isArray(parsed.projects)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearLastImport(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(LAST_IMPORT_KEY);
  } catch {
    // Ignore storage failures
  }
}
