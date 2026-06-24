import { useState } from "react";
import { format } from "date-fns";
import { CalendarDays, CircleDashed, Gauge, Settings, TriangleAlert, Wrench } from "lucide-react";
import { useVehicleStore, TyreRecord } from "@/store/vehicleStore";
import { VehicleApi } from "@/services/vehicleApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import foresterTopdown from "@/assets/forester-topdown.png";

const TYRE_BADGE_POSITION: Record<TyreRecord["position"], string> = {
  FL: "left-1 top-[17%]",
  FR: "right-1 top-[17%]",
  RL: "left-1 top-[68%]",
  RR: "right-1 top-[68%]",
  Spare: "left-1/2 bottom-2 -translate-x-1/2",
};

function pressureColor(pressure: number, target: number) {
  const diff = Math.abs(pressure - target);
  if (diff <= 1) return "text-green-400";
  if (diff <= 3) return "text-amber-400";
  return "text-red-400";
}

function tyreBadgeTone(tyre: TyreRecord) {
  const pressureOk = Math.abs(tyre.pressure - tyre.targetPressure) <= 1;
  if (tyre.condition === "Replace" || tyre.condition === "Poor") {
    return "border-red-500/60 bg-red-500/15 text-red-100";
  }
  if (pressureOk) return "border-green-500/50 bg-green-500/15 text-green-100";
  return "border-amber-500/60 bg-amber-500/15 text-amber-100";
}

function formatInstallDate(installDate: string) {
  if (!installDate) return "date not set";
  const date = new Date(installDate);
  if (Number.isNaN(date.getTime())) return "date not set";
  return format(date, "MMM yyyy");
}

function TyreBadge({ tyre, onEdit }: { tyre: TyreRecord; onEdit: (tyre: TyreRecord) => void }) {
  return (
    <button
      type="button"
      onClick={() => onEdit(tyre)}
      className={`absolute z-10 min-w-[58px] rounded-lg border px-2 py-1 text-left shadow-lg backdrop-blur ${tyreBadgeTone(tyre)} ${TYRE_BADGE_POSITION[tyre.position]}`}
      aria-label={`Edit ${tyre.position} tyre`}
    >
      <span className="block text-[10px] font-black leading-none">{tyre.position}</span>
      <span className="mt-0.5 block text-xs font-mono font-bold leading-none">{tyre.pressure} psi</span>
      <span className="mt-0.5 block max-w-[64px] truncate text-[9px] leading-none opacity-80">{tyre.condition}</span>
    </button>
  );
}

