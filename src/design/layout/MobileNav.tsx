/**
 * MobileNav — Fixed bottom navigation for mobile.
 */

'use client';

import { type ReactNode } from 'react';
import { cn } from '../utils/helpers';
import { Button } from '../primitives/Button';
import { Badge } from '../primitives/Badge';
import {
  LayoutDashboard,
  Camera,
  ReceiptText,
  Settings,
} from 'lucide-react';
import { usePathname } from 'next/navigation';

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
  badge?: number;
  open?: boolean;
}

const navItems: NavItem[] = [
  { label: 'Home', href: '/', icon: <LayoutDashboard className="h-6 w-6" /> },
  { label: 'Records', href: '/history', icon: <ReceiptText className="h-6 w-6" /> },
  { label: 'Scan', href: '/scan', icon: <Camera className="h-6 w-6" />, badge: 0 },
  { label: 'More', href: '/settings', icon: <Settings className="h-6 w-6" /> },
];

export interface MobileNavProps {
  open?: boolean;
  onClose?: () => void;
  currentPath?: string;
  className?: string;
  children?: ReactNode;
}

export function MobileNav({
  open: _open = true,
  onClose,
  currentPath,
  className,
  children,
}: MobileNavProps) {
  const pathname = usePathname() || currentPath || '/';

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'bg-sidebar-bg/95 backdrop-blur-xl border-t border-sidebar-border',
        'flex items-center justify-around',
        'h-16 safe-area-inset-bottom:pb-safe',
        'transition-transform duration-300',
        className
      )}
      aria-label="Mobile bottom navigation"
    >
      {navItems.map((item, index) => {
        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
        const isCenter = index === 2; // Scan button

        if (isCenter) {
          return (
            <Button
              key={item.href}
              variant="primary"
              size="icon"
              className={cn(
                'h-14 w-14 rounded-full shadow-lg shadow-champagne/30',
                '-mt-6',
                'relative z-10',
                item.badge && item.badge > 0 && 'animate-pulse'
              )}
              onClick={onClose}
              aria-label={item.label}
            >
              {item.icon}
              {item.badge && item.badge > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-danger text-white text-[10px] font-bold flex items-center justify-center">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </Button>
          );
        }

        return (
          <a
            key={item.href}
            href={item.href}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl',
              'text-[10px] font-medium transition-all duration-200',
              isActive
                ? 'bg-champagne/10 text-champagne'
                : 'text-sidebar-text-muted hover:bg-sidebar-hover hover:text-sidebar-text'
            )}
            onClick={onClose}
          >
            <span className="relative" aria-hidden="true">{item.icon}</span>
            <span>{item.label}</span>
            {item.badge && item.badge > 0 && (
              <Badge variant="danger" size="sm" className="absolute -top-1 -right-1 h-5 w-5 p-0">
                {item.badge > 9 ? '9+' : item.badge}
              </Badge>
            )}
          </a>
        );
      })}

      {children}
    </nav>
  );
}

export default MobileNav;