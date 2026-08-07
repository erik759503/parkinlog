import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { api } from '@/lib/api';

interface Vehicle {
  id: string;
  internalNumber: string;
  vehicleType: 'Rainha' | 'STB' | 'Particular';
  inYard: boolean;
}

export interface Driver {
  id: string;
  fullName: string;
  registration: string;
  photoUrl?: string;
  status: 'active' | 'inactive';
}

interface Movement {
  id: string;
  type: 'entry' | 'exit';
  date: string;
  time: string;
  vehicleId: string;
  driverId: string;
  identificationStatus: 'automatic' | 'manual';
  confirmedBy: 'camera' | 'gate';
  imageUrl?: string;
  registeredByUsername?: string;
  registeredByRole?: string;
}

interface AppContextType {
  vehicles: Vehicle[];
  drivers: Driver[];
  movements: Movement[];
  loading: boolean;
  addVehicle: (v: Omit<Vehicle, 'id'>) => Promise<void>;
  updateVehicle: (id: string, v: Partial<Vehicle>) => Promise<void>;
  addDriver: (d: Omit<Driver, 'id'>) => Promise<string | undefined>;
  updateDriver: (id: string, d: Partial<Driver>) => Promise<void>;
  addMovement: (m: Omit<Movement, 'id'>) => Promise<void>;
  updateMovement: (id: string, m: Partial<Movement>) => Promise<void>;
  deleteVehicle: (id: string) => Promise<void>;
  deleteDriver: (id: string) => Promise<void>;
  deleteMovement: (id: string) => Promise<void>;
  getVehicle: (id: string) => Vehicle | undefined;
  getDriver: (id: string) => Driver | undefined;
  refresh: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const mapVehicle = (row: any): Vehicle => ({
  id: row.id,
  internalNumber: row.internal_number,
  vehicleType: (row.vehicle_type || 'Particular') as 'Rainha' | 'STB' | 'Particular',
  inYard: row.in_yard,
});

const mapDriver = (row: any): Driver => ({
  id: row.id,
  fullName: row.full_name,
  registration: row.registration,
  photoUrl: row.photo_url || undefined,
  status: row.status as 'active' | 'inactive',
});

const mapMovement = (row: any): Movement => ({
  id: row.id,
  type: row.type as 'entry' | 'exit',
  date: row.date,
  time: row.time,
  vehicleId: row.vehicle_id,
  driverId: row.driver_id,
  identificationStatus: row.identification_status as 'automatic' | 'manual',
  confirmedBy: row.confirmed_by as 'camera' | 'gate',
  imageUrl: row.image_url || undefined,
  registeredByUsername: row.registered_by_username || undefined,
  registeredByRole: row.registered_by_role || undefined,
});

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { user, userRole } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    const [vehicles, drivers, movements] = await Promise.all([
      api.get<any[]>('/vehicles'),
      api.get<any[]>('/drivers'),
      api.get<any[]>('/movements'),
    ]);
    setVehicles((vehicles || []).map(mapVehicle));
    setDrivers((drivers || []).map(mapDriver));
    setMovements((movements || []).map(mapMovement));
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const addVehicle = async (v: Omit<Vehicle, 'id'>) => {
    await api.post('/vehicles', {
      internal_number: v.internalNumber,
      vehicle_type: v.vehicleType,
      plate: '',
      model: '',
      color: '',
      in_yard: v.inYard,
    });
    await fetchAll();
  };

  const updateVehicle = async (id: string, v: Partial<Vehicle>) => {
    const update: any = {};
    if (v.internalNumber !== undefined) update.internal_number = v.internalNumber;
    if (v.vehicleType !== undefined) update.vehicle_type = v.vehicleType;
    await api.patch(`/vehicles/${id}`, update);
    await fetchAll();
  };

  const addDriver = async (d: Omit<Driver, 'id'>) => {
    const data = await api.post<{ id: string }>('/drivers', {
      full_name: d.fullName, registration: d.registration,
      photo_url: d.photoUrl || null, status: d.status,
    });
    await fetchAll();
    return data?.id;
  };

  const updateDriver = async (id: string, d: Partial<Driver>) => {
    const update: any = {};
    if (d.fullName !== undefined) update.full_name = d.fullName;
    if (d.registration !== undefined) update.registration = d.registration;
    if (d.photoUrl !== undefined) update.photo_url = d.photoUrl;
    if (d.status !== undefined) update.status = d.status;
    await api.patch(`/drivers/${id}`, update);
    await fetchAll();
  };

  const addMovement = async (m: Omit<Movement, 'id'>) => {
    const username = user?.username || user?.fullName || user?.email || null;
    await api.post('/movements', {
      type: m.type, date: m.date, time: m.time,
      vehicle_id: m.vehicleId, driver_id: m.driverId,
      identification_status: m.identificationStatus,
      confirmed_by: m.confirmedBy, image_url: m.imageUrl || null,
      registered_by: user?.id,
      registered_by_username: userRole === 'dev' ? 'Teste' : username,
      registered_by_role: userRole === 'dev' ? 'teste' : userRole,
    });
    await api.patch(`/vehicles/${m.vehicleId}`, { in_yard: m.type === 'entry' });
    await fetchAll();
  };

  const updateMovement = async (id: string, m: Partial<Movement>) => {
    const update: any = {};
    if (m.vehicleId !== undefined) update.vehicle_id = m.vehicleId;
    if (m.driverId !== undefined) update.driver_id = m.driverId;
    if (m.identificationStatus !== undefined) update.identification_status = m.identificationStatus;
    if (m.confirmedBy !== undefined) update.confirmed_by = m.confirmedBy;
    await api.patch(`/movements/${id}`, update);
    await fetchAll();
  };

  const logDeletion = async (entityType: string, entityId: string, entityData: any) => {
    if (!user) return;
    const username = userRole === 'dev' ? 'Teste' : (user.username || user.fullName || user.email || 'unknown');
    await api.post('/deletion-logs', {
      entity_type: entityType,
      entity_id: entityId,
      entity_data: entityData,
      deleted_by: user.id,
      deleted_by_username: username,
    });
  };

  const deleteVehicle = async (id: string) => {
    const vehicle = vehicles.find(v => v.id === id);
    await api.delete(`/vehicles/${id}`);
    if (vehicle) await logDeletion('vehicle', id, vehicle);
    await fetchAll();
  };

  const deleteDriver = async (id: string) => {
    const driver = drivers.find(d => d.id === id);
    await api.delete(`/drivers/${id}`);
    if (driver) await logDeletion('driver', id, driver);
    await fetchAll();
  };

  const deleteMovement = async (id: string) => {
    const movement = movements.find(m => m.id === id);
    await api.delete(`/movements/${id}`);
    if (movement) await logDeletion('movement', id, movement);
    await fetchAll();
  };

  const getVehicle = useCallback((id: string) => vehicles.find(v => v.id === id), [vehicles]);
  const getDriver = useCallback((id: string) => drivers.find(d => d.id === id), [drivers]);

  return (
    <AppContext.Provider value={{
      vehicles, drivers, movements, loading,
      addVehicle, updateVehicle, addDriver, updateDriver,
      addMovement, updateMovement,
      deleteVehicle, deleteDriver, deleteMovement,
      getVehicle, getDriver, refresh: fetchAll,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
