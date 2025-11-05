'use client';

import Link from 'next/link';
import type { Route } from 'next';

type ScanMode = 'ai' | 'comprehensive';

type SidebarMode = {
  id: ScanMode;
  label: string;
  icon: string;
  description: string;
};

type SidebarNavItem = {
  label: string;
  href: Route;
  icon: string;
};

type DashboardSidebarProps = {
  mode: ScanMode;
  scanModes: ReadonlyArray<SidebarMode>;
  navItems: ReadonlyArray<SidebarNavItem>;
  onModeSelect: (mode: ScanMode) => void;
  modeCardClasses: (active: boolean) => string;
  className?: string;
};

export function DashboardSidebar({
  mode,
  scanModes,
  navItems,
  onModeSelect,
  modeCardClasses,
  className
}: DashboardSidebarProps) {
  const containerClasses = [
    'hidden',
    'lg:flex',
    'lg:flex-col',
    'lg:w-64',
    'lg:gap-8',
    'lg:border-r',
    'lg:border-slate-200',
    'lg:bg-white',
    'lg:px-6',
    'lg:py-8',
    'lg:shadow-sm',
    'lg:sticky',
    'lg:top-0',
    'lg:h-screen'
  ]
    .concat(className ? [className] : [])
    .join(' ')
    .trim();

  return (
    <aside className={containerClasses}>
      <Link href={'/dashboard' as Route} className="text-2xl font-semibold text-slate-900">
        SHOMAR
      </Link>

      <div className="space-y-3">
        {scanModes.map((modeOption) => {
          const isActive = mode === modeOption.id;
          return (
            <button
              key={modeOption.id}
              type="button"
              onClick={() => onModeSelect(modeOption.id)}
              className={modeCardClasses(isActive)}
            >
              <div className="flex items-center justify-between">
                <span className="text-xl">{modeOption.icon}</span>
                <span className="text-[11px] uppercase tracking-wide text-slate-400">
                  {isActive ? 'Active' : 'Switch'}
                </span>
              </div>
              <p className="mt-4 text-sm font-semibold">{modeOption.label}</p>
              <p className="mt-1 text-xs text-slate-500">{modeOption.description}</p>
            </button>
          );
        })}
      </div>

      <nav className="mt-6 space-y-1 text-sm">
        {navItems.map((item) => {
          const isActive = item.href === '/dashboard';
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 transition ${
                isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
