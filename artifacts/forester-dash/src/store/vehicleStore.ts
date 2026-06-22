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
    id: '1', position: 'FL', brand: 'Spare fitted', pressure: 33, targetPressure: 33,
    condition: 'Good', installDate: '', notes: 'Spare wheel is currently fitted on the front left.'
  },
  {
    id: '2', position: 'FR', brand: 'Unknown', pressure: 33, targetPressure: 33,
    condition: 'Good', installDate: '', notes: 'Checked about one month ago and confirmed OK.'
  },
  {
    id: '3', position: 'RL', brand: 'Unknown', pressure: 33, targetPressure: 33,
    condition: 'Replace', installDate: '', notes: 'Pressure is OK, but rear tyre needs replacement.'
  },
  {
    id: '4', position: 'RR', brand: 'Unknown', pressure: 33, targetPressure: 33,
    condition: 'Replace', installDate: '', notes: 'Pressure is OK, but rear tyre needs replacement.'
  },
  {
    id: '5', position: 'Spare', brand: 'Blown front-left tyre', pressure: 0, targetPressure: 33,
    condition: 'Replace', installDate: '', notes: 'Original front-left tyre is blown and stored in the boot. Replace before using as a spare.'
  },
];

const defaultRepairs: RepairRecord[] = [
  {
    id: 'r1', title: 'Front Left Tyre - Replace Blown Tyre', priority: 'High', status: 'Not Started',
    notes: 'Spare is currently fitted on the front left. Original front-left tyre is blown and stored in the boot.',
    dateCreated: new Date('2026-06-01').toISOString()
  },
  {
    id: 'r2', title: 'Rear Tyres - Replace', priority: 'Critical', status: 'Not Started',
    notes: 'Rear left and rear right tyres need replacement. Pressure is currently OK at 33 psi.',
    dateCreated: new Date('2026-06-22').toISOString()
  },
  {
    id: 'r3', title: 'Check Engine Light', priority: 'High', status: 'Not Started',
    notes: 'CEL active — cause unknown. Remained on after JAX Tyres oil filter work on 2 Jun 2026. Needs OBD scan.',
    dateCreated: new Date('2026-06-02').toISOString()
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
    id: 's-delivery', type: 'New Vehicle Delivery', provider: 'Autonexus Altona',
    date: new Date('2010-11-04').toISOString(), odometer: 0,
    status: 'OK', notes: 'Delivery completed. New vehicle from dealer.'
  },
  {
    id: 's01', type: '12,500 km / 6 Month Service', provider: 'Subaru Mentone',
    date: new Date('2011-06-05').toISOString(), odometer: 7076,
    status: 'OK', notes: ''
  },
  {
    id: 's02', type: '25,000 km / 12 Month Service', provider: 'Subaru Mentone',
    date: new Date('2011-12-23').toISOString(), odometer: 16258,
    status: 'OK', notes: ''
  },
  {
    id: 's03', type: '37,500 km / 18 Month Service', provider: 'Subaru Mentone',
    date: new Date('2012-07-05').toISOString(), odometer: 23502,
    status: 'OK', notes: ''
  },
  {
    id: 's04', type: '50,000 km / 24 Month Service', provider: 'Subaru Mentone',
    date: new Date('2013-01-10').toISOString(), odometer: 30039,
    status: 'OK', notes: ''
  },
  {
    id: 's05', type: '62,500 km / 30 Month Service', provider: 'Subaru Mentone',
    date: new Date('2013-06-28').toISOString(), odometer: 35781,
    status: 'OK', notes: ''
  },
  {
    id: 's06', type: '75,000 km / 36 Month Service', provider: 'Subaru Mentone',
    date: new Date('2014-04-07').toISOString(), odometer: 45238,
    status: 'OK', notes: ''
  },
  {
    id: 's07', type: '87,500 km Service', provider: 'Subaru Mentone',
    date: new Date('2015-01-14').toISOString(), odometer: 55633,
    status: 'OK', notes: ''
  },
  {
    id: 's08', type: '100,000 km Service', provider: 'Competition Tyres & More',
    date: new Date('2015-10-14').toISOString(), odometer: 64245,
    status: 'OK', notes: ''
  },
  {
    id: 's09', type: '112,500 km Service', provider: 'Subaru Mentone',
    date: new Date('2016-06-28').toISOString(), odometer: 71923,
    status: 'OK', notes: ''
  },
  {
    id: 's10', type: '125,000 km Service', provider: 'Carnegie Automotive',
    date: new Date('2017-01-13').toISOString(), odometer: 77789,
    status: 'OK', notes: ''
  },
  {
    id: 's11', type: 'Service Completed', provider: '',
    date: new Date('2017-07-11').toISOString(), odometer: 83054,
    status: 'OK', notes: ''
  },
  {
    id: 's12', type: '137,500 km Service', provider: 'Competition Tyres & More',
    date: new Date('2018-03-09').toISOString(), odometer: 89842,
    status: 'OK', notes: ''
  },
  {
    id: 's13', type: '150,000 km Service', provider: 'Ultra Tune McKinnon',
    date: new Date('2018-09-27').toISOString(), odometer: 94289,
    status: 'OK', notes: ''
  },
  {
    id: 's14', type: '162,500 km Service', provider: 'Ultra Tune McKinnon',
    date: new Date('2019-12-11').toISOString(), odometer: 104116,
    status: 'OK', notes: ''
  },
  {
    id: 's15', type: 'Service Completed', provider: 'Ultra Tune McKinnon',
    date: new Date('2021-07-28').toISOString(), odometer: 118432,
    status: 'OK', notes: ''
  },
  {
    id: 's16', type: 'Service Completed', provider: 'Ultra Tune McKinnon',
    date: new Date('2021-11-14').toISOString(), odometer: 123001,
    status: 'OK', notes: ''
  },
  {
    id: 's17', type: '175,000 km Service', provider: 'Ultra Tune McKinnon',
    date: new Date('2023-04-12').toISOString(), odometer: 130710,
    status: 'OK', notes: ''
  },
  {
    id: 's18', type: 'Service Completed', provider: 'Ultra Tune McKinnon',
    date: new Date('2024-09-23').toISOString(), odometer: 143073,
    status: 'OK', notes: ''
  },
  {
    id: 's19', type: '187,500 km Service', provider: 'Ultra Tune McKinnon',
    date: new Date('2025-07-10').toISOString(), odometer: 150376,
    status: 'OK', notes: ''
  },
  {
    id: 's20', type: '162,000 km Service', provider: '',
    date: new Date('2026-06-01').toISOString(), odometer: 163000,
    status: 'OVERDUE', notes: 'Next scheduled service. Not yet completed — oil filter replaced separately at JAX Tyres 2 Jun 2026, but full service (oil, spark plugs, filters) still required.'
  },
  {
    id: 's21', type: 'Oil Filter Replacement', provider: 'JAX Tyres',
    date: new Date('2026-06-02').toISOString(), odometer: 162000,
    status: 'OK', notes: 'Check engine light remained on after work completed.'
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
    id: 'rm3', title: 'Replace Rear Tyres', type: 'Tyre',
    dueDate: '', notes: 'Rear left and rear right tyres need replacement. Pressure is currently OK.', recurring: false, status: 'Due Soon'
  },
  {
    id: 'rm7', title: 'Replace Blown Front-Left Tyre', type: 'Tyre',
    dueDate: '', notes: 'Spare is fitted on the front left. Blown original front-left tyre is in the boot.', recurring: false, status: 'Due Soon'
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
      name: 'vehicle-storage-v6',
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
