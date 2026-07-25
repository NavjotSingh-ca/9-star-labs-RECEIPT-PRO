'use client';

import { type ReactNode, useState, useRef, useEffect } from 'react';
import { cn } from '../utils/helpers';
import { Button } from '../primitives/Button';
import { Input } from '../primitives/Input';
import { Badge } from '../primitives/Badge';
import {
  Search,
  Bell,
  Sun,
  Moon,
  UserCog,
  Menu as MenuIcon,
  ChevronDown,
  LogOut,
  Settings,
  Shield,
  CreditCard,
  Building2,
  Users,
  HelpCircle,
  Key,
  ChevronRight,
  Camera,
  ReceiptText,
  FileDown,
  Route,
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useTheme } from 'next-themes';

interface TopBarProps {
  onMenuClick?: () => void;
  pageTitle?: string;
  pageDescription?: string;
  pageAction?: ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  children?: ReactNode;
  className?: string;
}

export function TopBar({
  onMenuClick,
  pageTitle,
  pageDescription,
  pageAction,
  breadcrumbs,
  children: _children,
  className,
}: TopBarProps) {
  const { theme, setTheme } = useTheme();
  const [commandOpen, setCommandOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandOpen(true);
      }
      if (e.key === 'Escape') {
        setCommandOpen(false);
        setNotificationsOpen(false);
        setUserMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus search when command palette opens
  useEffect(() => {
    if (commandOpen) {
      searchRef.current?.focus();
    }
  }, [commandOpen]);

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-30 lg:pl-16',
        'bg-obsidian/90 backdrop-blur-xl border-b border-glass-border',
        'transition-all duration-300',
        className
      )}
    >
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Left: Menu + Breadcrumbs + Page Title */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onMenuClick}
            aria-label="Open menu"
          >
            <MenuIcon className="h-5 w-5" />
          </Button>

          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav className="hidden sm:flex items-center gap-1.5 text-sm" aria-label="Breadcrumb">
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

          <div className="hidden lg:block flex-1">
            {pageTitle && (
              <h1 className="text-xl font-bold text-text-primary truncate">{pageTitle}</h1>
            )}
            {pageDescription && (
              <p className="text-sm text-text-muted truncate">{pageDescription}</p>
            )}
          </div>
        </div>

        {/* Center: Global Search / Command Palette */}
        <div className="hidden lg:flex flex-1 max-w-xl mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" aria-hidden="true" />
            <Input
              ref={searchRef}
              type="search"
              placeholder="Search receipts, vendors, projects... (⌘K)"
              className="pl-10 pr-10 h-9 bg-sidebar-surface border-sidebar-border text-text-primary placeholder:text-text-muted focus:border-champagne focus:ring-champagne/40"
              onClick={() => setCommandOpen(true)}
              readOnly
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden items-center gap-1 text-[10px] font-medium text-text-muted sm:flex">
              <span>{isMac ? '⌘' : 'Ctrl'}</span>
              <span>+</span>
              <span>K</span>
            </kbd>
          </div>
        </div>

        {/* Right: Actions + Notifications + User Menu */}
        <div className="flex items-center gap-2">
          {pageAction}

          {/* Command Palette Trigger */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCommandOpen(true)}
            aria-label="Open command palette"
            title="Open command palette (⌘K)"
            className="hidden lg:flex"
          >
            <Search className="h-4 w-4" />
            <kbd className="hidden items-center gap-0.5 text-[10px] font-medium text-sidebar-text-muted sm:flex">
              <span>{isMac ? '⌘' : 'Ctrl'}</span>
              <span>+</span>
              <span>K</span>
            </kbd>
          </Button>

          {/* Notifications */}
          <div ref={notificationsRef} className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              aria-label="Notifications"
              aria-expanded={notificationsOpen}
            >
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-danger text-white text-[10px] font-bold flex items-center justify-center">
                3
              </span>
            </Button>

            {notificationsOpen && (
              <div
                className="fixed inset-0 z-50 bg-obsidian/50 backdrop-blur-sm"
                onClick={() => setNotificationsOpen(false)}
                aria-hidden="true"
              >
                <div
                  ref={notificationsRef}
                  className="fixed right-4 top-20 w-80 bg-surface-raised rounded-xl border border-glass-border shadow-lg animate-in slide-in-from-top-2 duration-150"
                  onClick={(e) => e.stopPropagation()}
                  role="dialog"
                  aria-label="Notifications"
                >
                  <div className="space-y-2 p-2">
                    {[
                      { type: 'approval', title: 'Receipt needs approval', time: '2m ago', unread: true },
                      { type: 'scan', title: 'Receipt scanned successfully', time: '15m ago', unread: true },
                      { type: 'budget', title: 'Budget alert: Office supplies 85% used', time: '1h ago', unread: false },
                      { type: 'report', title: 'Monthly report ready', time: 'Yesterday', unread: false },
                    ].map((notif, index) => (
                      <a
                        key={index}
                        href="#"
                        className={cn(
                          'flex items-start gap-3 p-3 rounded-xl transition-colors',
                          notif.unread ? 'bg-champagne/5' : 'hover:bg-sidebar-hover'
                        )}
                      >
                        <div className={cn(
                          'h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0',
                          notif.type === 'approval' && 'bg-warning-soft text-warning',
                          notif.type === 'scan' && 'bg-success-soft text-success',
                          notif.type === 'budget' && 'bg-danger-soft text-danger',
                          notif.type === 'report' && 'bg-info-soft text-info'
                        )}>
                          {notif.type === 'approval' && <ClipboardCheck className="h-4 w-4" />}
                          {notif.type === 'scan' && <CheckCircle2 className="h-4 w-4" />}
                          {notif.type === 'budget' && <AlertTriangle className="h-4 w-4" />}
                          {notif.type === 'report' && <FileDown className="h-4 w-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-text-primary">{notif.title}</p>
                          <p className="text-xs text-text-muted">{notif.time}</p>
                        </div>
                        {notif.unread && <span className="h-2 w-2 rounded-full bg-champagne flex-shrink-0 mt-2" />}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <Sun className="h-5 w-5 dark:hidden" aria-hidden="true" />
            <Moon className="h-5 w-5 hidden dark:block" aria-hidden="true" />
          </Button>

          {/* User Menu */}
          <div ref={userMenuRef} className="relative">
            <Button
              variant="ghost"
              className="flex items-center gap-2 px-2 py-1.5 rounded-xl"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              aria-expanded={userMenuOpen}
              aria-haspopup="true"
            >
              <div className="h-8 w-8 rounded-full bg-champagne/15 flex items-center justify-center">
                <UserCog className="h-4 w-4 text-champagne" aria-hidden="true" />
              </div>
              <span className="hidden sm:block text-sm font-medium text-text-primary">Current User</span>
              <ChevronDown className="h-4 w-4 text-text-muted" aria-hidden="true" />
            </Button>

            {userMenuOpen && (
              <div
                ref={userMenuRef}
                className="absolute right-0 mt-2 w-56 bg-surface-raised rounded-xl border border-glass-border shadow-lg p-2 animate-in slide-in-from-top-2 duration-150"
                role="menu"
                aria-label="Account"
              >
                <a
                  href="/settings/org"
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-text-primary hover:bg-surface-hover transition-colors"
                >
                  <Building2 className="h-5 w-5 text-text-muted" aria-hidden="true" />
                  Organization
                </a>
                <a
                  href="/settings/billing"
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-text-primary hover:bg-surface-hover transition-colors"
                >
                  <CreditCard className="h-5 w-5 text-text-muted" aria-hidden="true" />
                  <span className="flex items-center gap-1">
                    Billing
                    <Badge variant="warning" size="sm">Pro</Badge>
                  </span>
                </a>
                <a
                  href="/settings/team"
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-text-primary hover:bg-surface-hover transition-colors"
                >
                  <Users className="h-5 w-5 text-text-muted" aria-hidden="true" />
                  Team
                </a>
                <a
                  href="/settings/security"
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-text-primary hover:bg-surface-hover transition-colors"
                >
                  <Shield className="h-5 w-5 text-text-muted" aria-hidden="true" />
                  Security
                </a>
                <a
                  href="/settings/features"
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-text-primary hover:bg-surface-hover transition-colors"
                >
                  <Settings className="h-5 w-5 text-text-muted" aria-hidden="true" />
                  Features
                </a>
                <hr className="border-glass-border my-2" />
                <button
                  className="flex w-full items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-danger hover:bg-danger/10 transition-colors"
                >
                  <LogOut className="h-5 w-5" aria-hidden="true" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Command Palette */}
      {commandOpen && (
        <div
          className="fixed inset-0 z-50 bg-obsidian/50 backdrop-blur-sm flex items-start justify-center pt-16 lg:pt-24"
          onClick={() => setCommandOpen(false)}
          role="dialog"
          aria-label="Command Palette"
        >
          <div
            className="bg-surface-raised rounded-2xl border border-glass-border shadow-2xl w-full max-w-2xl mx-4 max-h-[70vh] flex flex-col animate-in slide-in-from-top-4 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative mb-6 p-4 border-b border-glass-border">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted" aria-hidden="true" />
              <Input
                ref={searchRef}
                type="search"
                placeholder="Type a command or search..."
                className="h-12 pl-12 text-lg bg-sidebar-surface border-sidebar-border focus:border-champagne"
                autoFocus
              />
              <kbd className="absolute right-4 top-1/2 -translate-y-1/2 hidden items-center gap-1 text-sm font-medium text-text-muted sm:flex">
                <span>{isMac ? '⌘' : 'Ctrl'}</span>
                <span>+</span>
                <span>K</span>
              </kbd>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 px-4 pb-4">
              <section>
                <h3 className="px-4 text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">Suggested</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 px-4">
                  {[
                    { label: 'Scan new receipt', href: '/scan', icon: Camera, shortcut: '⌘N' },
                    { label: 'View history', href: '/history', icon: ReceiptText, shortcut: '⌘H' },
                    { label: 'Create report', href: '/cra-reports', icon: FileDown, shortcut: '⌘R' },
                    { label: 'Reconcile bank', href: '/reconcile', icon: Route, shortcut: '⌘B' },
                  ].map(item => (
                    <a
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-3 p-4 rounded-xl bg-sidebar-surface border border-sidebar-border hover:border-champagne/30 hover:bg-sidebar-hover transition-colors"
                      onClick={() => setCommandOpen(false)}
                    >
                      <span className="h-10 w-10 rounded-lg bg-champagne/15 flex items-center justify-center text-champagne" aria-hidden="true">
                        <item.icon className="h-5 w-5" />
                      </span>
                      <div className="flex-1">
                        <p className="font-medium text-text-primary">{item.label}</p>
                        <p className="text-xs text-text-muted">{item.shortcut}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="px-4 text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">Quick Actions</h3>
                <div className="space-y-2 px-4">
                  {[
                    { label: 'Switch organization', href: '/settings/org', icon: Building2 },
                    { label: 'Manage team', href: '/settings/team', icon: Users },
                    { label: 'API keys', href: '/settings/api', icon: Key },
                    { label: 'Keyboard shortcuts', href: '/shortcuts', icon: HelpCircle },
                  ].map(item => (
                    <a
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-sidebar-hover transition-colors"
                      onClick={() => setCommandOpen(false)}
                    >
                      <span className="h-8 w-8 rounded-lg bg-sidebar-surface flex items-center justify-center text-text-muted" aria-hidden="true">
                        <item.icon className="h-4 w-4" />
                      </span>
                      <span className="font-medium text-text-primary">{item.label}</span>
                    </a>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Dropdown */}
      {notificationsOpen && (
        <div
          className="fixed inset-0 z-50 bg-obsidian/50 backdrop-blur-sm"
          onClick={() => setNotificationsOpen(false)}
          aria-hidden="true"
        >
          <div
            ref={notificationsRef}
            className="fixed right-4 top-20 w-80 bg-surface-raised rounded-xl border border-glass-border shadow-lg animate-in slide-in-from-top-2 duration-150"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Notifications"
          >
            <div className="space-y-2 p-2">
              {[
                { type: 'approval', title: 'Receipt needs approval', time: '2m ago', unread: true },
                { type: 'scan', title: 'Receipt scanned successfully', time: '15m ago', unread: true },
                { type: 'budget', title: 'Budget alert: Office supplies 85% used', time: '1h ago', unread: false },
                { type: 'report', title: 'Monthly report ready', time: 'Yesterday', unread: false },
              ].map((notif, index) => (
                <a
                  key={index}
                  href="#"
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-xl transition-colors',
                    notif.unread ? 'bg-champagne/5' : 'hover:bg-sidebar-hover'
                  )}
                >
                  <div className={cn(
                    'h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0',
                    notif.type === 'approval' && 'bg-warning-soft text-warning',
                    notif.type === 'scan' && 'bg-success-soft text-success',
                    notif.type === 'budget' && 'bg-danger-soft text-danger',
                    notif.type === 'report' && 'bg-info-soft text-info'
                  )}>
                    {notif.type === 'approval' && <ClipboardCheck className="h-4 w-4" />}
                    {notif.type === 'scan' && <CheckCircle2 className="h-4 w-4" />}
                    {notif.type === 'budget' && <AlertTriangle className="h-4 w-4" />}
                    {notif.type === 'report' && <FileDown className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text-primary">{notif.title}</p>
                    <p className="text-xs text-text-muted">{notif.time}</p>
                  </div>
                  {notif.unread && <span className="h-2 w-2 rounded-full bg-champagne flex-shrink-0 mt-2" />}
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default TopBar;