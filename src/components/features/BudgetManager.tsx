'use client';

import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/animations';
import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  Loader2,
  Plus,
  X,
  Edit3,
  Trash2,
  BarChart3,
} from 'lucide-react';
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';
import PageHeader from '@/components/layout/PageHeader';
import { supabase, getOrgIdString } from '@/lib/supabase';
import { formatCurrency } from '@/lib/ui-utils';
import { cn } from '@/lib/utils';

interface BudgetEntry {
  category: string;
  budget: number;
}

const SUGGESTED_CATEGORIES = [
  'Supplies',
  'Travel',
  'Meals',
  'Software',
  'Office',
  'Transportation',
  'Entertainment',
  'Other',
];

const STORAGE_KEY = 'receipt-budgets';

function loadBudgets(): BudgetEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e: unknown): e is BudgetEntry =>
        typeof e === 'object' && e !== null && typeof (e as BudgetEntry).category === 'string' && typeof (e as BudgetEntry).budget === 'number'
    );
  } catch {
    return [];
  }
}

function saveBudgets(budgets: BudgetEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(budgets));
}

async function fetchCategorySpend(orgId: string, budgets: BudgetEntry[]): Promise<Map<string, number>> {
  if (budgets.length === 0) return new Map();
  const cats = budgets.map((b) => b.category);
  const { data, error } = await supabase
    .from('receipts')
    .select('category, total_amount')
    .eq('org_id', orgId)
    .eq('is_deleted', false)
    .in('category', cats);
  if (error) throw new Error('Failed to load spend data');
  const map = new Map<string, number>();
  for (const cat of cats) map.set(cat, 0);
  for (const row of data || []) {
    if (row.category && map.has(row.category)) {
      map.set(row.category, map.get(row.category)! + (row.total_amount || 0));
    }
  }
  return map;
}

