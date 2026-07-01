// LOCKED: BUGGY

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

export function calculateCRAMileage(_yearToDateKm: number, _tripKm: number): { rate: number; amount: number } {
  return { rate: 0, amount: 0 };
}

export async function getVehicles(): Promise<Vehicle[]> {
  return [];
}

export async function createVehicle(_vehicle: { nickname: string; plate?: string; make?: string; model?: string; year?: number }): Promise<Vehicle> {
  throw new Error('Service locked');
}

export async function deleteVehicle(_id: string): Promise<void> {
  throw new Error('Service locked');
}

export async function getMileageLogs(): Promise<MileageLog[]> {
  return [];
}

export async function getYearToDateKm(_userId: string, _year: number): Promise<number> {
  return 0;
}

export async function createMileageLog(_entry: { vehicle_id?: string; trip_date: string; purpose: string; start_location?: string; end_location?: string; distance_km: number; project_id?: string; notes?: string }): Promise<MileageLog> {
  throw new Error('Service locked');
}

export async function deleteMileageLog(_id: string): Promise<void> {
  throw new Error('Service locked');
}

export async function getMileageSummary(): Promise<{ totalKm: number; totalAmount: number; tripCount: number }> {
  return { totalKm: 0, totalAmount: 0, tripCount: 0 };
}
