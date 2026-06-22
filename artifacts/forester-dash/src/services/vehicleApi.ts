export interface SensorData {
  speed: number;
  driverDoor: boolean;
  passengerDoor: boolean;
  rearLeftDoor: boolean;
  rearRightDoor: boolean;
  boot: boolean;
  bonnet: boolean;
  handbrake: boolean;
  headlights: boolean;
  parkingLights: boolean;
  interiorLights: boolean;
  reverseLight: boolean;
  cabinTemp: number;
  outsideTemp: number;
  engineRunning: boolean;
  timestamp: number;
}

export const defaultSensorData: SensorData = {
  speed: 0,
  driverDoor: false,
  passengerDoor: false,
  rearLeftDoor: false,
  rearRightDoor: false,
  boot: false,
  bonnet: false,
  handbrake: true,
  headlights: false,
  parkingLights: false,
  interiorLights: false,
  reverseLight: false,
  cabinTemp: 22,
  outsideTemp: 16,
  engineRunning: false,
  timestamp: Date.now()
};

let simulationInterval: number | null = null;
type Listener = (data: SensorData) => void;
const listeners = new Set<Listener>();

let currentData = { ...defaultSensorData };

export const VehicleApi = {
  startSimulation: () => {
    if (simulationInterval) return;
    simulationInterval = window.setInterval(() => {
      // Simulate minor variations
      currentData = {
        ...currentData,
        cabinTemp: currentData.cabinTemp + (Math.random() * 0.2 - 0.1),
        outsideTemp: currentData.outsideTemp + (Math.random() * 0.1 - 0.05),
        timestamp: Date.now()
      };
      
      listeners.forEach(listener => listener(currentData));
    }, 3000);
  },
  
  stopSimulation: () => {
    if (simulationInterval) {
      clearInterval(simulationInterval);
      simulationInterval = null;
    }
  },
  
  subscribe: (listener: Listener) => {
    listeners.add(listener);
    listener(currentData); // Send initial data immediately
    return () => listeners.delete(listener);
  },
  
  // For manual testing/overrides
  updateData: (data: Partial<SensorData>) => {
    currentData = { ...currentData, ...data, timestamp: Date.now() };
    listeners.forEach(listener => listener(currentData));
  }
};
