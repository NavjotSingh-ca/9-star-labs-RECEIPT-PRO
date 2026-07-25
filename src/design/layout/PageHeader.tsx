/**
 * PageHeader — Consistent page header with title, description, actions, and tabs.
 */

'use client';

import { type ReactNode } from 'react';
import { cn } from '../utils/helpers';
import { Button } from '../primitives/Button';
import { Badge } from '../primitives/Badge';
import { ChevronRight } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  secondaryAction?: ReactNode;
  tabs?: Array<{ label: string; href: string; count?: number }>;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  className?: string;
  variant?: 'default' | 'compact' | 'full';
}

export function PageHeader({
  title,
  description,
  action,
  secondaryAction,
  tabs,
  activeTab,
  onTabChange,
  breadcrumbs,
  className,
  variant = 'default',
}: PageHeaderProps) {
  const padding = variant === 'compact' ? 'py-4' : variant === 'full' ? 'py-8' : 'py-6';

  return (
    <header className={cn('border-b border-glass-border', padding, className)}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-sm" aria-label="Breadcrumb">
            {breadcrumbs.map((crumb, index) => (
              <span key={crumb.label} className="flex items-center gap-1.5">
                {index > 0 && <ChevronRight className="h-3.5 w-3.5 text-text-muted" aria-hidden="true" />}
                {crumb.href ? (
                  <a href={crumb.href} className="text-text-muted hover:text-text-primary transition-colors">
                    {crumb.label}
                  </a>
                ) : (
                  <span className="text-text-primary font-medium">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          {/* Title section */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary truncate">
              {title}
            </h1>
            {description && (
              <p className="mt-1 text-sm text-text-muted">{description}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {secondaryAction && (
              <Button variant="secondary" size="sm">
                {secondaryAction}
              </Button>
            )}
            {action && (
              <Button size="sm">
                {action}
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        {tabs && tabs.length > 0 && (
          <div className="mt-4 border-t border-glass-border pt-4">
            <nav className="flex gap-1 overflow-x-auto" role="tablist" aria-label="Page sections">
              {tabs.map((tab) => (
                <button
                  key={tab.href}
                  role="tab"
                  aria-selected={activeTab === tab.href}
                  aria-controls={`${tab.href}-panel`}
                  id={`${tab.href}-tab`}
                  onClick={() => onTabChange?.(tab.href)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200',
                    activeTab === tab.href
                      ? 'bg-champagne/10 text-champagne border border-champagne/30'
                      : 'text-text-muted hover:bg-surface-hover hover:text-text-primary'
                  )}
                >
                  {tab.label}
                  {tab.count !== undefined && (
                    <Badge variant="default" size="sm" className={activeTab === tab.href ? 'bg-champagne/30 text-champagne' : ''}>
                      {tab.count}
                    </Badge>
                  )}
                </button>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

/**
 * SectionHeader — Smaller header for sections within a page.
 */
interface SectionHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function SectionHeader({ title, description, action, className }: SectionHeaderProps) {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4', className)}>
      <div>
        <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
        {description && <p className="text-sm text-text-muted mt-0.5">{description}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

export default PageHeader;