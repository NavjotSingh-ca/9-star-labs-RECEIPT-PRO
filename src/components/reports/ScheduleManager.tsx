'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Clock, Bell, Trash2, Power, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useOrgSchedules, useCreateSchedule, useUpdateSchedule, useDeleteSchedule } from '@/hooks/useReports';

interface Props {
  /** Organization ID for scoping schedules */
  orgId: string;
}

export function ScheduleManager({ orgId }: Props) {
  const { data, isLoading } = useOrgSchedules(orgId);
  const updateMutation = useUpdateSchedule();
  const deleteMutation = useDeleteSchedule();
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const schedules = data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Scheduled Reports</h3>
          <p className="text-xs text-text-muted mt-0.5">
            Set up recurring report delivery via email
          </p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)} className="gap-1.5">
          <Plus className="h-4 w-4" />
          New Schedule
        </Button>
      </div>

      <AnimatePresence mode="popLayout">
        {!isLoading && schedules.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 text-text-muted"
          >
            <Clock className="mx-auto h-10 w-10 mb-3 opacity-40" />
            <p className="text-sm font-medium">No scheduled reports</p>
            <p className="text-xs mt-1">Create a schedule to receive reports automatically.</p>
          </motion.div>
        ) : (
          <div className="space-y-2">
            {schedules.map((schedule) => (
              <motion.div
                key={schedule.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-center justify-between p-3 rounded-lg border border-glass-border bg-card"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`h-2 w-2 rounded-full flex-shrink-0 ${schedule.is_active ? 'bg-emerald-success' : 'bg-text-muted'}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{schedule.report_name}</p>
                    <p className="text-[10px] text-text-muted">
                      {schedule.frequency} &middot; {schedule.format} &middot; {schedule.email_to}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Badge variant={schedule.is_active ? 'default' : 'secondary'} className="text-[9px] uppercase">
                    {schedule.is_active ? 'Active' : 'Paused'}
                  </Badge>
                  <button
                    onClick={() => updateMutation.mutate({ id: schedule.id, is_active: !schedule.is_active })}
                    className="p-1.5 rounded-md hover:bg-surface-hover text-text-muted hover:text-text-primary transition-colors"
                    title={schedule.is_active ? 'Pause schedule' : 'Activate schedule'}
                  >
                    <Power className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(schedule.id)}
                    className="p-1.5 rounded-md hover:bg-danger/10 text-text-muted hover:text-danger transition-colors"
                    title="Delete schedule"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      <CreateScheduleDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        orgId={orgId}
      />

      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Schedule</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this scheduled report. You can create a new schedule later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel render={<Button variant="outline" />} />
            <AlertDialogAction
              disabled={deleteMutation.isPending}
              render={<Button variant="destructive" />}
              onClick={() => {
                if (deleteTarget) {
                  deleteMutation.mutate(deleteTarget);
                  setDeleteTarget(null);
                }
              }}
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CreateScheduleDialog({ open, onClose, orgId }: { open: boolean; onClose: () => void; orgId: string }) {
  const [reportName, setReportName] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'quarterly'>('weekly');
  const [emailTo, setEmailTo] = useState('');
  const [format, setFormat] = useState<'pdf' | 'csv'>('pdf');
  const [timeOfDay, setTimeOfDay] = useState('08:00');
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const createMutation = useCreateSchedule();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportName || !emailTo) return;
    await createMutation.mutateAsync({
      orgId,
      report_name: reportName,
      frequency,
      email_to: emailTo,
      format,
      report_config: {},
      time_of_day: timeOfDay,
      day_of_week: frequency === 'weekly' ? dayOfWeek : undefined,
      day_of_month: frequency === 'monthly' || frequency === 'quarterly' ? dayOfMonth : undefined,
    });
    onClose();
    setReportName('');
    setFrequency('weekly');
    setEmailTo('');
    setFormat('pdf');
    setTimeOfDay('08:00');
    setDayOfWeek(1);
    setDayOfMonth(1);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Schedule</DialogTitle>
          <DialogDescription>Set up recurring report delivery.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="sched-name" className="block text-xs font-medium mb-1.5">Report Name</label>
            <Input id="sched-name" value={reportName} onChange={(e) => setReportName(e.target.value)} placeholder="Weekly GST Summary" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="sched-email" className="block text-xs font-medium mb-1.5">Recipient Email</label>
              <Input id="sched-email" value={emailTo} onChange={(e) => setEmailTo(e.target.value)} placeholder="admin@example.com" required />
            </div>
            <div>
              <label htmlFor="sched-format" className="block text-xs font-medium mb-1.5">Format</label>
              <select
                id="sched-format"
                value={format}
                onChange={(e) => setFormat(e.target.value as 'pdf' | 'csv')}
                className="w-full h-9 rounded-md border border-glass-border bg-card px-3 text-sm"
              >
                <option value="pdf">PDF</option>
                <option value="csv">CSV</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5">Frequency</label>
            <div className="flex gap-2">
              {(['daily', 'weekly', 'monthly', 'quarterly'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFrequency(f)}
                  className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
                    frequency === f
                      ? 'bg-champagne text-obsidian font-medium'
                      : 'bg-surface text-text-secondary hover:bg-surface-hover border border-glass-border'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="sched-time" className="block text-xs font-medium mb-1.5">Time of Day</label>
              <Input id="sched-time" type="time" value={timeOfDay} onChange={(e) => setTimeOfDay(e.target.value)} />
            </div>
            {frequency === 'weekly' && (
              <div>
                <label htmlFor="sched-dow" className="block text-xs font-medium mb-1.5">Day of Week</label>
                <select
                  id="sched-dow"
                  value={dayOfWeek}
                  onChange={(e) => setDayOfWeek(Number(e.target.value))}
                  className="w-full h-9 rounded-md border border-glass-border bg-card px-3 text-sm"
                >
                  <option value={0}>Sunday</option>
                  <option value={1}>Monday</option>
                  <option value={2}>Tuesday</option>
                  <option value={3}>Wednesday</option>
                  <option value={4}>Thursday</option>
                  <option value={5}>Friday</option>
                  <option value={6}>Saturday</option>
                </select>
              </div>
            )}
            {(frequency === 'monthly' || frequency === 'quarterly') && (
              <div>
                <label htmlFor="sched-dom" className="block text-xs font-medium mb-1.5">Day of Month</label>
                <Input id="sched-dom" type="number" min={1} max={28} value={dayOfMonth} onChange={(e) => setDayOfMonth(Number(e.target.value))} />
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button type="submit" size="sm" disabled={createMutation.isPending}>
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
              Create Schedule
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
