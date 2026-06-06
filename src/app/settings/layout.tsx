'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CreditCard, Building2, ShieldCheck, Users, ArrowLeft } from 'lucide-react';

const navItems = [
  { href: '/settings/billing', label: 'Billing & Plan', icon: CreditCard },
  { href: '/settings/team', label: 'Team', icon: Users },
  { href: '/settings/org', label: 'Organization', icon: Building2 },
  { href: '/settings/security', label: 'Security', icon: ShieldCheck },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="mx-auto flex max-w-5xl gap-8 px-4 py-8 lg:px-0">
      {/* Settings sidebar nav */}
      <nav className="hidden w-56 flex-shrink-0 lg:block" aria-label="Settings">
        <div className="mb-6">
          <Link
            href="/"
            className="mb-6 flex items-center gap-1.5 text-xs font-medium text-text-muted transition hover:text-text-secondary"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to app
          </Link>
        </div>
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-champagne/10 text-champagne'
                    : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile nav tabs */}
      <div className="mb-4 flex gap-1 border-b border-glass-border pb-1 lg:hidden" role="tablist" aria-label="Settings sections">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition ${
                isActive
                  ? 'bg-champagne/10 text-champagne'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              <item.icon className="h-3.5 w-3.5" />
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
