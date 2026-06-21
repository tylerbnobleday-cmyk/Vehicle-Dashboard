import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SensorData, defaultSensorData, VehicleApi } from '../services/vehicleApi';

export interface VehicleInfo {
  nickname: string;
  name: string;
  year: string;
  make: string;
  model: string;
  engine: string;
  registration: string;
  insuranceProvider: string;
  insurancePolicyNumber: string;
  insurancePeriod: string;
  insuranceType: string;
  odometer: number;
  photoUrl: string;
}

export interface ServiceRecord {
  id: string;
  type: string;
  provider?: string;
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

  updateInfo: (info: Partial<VehicleInfo>) => void;
  updateSensorData: (data: Partial<SensorData>) => void;
  updateQuickNotes: (notes: string) => void;

  addService: (service: Omit<ServiceRecord, 'id'>) => void;
  updateService: (id: string, service: Partial<ServiceRecord>) => void;
  deleteService: (id: string) => void;

  updateTyre: (id: string, tyre: Partial<TyreRecord>) => void;

  addRepair: (repair: Omit<RepairRecord, 'id' | 'dateCreated'>) => void;
  updateRepair: (id: string, repair: Partial<RepairRecord>) => void;
  deleteRepair: (id: string) => void;

  addReminder: (reminder: Omit<ReminderRecord, 'id'>) => void;
  updateReminder: (id: string, reminder: Partial<ReminderRecord>) => void;
  deleteReminder: (id: string) => void;

