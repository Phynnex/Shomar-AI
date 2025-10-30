import type { PlatformSummary } from "@/lib/api/integrations";

const CONNECTED_PLATFORMS_KEY = "shomar_connected_platforms";

export function readCachedPlatforms(): PlatformSummary[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CONNECTED_PLATFORMS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(Boolean) as PlatformSummary[];
  } catch {
    return [];
  }
}

export function writeCachedPlatforms(platforms: PlatformSummary[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      CONNECTED_PLATFORMS_KEY,
      JSON.stringify(platforms ?? [])
    );
  } catch {
    // Ignore storage write failures (e.g. private mode quota).
  }
}
