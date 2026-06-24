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
  engineNumber: string;
  vin: string;
  colour: string;
  tare: number;
  registration: string;
  registrationExpiry: string;
  acquisitionDate: string;
  transferId: string;
  marketValue: number;
  roadworthyCertificate: string;
  roadworthyDate: string;
  roadworthyOdometer: number;
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

export type LightingColorName = 'Purple' | 'Blue' | 'Green' | 'Red' | 'White' | 'Orange' | 'Yellow' | 'Pink';
export type LightingZoneId = 'frontCabin' | 'rearCabin' | 'bootArea';
export type LightingControllerType = 'IR' | 'Bluetooth';
export type LightingStatus = 'online' | 'offline';

export interface LightingZone {
  id: LightingZoneId;
  name: string;
  controllerName: string;
  controllerType: LightingControllerType;
  status: LightingStatus;
  enabled: boolean;
  color: LightingColorName;
  brightness: number;
  notes: string;
}

export interface LightingAutomationRule {
  id: string;
  event: 'doorOpen' | 'bootOpen' | 'reverseGear' | 'parkingMode' | 'vehicleStatus';
  targetZones: LightingZoneId[];
  color: LightingColorName;
  brightness: number;
  enabled: boolean;
}

export interface LightingSystem {
  colors: Record<LightingColorName, string>;
  zones: LightingZone[];
  automationRules: LightingAutomationRule[];
  lastUpdated: string;
}

interface VehicleState {
  info: VehicleInfo;
  sensorData: SensorData;
  services: ServiceRecord[];
  tyres: TyreRecord[];
  repairs: RepairRecord[];
  reminders: ReminderRecord[];
  lighting: LightingSystem;
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

  updateLightingZone: (id: LightingZoneId, zone: Partial<LightingZone>) => void;
  setAllLighting: (enabled: boolean) => void;
  applyLightingPreset: (color: LightingColorName, brightness: number, targetZones?: LightingZoneId[]) => void;

