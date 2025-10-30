"use client";

import { useAuth } from "@/lib/store/auth";

export function clearClientSession() {
  try {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_info");
  } catch {}
  try {
    // Use the store if available (in client components)
    const clear = (useAuth as any)?.getState?.()?.clearSession as undefined | (() => void);
    if (typeof clear === "function") clear();
  } catch {}
}

let redirecting = false;
export function redirectToLogin(next?: string) {
  if (redirecting) return;
  redirecting = true;
  const nextParam = next || (typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/');
  const url = `/auth/login?next=${encodeURIComponent(nextParam)}`;
  if (typeof window !== 'undefined') {
    window.location.assign(url);
  }
}

export function logoutAndRedirect(next?: string) {
  clearClientSession();
  redirectToLogin(next);
}

export function getStoredAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const token = window.localStorage.getItem("access_token");
    if (!token) return null;
    const trimmed = token.trim();
    if (!trimmed || trimmed === "undefined" || trimmed === "null") return null;
    return trimmed;
  } catch {
    return null;
  }
}

export function hasStoredSession(): boolean {
  return !!getStoredAccessToken();
}

