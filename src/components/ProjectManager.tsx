'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Loader2, Plus, Trash2, Briefcase, X, Columns3, List } from 'lucide-react';

import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getProjects, createProject, deleteProject } from '@/lib/services/receipts';
import { supabase, getOrgIdString } from '@/lib/supabase';
import type { Project } from '@/lib/types';
import { formatCurrency } from '@/lib/ui-utils';
import { cn } from '@/lib/utils';
import KanbanBoard from '@/components/KanbanBoard';

export default function ProjectManager() {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [budget, setBudget] = useState('');
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const trapRef = useFocusTrap(!!deleteConfirm);

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
    staleTime: 5 * 60 * 1000,
  });

  const { data: actuals = [], isLoading: isLoadingActuals } = useQuery({
    queryKey: ['project_actuals'],
    queryFn: async () => {
      const orgId = await getOrgIdString();
      if (!orgId) return [];
      const { data, error } = await supabase.rpc('get_project_actuals', { p_org_id: orgId });
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: () => createProject(name.trim(), code.trim() || undefined, parseFloat(budget) || undefined),
    onSuccess: () => {
      setName('');
      setCode('');
      setBudget('');
      setError('');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (err: Error) => setError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProject(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  });

  const handleCreate = () => {
    if (!name.trim()) { setError('Project name is required.'); return; }
    if (name.trim().length < 2) { setError('Project name must be at least 2 characters.'); return; }
    if (name.trim().length > 100) { setError('Project name must be less than 100 characters.'); return; }
    if (code && code.length > 10) { setError('Code must be less than 10 characters.'); return; }
    if (budget && (parseFloat(budget) < 0 || isNaN(parseFloat(budget)))) { setError('Budget must be a positive number.'); return; }
    createMutation.mutate();
  };

  return (
    <section className="space-y-6" role="region" aria-label="Project management">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-champagne">Jobs & Sites</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-text-primary">Project Portfolio</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Track project-wise spend against allocated budgets for jobs and sites.
          </p>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 rounded-lg border border-glass-border bg-surface p-0.5">
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
              viewMode === 'list'
                ? 'bg-champagne/10 text-champagne shadow-sm'
                : 'text-text-muted hover:text-text-secondary'
            }`}
            aria-label="List view"
            title="List view"
          >
            <List className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">List</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('kanban')}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
              viewMode === 'kanban'
                ? 'bg-champagne/10 text-champagne shadow-sm'
                : 'text-text-muted hover:text-text-secondary'
            }`}
            aria-label="Kanban board view"
            title="Kanban board view"
          >
            <Columns3 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Board</span>
          </button>
        </div>
      </div>

      {/* Create form */}
      <div className="rounded-3xl border border-glass-border bg-surface p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Briefcase className="h-4 w-4 text-champagne" />
          <p className="text-sm font-bold text-text-primary">Add New Project</p>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); handleCreate(); }} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-4 items-end">
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-1.5 ml-1">Project Name</label>
              <input
                type="text"
                placeholder="e.g. Westview Commercial Build"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                minLength={2}
                required
                className="w-full rounded-[2rem] border border-glass-border bg-surface-raised px-4 py-3 text-sm text-text-primary outline-none focus:border-champagne/40"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-1.5 ml-1">Code</label>
              <input
                type="text"
                placeholder="WCB-01"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={10}
                className="w-full rounded-[2rem] border border-glass-border bg-surface-raised px-4 py-3 text-sm text-text-primary outline-none focus:border-champagne/40"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-1.5 ml-1">Budget ($)</label>
              <input
                type="number"
                placeholder="0.00"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                min="0"
                step="0.01"
                className="w-full rounded-[2rem] border border-glass-border bg-surface-raised px-4 py-3 text-sm text-text-primary outline-none focus:border-champagne/40"
              />
            </div>
          </div>
          <div className="flex justify-end border-t border-glass-border pt-4">
            <button
              type="submit"
              disabled={createMutation.isPending || !name.trim()}
              className="flex items-center gap-2 rounded-[2rem] bg-champagne px-8 py-3 text-sm font-bold text-obsidian transition hover:bg-champagne-dim disabled:opacity-50 shadow-lg shadow-champagne/10"
            >
              {createMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Initialize Project
            </button>
          </div>
        </form>
        {error && <p className="mt-2 text-xs text-danger" role="alert">{error}</p>}
      </div>

      {/* Kanban view */}
      {viewMode === 'kanban' && (
        <KanbanBoard />
      )}

      {/* List view */}
      {viewMode === 'list' && (
        <div className="grid gap-4" aria-live="polite">
          {isLoading || isLoadingActuals ? (
            <div className="flex justify-center py-12" role="status" aria-label="Loading projects">
              <Loader2 className="h-8 w-8 animate-spin text-champagne" />
            </div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-glass-border bg-surface/30 py-16 text-center" aria-live="polite">
              <AlertCircle className="h-10 w-10 text-text-muted opacity-30" />
              <p className="text-sm text-text-muted">No active projects. Initialize your first job site above.</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {projects.map((p: Project) => {
                const actual = actuals.find((a: { project_id: string; total_spent: number }) => a.project_id === p.id);
                const spend = actual ? Number(actual.total_spent) : 0;
                const projectBudget = p.budget_amount || 0;
                const percent = projectBudget > 0 ? Math.min((spend / projectBudget) * 100, 100) : 0;
                const isOver = projectBudget > 0 && spend > projectBudget;

                return (
                  <motion.div
                    key={p.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="group rounded-3xl border border-glass-border bg-surface p-5 hover:bg-surface-raised transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-lg font-bold text-text-primary">{p.name}</p>
                          {p.code && (
                            <span className="rounded-[2rem] bg-champagne/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-champagne">
                              {p.code}
                            </span>
                          )}
                          <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                            p.status === 'active' ? 'bg-emerald-success/10 text-emerald-light' :
                            p.status === 'on_hold' ? 'bg-warning/10 text-warning' :
                            p.status === 'completed' ? 'bg-info/10 text-info' :
                            'bg-danger/10 text-danger'
                          }`}>
                            {p.status?.replace('_', ' ') || 'active'}
                          </span>
                        </div>
                        
                        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-6">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1">Spent</p>
                            <p className={cn("text-sm font-bold", isOver ? "text-danger" : "text-text-primary")}>
                              {formatCurrency(spend)}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1">Budget</p>
                            <p className="text-sm font-bold text-text-secondary">
                              {projectBudget > 0 ? formatCurrency(projectBudget) : '—'}
                            </p>
                          </div>
                          {projectBudget > 0 && (
                            <div className="col-span-2">
                              <div className="flex justify-between items-center mb-1.5">
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Utilization</p>
                                <p className={cn("text-[10px] font-black", isOver ? "text-danger" : "text-champagne")}>
                                  {percent.toFixed(1)}%
                                </p>
                              </div>
                              <div className="h-1.5 w-full rounded-full bg-glass-border overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${percent}%` }}
                                  className={cn("h-full rounded-full transition-all", isOver ? "bg-danger" : "bg-champagne")}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setDeleteConfirm({ id: p.id, name: p.name })}
                        disabled={deleteMutation.isPending}
                        className="rounded-[2rem] p-2.5 text-text-muted transition hover:bg-danger/10 hover:text-danger disabled:opacity-50"
                        aria-label="Delete project"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 focus-visible:outline-2 focus-visible:outline-champagne/40"
            onClick={() => setDeleteConfirm(null)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDeleteConfirm(null); } }}
            tabIndex={0}
            role="button"
            aria-label="Close dialog"
          >
            <motion.div
              ref={trapRef}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-3xl border border-danger/20 bg-surface p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-danger/10 text-danger">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-text-primary">Delete Project?</h3>
                  <p className="mt-2 text-sm text-text-secondary">
                    Are you sure you want to delete <strong className="text-text-primary">{deleteConfirm.name}</strong>? This action cannot be undone.
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Close dialog"
                  onClick={() => setDeleteConfirm(null)}
                  className="text-text-muted hover:text-text-primary"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(null)}
                  className="rounded-[2rem] border border-glass-border bg-surface-raised px-4 py-2 text-sm font-semibold text-text-secondary transition hover:bg-surface"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    deleteMutation.mutate(deleteConfirm.id);
                    setDeleteConfirm(null);
                  }}
                  disabled={deleteMutation.isPending}
                  className="rounded-[2rem] bg-danger px-4 py-2 text-sm font-bold text-white transition hover:bg-danger/80 disabled:opacity-50"
                >
                  {deleteMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
