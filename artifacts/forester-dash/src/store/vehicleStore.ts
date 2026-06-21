import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SensorData, defaultSensorData, VehicleApi } from '../services/vehicleApi';

export interface VehicleInfo {
  name: string;
  year: string;
  make: string;
  model: string;
  registration: string;
  insurance: string;
  odometer: number;
  photoUrl: string;
}

export interface ServiceRecord {
  id: string;
  type: string;
  date: string;
  odometer: number;
  cost?: number;
  notes: string;
  status: 'OK' | 'DUE SOON' | 'OVERDUE';
  nextDueDate?: string;
  nextDueOdometer?: number;
}

export interface TyreRecord {
  id: string;
  position: 'FL' | 'FR' | 'RL' | 'RR' | 'Spare';
  brand: string;
  pressure: number;
  targetPressure: number;
  condition: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Replace';
  installDate: string;
  notes: string;
}

export interface RepairRecord {
  id: string;
  title: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Not Started' | 'Waiting for Parts' | 'In Progress' | 'Booked' | 'Completed';
  estimatedCost?: number;
  notes: string;
  dateCreated: string;
}

export interface ReminderRecord {
  id: string;
  title: string;
  type: 'Rego' | 'Insurance' | 'Service' | 'Tyre' | 'Oil' | 'Camping' | 'Custom';
  dueDate: string;
  dueOdometer?: number;
  notes: string;
  recurring: boolean;
  status: 'Upcoming' | 'Due Soon' | 'Completed';
}

export interface CampingChecklist {
  id: string;
  name: string;
  items: { id: string; category: string; name: string; checked: boolean }[];
}

interface VehicleState {
  info: VehicleInfo;
  sensorData: SensorData;
  services: ServiceRecord[];
  tyres: TyreRecord[];
  repairs: RepairRecord[];
  reminders: ReminderRecord[];
  campingChecklists: CampingChecklist[];
  quickNotes: string;
  
  // Actions
  updateInfo: (info: Partial<VehicleInfo>) => void;
  updateSensorData: (data: Partial<SensorData>) => void;
  updateQuickNotes: (notes: string) => void;
  
  // Service
  addService: (service: Omit<ServiceRecord, 'id'>) => void;
  updateService: (id: string, service: Partial<ServiceRecord>) => void;
  deleteService: (id: string) => void;
  
  // Tyres
  updateTyre: (id: string, tyre: Partial<TyreRecord>) => void;
  
  // Repairs
  addRepair: (repair: Omit<RepairRecord, 'id' | 'dateCreated'>) => void;
  updateRepair: (id: string, repair: Partial<RepairRecord>) => void;
  deleteRepair: (id: string) => void;
  
  // Reminders
  addReminder: (reminder: Omit<ReminderRecord, 'id'>) => void;
  updateReminder: (id: string, reminder: Partial<ReminderRecord>) => void;
  deleteReminder: (id: string) => void;
  
  // Data management
  resetData: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

const defaultTyres: TyreRecord[] = [
  { id: '1', position: 'FL', brand: 'Unknown', pressure: 33, targetPressure: 33, condition: 'Good', installDate: new Date().toISOString(), notes: '' },
  { id: '2', position: 'FR', brand: 'Unknown', pressure: 33, targetPressure: 33, condition: 'Good', installDate: new Date().toISOString(), notes: '' },
  { id: '3', position: 'RL', brand: 'Unknown', pressure: 33, targetPressure: 33, condition: 'Good', installDate: new Date().toISOString(), notes: '' },
  { id: '4', position: 'RR', brand: 'Unknown', pressure: 33, targetPressure: 33, condition: 'Good', installDate: new Date().toISOString(), notes: '' },
  { id: '5', position: 'Spare', brand: 'Unknown', pressure: 33, targetPressure: 33, condition: 'Good', installDate: new Date().toISOString(), notes: '' },
];

const defaultRepairs: RepairRecord[] = [
  { id: 'r1', title: '162,000 km Service', priority: 'Critical', status: 'In Progress', notes: 'Service is overdue, needs oil, filter, spark plugs', dateCreated: new Date().toISOString() },
  { id: 'r2', title: 'Front Left Bumper Repair', priority: 'Medium', status: 'Not Started', notes: 'Repair stone chip damage to front bumper', dateCreated: new Date().toISOString() },
  { id: 'r3', title: 'Fog Light Repair', priority: 'Medium', status: 'Not Started', notes: 'Left fog light not working', dateCreated: new Date().toISOString() },
  { id: 'r4', title: 'Rear Cargo Trim Repair', priority: 'Low', status: 'Not Started', notes: 'Fix loose rear cargo area trim panel', dateCreated: new Date().toISOString() },
  { id: 'r5', title: 'Rear Wiper Repair', priority: 'Medium', status: 'Waiting for Parts', notes: 'Rear wiper blade worn, ordered replacement', dateCreated: new Date().toISOString() },
  { id: 'r6', title: 'Tyre Replacement/Check', priority: 'High', status: 'Not Started', notes: 'Check tread depth and replace if needed', dateCreated: new Date().toISOString() },
  { id: 'r7', title: 'Check Engine Light Investigation', priority: 'Critical', status: 'Not Started', notes: 'CEL came on, needs OBD scan', dateCreated: new Date().toISOString() },
];

const defaultReminders: ReminderRecord[] = [
  { id: 'rm1', title: 'Vehicle Registration', type: 'Rego', dueDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(), notes: '', recurring: true, status: 'Upcoming' },
  { id: 'rm2', title: 'Comprehensive Insurance', type: 'Insurance', dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), notes: '', recurring: true, status: 'Upcoming' },
  { id: 'rm3', title: 'Next Oil Change', type: 'Oil', dueDate: '', dueOdometer: 168000, notes: '', recurring: true, status: 'Upcoming' },
  { id: 'rm4', title: 'Tyre Rotation', type: 'Tyre', dueDate: '', dueOdometer: 170000, notes: '', recurring: true, status: 'Upcoming' },
  { id: 'rm5', title: 'Next Camping Trip', type: 'Camping', dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), notes: 'Grampians trip', recurring: false, status: 'Due Soon' },
];

