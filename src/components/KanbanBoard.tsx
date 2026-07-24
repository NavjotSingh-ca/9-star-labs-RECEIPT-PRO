'use client';

import { useState, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  Loader2,
  Play,
  Pause,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { getProjects, updateProjectStatus } from '@/lib/services/receipts';
import { supabase, getOrgIdString } from '@/lib/supabase';
import { formatCurrency } from '@/lib/ui-utils';
import { cn } from '@/lib/utils';
import { logError } from '@/lib/logger';
import type { Project, ProjectStatus } from '@/lib/types';

// ─── Column Configuration ───

interface ColumnConfig {
  id: ProjectStatus | 'completed' | 'cancelled';
  title: string;
  color: string;
  icon: React.ReactNode;
}

const COLUMNS: ColumnConfig[] = [
  {
    id: 'active',
    title: 'Active',
    color: 'border-l-champagne',
    icon: <Play className="h-3.5 w-3.5" />,
  },
  {
    id: 'on_hold',
    title: 'On Hold',
    color: 'border-l-warning',
    icon: <Pause className="h-3.5 w-3.5" />,
  },
  {
    id: 'completed',
    title: 'Completed',
    color: 'border-l-emerald-light',
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
  {
    id: 'cancelled',
    title: 'Cancelled',
    color: 'border-l-danger',
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
];

// ─── Project Card ───

interface KanbanCardProps {
  project: Project;
  actualSpend: number;
  budgetPercent: number;
  isOverBudget: boolean;
  isDragging?: boolean;
}

function KanbanCard({ project, actualSpend, budgetPercent, isOverBudget, isDragging }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortDragging,
  } = useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative rounded-xl border border-glass-border bg-card p-4 shadow-sm transition',
        isSortDragging && 'opacity-50 shadow-lg z-10',
        isDragging && 'shadow-xl rotate-2 scale-105',
        'hover:border-glass-border-hover hover:shadow-md'
      )}
      {...attributes}
    >
{/* Drag handle */}
      <button
        type="button"
        className="absolute -left-1 top-1/2 -translate-y-1/2 flex h-8 w-5 items-center justify-center rounded-r-md text-text-muted/30 hover:text-text-muted transition cursor-grab active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-champagne"
        {...listeners}
        aria-label="Drag to reorder"
        title="Drag to move between columns"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Budget indicator bar */}
      <div
        className={cn(
          'absolute left-0 top-0 bottom-0 w-1 rounded-l-xl',
          isOverBudget ? 'bg-danger' : budgetPercent > 80 ? 'bg-warning' : 'bg-champagne/40'
        )}
      />

      {/* Content */}
      <div className="pl-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-text-primary truncate">{project.name}</p>
            {project.code && (
              <span className="mt-0.5 inline-block rounded-full bg-champagne/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-champagne">
                {project.code}
              </span>
            )}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 text-xs">
          <span className="text-text-muted">Spent</span>
          <span className={cn('font-semibold tabular-nums', isOverBudget ? 'text-danger' : 'text-text-primary')}>
            {formatCurrency(actualSpend)}
          </span>
        </div>

        {project.budget_amount && project.budget_amount > 0 && (
          <>
            <div className="mt-1.5 h-1.5 w-full rounded-full bg-glass-border overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(budgetPercent, 100)}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className={cn(
                  'h-full rounded-full',
                  isOverBudget ? 'bg-danger' : budgetPercent > 80 ? 'bg-warning' : 'bg-champagne'
                )}
              />
            </div>
            <div className="mt-1 flex items-center justify-between text-[10px]">
              <span className="text-text-muted">
                {project.budget_amount ? formatCurrency(project.budget_amount) : '—'}
              </span>
              <span className={cn('font-semibold', isOverBudget ? 'text-danger' : 'text-champagne')}>
                {budgetPercent.toFixed(0)}%
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Column ───

interface KanbanColumnProps {
  column: ColumnConfig;
  projects: Project[];
  actualsMap: Map<string, number>;
  isDragTarget?: boolean;
}

