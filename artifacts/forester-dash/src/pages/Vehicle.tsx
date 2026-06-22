import { useVehicleStore } from "@/store/vehicleStore";
import { VehicleApi, SensorData } from "@/services/vehicleApi";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import foresterTopdown from "@/assets/forester-topdown.png";

interface StatusChipProps {
  label: string;
  value: string;
  active?: boolean;
  warning?: boolean;
}

function StatusChip({ label, value, active, warning }: StatusChipProps) {
  return (
    <div className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl border text-center min-w-[72px] transition-all duration-300
      ${warning ? "bg-red-500/15 border-red-500/40 shadow-[0_0_12px_rgba(239,68,68,0.2)]"
        : active ? "bg-primary/10 border-primary/30"
        : "bg-card/60 border-border/40"}`}>
      <span className="text-[9px] uppercase tracking-widest font-semibold text-muted-foreground">{label}</span>
      <span className={`text-sm font-bold leading-tight ${warning ? "text-red-400" : active ? "text-primary" : "text-foreground"}`}>{value}</span>
    </div>
  );
}

// Overlay zone: percentage-based absolute positioning on the photo container
interface PanelOverlayProps {
  open: boolean;
  style: React.CSSProperties;
  label?: string;
  rounded?: string;
}

function PanelOverlay({ open, style, label, rounded = "rounded-lg" }: PanelOverlayProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className={`absolute pointer-events-none ${rounded}`}
          style={{
            ...style,
            background: "rgba(239,68,68,0.28)",
            border: "2px solid rgba(239,68,68,0.7)",
            boxShadow: "0 0 18px 4px rgba(239,68,68,0.45), inset 0 0 12px rgba(239,68,68,0.15)",
          }}
        >
          {label && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[10px] font-black text-white tracking-widest drop-shadow-lg">OPEN</span>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ForesterPhoto({ s }: { s: SensorData }) {
  // All positions are percentages of the container (which has the photo)
  // Calibrated against the generated top-down image (3:4 aspect, car fills ~85% width, centered)
  return (
    <div className="relative w-full" style={{ aspectRatio: "3/4" }}>
      {/* Base photo */}
      <img
        src={foresterTopdown}
        alt="Forester top-down"
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />

      {/* Bonnet overlay — top of image */}
      <PanelOverlay
        open={s.bonnet}
        rounded="rounded-t-2xl"
        style={{ top: "2%", left: "14%", right: "14%", height: "22%" }}
        label="BONNET"
      />

      {/* Driver front door — left side, upper */}
      <PanelOverlay
        open={s.driverDoor}
        rounded="rounded-l-xl"
        style={{ top: "28%", left: "4%", width: "12%", height: "22%" }}
        label="OPEN"
      />

      {/* Passenger front door — right side, upper */}
      <PanelOverlay
        open={s.passengerDoor}
        rounded="rounded-r-xl"
        style={{ top: "28%", right: "4%", width: "12%", height: "22%" }}
        label="OPEN"
      />

      {/* Rear left door — left side, lower */}
      <PanelOverlay
        open={s.rearLeftDoor}
        rounded="rounded-l-xl"
        style={{ top: "52%", left: "4%", width: "12%", height: "20%" }}
        label="OPEN"
      />

      {/* Rear right door — right side, lower */}
      <PanelOverlay
        open={s.rearRightDoor}
        rounded="rounded-r-xl"
        style={{ top: "52%", right: "4%", width: "12%", height: "20%" }}
        label="OPEN"
      />

      {/* Boot overlay — bottom of image */}
      <PanelOverlay
        open={s.boot}
        rounded="rounded-b-2xl"
        style={{ bottom: "2%", left: "14%", right: "14%", height: "20%" }}
        label="BOOT"
      />

      {/* Headlight glow — top corners */}
      <AnimatePresence>
        {s.headlights && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-x-0 top-0 h-24 pointer-events-none"
            style={{ background: "linear-gradient(to bottom, rgba(253,230,138,0.18), transparent)" }}
          />
        )}
      </AnimatePresence>

      {/* Interior light glow — center cabin */}
      <AnimatePresence>
        {s.interiorLights && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute pointer-events-none rounded-2xl"
            style={{
              top: "28%", left: "20%", right: "20%", height: "44%",
              background: "rgba(255,255,220,0.07)",
              boxShadow: "inset 0 0 30px rgba(255,255,200,0.12)",
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Vehicle() {
  const sensorData = useVehicleStore((s) => s.sensorData);
  const [showToggles, setShowToggles] = useState(false);

  const toggleSensor = (key: keyof SensorData) => {
    if (typeof sensorData[key] === "boolean") {
      VehicleApi.updateData({ [key]: !sensorData[key] });
    }
  };

  return (
    <div className="min-h-[calc(100dvh-6rem)] flex flex-col pb-4">

      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vehicle</h1>
          <p className="text-sm text-muted-foreground">2010 Subaru Forester XS</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold border transition-all duration-500
          ${sensorData.engineRunning ? "bg-green-500/10 border-green-500/40 text-green-400"
            : "bg-muted/40 border-border/40 text-muted-foreground"}`}>
          <span className={`w-2 h-2 rounded-full transition-colors duration-500 ${sensorData.engineRunning ? "bg-green-400 animate-pulse" : "bg-muted-foreground"}`} />
          {sensorData.engineRunning ? "ENGINE ON" : "ENGINE OFF"}
        </div>
      </div>

      {/* Top chips */}
      <div className="flex gap-2 justify-center flex-wrap px-4 py-1 shrink-0">
        <StatusChip label="Speed" value={`${sensorData.speed} km/h`} active={sensorData.speed > 0} />
        <StatusChip label="Handbrake" value={sensorData.handbrake ? "ON" : "OFF"} active={sensorData.handbrake} />
      </div>

      {/* Main: side chips + car photo + side chips */}
      <div className="flex items-center justify-center gap-2 px-2 flex-1">

        {/* Left door chips */}
        <div className="flex flex-col gap-2 shrink-0 w-[76px]">
          <StatusChip label="Driver" value={sensorData.driverDoor ? "OPEN" : "Closed"} warning={sensorData.driverDoor} />
          <StatusChip label="Rear L" value={sensorData.rearLeftDoor ? "OPEN" : "Closed"} warning={sensorData.rearLeftDoor} />
        </div>

        {/* Photo + overlays */}
        <div className="flex-1 max-w-[240px]">
          <ForesterPhoto s={sensorData} />
        </div>

        {/* Right door chips */}
        <div className="flex flex-col gap-2 shrink-0 w-[76px]">
          <StatusChip label="Passngr" value={sensorData.passengerDoor ? "OPEN" : "Closed"} warning={sensorData.passengerDoor} />
          <StatusChip label="Rear R" value={sensorData.rearRightDoor ? "OPEN" : "Closed"} warning={sensorData.rearRightDoor} />
        </div>
      </div>

      {/* Bottom status chips */}
      <div className="flex gap-2 justify-center flex-wrap px-4 pb-1 shrink-0">
        <StatusChip label="Outside" value={sensorData.outsideTemp === null ? "--" : `${sensorData.outsideTemp.toFixed(0)} C`} />
        <StatusChip label="Location" value={sensorData.locationStatus === "available" ? "ON" : sensorData.locationStatus.toUpperCase()} active={sensorData.locationStatus === "available"} />
        <StatusChip label="Bonnet" value={sensorData.bonnet ? "OPEN" : "Closed"} warning={sensorData.bonnet} />
        <StatusChip label="Boot" value={sensorData.boot ? "OPEN" : "Closed"} warning={sensorData.boot} />
      </div>

      {/* Lights row */}
      <div className="flex gap-2 justify-center flex-wrap px-4 pb-2 shrink-0">
        <StatusChip label="Headlights" value={sensorData.headlights ? "ON" : "Off"} active={sensorData.headlights} />
        <StatusChip label="Parking" value={sensorData.parkingLights ? "ON" : "Off"} active={sensorData.parkingLights} />
        <StatusChip label="Interior" value={sensorData.interiorLights ? "ON" : "Off"} active={sensorData.interiorLights} />
        <StatusChip label="Reverse" value={sensorData.reverseLight ? "ON" : "Off"} active={sensorData.reverseLight} />
      </div>

      {/* Simulation toggles — collapsible */}
      <div className="mx-4 shrink-0">
        <button
          data-testid="button-toggle-simulation"
          onClick={() => setShowToggles(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-card/40 border border-border/40 text-sm font-semibold text-muted-foreground hover:bg-card/60 transition-colors"
        >
          <span className="uppercase tracking-wider text-xs">Simulation Toggles</span>
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showToggles ? "rotate-180" : ""}`} />
        </button>
        <AnimatePresence>
          {showToggles && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-2 p-4 rounded-xl bg-card/30 border border-border/30 grid grid-cols-2 gap-4">
                {([
                  ["engineRunning", "Engine Running"],
                  ["handbrake", "Handbrake"],
                  ["driverDoor", "Driver Door"],
                  ["passengerDoor", "Passenger Door"],
                  ["rearLeftDoor", "Rear Left Door"],
                  ["rearRightDoor", "Rear Right Door"],
                  ["bonnet", "Bonnet"],
                  ["boot", "Boot"],
                  ["headlights", "Headlights"],
                  ["parkingLights", "Parking Lights"],
                  ["interiorLights", "Interior Lights"],
                  ["reverseLight", "Reverse Light"],
                ] as [keyof SensorData, string][]).map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between">
                    <Label className="text-sm cursor-pointer" htmlFor={key}>{label}</Label>
                    <Switch
                      id={key}
                      data-testid={`toggle-${key}`}
                      checked={!!sensorData[key]}
                      onCheckedChange={() => toggleSensor(key)}
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
