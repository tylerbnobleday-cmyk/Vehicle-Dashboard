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
  outsideTemp: number | null;
  latitude: number | null;
  longitude: number | null;
  locationAccuracy: number | null;
  locationStatus: "idle" | "requesting" | "available" | "denied" | "unavailable";
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
  outsideTemp: null,
  latitude: null,
  longitude: null,
  locationAccuracy: null,
  locationStatus: "idle",
  engineRunning: false,
  timestamp: Date.now()
};

let simulationInterval: number | null = null;
let locationWatchId: number | null = null;
let lastWeatherFetch = 0;
type Listener = (data: SensorData) => void;
const listeners = new Set<Listener>();

let currentData = { ...defaultSensorData };

const notify = () => listeners.forEach(listener => listener(currentData));

async function updateWeather(latitude: number, longitude: number) {
  const now = Date.now();
  if (now - lastWeatherFetch < 10 * 60 * 1000) return;

  lastWeatherFetch = now;

  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m`
    );
    if (!response.ok) return;

    const data = await response.json();
    const temp = data?.current?.temperature_2m;
    if (typeof temp === "number") {
      currentData = { ...currentData, outsideTemp: temp, timestamp: Date.now() };
      notify();
    }
  } catch {
    // Weather is best-effort. Keep the last known location even if weather fails.
  }
}

export const VehicleApi = {
  startSimulation: () => {
    if (simulationInterval) return;
    simulationInterval = window.setInterval(() => {
      currentData = {
        ...currentData,
        timestamp: Date.now()
      };
      
      notify();
    }, 3000);

    if (!("geolocation" in navigator)) {
      currentData = { ...currentData, locationStatus: "unavailable", timestamp: Date.now() };
      notify();
      return;
    }

    currentData = { ...currentData, locationStatus: "requesting", timestamp: Date.now() };
    notify();

    locationWatchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        currentData = {
          ...currentData,
          latitude,
          longitude,
          locationAccuracy: accuracy,
          locationStatus: "available",
          timestamp: Date.now(),
        };
        notify();
        void updateWeather(latitude, longitude);
      },
      (error) => {
        currentData = {
          ...currentData,
          locationStatus: error.code === error.PERMISSION_DENIED ? "denied" : "unavailable",
          timestamp: Date.now(),
        };
        notify();
      },
      {
        enableHighAccuracy: true,
        maximumAge: 60_000,
        timeout: 15_000,
      }
    );
  },
  
  stopSimulation: () => {
    if (simulationInterval) {
      clearInterval(simulationInterval);
      simulationInterval = null;
    }
    if (locationWatchId !== null) {
      navigator.geolocation.clearWatch(locationWatchId);
      locationWatchId = null;
    }
  },
  
  subscribe: (listener: Listener) => {
    listeners.add(listener);
    listener(currentData);
    return () => listeners.delete(listener);
  },
  
  // For manual testing/overrides
  updateData: (data: Partial<SensorData>) => {
    currentData = { ...currentData, ...data, timestamp: Date.now() };
    notify();
  }
};
