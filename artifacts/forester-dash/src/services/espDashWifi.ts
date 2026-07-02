import { VehicleApi } from "./vehicleApi";

export type EspDashConnectionStatus = "disconnected" | "connecting" | "connected" | "error" | "blocked";

export interface EspDashData {
  speedKmh?: number;
  rawSpeedKmh?: number;
  latitude?: number;
  longitude?: number;
  satellites?: number;
  fix?: boolean;
  speedLimitKmh?: number;
  overLimit?: boolean;
  tripKm?: number;
  odometerAddKm?: number;
  headingDeg?: number;
  staleLimit?: boolean;
  timestamp: number;
}

export interface EspDashState {
  status: EspDashConnectionStatus;
  data: EspDashData | null;
  error: string;
  url: string;
}

type Listener = (state: EspDashState) => void;

const DEFAULT_API_URL = "http://192.168.4.1";
const listeners = new Set<Listener>();

let pollTimer: ReturnType<typeof setInterval> | null = null;
let abortController: AbortController | null = null;
let state: EspDashState = {
  status: "disconnected",
  data: null,
  error: "",
  url: DEFAULT_API_URL,
};

function notify() {
  listeners.forEach((listener) => listener(state));
}

function setState(next: Partial<EspDashState>) {
  state = { ...state, ...next };
  notify();
}

function finiteNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return undefined;
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function optionalBoolean(value: unknown) {
  if (typeof value === "boolean") return value;
  if (value === 1 || value === "1" || value === "true") return true;
  if (value === 0 || value === "0" || value === "false") return false;
  return undefined;
}

export function parseEspDashJson(raw: string): EspDashData | null {
  try {
    const message = JSON.parse(raw) as Record<string, unknown>;
    if (message.type !== "dash") return null;

    const latitude = finiteNumber(message.latitude);
    const longitude = finiteNumber(message.longitude);
    const validLocation =
      latitude !== undefined &&
      longitude !== undefined &&
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180;

    const data: EspDashData = {
      timestamp: Date.now(),
    };

    const speedKmh = finiteNumber(message.speedKmh);
    if (speedKmh !== undefined) data.speedKmh = speedKmh;

    const rawSpeedKmh = finiteNumber(message.rawSpeedKmh);
    if (rawSpeedKmh !== undefined) data.rawSpeedKmh = rawSpeedKmh;

    if (validLocation) {
      data.latitude = latitude;
      data.longitude = longitude;
    }

    const satellites = finiteNumber(message.satellites);
    if (satellites !== undefined) data.satellites = satellites;

    const fix = optionalBoolean(message.fix);
    if (fix !== undefined) data.fix = fix;

    const speedLimitKmh = finiteNumber(message.speedLimitKmh);
    if (speedLimitKmh !== undefined) data.speedLimitKmh = speedLimitKmh;

    const overLimit = optionalBoolean(message.overLimit);
    if (overLimit !== undefined) data.overLimit = overLimit;

    const tripKm = finiteNumber(message.tripKm);
    if (tripKm !== undefined) data.tripKm = Math.max(0, tripKm);

    const odometerAddKm = finiteNumber(message.odometerAddKm);
    if (odometerAddKm !== undefined) data.odometerAddKm = Math.max(0, odometerAddKm);

    const headingDeg = finiteNumber(message.headingDeg);
    if (headingDeg !== undefined) data.headingDeg = headingDeg;

    const staleLimit = optionalBoolean(message.staleLimit);
    if (staleLimit !== undefined) data.staleLimit = staleLimit;

    return data;
  } catch {
    return null;
  }
}

function applyToVehicleApi(data: EspDashData) {
  const update: Parameters<typeof VehicleApi.updateData>[0] = {
    timestamp: Date.now(),
  };

  if (data.latitude !== undefined && data.longitude !== undefined) {
    update.latitude = data.latitude;
    update.longitude = data.longitude;
  }

  if (data.fix !== undefined) {
    update.locationAccuracy = data.fix ? 5 : null;
    update.locationStatus = data.fix ? "available" : "unavailable";
  }

  if (data.tripKm !== undefined) {
    update.estimatedDistanceKm = data.tripKm;
  }

  VehicleApi.updateData(update);
}

function apiUrl(baseUrl: string, path: string) {
  return `${baseUrl.replace(/\/$/, "")}${path}`;
}

function blockedByMixedContent(url: string) {
  return window.location.protocol === "https:" && url.startsWith("http://");
}

async function fetchDash(url: string) {
  abortController?.abort();
  abortController = new AbortController();

  const response = await fetch(apiUrl(url, "/api/dash"), {
    signal: abortController.signal,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`ESP returned HTTP ${response.status}`);
  }

  const raw = await response.text();
  const data = parseEspDashJson(raw);
  if (!data) {
    throw new Error("ESP sent dashboard data in an unexpected format.");
  }

  setState({ data, status: "connected", error: "" });
  applyToVehicleApi(data);
}

export const EspDashWifi = {
  defaultUrl: DEFAULT_API_URL,

  getState: () => state,

  subscribe: (listener: Listener) => {
    listeners.add(listener);
    listener(state);
    return () => listeners.delete(listener);
  },

  connect: (url = DEFAULT_API_URL) => {
    if (blockedByMixedContent(url)) {
      setState({
        status: "blocked",
        error: "GitHub Pages is HTTPS, so this browser may block http://192.168.4.1. Use local HTTP dev mode or the ESP-hosted page.",
        url,
      });
      return;
    }

    EspDashWifi.disconnect();
    setState({ status: "connecting", error: "", url });

    void fetchDash(url)
      .then(() => {
        pollTimer = setInterval(() => {
          void fetchDash(url).catch((error) => {
            setState({ status: "error", error: error instanceof Error ? error.message : "Could not read ESP GPS data." });
          });
        }, 1000);
      })
      .catch((error) => {
        setState({ status: "error", error: error instanceof Error ? error.message : "Could not connect to the ESP WiFi dash." });
      });
  },

  disconnect: () => {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
    abortController?.abort();
    abortController = null;
    setState({ status: "disconnected" });
  },

  sendCommand: (command: string, value?: number) => {
    if (state.status !== "connected") return false;

    const params = new URLSearchParams({ command });
    if (value !== undefined) params.set("value", String(value));

    void fetch(apiUrl(state.url, `/api/command?${params.toString()}`), {
      method: "POST",
      cache: "no-store",
    }).then(async (response) => {
      if (!response.ok) throw new Error(`ESP returned HTTP ${response.status}`);
      const data = parseEspDashJson(await response.text());
      if (data) {
        setState({ data, status: "connected", error: "" });
        applyToVehicleApi(data);
      }
    }).catch((error) => {
      setState({ status: "error", error: error instanceof Error ? error.message : "Could not send ESP command." });
    });

    return true;
  },
};
