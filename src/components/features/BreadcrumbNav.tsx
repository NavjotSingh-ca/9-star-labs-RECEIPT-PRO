'use client';

import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbNavProps {
  items: BreadcrumbItem[];
}

/**
 * BreadcrumbNav - Accessible breadcrumb navigation
 * Improves UX and SEO for complex app flows
 */
export default function BreadcrumbNav({ items }: BreadcrumbNavProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs">
      <Link
        href="/"
        className="flex items-center gap-1 text-text-muted hover:text-text-primary transition"
        aria-label="Home"
      >
        <Home className="h-3 w-3" aria-hidden="true" />
      </Link>
      {items.map((item, i) => (
        <React.Fragment key={i}>
          <ChevronRight className="h-3 w-3 text-text-muted" aria-hidden="true" />
          {item.href ? (
            <Link
              href={item.href}
              className="text-text-secondary hover:text-text-primary transition"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-text-primary font-medium" aria-current="page">
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}