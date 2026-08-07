import { Vehicle, Driver, Movement } from '@/types';

export const mockVehicles: Vehicle[] = [
  { id: '1', internalNumber: 'CARRO-01', vehicleType: 'Rainha', inYard: true },
  { id: '2', internalNumber: 'CARRO-02', vehicleType: 'STB', inYard: false },
  { id: '3', internalNumber: 'CARRO-03', vehicleType: 'Particular', inYard: true },
  { id: '4', internalNumber: 'CARRO-04', vehicleType: 'Rainha', inYard: false },
  { id: '5', internalNumber: 'CARRO-05', vehicleType: 'STB', inYard: true },
];

export const mockDrivers: Driver[] = [
  { id: '1', fullName: 'João Silva', registration: 'MOT-001', status: 'active' },
  { id: '2', fullName: 'Maria Santos', registration: 'MOT-002', status: 'active' },
  { id: '3', fullName: 'Carlos Oliveira', registration: 'MOT-003', status: 'active' },
  { id: '4', fullName: 'Ana Costa', registration: 'MOT-004', status: 'inactive' },
  { id: '5', fullName: 'Pedro Souza', registration: 'MOT-005', status: 'active' },
];

const today = new Date().toISOString().split('T')[0];
const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

export const mockMovements: Movement[] = [
  { id: '1', type: 'entry', date: today, time: '08:15', vehicleId: '1', driverId: '1', identificationStatus: 'automatic', confirmedBy: 'camera' },
  { id: '2', type: 'entry', date: today, time: '08:30', vehicleId: '3', driverId: '2', identificationStatus: 'automatic', confirmedBy: 'camera' },
  { id: '3', type: 'exit', date: today, time: '09:00', vehicleId: '2', driverId: '3', identificationStatus: 'manual', confirmedBy: 'gate' },
  { id: '4', type: 'entry', date: today, time: '09:45', vehicleId: '5', driverId: '5', identificationStatus: 'automatic', confirmedBy: 'camera' },
  { id: '5', type: 'exit', date: yesterday, time: '17:30', vehicleId: '1', driverId: '1', identificationStatus: 'automatic', confirmedBy: 'camera' },
  { id: '6', type: 'entry', date: yesterday, time: '07:00', vehicleId: '1', driverId: '1', identificationStatus: 'automatic', confirmedBy: 'camera' },
  { id: '7', type: 'entry', date: yesterday, time: '07:15', vehicleId: '2', driverId: '3', identificationStatus: 'manual', confirmedBy: 'gate' },
  { id: '8', type: 'exit', date: yesterday, time: '18:00', vehicleId: '2', driverId: '3', identificationStatus: 'automatic', confirmedBy: 'camera' },
];
