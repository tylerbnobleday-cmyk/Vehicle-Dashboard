import { useVehicleStore, TyreRecord } from "@/store/vehicleStore";
import { VehicleApi, SensorData } from "@/services/vehicleApi";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, CircleDashed, Settings } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
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

const TYRE_BADGE_POSITION: Record<TyreRecord["position"], string> = {
  FL: "left-1 top-[17%]",
  FR: "right-1 top-[17%]",
  RL: "left-1 top-[68%]",
  RR: "right-1 top-[68%]",
  Spare: "left-1/2 bottom-2 -translate-x-1/2",
};

function TyreBadge({ tyre, onEdit }: { tyre: TyreRecord; onEdit: (tyre: TyreRecord) => void }) {
  const pressureOk = Math.abs(tyre.pressure - tyre.targetPressure) <= 1;
  const needsAttention = tyre.condition === "Replace" || tyre.condition === "Poor";
  const badgeColor = needsAttention
    ? "border-red-500/60 bg-red-500/15 text-red-200"
    : pressureOk
      ? "border-green-500/50 bg-green-500/15 text-green-100"
      : "border-amber-500/60 bg-amber-500/15 text-amber-100";

  return (
    <button
      type="button"
      onClick={() => onEdit(tyre)}
      className={`absolute z-20 min-w-[58px] rounded-lg border px-2 py-1 text-left shadow-lg backdrop-blur ${badgeColor} ${TYRE_BADGE_POSITION[tyre.position]}`}
      aria-label={`Edit ${tyre.position} tyre`}
    >
      <span className="block text-[10px] font-black leading-none">{tyre.position}</span>
      <span className="mt-0.5 block text-xs font-mono font-bold leading-none">{tyre.pressure} psi</span>
      <span className="mt-0.5 block max-w-[64px] truncate text-[9px] leading-none opacity-80">{tyre.condition}</span>
    </button>
  );
}