export default function Vehicle() {
  const info = useVehicleStore((state) => state.info);
  const sensorData = useVehicleStore((state) => state.sensorData);
  const tyres = useVehicleStore((state) => state.tyres);
  const services = useVehicleStore((state) => state.services);
  const repairs = useVehicleStore((state) => state.repairs);
  const updateInfo = useVehicleStore((state) => state.updateInfo);
  const updateTyre = useVehicleStore((state) => state.updateTyre);
  const [editingTyre, setEditingTyre] = useState<TyreRecord | null>(null);

  const overdueServices = services.filter((service) => service.status === "OVERDUE");
  const openRepairs = repairs.filter((repair) => repair.status !== "Completed");
  const tyreWarnings = tyres.filter((tyre) => tyre.condition === "Replace" || tyre.condition === "Poor").length;
  const latestService = [...services]
    .filter((service) => service.status === "OK")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

  const handleSaveTyre = () => {
    if (!editingTyre) return;
    updateTyre(editingTyre.id, editingTyre);
    setEditingTyre(null);
  };

  const estimatedKmToAdd = Math.round(sensorData.estimatedDistanceKm);
  const handleApplyEstimatedKm = () => {
    if (estimatedKmToAdd <= 0) return;
    updateInfo({ odometer: info.odometer + estimatedKmToAdd });
    VehicleApi.resetEstimatedDistance();
  };

  return (
    <div className="min-h-[calc(100dvh-6rem)] p-4 md:p-6 space-y-4 max-w-7xl mx-auto pb-32">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Vehicle</h1>
        <p className="text-sm text-muted-foreground">{info.name} · {info.registration}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Card className="bg-card/40 border-border/50">
          <CardContent className="p-4">
            <Gauge className="w-5 h-5 text-primary mb-2" />
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Odometer</p>
            <p className="text-2xl font-mono font-bold">{info.odometer.toLocaleString()} km</p>
            <p className="text-[11px] text-muted-foreground mt-1">Manual record, not live tracked</p>
          </CardContent>
        </Card>
        <Card className="bg-card/40 border-border/50">
          <CardContent className="p-4">
            <Gauge className="w-5 h-5 text-green-400 mb-2" />
            <p className="text-xs uppercase tracking-widest text-muted-foreground">GPS Estimate</p>
            <p className="text-2xl font-mono font-bold">{sensorData.estimatedDistanceKm.toFixed(1)} km</p>
            <button
              type="button"
              onClick={handleApplyEstimatedKm}
              disabled={estimatedKmToAdd <= 0}
              className="mt-2 h-8 rounded-md border border-border/50 px-2 text-xs font-semibold text-primary disabled:text-muted-foreground disabled:opacity-50"
            >
              Add {estimatedKmToAdd} km to odo
            </button>
          </CardContent>
        </Card>
        <Card className="bg-card/40 border-border/50">
          <CardContent className="p-4">
            <CalendarDays className="w-5 h-5 text-primary mb-2" />
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Rego</p>
            <p className="text-2xl font-mono font-bold">{info.registration}</p>
            <p className="text-[11px] text-muted-foreground mt-1">Expires 11 Nov 2026</p>
          </CardContent>
        </Card>
        <Card className="bg-card/40 border-border/50">
          <CardContent className="p-4">
            <Wrench className="w-5 h-5 text-amber-400 mb-2" />
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Service</p>
            <p className={`text-xl font-bold ${overdueServices.length ? "text-amber-400" : "text-green-400"}`}>
              {overdueServices.length ? "Overdue" : "Current"}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1 truncate">{latestService?.type || "No service record"}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/40 border-border/50">
          <CardContent className="p-4">
            <TriangleAlert className="w-5 h-5 text-primary mb-2" />
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Open Items</p>
            <p className="text-2xl font-mono font-bold">{openRepairs.length}</p>
            <p className="text-[11px] text-muted-foreground mt-1">{tyreWarnings} tyre warning(s)</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card/35 border-border/50">
        <CardContent className="p-4 text-sm text-muted-foreground">
          GPS odometer assist only counts movement from the trusted car tablet. It is an estimate from location, so the stored odometer changes only when you press the add button.
          <span className="block mt-1 font-mono text-xs">
            Location: {sensorData.locationStatus}
            {sensorData.locationAccuracy !== null ? ` · +/- ${Math.round(sensorData.locationAccuracy)} m` : ""}
          </span>
        </CardContent>
      </Card>

      <Card className="bg-card/35 border-border/50 overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-widest text-muted-foreground">
            <CircleDashed className="w-4 h-4" /> Tyre Map
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5 items-center">
          <div className="relative mx-auto w-full max-w-[320px]" style={{ aspectRatio: "3/4" }}>
            <img
              src={foresterTopdown}
              alt="Forester top-down"
              className="absolute inset-0 w-full h-full object-cover"
              draggable={false}
            />
            {tyres.map((tyre) => (
              <TyreBadge key={tyre.id} tyre={tyre} onEdit={setEditingTyre} />
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    <p className={`text-xl font-mono font-bold ${pressureColor(tyre.pressure, tyre.targetPressure)}`}>
                      {tyre.pressure}<span className="ml-1 text-xs text-muted-foreground">psi</span>
                    </p>
                  </div>
                  <StatusBadge status={tyre.condition} className="text-xs px-2 py-1" />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">Installed {formatInstallDate(tyre.installDate)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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