const defaultServices: ServiceRecord[] = [
  { id: 's1', type: '162,000 km Service', date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), odometer: 162000, status: 'OVERDUE', notes: 'Needs oil, filter, spark plugs' }
];

export const useVehicleStore = create<VehicleState>()(
  persist(
    (set) => ({
      info: {
        name: '2010 Subaru Forester XS',
        year: '2010',
        make: 'Subaru',
        model: 'Forester XS',
        registration: '',
        insurance: '',
        odometer: 163000,
        photoUrl: '',
      },
      sensorData: defaultSensorData,
      services: defaultServices,
      tyres: defaultTyres,
      repairs: defaultRepairs,
      reminders: defaultReminders,
      campingChecklists: [],
      quickNotes: '',
      
      updateInfo: (info) => set((state) => ({ info: { ...state.info, ...info } })),
      updateSensorData: (data) => set((state) => ({ sensorData: { ...state.sensorData, ...data } })),
      updateQuickNotes: (notes) => set({ quickNotes: notes }),
      
      addService: (service) => set((state) => ({ services: [...state.services, { ...service, id: generateId() }] })),
      updateService: (id, service) => set((state) => ({ 
        services: state.services.map(s => s.id === id ? { ...s, ...service } : s) 
      })),
      deleteService: (id) => set((state) => ({ services: state.services.filter(s => s.id !== id) })),
      
      updateTyre: (id, tyre) => set((state) => ({ 
        tyres: state.tyres.map(t => t.id === id ? { ...t, ...tyre } : t) 
      })),
      
      addRepair: (repair) => set((state) => ({ 
        repairs: [...state.repairs, { ...repair, id: generateId(), dateCreated: new Date().toISOString() }] 
      })),
      updateRepair: (id, repair) => set((state) => ({ 
        repairs: state.repairs.map(r => r.id === id ? { ...r, ...repair } : r) 
      })),
      deleteRepair: (id) => set((state) => ({ repairs: state.repairs.filter(r => r.id !== id) })),
      
      addReminder: (reminder) => set((state) => ({ 
        reminders: [...state.reminders, { ...reminder, id: generateId() }] 
      })),
      updateReminder: (id, reminder) => set((state) => ({ 
        reminders: state.reminders.map(r => r.id === id ? { ...r, ...reminder } : r) 
      })),
      deleteReminder: (id) => set((state) => ({ reminders: state.reminders.filter(r => r.id !== id) })),
      
      resetData: () => set({
        info: {
          name: '2010 Subaru Forester XS',
          year: '2010',
          make: 'Subaru',
          model: 'Forester XS',
          registration: '',
          insurance: '',
          odometer: 163000,
          photoUrl: '',
        },
        services: defaultServices,
        tyres: defaultTyres,
        repairs: defaultRepairs,
        reminders: defaultReminders,
        campingChecklists: [],
        quickNotes: ''
      })
    }),
    {
      name: 'vehicle-storage',
      partialize: (state) => ({
        info: state.info,
        services: state.services,
        tyres: state.tyres,
        repairs: state.repairs,
        reminders: state.reminders,
        campingChecklists: state.campingChecklists,
        quickNotes: state.quickNotes
      }), // Don't persist sensorData
    }
  )
);

// Subscribe to vehicle API updates
VehicleApi.subscribe((data) => {
  useVehicleStore.getState().updateSensorData(data);
});
VehicleApi.startSimulation();
