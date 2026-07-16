import { supabase, getOrgIdString } from '@/lib/supabase';
import { handleSupabaseError } from '@/lib/supabase-error-handler';
import { logError } from '@/lib/logger';

// ─── CRA Prescribed Mileage Rates (2024/2025) ───
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

export interface CreateVehicleParams {
  nickname: string;
  plate?: string;
  make?: string;
  model?: string;
  year?: number;
}

export interface CreateMileageLogEntry {
  vehicle_id?: string;
  trip_date: string;
  purpose: string;
  start_location?: string;
  end_location?: string;
  distance_km: number;
  project_id?: string;
  notes?: string;
}

/**
 * Calculate CRA prescribed mileage rate for a trip, considering annual cumulative distance.
 *
 * Rates (2024/2025):
 * - First 5,000 km: $0.70/km
 * - After 5,000 km: $0.64/km
 * - Northwest Territories, Yukon, Nunavut add $0.04/km (not yet implemented)
 *
 * @param yearToDateKm - Total km already driven this year before this trip (must be >= 0).
 * @param tripKm - Distance of the current trip in km (must be > 0).
 * @returns Weighted average rate and total dollar amount, both rounded to 2 decimal places.
 * @throws {Error} If yearToDateKm is negative or tripKm is not positive.
 */
export function calculateCRAMileage(yearToDateKm: number, tripKm: number): { rate: number; amount: number } {
  if (yearToDateKm < 0 || !Number.isFinite(yearToDateKm)) {
    throw new Error('yearToDateKm must be a non-negative finite number');
  }
  if (tripKm <= 0 || !Number.isFinite(tripKm)) {
    throw new Error('tripKm must be a positive finite number');
  }

  const startKm = yearToDateKm;
  const endKm = yearToDateKm + tripKm;

  let amount = 0;

  if (endKm <= CRA_THRESHOLD_KM) {
    amount = tripKm * CRA_RATE_FIRST_5000;
  } else if (startKm >= CRA_THRESHOLD_KM) {
    amount = tripKm * CRA_RATE_AFTER_5000;
  } else {
    const kmAtHighRate = CRA_THRESHOLD_KM - startKm;
    const kmAtLowRate = tripKm - kmAtHighRate;
    amount = (kmAtHighRate * CRA_RATE_FIRST_5000) + (kmAtLowRate * CRA_RATE_AFTER_5000);
  }

  const rate = amount / tripKm;
  return { rate: Math.round(rate * 100) / 100, amount: Math.round(amount * 100) / 100 };
}

// ─── Vehicle CRUD ───

/**
 * Fetch all vehicles for the current user's organization.
 *
 * @returns Array of vehicles, newest first. Empty array on error.
 */
export async function getVehicles(): Promise<Vehicle[]> {
  const orgId = await getOrgIdString();
  if (!orgId) return [];

  try {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (error) throw handleSupabaseError(error);
    return data || [];
  } catch (err) {
    const supabaseError = handleSupabaseError(err);
    logError(supabaseError, { action: 'get_vehicles' });
    throw supabaseError;
  }
}

/**
 * Create a new vehicle record for the current user's organization.
 *
 * @param vehicle - Vehicle details (nickname required, optional plate/make/model/year).
 * @returns The created vehicle record.
 * @throws {Error} If authentication or organization context is missing, or DB write fails.
 */
export async function createVehicle(vehicle: CreateVehicleParams): Promise<Vehicle> {
  if (!vehicle.nickname || vehicle.nickname.trim().length === 0) {
    throw new Error('Vehicle nickname is required');
  }

  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user) throw new Error('Authentication required');

  const orgId = await getOrgIdString();
  if (!orgId) throw new Error('Organization required');

  try {
    const { data, error } = await supabase
      .from('vehicles')
      .insert({
        org_id: orgId,
        user_id: authData.user.id,
        nickname: vehicle.nickname.trim(),
        plate: vehicle.plate || null,
        make: vehicle.make || null,
        model: vehicle.model || null,
        year: vehicle.year || null,
      })
      .select()
      .single();

    if (error) throw handleSupabaseError(error);
    return data;
  } catch (err) {
    const supabaseError = handleSupabaseError(err);
    logError(supabaseError, { action: 'create_vehicle' });
    throw supabaseError;
  }
}

/**
 * Delete a vehicle by ID, scoped to the current user's organization.
 *
 * @param id - UUID of the vehicle to delete.
 * @throws {Error} If organization context is missing or DB operation fails.
 */
export async function deleteVehicle(id: string): Promise<void> {
  if (!id) throw new Error('Vehicle ID is required');

  const orgId = await getOrgIdString();
  if (!orgId) throw new Error('No organization found');

  try {
    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', id)
      .eq('org_id', orgId);

    if (error) throw handleSupabaseError(error);
  } catch (err) {
    const supabaseError = handleSupabaseError(err);
    logError(supabaseError, { action: 'delete_vehicle' });
    throw supabaseError;
  }
}

// ─── Mileage Log CRUD ───

/**
 * Fetch all mileage logs for the current user's organization.
 *
 * @returns Array of mileage logs with vehicle join, newest trip first. Empty array on error.
 */