export default function BudgetManager() {
  const [budgets, setBudgets] = useState<BudgetEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [formCategory, setFormCategory] = useState('');
  const [formBudget, setFormBudget] = useState('');
  const [customCategory, setCustomCategory] = useState('');

  useEffect(() => {
    setBudgets(loadBudgets());
  }, []);

  const { data: orgId } = useQuery({
    queryKey: ['budget-manager-org'],
    queryFn: async () => {
      const id = await getOrgIdString();
      if (!id) throw new Error('No organization found');
      return id;
    },
    staleTime: Infinity,
  });

  const { data: spendMap = new Map(), isLoading, error } = useQuery({
    queryKey: ['budget-manager-spend', orgId, budgets],
    queryFn: () => fetchCategorySpend(orgId!, budgets),
    enabled: !!orgId,
    staleTime: 60 * 1000,
  });

  const persist = useCallback((next: BudgetEntry[]) => {
    setBudgets(next);
    saveBudgets(next);
  }, []);

  const openAddForm = () => {
    setEditIndex(null);
    setFormCategory('');
    setFormBudget('');
    setCustomCategory('');
    setShowForm(true);
  };

  const openEditForm = (i: number) => {
    setEditIndex(i);
    setFormCategory(budgets[i].category);
    setFormBudget(String(budgets[i].budget));
    setCustomCategory('');
    setShowForm(true);
  };

  const usedCategories = new Set(budgets.map((b) => b.category));
  const availableSuggestions = SUGGESTED_CATEGORIES.filter((c) => !usedCategories.has(c));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cat = formCategory === '__custom__' ? customCategory.trim() : formCategory;
    const amt = parseFloat(formBudget);
    if (!cat || isNaN(amt) || amt <= 0) return;
    const next = [...budgets];
    if (editIndex !== null) {
      next[editIndex] = { category: cat, budget: amt };
    } else {
      next.push({ category: cat, budget: amt });
    }
    persist(next);
    setShowForm(false);
  };

  const handleDelete = (i: number) => {
    const next = budgets.filter((_, idx) => idx !== i);
    persist(next);
  };

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="show"
      className="space-y-5"
    >
      <PageHeader
        title="Budget Manager"
        subtitle="Set and track spending limits per category"
        action={
          <button
            type="button"
            onClick={openAddForm}
            className="inline-flex items-center gap-1.5 rounded-xl bg-champagne px-3.5 py-2 text-xs font-semibold text-black transition-colors hover:bg-champagne-dim"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Budget
          </button>
        }
      />

      {error && (
        <div className="rounded-[2rem] bg-danger/10 p-4 text-sm text-danger">
          <AlertCircle className="inline h-4 w-4 mr-2" />
          {error.message}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-glass-border bg-card p-4 space-y-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold tracking-tight">
              {editIndex !== null ? 'Edit Budget' : 'New Budget'}
            </h3>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-text-muted hover:text-text-primary cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-text-muted">Category</label>
            <select
              value={formCategory}
              onChange={(e) => setFormCategory(e.target.value)}
              className="w-full rounded-xl border border-glass-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-champagne"
            >
              <option value="">Select a category…</option>
              {availableSuggestions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
              {editIndex !== null && !availableSuggestions.includes(formCategory) && formCategory && (
                <option value={formCategory}>{formCategory}</option>
              )}
              <option value="__custom__">Custom…</option>
            </select>
            {formCategory === '__custom__' && (
              <input
                type="text"
                placeholder="Enter category name"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className="mt-2 w-full rounded-xl border border-glass-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-champagne"
              />
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-text-muted">Monthly Budget ($)</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              value={formBudget}
              onChange={(e) => setFormBudget(e.target.value)}
              className="w-full rounded-xl border border-glass-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-champagne"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-xl border border-glass-border bg-surface px-4 py-2 text-xs font-semibold text-text-secondary transition-colors hover:bg-surface-hover"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!formCategory || !formBudget}
              className="rounded-xl bg-champagne px-4 py-2 text-xs font-semibold text-black transition-colors hover:bg-champagne-dim disabled:opacity-40"
            >
              {editIndex !== null ? 'Save' : 'Add'}
            </button>
          </div>
        </form>
      )}

      {isLoading && (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-champagne" />
        </div>
      )}

      {!isLoading && !error && budgets.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-glass-border bg-surface/30 py-16 text-center">
          <BarChart3 className="h-10 w-10 text-text-muted/50" />
          <p className="text-sm text-text-muted">
            No budgets set. Add budgets to track spending limits.
          </p>
        </div>
      )}

      {!isLoading && budgets.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {budgets.map((entry, i) => {
            const spent = spendMap.get(entry.category) ?? 0;
            const pct = entry.budget > 0 ? Math.min((spent / entry.budget) * 100, 100) : 0;
            const overBudget = spent > entry.budget;
            const remaining = entry.budget - spent;

            const ringData = [{ name: entry.category, value: Math.round(pct), fill: overBudget ? 'var(--danger)' : 'var(--champagne)' }];

            return (
              <div
                key={entry.category}
                className={cn(
                  'relative rounded-2xl border bg-card p-4 shadow-sm transition-all hover:shadow-md',
                  overBudget ? 'border-danger/30' : 'border-glass-border'
                )}
              >
                {overBudget && (
                  <div className="absolute -top-1.5 -right-1.5 rounded-full bg-danger px-2 py-0.5 text-[10px] font-bold text-white">
                    OVER
                  </div>
                )}

                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-bold text-text-primary">{entry.category}</p>
                    <p className="text-xs text-text-muted mt-0.5">
                      {formatCurrency(spent)} / {formatCurrency(entry.budget)}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => openEditForm(i)}
                      className="rounded-lg p-1.5 text-text-muted hover:bg-surface-hover hover:text-text-primary"
                      title="Edit budget"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(i)}
                      className="rounded-lg p-1.5 text-text-muted hover:bg-danger/10 hover:text-danger"
                      title="Delete budget"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-16 w-16 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart
                        cx="50%"
                        cy="50%"
                        innerRadius="70%"
                        outerRadius="100%"
                        barSize={8}
                        data={ringData}
                        startAngle={90}
                        endAngle={-270}
                      >
                        <RadialBar
                          dataKey="value"
                          cornerRadius={4}
                          background={{ fill: 'var(--glass-border)' }}
                        />
                      </RadialBarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-hover">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-300',
                          overBudget ? 'bg-danger' : 'bg-champagne'
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p
                      className={cn(
                        'mt-1 text-xs font-semibold tabular-nums',
                        overBudget ? 'text-danger' : 'text-text-secondary'
                      )}
                    >
                      {overBudget
                        ? `${formatCurrency(Math.abs(remaining))} over`
                        : `${formatCurrency(remaining)} remaining`}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