  resetData: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

const defaultInfo: VehicleInfo = {
  nickname: 'Steamy',
  name: '2010 Subaru Forester XS',
  year: '2010',
  make: 'Subaru',
  model: 'Forester XS (SH)',
  engine: '2.5L Petrol',
  registration: '1MB1KE',
  insuranceProvider: 'RACV',
  insurancePolicyNumber: 'MOT 815 262 759',
  insurancePeriod: '21 May 2026 – 21 May 2027',
  insuranceType: 'Third Party Fire & Theft',
  odometer: 163000,
  photoUrl: '',
};

const defaultTyres: TyreRecord[] = [
  {
    id: '1', position: 'FL', brand: 'Unknown', pressure: 0, targetPressure: 33,
    condition: 'Poor', installDate: '', notes: 'Needs inspection — condition requires assessment'
  },
  {
    id: '2', position: 'FR', brand: 'Unknown', pressure: 0, targetPressure: 33,
    condition: 'Fair', installDate: '', notes: 'Serviceable — pressure unknown'
  },
  {
    id: '3', position: 'RL', brand: 'Unknown', pressure: 0, targetPressure: 33,
    condition: 'Replace', installDate: '', notes: 'DANGEROUS — Tread worn out, steel belts/wires visible. Replace immediately.'
  },
  {
    id: '4', position: 'RR', brand: 'Unknown', pressure: 0, targetPressure: 33,
    condition: 'Replace', installDate: '', notes: 'DANGEROUS — Tread worn out, steel belts/wires visible. Replace immediately.'
  },
  {
    id: '5', position: 'Spare', brand: 'Unknown', pressure: 0, targetPressure: 33,
    condition: 'Good', installDate: '', notes: 'Available'
  },
];

const defaultRepairs: RepairRecord[] = [
  {
    id: 'r1', title: 'Rear Left Tyre — Replace', priority: 'Critical', status: 'Not Started',
    notes: 'Tread worn out, steel belts/wires visible. Replace immediately — dangerous condition.',
    dateCreated: new Date('2026-06-01').toISOString()
  },
  {
    id: 'r2', title: 'Rear Right Tyre — Replace', priority: 'Critical', status: 'Not Started',
    notes: 'Tread worn out, steel belts/wires visible. Replace immediately — dangerous condition.',
    dateCreated: new Date('2026-06-01').toISOString()
  },
  {
    id: 'r3', title: 'Check Engine Light', priority: 'High', status: 'Not Started',
    notes: 'CEL active — cause unknown. Remained on after JAX Tyres oil filter work on 2 Jun 2026. Needs OBD scan.',
    dateCreated: new Date('2026-06-02').toISOString()
  },
  {
    id: 'r4', title: 'Front Left Tyre — Inspect', priority: 'High', status: 'Not Started',
    notes: 'Condition requires assessment. Likely needs replacement.',
    dateCreated: new Date('2026-06-01').toISOString()
  },
  {
    id: 'r5', title: 'Rear Wiper — Diagnose', priority: 'High', status: 'In Progress',
    notes: 'New arm installed but system still not working. Requires further diagnosis.',
    dateCreated: new Date('2026-05-15').toISOString()
  },
  {
    id: 'r6', title: 'Front Left Bumper', priority: 'Medium', status: 'Not Started',
    notes: 'Previous crack and temporary repairs completed. Permanent repair needed.',
    dateCreated: new Date('2026-05-01').toISOString()
  },
  {
    id: 'r7', title: 'Left Fog Light', priority: 'Medium', status: 'Not Started',
    notes: 'Housing and bulb damaged. Needs replacement.',
    dateCreated: new Date('2026-05-01').toISOString()
  },
  {
    id: 'r8', title: 'Rear Cargo Trim', priority: 'Low', status: 'Not Started',
    notes: 'Has fallen down previously. Requires clip repair to secure properly.',
    dateCreated: new Date('2026-05-01').toISOString()
  },
  {
    id: 'r9', title: '162,000 km Full Service', priority: 'High', status: 'Not Started',
    notes: 'Service overdue — needs oil change, air filter, cabin filter, spark plugs. Oil filter replaced at JAX Tyres 2 Jun 2026.',
    dateCreated: new Date('2026-06-01').toISOString()
  },
];

const defaultServices: ServiceRecord[] = [
  {
    id: 's1', type: 'Oil Filter Replacement', provider: 'JAX Tyres',
    date: new Date('2026-06-02').toISOString(), odometer: 163000,
    status: 'OK', notes: 'Check engine light remained on after work completed.'
  },
  {
    id: 's2', type: '162,000 km Service', provider: '',
    date: new Date('2026-01-01').toISOString(), odometer: 162000,
    status: 'OVERDUE', notes: 'Full service overdue. Oil filter done at JAX 2 Jun. Remaining items still needed.'
  },
];

const defaultReminders: ReminderRecord[] = [
  {
    id: 'rm1', title: 'Vehicle Registration', type: 'Rego',
    dueDate: '', notes: 'Vic — 1MB1KE', recurring: true, status: 'Upcoming'
  },
  {
    id: 'rm2', title: 'RACV Insurance Renewal', type: 'Insurance',
    dueDate: new Date('2027-05-21').toISOString(),
    notes: 'MOT 815 262 759 — Third Party Fire & Theft. Renews 21 May 2027.',
    recurring: true, status: 'Upcoming'
  },
  {
    id: 'rm3', title: 'Tyre Replacement — Rear', type: 'Tyre',
    dueDate: '', notes: 'RL and RR are bald/dangerous. Do not delay.', recurring: false, status: 'Due Soon'
  },
  {
    id: 'rm4', title: 'Next Oil Change', type: 'Oil',
    dueDate: '', dueOdometer: 168000, notes: '', recurring: true, status: 'Upcoming'
  },
  {
    id: 'rm5', title: 'OBD Scan — CEL', type: 'Custom',
    dueDate: '', notes: 'Check engine light active — scan to find fault code', recurring: false, status: 'Due Soon'
  },
  {
    id: 'rm6', title: 'Next Camping Trip', type: 'Camping',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Grampians trip', recurring: false, status: 'Due Soon'
  },
];

export const useVehicleStore = create<VehicleState>()(
  persist(
    (set) => ({
      info: defaultInfo,
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
        info: defaultInfo,
        services: defaultServices,
        tyres: defaultTyres,
        repairs: defaultRepairs,
        reminders: defaultReminders,
        campingChecklists: [],
        quickNotes: ''
      })
    }),
    {
      name: 'vehicle-storage-v2',
      partialize: (state) => ({
        info: state.info,
        services: state.services,
        tyres: state.tyres,
        repairs: state.repairs,
        reminders: state.reminders,
        campingChecklists: state.campingChecklists,
        quickNotes: state.quickNotes
      }),
    }
  )
);

VehicleApi.subscribe((data) => {
  useVehicleStore.getState().updateSensorData(data);
});
VehicleApi.startSimulation();