function KanbanColumn({ column, projects, actualsMap, isDragTarget }: KanbanColumnProps) {
  const projectIds = useMemo(() => projects.map((p) => p.id), [projects]);

  return (
    <div className="flex flex-col gap-3 min-w-[280px] w-[320px] flex-shrink-0">
      {/* Column header */}
      <div className="flex items-center gap-2 px-1">
        <span className="text-text-muted/60">{column.icon}</span>
        <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-text-secondary">{column.title}</h3>
        <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-surface-raised px-1.5 text-[10px] font-bold text-text-muted">
          {projects.length}
        </span>
      </div>

      {/* Cards */}
      <SortableContext items={projectIds} strategy={verticalListSortingStrategy}>
<div
          className={cn(
            'flex flex-col gap-2 min-h-[120px] rounded-xl p-2 transition-colors',
            isDragTarget && column.id !== 'cancelled' && 'bg-champagne/10 border border-champagne/30 ring-1 ring-champagne/20',
            isDragTarget && column.id === 'cancelled' && 'bg-danger/5 border border-danger/30 ring-1 ring-danger/20'
          )}
        >
          <AnimatePresence mode="popLayout">
            {projects.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <p className={cn(
                  'text-xs text-text-muted/50',
                  isDragTarget && column.id !== 'cancelled' && 'text-champagne font-medium',
                  isDragTarget && column.id === 'cancelled' && 'text-danger'
                )}>
                  {isDragTarget && column.id !== 'cancelled' ? 'Drop to move here' : 'Drop projects here'}
                </p>
              </div>
            ) : (
              projects.map((project) => {
                const actualSpend = actualsMap.get(project.id) || 0;
                const budgetAmount = project.budget_amount || 0;
                const budgetPercent = budgetAmount > 0 ? (actualSpend / budgetAmount) * 100 : 0;
                const isOverBudget = budgetAmount > 0 && actualSpend > budgetAmount;

                return (
                  <motion.div
                    key={project.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <KanbanCard
                      project={project}
                      actualSpend={actualSpend}
                      budgetPercent={budgetPercent}
                      isOverBudget={isOverBudget}
                    />
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </SortableContext>
    </div>
  );
}

// ─── Main Component ───

/**
 * KanbanBoard — Drag-and-drop project status board using @dnd-kit.
 * Four columns: Active, On Hold, Completed, Cancelled.
 * Cards show spend vs budget with utilization bars. Drag between columns updates project status.
 * Cancelled projects are locked from further moves.
 */
export default function KanbanBoard() {
  const queryClient = useQueryClient();
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const dragContainerRef = useRef<HTMLDivElement>(null);

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
      return data as Array<{ project_id: string; total_spent: number }>;
    },
    staleTime: 5 * 60 * 1000,
  });

  const [draggedOverColumn, setDraggedOverColumn] = useState<string | null>(null);

  const actualsMap = useMemo(() => {
    const map = new Map<string, number>();
    (actuals || []).forEach((a: { project_id: string; total_spent: number }) => {
      map.set(a.project_id, Number(a.total_spent));
    });
    return map;
  }, [actuals]);

  const statusMutation = useMutation({
    mutationFn: async ({ projectId, status }: { projectId: string; status: ProjectStatus }) => {
      await updateProjectStatus(projectId, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (err: Error) => {
      logError(err, { action: 'kanban_status_update' });
      toast.error('Failed to update project status');
    },
  });

  // Group projects by status
  const grouped = useMemo(() => {
    const groups: Record<string, Project[]> = {
      active: [],
      on_hold: [],
      completed: [],
      cancelled: [],
    };

    projects.forEach((p) => {
      const status = p.status || 'active';
      if (groups[status]) {
        groups[status].push(p);
      } else {
        groups.active.push(p);
      }
    });

    return groups;
  }, [projects]);

  // Find which column a project belongs to
  const findColumn = useCallback(
    (id: string): string | null => {
      for (const [status, items] of Object.entries(grouped)) {
        if (items.some((p) => p.id === id)) return status;
      }
      return null;
    },
    [grouped]
  );

  // Drag state
  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeDragId) || null,
    [projects, activeDragId]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const overId = event.over?.id;
    if (overId && COLUMNS.some((c) => c.id === overId)) {
      setDraggedOverColumn(String(overId));
    } else if (!overId) {
      setDraggedOverColumn(null);
    }
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDragId(null);
      setDraggedOverColumn(null);

      const { active, over } = event;
      if (!over || !active) return;

      const activeId = String(active.id);
      const overId = String(over.id);

      // Find source and destination columns
      const sourceColumn = findColumn(activeId);
      const destColumn = findColumn(overId);

      if (!sourceColumn || !destColumn) return;
      if (sourceColumn === destColumn) return; // Same column, no status change needed

      // Update project status to match destination column
      // overId could be either a project ID or a column ID
      let targetStatus: ProjectStatus;
      if (COLUMNS.some((c) => c.id === overId)) {
        targetStatus = overId as ProjectStatus;
      } else if (destColumn) {
        targetStatus = destColumn as ProjectStatus;
      } else {
        return;
      }

      // Don't allow dragging to/from cancelled
      if (targetStatus === 'cancelled' || sourceColumn === 'cancelled') {
        toast.error('Cancelled projects cannot be moved. Create a new project instead.');
        return;
      }

      statusMutation.mutate({ projectId: activeId, status: targetStatus });
    },
    [findColumn, statusMutation]
  );

  const isLoading_ = isLoading || isLoadingActuals;

  if (isLoading_) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-champagne" />
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-sm text-text-muted">No projects yet. Create one above to get started.</p>
      </div>
    );
  }

  return (
    <div ref={dragContainerRef} className="overflow-x-auto pb-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 min-w-max">
          {COLUMNS.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              projects={grouped[column.id] || []}
              actualsMap={actualsMap}
              isDragTarget={draggedOverColumn === column.id}
            />
          ))}
        </div>

        <DragOverlay>
          {activeProject && (
            <div className="rotate-3 scale-105 opacity-90">
              <KanbanCard
                project={activeProject}
                actualSpend={actualsMap.get(activeProject.id) || 0}
                budgetPercent={
                  (activeProject.budget_amount || 0) > 0
                    ? ((actualsMap.get(activeProject.id) || 0) / (activeProject.budget_amount || 1)) * 100
                    : 0
                }
                isOverBudget={
                  (activeProject.budget_amount || 0) > 0 &&
                  (actualsMap.get(activeProject.id) || 0) > (activeProject.budget_amount || 0)
                }
                isDragging
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
