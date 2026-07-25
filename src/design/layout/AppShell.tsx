/**
 * AppShell — Root layout component providing consistent structure.
 * Handles sidebar, mobile nav, and main content area.
 */

'use client';

import { type ReactNode, useState, useEffect } from 'react';
import { cn } from '@design/utils/helpers';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { TopBar } from './TopBar';

export interface AppShellProps {
  children: ReactNode;
  sidebarOpen?: boolean;
  onSidebarToggle?: () => void;
  pageTitle?: string;
  pageDescription?: string;
  pageAction?: ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  className?: string;
}

export function AppShell({
  children,
  sidebarOpen = false,
  onSidebarToggle,
  pageTitle,
  pageDescription,
  pageAction,
  breadcrumbs,
  className,
}: AppShellProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className={cn('min-h-screen bg-surface', className)}>
      {/* Sidebar - Desktop */}
      <Sidebar
        open={sidebarOpen}
        onClose={onSidebarToggle}
        className={cn('hidden lg:fixed lg:inset-y-0 lg:z-40', !sidebarOpen && 'lg:w-16')}
      />

      {/* Main content */}
      <div className={cn('transition-all duration-300', sidebarOpen ? 'lg:pl-64' : 'lg:pl-16')}>
        {/* Top Bar - Desktop */}
        <TopBar
          onMenuClick={onSidebarToggle}
          pageTitle={pageTitle}
          pageDescription={pageDescription}
          pageAction={pageAction}
          breadcrumbs={breadcrumbs}
        />

        {/* Mobile Nav */}
        <MobileNav
          open={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
          currentPath={window.location.pathname}
        />

        {/* Mobile sidebar overlay */}
        {isMobile && sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-obsidian/50 backdrop-blur-sm lg:hidden"
            onClick={onSidebarToggle}
            aria-hidden="true"
          />
        )}

        {/* Page content */}
        <main id="main-content" className="pt-4 lg:pt-0 pb-20 lg:pb-8 px-4 lg:px-6">
          {children}
        </main>

        {/* Mobile bottom nav */}
        <MobileNav className="lg:hidden fixed bottom-0 left-0 right-0 z-50" />
      </div>
    </div>
  );
}

export default AppShell;