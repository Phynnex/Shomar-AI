import { API_BASE_URL } from "@/lib/config";

export type ApiError = {
  status: number;
  message: string;
  details?: unknown;
};

export async function apiFetch<T = unknown>(
  path: string,
  init?: RequestInit & { parseJson?: boolean }
): Promise<T> {
  const url = new URL(path.replace(/^\/+/, ""), API_BASE_URL).toString();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(init?.headers || {}),
  };
  const res = await fetch(url, { ...init, headers });
  const parseJson = init?.parseJson ?? true;

  if (!res.ok) {
    let payload: any = undefined;
    try {
      payload = parseJson ? await res.json() : await res.text();
    } catch (_) {}
    const message = (payload && (payload.message || payload.error)) || res.statusText || "Request failed";
    const err: ApiError = { status: res.status, message, details: payload };
    throw err;
  }

  if (!parseJson) return (undefined as unknown) as T;
  try {
    return (await res.json()) as T;
  } catch (_) {
    // If there's no JSON body
    return (undefined as unknown) as T;
  }
}

