'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeUp } from '@/lib/animations';
import { AlertCircle, Plus, Car, Trash2, MapPin, Calendar, Gauge, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v4';
import { formatCurrency } from '@/lib/ui-utils';
import { Skeleton } from '@/components/ui/skeleton';
import PageHeader from '@/components/layout/PageHeader';
import {
  getVehicles, createVehicle, deleteVehicle,
  getMileageLogs, createMileageLog, deleteMileageLog,
  calculateCRAMileage, getYearToDateKm,
} from '@/lib/services/mileage';
import { supabase } from '@/lib/supabase';

const vehicleSchema = z.object({
  nickname: z.string().min(1, 'Nickname is required').max(60),
  plate: z.string().max(20).optional(),
  make: z.string().max(40).optional(),
  model: z.string().max(40).optional(),
  year: z.string().regex(/^\d{0,4}$/).optional(),
});

const tripSchema = z.object({
  tripDate: z.string().min(1, 'Date is required'),
  purpose: z.string().min(1, 'Purpose is required').max(200),
  startLocation: z.string().max(200).optional(),
  endLocation: z.string().max(200).optional(),
  distanceKm: z.string().min(1, 'Distance is required').refine(v => parseFloat(v) > 0, 'Distance must be greater than 0'),
  vehicleId: z.string().optional(),
  notes: z.string().max(500).optional(),
});

type VehicleForm = z.infer<typeof vehicleSchema>;
type TripForm = z.infer<typeof tripSchema>;

/**
 * MileageTracker — CRA-compliant mileage log with vehicle management, trip logging,
 * per-km rate calculation, and YTD deduction previews. Supports add/delete for both
 * vehicles and trips with live deduction preview.
 */
export default function MileageTracker() {
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [showAddTrip, setShowAddTrip] = useState(false);

  const vehicleForm = useForm<VehicleForm>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: { nickname: '', plate: '', make: '', model: '', year: '' },
  });

  const tripForm = useForm<TripForm>({
    resolver: zodResolver(tripSchema),
    defaultValues: {
      tripDate: new Date().toISOString().split('T')[0],
      purpose: '', startLocation: '', endLocation: '',
      distanceKm: '', vehicleId: '', notes: '',
    },
  });

  const watchedKm = tripForm.watch('distanceKm');

  const { data: vehicles = [], isLoading: vehiclesLoading, error: vehiclesError } = useQuery({
    queryKey: ['vehicles'],
    queryFn: getVehicles,
    staleTime: 60_000,
  });

  const { data: logs = [], isLoading: logsLoading, error: logsError } = useQuery({
    queryKey: ['mileage_logs'],
    queryFn: getMileageLogs,
    staleTime: 30_000,
  });

  const { data: userId, error: userIdError } = useQuery({
    queryKey: ['userId'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user?.id ?? null;
    },
    staleTime: Infinity,
  });

  const { data: ytdKm = 0, error: ytdError } = useQuery({
    queryKey: ['ytd_km', userId],
    queryFn: () => getYearToDateKm(userId!, new Date().getFullYear()),
    enabled: !!userId,
    staleTime: 60_000,
  });

  const loading = vehiclesLoading || logsLoading;
  const queryError = vehiclesError || logsError || userIdError || ytdError;
  const refetchAll = () => {
    queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    queryClient.invalidateQueries({ queryKey: ['mileage_logs'] });
    queryClient.invalidateQueries({ queryKey: ['ytd_km'] });
    queryClient.invalidateQueries({ queryKey: ['userId'] });
  };

  const previewAmount = useMemo(() => {
    const km = parseFloat(watchedKm);
    if (km > 0) {
      const { amount } = calculateCRAMileage(ytdKm, km);
      return amount;
    }
    return null;
  }, [watchedKm, ytdKm]);

  const summary = useMemo(() => {
    const totalKm = logs.reduce((s, l) => s + Number(l.distance_km), 0);
    const totalAmount = logs.reduce((s, l) => s + Number(l.total_amount), 0);
    return { totalKm: Math.round(totalKm * 10) / 10, totalAmount: Math.round(totalAmount * 100) / 100, tripCount: logs.length };
  }, [logs]);

  const addVehicleMutation = useMutation({
    mutationFn: (data: VehicleForm) => createVehicle({
      nickname: data.nickname.trim(),
      plate: data.plate?.trim() || undefined,
      make: data.make?.trim() || undefined,
      model: data.model?.trim() || undefined,
      year: data.year ? parseInt(data.year) : undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      setShowAddVehicle(false);
      vehicleForm.reset();
    },
    onError: () => setError('Failed to add vehicle. The database may be unavailable.'),
  });

  const addTripMutation = useMutation({
    mutationFn: (data: TripForm) => createMileageLog({
      trip_date: data.tripDate,
      purpose: data.purpose.trim(),
      start_location: data.startLocation?.trim() || undefined,
      end_location: data.endLocation?.trim() || undefined,
      distance_km: parseFloat(data.distanceKm),
      vehicle_id: data.vehicleId || undefined,
      notes: data.notes?.trim() || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mileage_logs'] });
      queryClient.invalidateQueries({ queryKey: ['ytd_km'] });
      setShowAddTrip(false);
      tripForm.reset();
    },
    onError: () => setError('Failed to log trip. The database may be unavailable.'),
  });

  const handleAddVehicle = vehicleForm.handleSubmit((data) => {
    setError('');
    addVehicleMutation.mutate(data);
  });

  const handleAddTrip = tripForm.handleSubmit((data) => {
    setError('');
    addTripMutation.mutate(data);
  });

  const deleteLogMutation = useMutation({
    mutationFn: (id: string) => deleteMileageLog(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mileage_logs'] });
      queryClient.invalidateQueries({ queryKey: ['ytd_km'] });
    },
    onError: () => setError('Failed to delete trip.'),
  });

  const deleteVehicleMutation = useMutation({
    mutationFn: (id: string) => deleteVehicle(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vehicles'] }),
    onError: () => setError('Failed to delete vehicle.'),
  });

  const handleDeleteLog = (id: string) => deleteLogMutation.mutate(id);

  const inputCls = 'w-full rounded-[2rem] border border-glass-border bg-surface-raised px-3 py-2.5 text-sm text-text-primary outline-none transition placeholder:text-text-muted focus:border-champagne/40 focus:ring-2 focus:ring-champagne/15';
  const errCls = (field: string) => tripForm.formState.errors[field as keyof typeof tripForm.formState.errors] ? 'border-danger/60' : '';

  if (loading) {
    return (
      <div className="space-y-4 pb-10" role="status" aria-live="polite" aria-label="Loading mileage data">
        <Skeleton className="h-8 w-64 rounded-[2rem]" />
        <Skeleton className="h-5 w-48 rounded-[2rem]" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-[2rem]" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-[3rem]" />
      </div>
    );
  }

  if (queryError) {
    return (
      <div className="space-y-4 pb-10 fade-in" role="alert">
        <div className="flex items-center gap-3 rounded-[3rem] border border-danger/20 bg-danger/[0.06] px-4 py-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-danger" />
          <p className="flex-1 text-sm text-danger">Failed to load mileage data. Please try again.</p>
          <button
            type="button"
            onClick={refetchAll}
            className="flex items-center gap-1.5 rounded-[2rem] border border-danger/20 px-3 py-1.5 text-xs font-semibold text-danger transition hover:bg-danger/10"
          >
            <Loader2 className="h-3 w-3" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in pb-10" role="region" aria-label="Mileage tracking">
      <PageHeader
        title="Mileage Tracker"
        subtitle="CRA-compliant mileage log with prescribed per-km rates."
        action={
          <div className="flex gap-2">
            <button
              onClick={() => { setShowAddVehicle(true); setShowAddTrip(false); }}
              type="button"
              className="flex items-center gap-1.5 rounded-full border border-glass-border bg-surface px-3 py-2 text-xs font-semibold text-text-primary hover:bg-surface-raised transition"
            >
              <Car className="h-3.5 w-3.5" /> Add Vehicle
            </button>
            <button
              onClick={() => { setShowAddTrip(true); setShowAddVehicle(false); }}
              type="button"
              className="flex items-center gap-1.5 rounded-full bg-gradient-to-b from-champagne-dim to-champagne px-4 py-2 text-xs font-bold text-black shadow-lg hover:opacity-90 transition"
            >
              <Plus className="h-3.5 w-3.5" /> Log Trip
            </button>
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-3xl border border-glass-border bg-surface p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Total Distance</p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-text-primary">{summary.totalKm.toLocaleString()} km</p>
        </div>
        <div className="rounded-3xl border border-glass-border bg-surface p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">CRA Deduction</p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-champagne">{formatCurrency(summary.totalAmount)}</p>
        </div>
        <div className="rounded-3xl border border-glass-border bg-surface p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Trips Logged</p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-text-primary">{summary.tripCount}</p>
        </div>
      </div>

      {/* CRA Rate Info */}
      <div className="rounded-[2rem] border border-champagne/15 bg-champagne/[0.03] p-4 text-xs text-text-secondary">
        <p className="font-bold text-champagne text-[10px] uppercase tracking-wider mb-1">CRA Prescribed Rates (2024/2025)</p>
        <p>First 5,000 km: <span className="font-bold text-text-primary">$0.70/km</span> · After 5,000 km: <span className="font-bold text-text-primary">$0.64/km</span></p>
        <p className="mt-1">Your YTD: <span className="font-bold text-text-primary">{ytdKm.toLocaleString()} km</span> — {ytdKm >= 5000 ? 'using lower rate' : `${Math.round(5000 - ytdKm)} km until lower rate`}</p>
      </div>

      {error && (
        <div className="rounded-[2rem] border border-danger/20 bg-danger/[0.06] p-3 text-sm text-danger" role="alert">{error}</div>
      )}

      {/* Add Vehicle Form */}
      <AnimatePresence>
        {showAddVehicle && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <form onSubmit={handleAddVehicle} className="rounded-3xl border border-glass-border bg-surface p-5 space-y-4 shadow-sm">
              <h3 className="text-sm font-bold text-text-primary">New Vehicle</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="v-nickname" className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Nickname *</label>
                  <input id="v-nickname" {...vehicleForm.register('nickname')} placeholder="e.g. Work Truck" className={inputCls} />
                  {vehicleForm.formState.errors.nickname && <p className="text-[10px] text-danger mt-1">{vehicleForm.formState.errors.nickname.message}</p>}
                </div>
                <div>
                  <label htmlFor="v-plate" className="text-[10px] font-bold uppercase tracking-wider text-text-muted">License plate</label>
                  <input id="v-plate" {...vehicleForm.register('plate')} placeholder="ABC-123" className={inputCls} />
                </div>
                <div>
                  <label htmlFor="v-make" className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Make</label>
                  <input id="v-make" {...vehicleForm.register('make')} placeholder="Ford" className={inputCls} />
                </div>
                <div>
                  <label htmlFor="v-model" className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Model</label>
                  <input id="v-model" {...vehicleForm.register('model')} placeholder="F-150" className={inputCls} />
                </div>
                <div>
                  <label htmlFor="v-year" className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Year</label>
                  <input id="v-year" {...vehicleForm.register('year')} placeholder="2024" className={inputCls} />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => { setShowAddVehicle(false); vehicleForm.reset(); }} className="px-4 py-2 text-xs font-semibold text-text-secondary rounded-full border border-glass-border hover:bg-surface-raised transition">Cancel</button>
                <button type="submit" disabled={addVehicleMutation.isPending} className="px-4 py-2 text-xs font-bold text-black bg-champagne rounded-full hover:opacity-90 transition disabled:opacity-50">
                  {addVehicleMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin inline" /> : 'Save Vehicle'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Trip Form */}
      <AnimatePresence>
        {showAddTrip && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <form onSubmit={handleAddTrip} className="rounded-3xl border border-glass-border bg-surface p-5 space-y-4 shadow-sm">
              <h3 className="text-sm font-bold text-text-primary">Log New Trip</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="trip-date" className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">Date *</label>
                  <input id="trip-date" type="date" {...tripForm.register('tripDate')} className={`${inputCls} ${errCls('tripDate')}`} />
                  {tripForm.formState.errors.tripDate && <p className="text-[10px] text-danger mt-1">{tripForm.formState.errors.tripDate.message}</p>}
                </div>
                <div>
                  <label htmlFor="trip-km" className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">Distance (km) *</label>
                  <input id="trip-km" type="number" step="0.1" min="0" {...tripForm.register('distanceKm')} placeholder="0.0" className={`${inputCls} ${errCls('distanceKm')}`} />
                  {tripForm.formState.errors.distanceKm && <p className="text-[10px] text-danger mt-1">{tripForm.formState.errors.distanceKm.message}</p>}
                </div>
                <div className="col-span-2">
                  <label htmlFor="trip-purpose" className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">Purpose *</label>
                  <input id="trip-purpose" {...tripForm.register('purpose')} placeholder="e.g. Client meeting at Leduc site" className={`${inputCls} ${errCls('purpose')}`} />
                  {tripForm.formState.errors.purpose && <p className="text-[10px] text-danger mt-1">{tripForm.formState.errors.purpose.message}</p>}
                </div>
                <div>
                  <label htmlFor="trip-start" className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">Start location</label>
                  <input id="trip-start" {...tripForm.register('startLocation')} placeholder="123 Main St" className={inputCls} />
                </div>
                <div>
                  <label htmlFor="trip-end" className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">End location</label>
                  <input id="trip-end" {...tripForm.register('endLocation')} placeholder="456 Oak Ave" className={inputCls} />
                </div>
                {vehicles.length > 0 && (
                  <div>
                    <label htmlFor="trip-vehicle" className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">Vehicle</label>
                    <select id="trip-vehicle" {...tripForm.register('vehicleId')} className={inputCls}>
                      <option value="">Select vehicle</option>
                      {vehicles.map(v => (
                        <option key={v.id} value={v.id}>{v.nickname} {v.plate ? `(${v.plate})` : ''}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label htmlFor="trip-notes" className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">Notes</label>
                  <input id="trip-notes" {...tripForm.register('notes')} placeholder="Optional" className={inputCls} />
                </div>
              </div>

              {/* Live preview */}
              {previewAmount !== null && (
                <div className="rounded-[2rem] bg-emerald-success/[0.06] border border-emerald-success/20 p-3 flex items-center justify-between" aria-live="polite">
                  <span className="text-xs text-emerald-light font-bold">CRA Deduction Preview</span>
                  <span className="text-lg font-black tabular-nums text-emerald-light">{formatCurrency(previewAmount)}</span>
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => { setShowAddTrip(false); tripForm.reset(); }} className="px-4 py-2 text-xs font-semibold text-text-secondary rounded-full border border-glass-border hover:bg-surface-raised transition">Cancel</button>
                <button type="submit" disabled={addTripMutation.isPending} className="px-4 py-2 text-xs font-bold text-black bg-champagne rounded-full hover:opacity-90 transition disabled:opacity-50">
                  {addTripMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin inline" /> : 'Save Trip'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trip Log */}
      {logs.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-glass-border bg-surface/30 py-16 text-center" role="status" aria-live="polite">
          <Gauge className="h-10 w-10 text-text-muted opacity-30" />
          <p className="text-sm text-text-muted">No trips logged yet. Tap &quot;Log Trip&quot; to start tracking mileage.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <motion.div
              key={log.id}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="rounded-[2rem] border border-glass-border bg-surface p-4 shadow-sm group"
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-text-primary truncate">{log.purpose}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-text-secondary">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{log.trip_date}</span>
                    <span className="flex items-center gap-1"><Gauge className="h-3 w-3" />{Number(log.distance_km)} km</span>
                    {log.start_location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{log.start_location} → {log.end_location || '...'}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-bold tabular-nums text-champagne">{formatCurrency(Number(log.total_amount))}</p>
                    <p className="text-[10px] text-text-muted">${Number(log.rate_per_km).toFixed(2)}/km</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteLog(log.id)}
                    disabled={deleteLogMutation.isPending}
                    className="opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition p-1.5 rounded-full text-text-muted hover:text-danger hover:bg-danger/10 disabled:opacity-30"
                    aria-label="Delete trip"
                  >
                    {deleteLogMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Vehicles list */}
      {vehicles.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-3">Registered Vehicles</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {vehicles.map(v => (
              <div key={v.id} className="rounded-[2rem] border border-glass-border bg-surface p-4 shadow-sm flex items-center justify-between group">
                <div>
                  <p className="text-sm font-semibold text-text-primary">{v.nickname}</p>
                  <p className="text-xs text-text-secondary">
                    {[v.year, v.make, v.model].filter(Boolean).join(' ')}
                    {v.plate && ` · ${v.plate}`}
                  </p>
                </div>
                <button
                  onClick={() => deleteVehicleMutation.mutate(v.id)}
                  disabled={deleteVehicleMutation.isPending}
                  className="opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition p-1.5 rounded-full text-text-muted hover:text-danger hover:bg-danger/10 disabled:opacity-30"
                  aria-label="Delete vehicle"
                >
                  {deleteVehicleMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
