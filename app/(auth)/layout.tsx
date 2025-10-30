import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-white to-surface-lighter text-foreground">
      {children}
    </div>
  );
}
