export interface SensorData {
  outsideTemp: number | null;
  latitude: number | null;
  longitude: number | null;
  locationAccuracy: number | null;
  locationStatus: "disabled" | "idle" | "requesting" | "available" | "cached" | "denied" | "unavailable";
  estimatedDistanceKm: number;
  timestamp: number;
}

export const defaultSensorData: SensorData = {
  outsideTemp: null,
  latitude: null,
  longitude: null,
  locationAccuracy: null,
  locationStatus: "disabled",
  estimatedDistanceKm: 0,
  timestamp: Date.now()
};

let locationWatchId: number | null = null;
let lastWeatherFetch = 0;
type Listener = (data: SensorData) => void;
const listeners = new Set<Listener>();

let currentData = { ...defaultSensorData };

const notify = () => listeners.forEach(listener => listener(currentData));
const TRUSTED_DEVICE_KEY = "forester-dash-trusted-location-device";
const LAST_LOCATION_KEY = "forester-dash-last-tablet-location";
const ESTIMATED_DISTANCE_KEY = "forester-dash-estimated-distance-km";

const isTrustedLocationDevice = () =>
  typeof window !== "undefined" && localStorage.getItem(TRUSTED_DEVICE_KEY) === "true";

function loadEstimatedDistance() {
  if (typeof window === "undefined") return 0;
  const saved = Number(localStorage.getItem(ESTIMATED_DISTANCE_KEY) || 0);
  return Number.isFinite(saved) ? saved : 0;
}

function saveEstimatedDistance(distanceKm: number) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ESTIMATED_DISTANCE_KEY, String(Math.max(0, distanceKm)));
}

function distanceKmBetween(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
  const toRad = (value: number) => value * Math.PI / 180;
  const earthKm = 6371;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return earthKm * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function loadLastTabletLocation() {
  if (typeof window === "undefined") return null;

  try {
    const saved = localStorage.getItem(LAST_LOCATION_KEY);
    if (!saved) return null;

    const parsed = JSON.parse(saved) as Partial<SensorData>;
    if (typeof parsed.latitude !== "number" || typeof parsed.longitude !== "number") {
      return null;
    }

    return {
      latitude: parsed.latitude,
      longitude: parsed.longitude,
      locationAccuracy: typeof parsed.locationAccuracy === "number" ? parsed.locationAccuracy : null,
      outsideTemp: typeof parsed.outsideTemp === "number" ? parsed.outsideTemp : null,
      estimatedDistanceKm: typeof parsed.estimatedDistanceKm === "number" ? parsed.estimatedDistanceKm : loadEstimatedDistance(),
      timestamp: typeof parsed.timestamp === "number" ? parsed.timestamp : Date.now(),
    };
  } catch {
    return null;
  }
}

function saveLastTabletLocation(data: SensorData) {
  if (typeof window === "undefined" || data.latitude === null || data.longitude === null) return;

  localStorage.setItem(
    LAST_LOCATION_KEY,
    JSON.stringify({
      latitude: data.latitude,
      longitude: data.longitude,
      locationAccuracy: data.locationAccuracy,
      outsideTemp: data.outsideTemp,
      estimatedDistanceKm: data.estimatedDistanceKm,
      timestamp: data.timestamp,
    })
  );
  saveEstimatedDistance(data.estimatedDistanceKm);
}

function useLastTabletLocation(status: SensorData["locationStatus"] = "cached") {
  const lastLocation = loadLastTabletLocation();
  if (!lastLocation) return false;

  currentData = {
    ...currentData,
    ...lastLocation,
    locationStatus: status,
    timestamp: Date.now(),
  };
  notify();
  return true;
}

function clearLocationData(status: SensorData["locationStatus"] = "disabled") {
  currentData = {
    ...currentData,
    outsideTemp: null,
    latitude: null,
    longitude: null,
    locationAccuracy: null,
    locationStatus: status,
    timestamp: Date.now(),
  };
  notify();
}

function stopLocationWatch() {
  if (locationWatchId !== null) {
    navigator.geolocation.clearWatch(locationWatchId);
    locationWatchId = null;
  }
}

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
  startTracking: () => {
    if (!isTrustedLocationDevice()) {
      clearLocationData("disabled");
      return;
    }

    useLastTabletLocation("cached");

    if (!("geolocation" in navigator)) {
      if (!useLastTabletLocation("cached")) {
        currentData = { ...currentData, locationStatus: "unavailable", timestamp: Date.now() };
        notify();
      }
      return;
    }

    currentData = { ...currentData, locationStatus: "requesting", timestamp: Date.now() };
    notify();

    locationWatchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const previous =
          currentData.latitude !== null && currentData.longitude !== null
            ? { latitude: currentData.latitude, longitude: currentData.longitude }
            : null;
        const next = { latitude, longitude };
        const movementKm = previous ? distanceKmBetween(previous, next) : 0;
        const plausibleMovement = accuracy <= 100 && movementKm > 0.01 && movementKm < 5;
        const estimatedDistanceKm = plausibleMovement
          ? currentData.estimatedDistanceKm + movementKm
          : currentData.estimatedDistanceKm;

        currentData = {
          ...currentData,
          latitude,
          longitude,
          locationAccuracy: accuracy,
          locationStatus: "available",
          estimatedDistanceKm,
          timestamp: Date.now(),
        };
        saveLastTabletLocation(currentData);
        notify();
        void updateWeather(latitude, longitude);
      },
      (error) => {
        const fallbackStatus = error.code === error.PERMISSION_DENIED ? "denied" : "unavailable";
        if (useLastTabletLocation("cached")) return;

        currentData = {
          ...currentData,
          locationStatus: fallbackStatus,
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
  
  stopTracking: () => {
    stopLocationWatch();
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
  },

  resetEstimatedDistance: () => {
    currentData = { ...currentData, estimatedDistanceKm: 0, timestamp: Date.now() };
    saveEstimatedDistance(0);
    saveLastTabletLocation(currentData);
    notify();
  },

  isTrustedLocationDevice,

  setTrustedLocationDevice: (trusted: boolean) => {
    if (trusted) {
      localStorage.setItem(TRUSTED_DEVICE_KEY, "true");
      VehicleApi.stopTracking();
      VehicleApi.startTracking();
    } else {
      localStorage.removeItem(TRUSTED_DEVICE_KEY);
      localStorage.removeItem(LAST_LOCATION_KEY);
      localStorage.removeItem(ESTIMATED_DISTANCE_KEY);
      stopLocationWatch();
      clearLocationData("disabled");
    }
  }
};
