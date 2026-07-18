'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CreditCard, Building2, ShieldCheck, Users, LayoutDashboard, ArrowLeft, ToggleLeft } from 'lucide-react';

const navItems = [
  { href: '/settings/billing', label: 'Billing & Plan', icon: CreditCard },
  { href: '/settings/team', label: 'Team', icon: Users },
  { href: '/settings/org', label: 'Organization', icon: Building2 },
  { href: '/settings/features', label: 'Features', icon: ToggleLeft },
  { href: '/settings/admin', label: 'Admin', icon: LayoutDashboard },
  { href: '/settings/security', label: 'Security', icon: ShieldCheck },
];

/**
 * Settings layout — provides sidebar navigation (desktop) and tab navigation (mobile)
 * across all settings pages: Billing, Team, Organization, Admin, Security.
 * Uses aria-current and role="tablist" for accessible navigation.
 */
export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="mx-auto flex max-w-5xl gap-8 px-4 py-8 lg:px-0">
      {/* Settings sidebar nav */}
      <nav className="hidden w-56 flex-shrink-0 lg:block animate-in fade-in slide-up-from-bottom-4 duration-700" aria-label="Settings navigation">
        <div className="mb-6">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-1.5 text-xs font-medium text-text-muted transition hover:text-text-secondary group"
          >
            <ArrowLeft className="h-3 w-3 transition group-hover:-translate-x-0.5" />
            Back to app
          </Link>
        </div>
        <ul className="space-y-1.5" role="list">
          {navItems.map((item, i) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href} className="animate-in fade-in slide-up-from-bottom-2 duration-500" style={{ animationDelay: `${i * 50}ms` }}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-champagne/10 text-champagne'
                      : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                  }`}
                  {...(isActive ? { 'aria-current': 'page' as const } : {})}
                >
                  <item.icon className="h-4 w-4" aria-hidden />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Mobile nav tabs */}
      <div className="mb-4 flex gap-1.5 border-b border-glass-border pb-1 lg:hidden animate-in fade-in slide-up-from-bottom-4 duration-700" role="tablist" aria-label="Settings sections">
        {navItems.map((item, i) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              role="tab"
              aria-selected={isActive}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-200 animate-in fade-in slide-up-from-bottom-2 duration-500 ${isActive ? 'bg-champagne/10 text-champagne' : 'text-text-muted hover:text-text-secondary'}`}
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <item.icon className="h-3.5 w-3.5" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* Content pane */}
      <div className="min-w-0 flex-1">
        {children}
      </div>
    </div>
  );
}