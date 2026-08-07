export interface Vehicle {
  id: string;
  internalNumber: string;
  vehicleType: 'Rainha' | 'STB' | 'Particular';
  inYard: boolean;
}

export const vehicleTypeOptions = ['Rainha', 'STB', 'Particular'] as const;

export const vehicleTypeLabel = (vehicleType?: string) => vehicleType || '—';

export interface Driver {
  id: string;
  fullName: string;
  registration: string;
  photoUrl?: string;
  status: 'active' | 'inactive';
}

export interface Movement {
  id: string;
  type: 'entry' | 'exit';
  date: string;
  time: string;
  vehicleId: string;
  vehicle?: Vehicle;
  driverId: string;
  driver?: Driver;
  identificationStatus: 'automatic' | 'manual';
  confirmedBy: 'camera' | 'gate';
  imageUrl?: string;
}

export type UserRole = 'admin' | 'gate';
