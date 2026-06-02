'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Car, Trash2, MapPin, Calendar, Gauge, DollarSign, Loader2, ChevronDown } from 'lucide-react';
import { formatCurrency } from '@/lib/ui-utils';
import { Skeleton } from '@/components/ui/skeleton';
import {
  getVehicles, createVehicle, deleteVehicle,
  getMileageLogs, createMileageLog, deleteMileageLog,
  calculateCRAMileage, getYearToDateKm,
  type Vehicle, type MileageLog,
} from '@/lib/services/mileage';
import { supabase } from '@/lib/supabase';

export default function MileageTracker() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [logs, setLogs] = useState<MileageLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [showAddTrip, setShowAddTrip] = useState(false);

  // Vehicle form
  const [vNickname, setVNickname] = useState('');
  const [vPlate, setVPlate] = useState('');
  const [vMake, setVMake] = useState('');
  const [vModel, setVModel] = useState('');
  const [vYear, setVYear] = useState('');

  // Trip form
  const [tripDate, setTripDate] = useState(new Date().toISOString().split('T')[0]);
  const [tripPurpose, setTripPurpose] = useState('');
  const [tripStart, setTripStart] = useState('');
  const [tripEnd, setTripEnd] = useState('');
  const [tripKm, setTripKm] = useState('');
  const [tripVehicle, setTripVehicle] = useState('');
  const [tripNotes, setTripNotes] = useState('');

  // Preview calculation
  const [previewAmount, setPreviewAmount] = useState<number | null>(null);
  const [ytdKm, setYtdKm] = useState(0);

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const km = parseFloat(tripKm);
    if (km > 0) {
      const { amount } = calculateCRAMileage(ytdKm, km);
      setPreviewAmount(amount);
    } else {
      setPreviewAmount(null);
    }
  }, [tripKm, ytdKm]);

  async function load() {
    setLoading(true);
    try {
      const [v, l] = await Promise.all([getVehicles(), getMileageLogs()]);
      setVehicles(v);
      setLogs(l);

      // Get YTD km for current user
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user) {
        const ytd = await getYearToDateKm(authData.user.id, new Date().getFullYear());
        setYtdKm(ytd);
      }
    } catch (err) {
      setError('Failed to load mileage data.');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddVehicle() {
    if (!vNickname.trim()) { setError('Vehicle nickname is required.'); return; }
    setSaving(true);
    setError('');
    try {
      const v = await createVehicle({
        nickname: vNickname.trim(),
        plate: vPlate.trim() || undefined,
        make: vMake.trim() || undefined,
        model: vModel.trim() || undefined,
        year: vYear ? parseInt(vYear) : undefined,
      });
      setVehicles(prev => [v, ...prev]);
      setShowAddVehicle(false);
      setVNickname(''); setVPlate(''); setVMake(''); setVModel(''); setVYear('');
    } catch (err) {
      setError('Failed to add vehicle.');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddTrip() {
    if (!tripPurpose.trim()) { setError('Trip purpose is required.'); return; }
    const km = parseFloat(tripKm);
    if (!km || km <= 0) { setError('Distance must be greater than 0.'); return; }
    if (!tripDate) { setError('Trip date is required.'); return; }

    setSaving(true);
    setError('');
    try {
      const log = await createMileageLog({
        trip_date: tripDate,
        purpose: tripPurpose.trim(),
        start_location: tripStart.trim() || undefined,
        end_location: tripEnd.trim() || undefined,
        distance_km: km,
        vehicle_id: tripVehicle || undefined,
        notes: tripNotes.trim() || undefined,
      });
      setLogs(prev => [log, ...prev]);
      setYtdKm(prev => prev + km);
      setShowAddTrip(false);
      setTripPurpose(''); setTripStart(''); setTripEnd(''); setTripKm(''); setTripVehicle(''); setTripNotes('');
    } catch (err) {
      setError('Failed to log trip.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteLog(id: string) {
    try {
      await deleteMileageLog(id);
      setLogs(prev => prev.filter(l => l.id !== id));
    } catch {
      setError('Failed to delete trip.');
    }
  }

  const summary = useMemo(() => {
    const totalKm = logs.reduce((s, l) => s + Number(l.distance_km), 0);
    const totalAmount = logs.reduce((s, l) => s + Number(l.total_amount), 0);
    return { totalKm: Math.round(totalKm * 10) / 10, totalAmount: Math.round(totalAmount * 100) / 100, tripCount: logs.length };
  }, [logs]);

  const inputCls = 'w-full rounded-[2rem] border border-glass-border bg-surface-raised px-3 py-2.5 text-sm text-text-primary outline-none transition placeholder:text-text-muted focus:border-champagne/40 focus:ring-2 focus:ring-champagne/15';

  if (loading) {
    return (
      <div className="space-y-4 pb-10">
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

  return (
    <div className="space-y-6 fade-in pb-10" role="region" aria-label="Mileage tracking">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-text-primary">Mileage Tracker</h2>
          <p className="mt-1 text-sm text-text-secondary">CRA-compliant mileage log with prescribed per-km rates.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowAddVehicle(true); setShowAddTrip(false); }}
            className="flex items-center gap-1.5 rounded-full border border-glass-border bg-surface px-3 py-2 text-xs font-semibold text-text-primary hover:bg-surface-raised transition"
          >
            <Car className="h-3.5 w-3.5" /> Add Vehicle
          </button>
          <button
            onClick={() => { setShowAddTrip(true); setShowAddVehicle(false); }}
            className="flex items-center gap-1.5 rounded-full bg-gradient-to-b from-[#dfcaaa] to-champagne px-4 py-2 text-xs font-bold text-black shadow-lg hover:opacity-90 transition"
          >
            <Plus className="h-3.5 w-3.5" /> Log Trip
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
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
        <div className="rounded-[2rem] border border-red-500/20 bg-red-500/[0.06] p-3 text-sm text-red-400">{error}</div>
      )}

      {/* Add Vehicle Form */}
      <AnimatePresence>
        {showAddVehicle && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="rounded-3xl border border-glass-border bg-surface p-5 space-y-4 shadow-sm">
              <h3 className="text-sm font-bold text-text-primary">New Vehicle</h3>
              <div className="grid grid-cols-2 gap-3">
                <input value={vNickname} onChange={e => setVNickname(e.target.value)} placeholder="Nickname *" className={inputCls} />
                <input value={vPlate} onChange={e => setVPlate(e.target.value)} placeholder="License plate" className={inputCls} />
                <input value={vMake} onChange={e => setVMake(e.target.value)} placeholder="Make" className={inputCls} />
                <input value={vModel} onChange={e => setVModel(e.target.value)} placeholder="Model" className={inputCls} />
                <input value={vYear} onChange={e => setVYear(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="Year" className={inputCls} />
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowAddVehicle(false)} className="px-4 py-2 text-xs font-semibold text-text-secondary rounded-full border border-glass-border hover:bg-surface-raised transition">Cancel</button>
                <button onClick={handleAddVehicle} disabled={saving} className="px-4 py-2 text-xs font-bold text-black bg-champagne rounded-full hover:opacity-90 transition disabled:opacity-50">
                  {saving ? <Loader2 className="h-3 w-3 animate-spin inline" /> : 'Save Vehicle'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Trip Form */}
      <AnimatePresence>
        {showAddTrip && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="rounded-3xl border border-glass-border bg-surface p-5 space-y-4 shadow-sm">
              <h3 className="text-sm font-bold text-text-primary">Log New Trip</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">Date *</label>
                  <input type="date" value={tripDate} onChange={e => setTripDate(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">Distance (km) *</label>
                  <input type="number" step="0.1" min="0" value={tripKm} onChange={e => setTripKm(e.target.value)} placeholder="0.0" className={inputCls} />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">Purpose *</label>
                  <input value={tripPurpose} onChange={e => setTripPurpose(e.target.value)} placeholder="e.g. Client meeting at Leduc site" className={inputCls} />
                </div>
                <input value={tripStart} onChange={e => setTripStart(e.target.value)} placeholder="Start location" className={inputCls} />
                <input value={tripEnd} onChange={e => setTripEnd(e.target.value)} placeholder="End location" className={inputCls} />
                {vehicles.length > 0 && (
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">Vehicle</label>
                    <select value={tripVehicle} onChange={e => setTripVehicle(e.target.value)} className={inputCls}>
                      <option value="">Select vehicle</option>
                      {vehicles.map(v => (
                        <option key={v.id} value={v.id}>{v.nickname} {v.plate ? `(${v.plate})` : ''}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">Notes</label>
                  <input value={tripNotes} onChange={e => setTripNotes(e.target.value)} placeholder="Optional" className={inputCls} />
                </div>
              </div>

              {/* Live preview */}
              {previewAmount !== null && (
                <div className="rounded-[2rem] bg-emerald-500/[0.06] border border-emerald-500/20 p-3 flex items-center justify-between">
                  <span className="text-xs text-emerald-400 font-bold">CRA Deduction Preview</span>
                  <span className="text-lg font-black tabular-nums text-emerald-400">{formatCurrency(previewAmount)}</span>
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowAddTrip(false)} className="px-4 py-2 text-xs font-semibold text-text-secondary rounded-full border border-glass-border hover:bg-surface-raised transition">Cancel</button>
                <button onClick={handleAddTrip} disabled={saving} className="px-4 py-2 text-xs font-bold text-black bg-champagne rounded-full hover:opacity-90 transition disabled:opacity-50">
                  {saving ? <Loader2 className="h-3 w-3 animate-spin inline" /> : 'Save Trip'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trip Log */}
      {logs.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-glass-border bg-surface p-12 text-center">
          <Gauge className="mx-auto mb-3 h-12 w-12 text-text-muted/30" />
          <p className="text-sm font-semibold text-text-primary">No trips logged yet.</p>
          <p className="mt-1 text-xs text-text-secondary">Tap "Log Trip" above to start tracking mileage.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log, idx) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="rounded-[2rem] border border-glass-border bg-surface p-4 shadow-sm group"
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-text-primary truncate">{log.purpose}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-text-secondary">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{log.trip_date}</span>
                    <span className="flex items-center gap-1"><Gauge className="h-3 w-3" />{Number(log.distance_km)} km</span>
                    {log.start_location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{log.start_location} → {log.end_location || '...'}</span>}
                    {(log as any).vehicle && <span className="flex items-center gap-1"><Car className="h-3 w-3" />{(log as any).vehicle.nickname}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-bold tabular-nums text-champagne">{formatCurrency(Number(log.total_amount))}</p>
                    <p className="text-[10px] text-text-muted">${Number(log.rate_per_km).toFixed(2)}/km</p>
                  </div>
                  <button
                    onClick={() => handleDeleteLog(log.id)}
                    className="opacity-0 group-hover:opacity-100 transition p-1.5 rounded-full text-text-muted hover:text-red-400 hover:bg-red-500/10"
                    aria-label="Delete trip"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
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
                  onClick={async () => { await deleteVehicle(v.id); setVehicles(prev => prev.filter(x => x.id !== v.id)); }}
                  className="opacity-0 group-hover:opacity-100 transition p-1.5 rounded-full text-text-muted hover:text-red-400 hover:bg-red-500/10"
                  aria-label="Delete vehicle"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