function ForesterPhoto({ s, tyres, onEditTyre }: { s: SensorData; tyres: TyreRecord[]; onEditTyre: (tyre: TyreRecord) => void }) {
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

      {tyres.map((tyre) => (
        <TyreBadge key={tyre.id} tyre={tyre} onEdit={onEditTyre} />
      ))}

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
        rounded="rounded-r-xl"
        style={{ top: "28%", right: "4%", width: "12%", height: "22%" }}
        label="OPEN"
      />

      {/* Passenger front door — right side, upper */}
      <PanelOverlay
        open={s.passengerDoor}
        rounded="rounded-l-xl"
        style={{ top: "28%", left: "4%", width: "12%", height: "22%" }}
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
  const tyres = useVehicleStore((s) => s.tyres);
  const updateTyre = useVehicleStore((s) => s.updateTyre);
  const [showToggles, setShowToggles] = useState(false);
  const [editingTyre, setEditingTyre] = useState<TyreRecord | null>(null);

  const toggleSensor = (key: keyof SensorData) => {
    if (typeof sensorData[key] === "boolean") {
      VehicleApi.updateData({ [key]: !sensorData[key] });
    }
  };

  const getPressureColor = (pressure: number, target: number) => {
    const diff = Math.abs(pressure - target);
    if (diff <= 1) return "text-green-500";
    if (diff <= 3) return "text-amber-500";
    return "text-red-500";
  };

  const formatInstallDate = (installDate: string) => {
    if (!installDate) return "date not set";
    const date = new Date(installDate);
    if (Number.isNaN(date.getTime())) return "date not set";
    return format(date, "MMM yyyy");
  };

  const handleSaveTyre = () => {
    if (!editingTyre) return;
    updateTyre(editingTyre.id, editingTyre);
    setEditingTyre(null);
  };

  return (
    <div className="min-h-[calc(100dvh-6rem)] flex flex-col pb-32">

      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vehicle</h1>
          <p className="text-sm text-muted-foreground">2010 Subaru Forester XS</p>
        </div>
      </div>

      {/* Top chips */}
      <div className="flex gap-2 justify-center flex-wrap px-4 py-1 shrink-0">
        <StatusChip label="Speed" value={`${sensorData.speed} km/h`} active={sensorData.speed > 0} />
      </div>

      {/* Main: side chips + car photo + side chips */}
      <div className="flex items-center justify-center gap-2 px-2 flex-1">

        {/* Left door chips */}
        <div className="flex flex-col gap-2 shrink-0 w-[90px]">
          <StatusChip label="Passenger Door" value={sensorData.passengerDoor ? "OPEN" : "Closed"} warning={sensorData.passengerDoor} />
          <StatusChip label="Rear Left Door" value={sensorData.rearLeftDoor ? "OPEN" : "Closed"} warning={sensorData.rearLeftDoor} />
        </div>

        {/* Photo + overlays */}
        <div className="flex-1 max-w-[260px]">
          <ForesterPhoto s={sensorData} tyres={tyres} onEditTyre={setEditingTyre} />
        </div>

        {/* Right door chips */}
        <div className="flex flex-col gap-2 shrink-0 w-[90px]">
          <StatusChip label="Driver Door" value={sensorData.driverDoor ? "OPEN" : "Closed"} warning={sensorData.driverDoor} />
          <StatusChip label="Rear Right Door" value={sensorData.rearRightDoor ? "OPEN" : "Closed"} warning={sensorData.rearRightDoor} />
        </div>
      </div>

      {/* Bottom status chips */}
      <div className="flex gap-2 justify-center flex-wrap px-4 pb-1 shrink-0">
        <StatusChip label="Outside" value={sensorData.outsideTemp === null ? "--" : `${sensorData.outsideTemp.toFixed(0)} C`} />
        <StatusChip label="Location" value={sensorData.locationStatus === "available" ? "ON" : sensorData.locationStatus === "cached" ? "LAST" : sensorData.locationStatus.toUpperCase()} active={sensorData.locationStatus === "available" || sensorData.locationStatus === "cached"} />
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

      <div className="mx-4 mb-3 shrink-0">
        <Card className="bg-card/35 border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-widest text-muted-foreground">
              <CircleDashed className="w-4 h-4" /> Tyres
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {tyres.map((tyre) => (
              <div key={tyre.id} className="rounded-xl border border-border/40 bg-background/40 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-lg font-black uppercase leading-none">{tyre.position}</p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">{tyre.brand}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => setEditingTyre(tyre)}>
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Pressure</p>
                    <p className={`text-xl font-mono font-bold ${getPressureColor(tyre.pressure, tyre.targetPressure)}`}>
                      {tyre.pressure}<span className="ml-1 text-xs text-muted-foreground">psi</span>
                    </p>
                  </div>
                  <StatusBadge status={tyre.condition} className="text-xs px-2 py-1" />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">Installed {formatInstallDate(tyre.installDate)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
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

      <Dialog open={!!editingTyre} onOpenChange={(open) => !open && setEditingTyre(null)}>
        <DialogContent className="sm:max-w-[500px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-2xl uppercase">Edit {editingTyre?.position} Tyre</DialogTitle>
          </DialogHeader>
          {editingTyre && (
            <div className="space-y-6 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label>Brand & Model</Label>
                  <Input value={editingTyre.brand} onChange={e => setEditingTyre({ ...editingTyre, brand: e.target.value })} className="h-12 text-lg" />
                </div>
                <div className="space-y-2">
                  <Label>Current Pressure (psi)</Label>
                  <Input type="number" value={editingTyre.pressure} onChange={e => setEditingTyre({ ...editingTyre, pressure: parseInt(e.target.value) || 0 })} className="h-12 text-lg" />
                </div>
                <div className="space-y-2">
                  <Label>Condition</Label>
                  <select
                    className="flex h-12 w-full rounded-md border border-input bg-transparent px-3 py-1 text-lg shadow-sm transition-colors"
                    value={editingTyre.condition}
                    onChange={e => setEditingTyre({ ...editingTyre, condition: e.target.value as TyreRecord["condition"] })}
                  >
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                    <option value="Replace">Replace</option>
                  </select>
                </div>
              </div>
              <Button onClick={handleSaveTyre} size="lg" className="w-full h-14 text-lg">Save Changes</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
