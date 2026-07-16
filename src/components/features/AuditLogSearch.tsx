'use client';

import React, { useState } from 'react';
import { Search, Filter, Calendar, User } from 'lucide-react';

interface AuditLogSearchProps {
  onSearch: (filters: { query: string; dateFrom?: string; dateTo?: string; user?: string }) => void;
}

/**
 * AuditLogSearch - Advanced search for audit logs
 * Filter by date, user, action type
 */
export default function AuditLogSearch({ onSearch }: AuditLogSearchProps) {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [user, setUser] = useState('');

  const handleSearch = () => {
    onSearch({ query, dateFrom, dateTo, user });
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" aria-hidden="true" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Search audit logs..."
            className="w-full rounded-xl border border-glass-border bg-surface pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-champagne/40"
            aria-label="Search audit logs"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowFilters(s => !s)}
          className="rounded-xl border border-glass-border bg-surface px-3 py-2.5 text-sm font-medium text-text-secondary transition hover:bg-surface-hover focus:outline-none focus:ring-2 focus:ring-champagne/40"
          aria-label="Toggle filters"
        >
          <Filter className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {showFilters && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 rounded-xl border border-glass-border bg-surface p-4">
          <div>
            <label className="text-xs text-text-muted" htmlFor="date-from">
              Date From
            </label>
            <div className="relative mt-1">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-text-muted" aria-hidden="true" />
              <input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="w-full rounded-lg border border-glass-border bg-card pl-8 pr-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-champagne/40"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-text-muted" htmlFor="date-to">
              Date To
            </label>
            <div className="relative mt-1">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-text-muted" aria-hidden="true" />
              <input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="w-full rounded-lg border border-glass-border bg-card pl-8 pr-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-champagne/40"
              />
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="text-xs text-text-muted" htmlFor="user-filter">
              User Email
            </label>
            <div className="relative mt-1">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-text-muted" aria-hidden="true" />
              <input
                id="user-filter"
                type="email"
                value={user}
                onChange={e => setUser(e.target.value)}
                placeholder="user@company.com"
                className="w-full rounded-lg border border-glass-border bg-card pl-8 pr-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-champagne/40"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}