export async function getMileageLogs(): Promise<MileageLog[]> {
  const orgId = await getOrgIdString();
  if (!orgId) return [];

  try {
    const { data, error } = await supabase
      .from('mileage_logs')
      .select('*, vehicle:vehicles(*)')
      .eq('org_id', orgId)
      .order('trip_date', { ascending: false });

    if (error) throw handleSupabaseError(error);
    return data || [];
  } catch (err) {
    const supabaseError = handleSupabaseError(err);
    logError(supabaseError, { action: 'get_mileage_logs' });
    throw supabaseError;
  }
}

/**
 * Get total km driven year-to-date for a specific user in their org.
 *
 * @param userId - UUID of the user.
 * @param year - Calendar year (e.g., 2025).
 * @returns Total distance in km, rounded to 1 decimal place.
 */
export async function getYearToDateKm(userId: string, year: number): Promise<number> {
  if (!userId) return 0;
  if (!Number.isInteger(year) || year < 2000 || year > 2100) return 0;

  const orgId = await getOrgIdString();
  if (!orgId) return 0;

  const yearStart = `${year}-01-01`;
  const yearEnd = `${year + 1}-01-01`;

  try {
    const { data, error } = await supabase
      .from('mileage_logs')
      .select('distance_km')
      .eq('user_id', userId)
      .eq('org_id', orgId)
      .gte('trip_date', yearStart)
      .lt('trip_date', yearEnd);

    if (error) throw handleSupabaseError(error);
    return (data || []).reduce((sum, r) => sum + Number(r.distance_km), 0);
  } catch (err) {
    const supabaseError = handleSupabaseError(err);
    logError(supabaseError, { action: 'get_year_to_date_km', userId, year });
    throw supabaseError;
  }
}

/**
 * Create a new mileage log entry with automatic CRA rate calculation.
 *
 * @param entry - Trip details including date, purpose, distance, and optional vehicle/project.
 * @returns The created mileage log with vehicle join.
 * @throws {Error} If authentication or org context is missing, or DB write fails.
 */
export async function createMileageLog(entry: CreateMileageLogEntry): Promise<MileageLog> {
  if (!entry.trip_date) {
    throw new Error('Trip date is required');
  }
  if (!entry.purpose || entry.purpose.trim().length === 0) {
    throw new Error('Trip purpose is required');
  }
  if (!entry.distance_km || entry.distance_km <= 0 || !Number.isFinite(entry.distance_km)) {
    throw new Error('Distance must be a positive number');
  }

  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user) throw new Error('Authentication required');

  const orgId = await getOrgIdString();
  if (!orgId) throw new Error('Organization required');

  // Calculate CRA rate based on year-to-date km
  const tripYear = new Date(entry.trip_date).getFullYear();
  if (isNaN(tripYear)) {
    throw new Error('Invalid trip date format');
  }

  const ytdKm = await getYearToDateKm(authData.user.id, tripYear);
  const { rate, amount } = calculateCRAMileage(ytdKm, entry.distance_km);

  try {
    const { data, error } = await supabase
      .from('mileage_logs')
      .insert({
        org_id: orgId,
        user_id: authData.user.id,
        vehicle_id: entry.vehicle_id || null,
        trip_date: entry.trip_date,
        purpose: entry.purpose.trim(),
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
  } catch (err) {
    const supabaseError = handleSupabaseError(err);
    logError(supabaseError, { action: 'create_mileage_log' });
    throw supabaseError;
  }
}

/**
 * Delete a mileage log by ID, scoped to the current user's organization.
 *
 * @param id - UUID of the mileage log to delete.
 * @throws {Error} If organization context is missing or DB operation fails.
 */
export async function deleteMileageLog(id: string): Promise<void> {
  if (!id) throw new Error('Mileage log ID is required');

  const orgId = await getOrgIdString();
  if (!orgId) throw new Error('No organization found');

  try {
    const { error } = await supabase
      .from('mileage_logs')
      .delete()
      .eq('id', id)
      .eq('org_id', orgId);

    if (error) throw handleSupabaseError(error);
  } catch (err) {
    const supabaseError = handleSupabaseError(err);
    logError(supabaseError, { action: 'delete_mileage_log' });
    throw supabaseError;
  }
}

// ─── Mileage Summary for Dashboard ───

export interface MileageSummary {
  totalKm: number;
  totalAmount: number;
  tripCount: number;
}

/**
 * Get aggregated mileage summary for the current user's organization.
 *
 * @returns Total km, total amount, and trip count. All zeros on error.
 */
export async function getMileageSummary(): Promise<MileageSummary> {
  const orgId = await getOrgIdString();
  if (!orgId) return { totalKm: 0, totalAmount: 0, tripCount: 0 };

  try {
    const { data, error } = await supabase
      .from('mileage_logs')
      .select('distance_km, total_amount')
      .eq('org_id', orgId);

    if (error) {
      logError(error, { action: 'get_mileage_summary' });
      return { totalKm: 0, totalAmount: 0, tripCount: 0 };
    }

    const rows = data || [];
    const totalKm = rows.reduce((sum, r) => sum + Number(r.distance_km), 0);
    const totalAmount = rows.reduce((sum, r) => sum + Number(r.total_amount), 0);

    return {
      totalKm: Math.round(totalKm * 10) / 10,
      totalAmount: Math.round(totalAmount * 100) / 100,
      tripCount: rows.length,
    };
  } catch (err) {
    logError(err, { action: 'get_mileage_summary' });
    return { totalKm: 0, totalAmount: 0, tripCount: 0 };
  }
}