  resetData: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

const lightingColors: Record<LightingColorName, string> = {
  Purple: '#8b5cf6',
  Blue: '#2563eb',
  Green: '#16a34a',
  Red: '#dc2626',
  White: '#f8fafc',
  Orange: '#f97316',
  Yellow: '#eab308',
  Pink: '#ec4899',
};

const defaultLighting: LightingSystem = {
  colors: lightingColors,
  zones: [
    {
      id: 'frontCabin',
      name: 'Front Cabin',
      controllerName: 'Anko IR controller',
      controllerType: 'IR',
      status: 'offline',
      enabled: true,
      color: 'Purple',
      brightness: 80,
      notes: 'Requires an IR blaster bridge to control from the web app.',
    },
    {
      id: 'rearCabin',
      name: 'Rear Cabin',
      controllerName: 'Anko IR controller',
      controllerType: 'IR',
      status: 'offline',
      enabled: true,
      color: 'Purple',
      brightness: 80,
      notes: 'Requires an IR blaster bridge to control from the web app.',
    },
    {
      id: 'bootArea',
      name: 'Boot Area',
      controllerName: 'Lotus Lantern Bluetooth controller',
      controllerType: 'Bluetooth',
      status: 'offline',
      enabled: true,
      color: 'Purple',
      brightness: 80,
      notes: 'Designed for future Bluetooth bridge or Web Bluetooth integration.',
    },
  ],
  automationRules: [
    { id: 'door-open', event: 'doorOpen', targetZones: ['frontCabin', 'rearCabin'], color: 'White', brightness: 100, enabled: false },
    { id: 'boot-open', event: 'bootOpen', targetZones: ['bootArea'], color: 'White', brightness: 100, enabled: false },
    { id: 'reverse-gear', event: 'reverseGear', targetZones: ['bootArea'], color: 'White', brightness: 100, enabled: false },
    { id: 'parking-mode', event: 'parkingMode', targetZones: ['frontCabin', 'rearCabin', 'bootArea'], color: 'Purple', brightness: 40, enabled: false },
    { id: 'vehicle-status', event: 'vehicleStatus', targetZones: ['frontCabin', 'rearCabin', 'bootArea'], color: 'Blue', brightness: 60, enabled: false },
  ],
  lastUpdated: new Date('2026-06-23').toISOString(),
};

const defaultInfo: VehicleInfo = {
  nickname: 'Steamy',
  name: '2010 Subaru Forester XS',
  year: '2010',
  make: 'Subaru',
  model: 'Forester XS (SH)',
  engine: '2.5L Petrol',
  engineNumber: 'E300652',
  vin: 'JF2SH9KL5AG056073',
  colour: 'Blue',
  tare: 1490,
  registration: '1MB1KE',
  registrationExpiry: '11 Nov 2026',
  acquisitionDate: '20 May 2026',
  transferId: '85380996 6',
  marketValue: 3000,
  roadworthyCertificate: 'N993847',
  roadworthyDate: '20 May 2026',
  roadworthyOdometer: 157981,
  insuranceProvider: 'RACV',
  insurancePolicyNumber: 'MOT 815 262 759',
  insurancePeriod: '21 May 2026 – 21 May 2027',
  insuranceType: 'Third Party Fire & Theft',
  odometer: 163278,
  photoUrl: '',
};

const defaultTyres: TyreRecord[] = [
  {
    id: '1', position: 'FL', brand: 'Wanli Harmonic Plus SP026 215/65R16 98V', pressure: 33, targetPressure: 33,
    condition: 'Excellent', installDate: new Date('2026-06-23').toISOString(), notes: 'New tyre fitted by JAX Tyres & Auto Caulfield South. Invoice 77598 / work order 061491.'
  },
  {
    id: '2', position: 'FR', brand: 'Unknown', pressure: 33, targetPressure: 33,
    condition: 'Good', installDate: '', notes: 'Checked about one month ago and confirmed OK.'
  },
  {
    id: '3', position: 'RL', brand: 'Wanli Harmonic Plus SP026 215/65R16 98V', pressure: 33, targetPressure: 33,
    condition: 'Excellent', installDate: new Date('2026-06-23').toISOString(), notes: 'New tyre fitted by JAX Tyres & Auto Caulfield South. Invoice 77598 / work order 061491.'
  },
  {
    id: '4', position: 'RR', brand: 'Wanli Harmonic Plus SP026 215/65R16 98V', pressure: 33, targetPressure: 33,
    condition: 'Excellent', installDate: new Date('2026-06-23').toISOString(), notes: 'New tyre fitted by JAX Tyres & Auto Caulfield South. Invoice 77598 / work order 061491.'
  },
  {
    id: '5', position: 'Spare', brand: 'Factory spare in boot', pressure: 33, targetPressure: 33,
    condition: 'Good', installDate: '', notes: 'Spare tyre confirmed present in the boot/spare wheel well on 23 Jun 2026. Roadworthy with adequate pressure.'
  },
];

const defaultRepairs: RepairRecord[] = [
  {
    id: 'r1', title: 'Front Left Tyre - Replace Blown Tyre', priority: 'High', status: 'Completed',
    notes: 'Completed at JAX Tyres & Auto Caulfield South on 23 Jun 2026 as part of three-tyre replacement. Invoice 77598 / work order 061491.',
    dateCreated: new Date('2026-06-01').toISOString()
  },
  {
    id: 'r2', title: 'Tyres - Replace Three at JAX', priority: 'Critical', status: 'Completed',
    notes: 'Completed at JAX Tyres & Auto Caulfield South on 23 Jun 2026. Three Wanli Harmonic Plus SP026 215/65R16 98V tyres fitted, balanced, with tubeless valves and waste tyre management. Invoice 77598 / work order 061491. Total paid $417.00.',
    dateCreated: new Date('2026-06-22').toISOString()
  },
  {
    id: 'r3', title: 'P0028 Pending DTC - Bank 2 Intake Valve Control', priority: 'High', status: 'In Progress',
    notes: 'Check engine light is not currently on, but owner OBD scan on 23 Jun 2026 showed pending DTC P0028: Intake Valve Control Solenoid Circuit Range/Performance Bank 2. Fault appears under high RPM/load with occasional hesitation under acceleration. Oil pressure switch was replaced by JAX on 2 Jun 2026 at 160,424 km, but this does not resolve the current pending P0028 issue. Next checks: Bank 2 intake valve control solenoid/OCV, wiring and connector, engine oil level/condition, oil passages, and full diagnostic confirmation with written fault code report.',
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
    notes: 'Service remains overdue. Current odometer is 163,278 km, approximately 1,278 km past the 162,000 km service interval. Full service still required: inspect engine oil condition, oil filter, air filter, cabin filter, spark plugs, and general vehicle health. Oil pressure switch was replaced at JAX Tyres on 2 Jun 2026, but this did not complete the scheduled service.',
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
    id: 's23', type: 'Three Tyres Fitted', provider: 'JAX Tyres & Auto Caulfield South',
    date: new Date('2026-06-23T12:11:00').toISOString(), odometer: 163278,
    status: 'OK', notes: 'Tax invoice 77598 / work order 061491. Fitted 3x Wanli Harmonic Plus SP026 215/65R16 98V tyres. Included balancing, tubeless valves, and waste tyre management. Paid $417.00 including GST $37.91.'
  },
  {
    id: 's24', type: 'Owner OBD Scan - Pending DTC P0028', provider: 'Owner scan / Ozito OBD reader',
    date: new Date('2026-06-23').toISOString(), odometer: 163278,
    status: 'DUE SOON', notes: 'Scanner showed pending DTC P0028: Intake Valve Control Solenoid Circuit Range/Performance Bank 2. Check engine light was not currently on, but symptom appears under high RPM/load. Needs diagnostic confirmation and repair quote.'
  },
  {
    id: 's20', type: '162,000 km Service', provider: '',
    date: new Date('2026-06-23').toISOString(), odometer: 163278,
    status: 'OVERDUE', notes: 'Scheduled service remains overdue at 163,278 km. Tyres were completed separately at JAX on 23 Jun 2026, but full service still needs engine oil condition, oil filter, air filter, cabin filter, spark plugs, and general vehicle health check.'
  },
  {
    id: 's21', type: 'Oil Filter Replacement', provider: 'JAX Tyres',
    date: new Date('2026-06-02T15:58:00').toISOString(), odometer: 160424,
    status: 'OK', notes: 'JAX Tyres & Auto Caulfield invoice 77151 / work order 060996. Replaced oil pressure switch. Paid $135.00. Check engine light remained on after work completed.'
  },
  {
    id: 's22', type: 'Roadworthy Certificate', provider: 'Prestige Auto Clinic',
    date: new Date('2026-05-20T14:23:00').toISOString(), odometer: 157981,
    status: 'OK', notes: 'Certificate N993847. Second examination result: Pass. Used for registration transfer.'
  },
];

const defaultReminders: ReminderRecord[] = [
  {
    id: 'rm1', title: 'Vehicle Registration', type: 'Rego',
    dueDate: new Date('2026-11-11').toISOString(), notes: 'Vic reg 1MB1KE expires 11 Nov 2026.', recurring: true, status: 'Upcoming'
  },
  {
    id: 'rm2', title: 'RACV Insurance Renewal', type: 'Insurance',
    dueDate: new Date('2027-05-21').toISOString(),
    notes: 'MOT 815 262 759 — Third Party Fire & Theft. Renews 21 May 2027.',
    recurring: true, status: 'Upcoming'
  },
  {
    id: 'rm3', title: 'Replace Rear Tyres', type: 'Tyre',
    dueDate: new Date('2026-06-23T10:00:00').toISOString(), notes: 'Completed 23 Jun 2026 at JAX Tyres & Auto Caulfield South. See invoice 77598 / service record.', recurring: false, status: 'Completed'
  },
  {
    id: 'rm7', title: 'Replace Blown Front-Left Tyre', type: 'Tyre',
    dueDate: new Date('2026-06-23T10:00:00').toISOString(), notes: 'Completed 23 Jun 2026 at JAX Tyres & Auto Caulfield South as part of three-tyre replacement. Confirm spare status separately.', recurring: false, status: 'Completed'
  },
  {
    id: 'rm4', title: 'Next Oil Change', type: 'Oil',
    dueDate: '', dueOdometer: 168000, notes: '', recurring: true, status: 'Upcoming'
  },
  {
    id: 'rm5', title: 'Diagnose P0028 - Bank 2 Intake Valve Control', type: 'Custom',
    dueDate: '', notes: 'Still required. Owner OBD scan showed pending DTC P0028: Intake Valve Control Solenoid Circuit Range/Performance Bank 2. Check engine light is not currently on, but the fault appears under high RPM/load. Ask mechanic to test Bank 2 OCV/intake valve control solenoid, wiring/connector, oil level/condition, oil passages, and provide written diagnosis plus repair quote.', recurring: false, status: 'Due Soon'
  },
  {
    id: 'rm8', title: 'Upcoming 162,000 km Service', type: 'Service',
    dueDate: '', dueOdometer: 162000, notes: 'Current odometer 163,278 km as of 23 Jun 2026, about 1,278 km past the 162,000 km service interval. Full service still needed: engine oil condition, oil filter, air filter, cabin filter, spark plugs, and general health check.', recurring: false, status: 'Upcoming'
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
      lighting: defaultLighting,
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

      updateLightingZone: (id, zone) => set((state) => ({
        lighting: {
          ...state.lighting,
          zones: state.lighting.zones.map(current => current.id === id ? { ...current, ...zone } : current),
          lastUpdated: new Date().toISOString(),
        }
      })),

      setAllLighting: (enabled) => set((state) => ({
        lighting: {
          ...state.lighting,
          zones: state.lighting.zones.map(zone => ({ ...zone, enabled })),
          lastUpdated: new Date().toISOString(),
        }
      })),

      applyLightingPreset: (color, brightness, targetZones) => set((state) => {
        const targetSet = new Set(targetZones ?? state.lighting.zones.map(zone => zone.id));

        return {
          lighting: {
            ...state.lighting,
            zones: state.lighting.zones.map(zone =>
              targetSet.has(zone.id) ? { ...zone, color, brightness, enabled: true } : zone
            ),
            lastUpdated: new Date().toISOString(),
          }
        };
      }),

      resetData: () => set({
        info: defaultInfo,
        services: defaultServices,
        tyres: defaultTyres,
        repairs: defaultRepairs,
        reminders: defaultReminders,
        lighting: defaultLighting,
        campingChecklists: [],
        quickNotes: ''
      })
    }),
    {
      name: 'vehicle-storage-v14',
      partialize: (state) => ({
        info: state.info,
        services: state.services,
        tyres: state.tyres,
        repairs: state.repairs,
        reminders: state.reminders,
        lighting: state.lighting,
        campingChecklists: state.campingChecklists,
        quickNotes: state.quickNotes
      }),
    }
  )
);

VehicleApi.subscribe((data) => {
  useVehicleStore.getState().updateSensorData(data);
});
VehicleApi.startTracking();
