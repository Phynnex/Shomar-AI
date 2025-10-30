'use client';

import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

type IconProps = React.SVGProps<SVGSVGElement>;

function BellIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 17h5l-1.4-1.4A2 2 0 0118 14v-3a6 6 0 10-12 0v3a2 2 0 01-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1"
      />
    </svg>
  );
}

function ChevronDownIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 7.5l5 5 5-5" />
    </svg>
  );
}

type DashboardHeaderProps = {
  user: {
    name: string;
    email?: string;
    avatarUrl?: string;
  };
  notificationsCount?: number;
  onSettings?: () => void;
  onLogout?: () => void;
  onNotificationsClick?: () => void;
};

export function DashboardHeader({
  user,
  notificationsCount = 0,
  onSettings,
  onLogout,
  onNotificationsClick
}: DashboardHeaderProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        setMenuOpen(false);
      }
    };

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);

    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [menuOpen]);

  const breadcrumbs = useMemo(() => {
    const segments = pathname
      .split('/')
      .filter(Boolean)
      .map((segment) =>
        segment
          .replace(/-/g, ' ')
          .split(' ')
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' ')
      );

    const items: Array<{ label: string; type: 'user' | 'route' | 'current' }> = [
      { label: user.name, type: 'user' }
    ];

    if (segments.length === 0) {
      items.push({ label: 'Dashboard', type: 'current' });
      return items;
    }

    segments.forEach((segment, index) => {
      items.push({
        label: segment,
        type: index === segments.length - 1 ? 'current' : 'route'
      });
    });

    return items;
  }, [pathname, user.name]);

  const currentPage = breadcrumbs[breadcrumbs.length - 1]?.label ?? 'Dashboard';

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="relative mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-10">
        <div className="flex flex-col">
          <nav className="flex flex-wrap items-center gap-1 text-xs font-medium uppercase tracking-wide text-slate-400">
            {breadcrumbs.map((crumb, index) => (
              <Fragment key={`${crumb.label}-${index}`}>
                <span className={crumb.type === 'current' ? 'text-slate-500' : undefined}>{crumb.label}</span>
                {index < breadcrumbs.length - 1 && <span className="text-slate-300">/</span>}
              </Fragment>
            ))}
          </nav>
          <h1 className="mt-1 text-lg font-semibold text-slate-900 sm:text-xl">{currentPage}</h1>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onNotificationsClick}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:text-slate-900"
            aria-label="Notifications"
          >
            <BellIcon className="h-5 w-5" aria-hidden />
            {notificationsCount > 0 && (
              <span className="absolute top-1.5 right-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-blue-500 px-1 text-[11px] font-semibold text-white">
                {notificationsCount > 9 ? '9+' : notificationsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            ref={triggerRef}
            onClick={() => setMenuOpen((prev) => !prev)}
            className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-left transition hover:border-slate-300 hover:shadow-sm"
          >
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-slate-100">
              {user.avatarUrl ? (
                <Image
                  src={user.avatarUrl}
                  alt={`${user.name} avatar`}
                  width={40}
                  height={40}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-base font-semibold text-slate-600">
                  {user.name
                    .split(' ')
                    .map((part) => part[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </span>
              )}
            </div>
            <div className="hidden flex-col leading-tight text-sm sm:flex">
              <span className="font-semibold text-slate-900">{user.name}</span>
              {user.email && <span className="text-xs text-slate-500">{user.email}</span>}
            </div>
            <ChevronDownIcon className="h-4 w-4 text-slate-400" aria-hidden />
          </button>
        </div>

        {menuOpen && (
          <div
            ref={menuRef}
            className="absolute right-4 top-[calc(100%+0.75rem)] w-56 rounded-2xl border border-slate-200 bg-white p-3 text-sm shadow-lg sm:right-6 lg:right-10"
          >
            <div className="space-y-1 border-b border-slate-100 pb-3">
              <p className="text-xs uppercase tracking-wide text-slate-400">Signed in as</p>
              <p className="text-sm font-medium text-slate-900">{user.name}</p>
              {user.email && <p className="text-xs text-slate-500">{user.email}</p>}
            </div>
            <div className="mt-3 space-y-1">
              <button
                type="button"
                onClick={() => {
                  onSettings?.();
                  setMenuOpen(false);
                }}
                className="w-full rounded-lg px-3 py-2 text-left text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
              >
                Settings
              </button>
              <button
                type="button"
                onClick={() => {
                  onLogout?.();
                  setMenuOpen(false);
                }}
                className="w-full rounded-lg px-3 py-2 text-left text-rose-600 transition hover:bg-rose-50"
              >
                Log out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
