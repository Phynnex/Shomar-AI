'use client';

export type AuthState = {
  token: string | null;
  email: string | null;
  clearSession: () => void;
};

const emptyState: AuthState = {
  token: null,
  email: null,
  clearSession: () => undefined
};

export function useAuth(): AuthState {
  return emptyState;
}
