import { supabase, getOrgIdString } from '@/lib/supabase';
import { handleSupabaseError, withRetry } from '@/lib/supabase-error-handler';

// ─── CRA Prescribed Mileage Rates (2024/2025) ───
// First 5,000 km: $0.70/km, after: $0.64/km
// Northwest Territories, Yukon, Nunavut add $0.04/km
const CRA_RATE_FIRST_5000 = 0.70;
const CRA_RATE_AFTER_5000 = 0.64;
const CRA_THRESHOLD_KM = 5000;

export interface Vehicle {
  id: string;
  org_id: string;
  user_id: string;
  nickname: string;
  plate: string | null;
  make: string | null;
  model: string | null;
  year: number | null;
  created_at: string;
}

export interface MileageLog {
  id: string;
  org_id: string;
  user_id: string;
  vehicle_id: string | null;
  trip_date: string;
  purpose: string;
  start_location: string | null;
  end_location: string | null;
  distance_km: number;
  rate_per_km: number;
  total_amount: number;
  is_reimbursed: boolean;
  project_id: string | null;
  notes: string | null;
  created_at: string;
  vehicle?: Vehicle;
}

/**
 * Calculate CRA rate for a given km entry, considering annual cumulative distance.
 * @param yearToDateKm - Total km already driven this year before this trip
 * @param tripKm - Distance of the current trip
 * @returns { rate, amount } — weighted average rate and total dollar amount
 */
export function calculateCRAMileage(yearToDateKm: number, tripKm: number): { rate: number; amount: number } {
  const startKm = yearToDateKm;
  const endKm = yearToDateKm + tripKm;

  let amount = 0;

  if (endKm <= CRA_THRESHOLD_KM) {
    // Entire trip is under 5000km threshold
    amount = tripKm * CRA_RATE_FIRST_5000;
  } else if (startKm >= CRA_THRESHOLD_KM) {
    // Entire trip is over 5000km threshold
    amount = tripKm * CRA_RATE_AFTER_5000;
  } else {
    // Trip straddles the 5000km boundary
    const kmAtHighRate = CRA_THRESHOLD_KM - startKm;
    const kmAtLowRate = tripKm - kmAtHighRate;
    amount = (kmAtHighRate * CRA_RATE_FIRST_5000) + (kmAtLowRate * CRA_RATE_AFTER_5000);
  }

  const rate = amount / tripKm;
  return { rate: Math.round(rate * 100) / 100, amount: Math.round(amount * 100) / 100 };
}

// ─── Vehicle CRUD ───

export async function getVehicles(): Promise<Vehicle[]> {
  const orgId = await getOrgIdString();
  if (!orgId) return [];

  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });

  if (error) throw handleSupabaseError(error);
  return data || [];
}

export async function createVehicle(vehicle: { nickname: string; plate?: string; make?: string; model?: string; year?: number }): Promise<Vehicle> {
  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user) throw new Error('Authentication required');

  const orgId = await getOrgIdString();
  if (!orgId) throw new Error('Organization required');

  const { data, error } = await supabase
    .from('vehicles')
    .insert({
      org_id: orgId,
      user_id: authData.user.id,
      nickname: vehicle.nickname,
      plate: vehicle.plate || null,
      make: vehicle.make || null,
      model: vehicle.model || null,
      year: vehicle.year || null,
    })
    .select()
    .single();

  if (error) throw handleSupabaseError(error);
  return data;
}

export async function deleteVehicle(id: string): Promise<void> {
  const { error } = await supabase.from('vehicles').delete().eq('id', id);
  if (error) throw handleSupabaseError(error);
}

// ─── Mileage Log CRUD ───

export async function getMileageLogs(): Promise<MileageLog[]> {
  const orgId = await getOrgIdString();
  if (!orgId) return [];

  const { data, error } = await supabase
    .from('mileage_logs')
    .select('*, vehicle:vehicles(*)')
    .eq('org_id', orgId)
    .order('trip_date', { ascending: false });

  if (error) throw handleSupabaseError(error);
  return data || [];
}

export async function getYearToDateKm(userId: string, year: number): Promise<number> {
  const yearStart = `${year}-01-01`;
  const yearEnd = `${year + 1}-01-01`;

  const { data, error } = await supabase
    .from('mileage_logs')
    .select('distance_km')
    .eq('user_id', userId)
    .gte('trip_date', yearStart)
    .lt('trip_date', yearEnd);

  if (error) throw handleSupabaseError(error);
  return (data || []).reduce((sum, r) => sum + Number(r.distance_km), 0);
}

export async function createMileageLog(entry: {
  vehicle_id?: string;
  trip_date: string;
  purpose: string;
  start_location?: string;
  end_location?: string;
  distance_km: number;
  project_id?: string;
  notes?: string;
}): Promise<MileageLog> {
  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user) throw new Error('Authentication required');

  const orgId = await getOrgIdString();
  if (!orgId) throw new Error('Organization required');

  // Calculate CRA rate based on year-to-date km
  const tripYear = new Date(entry.trip_date).getFullYear();
  const ytdKm = await getYearToDateKm(authData.user.id, tripYear);
  const { rate, amount } = calculateCRAMileage(ytdKm, entry.distance_km);

  const { data, error } = await supabase
    .from('mileage_logs')
    .insert({
      org_id: orgId,
      user_id: authData.user.id,
      vehicle_id: entry.vehicle_id || null,
      trip_date: entry.trip_date,
      purpose: entry.purpose,
      start_location: entry.start_location || null,
      end_location: entry.end_location || null,
      distance_km: entry.distance_km,
      rate_per_km: rate,
      total_amount: amount,
      project_id: entry.project_id || null,
      notes: entry.notes || null,
    })
    .select('*, vehicle:vehicles(*)')
    .single();

  if (error) throw handleSupabaseError(error);
  return data;
}

export async function deleteMileageLog(id: string): Promise<void> {
  const { error } = await supabase.from('mileage_logs').delete().eq('id', id);
  if (error) throw handleSupabaseError(error);
}

// ─── Mileage Summary for Dashboard ───

export async function getMileageSummary(): Promise<{ totalKm: number; totalAmount: number; tripCount: number }> {
  const orgId = await getOrgIdString();
  if (!orgId) return { totalKm: 0, totalAmount: 0, tripCount: 0 };

  const { data, error } = await supabase
    .from('mileage_logs')
    .select('distance_km, total_amount')
    .eq('org_id', orgId);

  if (error) return { totalKm: 0, totalAmount: 0, tripCount: 0 };

  const totalKm = (data || []).reduce((sum, r) => sum + Number(r.distance_km), 0);
  const totalAmount = (data || []).reduce((sum, r) => sum + Number(r.total_amount), 0);
  return { totalKm: Math.round(totalKm * 10) / 10, totalAmount: Math.round(totalAmount * 100) / 100, tripCount: (data || []).length };
}
