import { useEffect, useState } from "react";
import { format, formatDistanceToNowStrict } from "date-fns";
import {
  Car,
  CheckCircle2,
  CircleDashed,
  CircleDot,
  Gauge,
  MapPin,
  Settings,
  ShieldCheck,
  Thermometer,
  TriangleAlert,
  Wifi,
  WifiOff,
  Wrench,
} from "lucide-react";
import { useVehicleStore, TyreRecord, ServiceRecord, RepairRecord, ReminderRecord } from "@/store/vehicleStore";
import { VehicleApi } from "@/services/vehicleApi";
import { EspDashWifi, EspDashState } from "@/services/espDashWifi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import foresterHero from "@/assets/forester-hero.png";
import foresterTopdown from "@/assets/forester-topdown.png";

const TYRE_BADGE_POSITION: Record<TyreRecord["position"], string> = {
  FL: "left-1 top-[17%]",
  FR: "right-1 top-[17%]",
  RL: "left-1 top-[68%]",
  RR: "right-1 top-[68%]",
  Spare: "left-1/2 bottom-2 -translate-x-1/2",
};

const TYRE_CONDITION_COLOR: Record<string, string> = {
  Excellent: "text-green-400",
  Good: "text-green-400",
  Fair: "text-amber-400",
  Poor: "text-orange-400",
  Replace: "text-red-500",
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

function computeHealthScore(
  tyres: TyreRecord[],
  services: ServiceRecord[],
  repairs: RepairRecord[],
): { score: number; label: string; color: string; bgColor: string } {
  let score = 100;
  score -= tyres.filter((tyre) => tyre.condition === "Replace").length * 25;
  if (services.some((service) => service.status === "OVERDUE")) score -= 15;
  if (repairs.some((repair) =>
    repair.title.toLowerCase().includes("p0028") ||
    repair.title.toLowerCase().includes("engine light") ||
    repair.notes.toLowerCase().includes("pending dtc") ||
    repair.notes.toLowerCase().includes("p0028") ||
    repair.notes.toLowerCase().includes("check engine")
  )) score -= 10;
  score -= repairs.filter((repair) => repair.status !== "Completed").length * 5;
  score = Math.max(0, score);

  if (score >= 80) return { score, label: "Excellent", color: "text-green-400", bgColor: "bg-green-500/10 border-green-500/30" };
  if (score >= 60) return { score, label: "Good", color: "text-blue-400", bgColor: "bg-blue-500/10 border-blue-500/30" };
  if (score >= 40) return { score, label: "Fair", color: "text-amber-400", bgColor: "bg-amber-500/10 border-amber-500/30" };
  if (score >= 20) return { score, label: "Needs Attention", color: "text-orange-400", bgColor: "bg-orange-500/10 border-orange-500/30" };
  return { score, label: "Unsafe", color: "text-red-400", bgColor: "bg-red-500/10 border-red-500/30" };
}

function reminderLabel(reminder: ReminderRecord) {
  if ((reminder.type === "Rego" || reminder.type === "Insurance") && reminder.dueDate) {
    const due = new Date(reminder.dueDate);
    if (!Number.isNaN(due.getTime())) {
      const distance = formatDistanceToNowStrict(due, { addSuffix: false });
      return due.getTime() >= Date.now() ? `Expires in ${distance}` : `Expired ${distance} ago`;
    }
  }
  if (reminder.dueOdometer) return `${reminder.dueOdometer.toLocaleString()} km`;
  return reminder.status;
}

function formatEspValue(value: number | undefined, suffix = "") {
  return value === undefined ? "--" : `${value.toFixed(value % 1 === 0 ? 0 : 1)}${suffix}`;
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
  const reminders = useVehicleStore((state) => state.reminders);
  const quickNotes = useVehicleStore((state) => state.quickNotes);
  const updateInfo = useVehicleStore((state) => state.updateInfo);
  const updateTyre = useVehicleStore((state) => state.updateTyre);
  const updateQuickNotes = useVehicleStore((state) => state.updateQuickNotes);

  const [editingTyre, setEditingTyre] = useState<TyreRecord | null>(null);
  const [time, setTime] = useState(new Date());
  const [espDash, setEspDash] = useState<EspDashState>(() => EspDashWifi.getState());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const unsubscribe = EspDashWifi.subscribe(setEspDash);
    return () => {
      unsubscribe();
    };
  }, []);

  const overdueServices = services.filter((service) => service.status === "OVERDUE");
  const openRepairs = repairs.filter((repair) => repair.status !== "Completed");
  const criticalRepairs = openRepairs.filter((repair) => repair.priority === "Critical");
  const tyreWarnings = tyres.filter((tyre) => tyre.condition === "Replace" || tyre.condition === "Poor").length;
  const health = computeHealthScore(tyres, services, repairs);
  const latestService = [...services]
    .filter((service) => service.status === "OK")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  const activeReminders = [...reminders]
    .filter((reminder) => reminder.status !== "Completed")
    .sort((a, b) => {
      if (a.type === "Service" && b.type !== "Service") return -1;
      if (b.type === "Service" && a.type !== "Service") return 1;
      if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return 0;
    });

  const outsideTemp = sensorData.outsideTemp === null ? "--" : sensorData.outsideTemp.toFixed(1);
  const locationText =
    sensorData.latitude !== null && sensorData.longitude !== null
      ? `${sensorData.latitude.toFixed(4)}, ${sensorData.longitude.toFixed(4)}`
      : sensorData.locationStatus === "denied"
        ? "Permission denied"
        : sensorData.locationStatus === "requesting"
          ? "Requesting..."
          : sensorData.locationStatus === "disabled"
            ? "Not car tablet"
            : "No location";

  const estimatedKmToAdd = Math.round(sensorData.estimatedDistanceKm);
  const espData = espDash.data;
  const espConnected = espDash.status === "connected";
  const espLastUpdate =
    espData?.timestamp ? formatDistanceToNowStrict(new Date(espData.timestamp), { addSuffix: true }) : "Never";

  const handleApplyEstimatedKm = () => {
    if (estimatedKmToAdd <= 0) return;
    updateInfo({ odometer: info.odometer + estimatedKmToAdd });
    VehicleApi.resetEstimatedDistance();
  };

  const handleSaveTyre = () => {
    if (!editingTyre) return;
    updateTyre(editingTyre.id, editingTyre);
    setEditingTyre(null);
  };

  return (
    <div className="min-h-[calc(100dvh-6rem)] p-4 md:p-6 space-y-5 max-w-7xl mx-auto pb-32 animate-in fade-in duration-500">
      <div className="relative min-h-[112px] overflow-hidden rounded-2xl border border-border/30 bg-card/40">
        <img src={foresterHero} alt="Steamy" className="absolute inset-0 h-full w-full object-cover opacity-25" draggable={false} />
        <div className="absolute inset-0 bg-gradient-to-r from-background/96 via-background/65 to-background/15" />
        <div className="relative flex items-center justify-between gap-4 p-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-primary">{info.nickname || info.name}</h1>
              <span className="rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 font-mono text-sm font-bold text-primary">
                {info.registration}
              </span>
            </div>
            <p className="mt-0.5 text-base text-muted-foreground">{info.name} - {info.odometer.toLocaleString()} km</p>
          </div>
          <div className="shrink-0 text-right">
            <div className="font-mono text-4xl md:text-5xl font-bold tracking-tighter">{format(time, "HH:mm")}</div>
            <div className="text-sm uppercase tracking-widest text-muted-foreground">{format(time, "EEE, d MMM")}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Card className="bg-card/40 border-border/50">
          <CardContent className="p-4">
            <Gauge className="w-5 h-5 text-primary mb-2" />
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Odometer</p>
            <p className="text-2xl font-mono font-bold">{info.odometer.toLocaleString()} km</p>
            <p className="text-[11px] text-muted-foreground mt-1">Manual record</p>
          </CardContent>
        </Card>
        <Card className="bg-card/40 border-border/50">
          <CardContent className="p-4">
            <Thermometer className="w-5 h-5 text-primary mb-2" />
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Outside</p>
            <p className="text-2xl font-mono font-bold">{outsideTemp} C</p>
            <p className="text-[11px] text-muted-foreground mt-1 truncate">{locationText}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/40 border-border/50">
          <CardContent className="p-4">
            <Gauge className="w-5 h-5 text-green-400 mb-2" />
            <p className="text-xs uppercase tracking-widest text-muted-foreground">GPS Estimate</p>
            <p className="text-2xl font-mono font-bold">{sensorData.estimatedDistanceKm.toFixed(1)} km</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {espConnected ? "Source: ESP GPS" : "Source: car tablet GPS"}
            </p>
            <button
              type="button"
              onClick={handleApplyEstimatedKm}
              disabled={estimatedKmToAdd <= 0}
              className="mt-2 h-8 rounded-md border border-border/50 px-2 text-xs font-semibold text-primary disabled:text-muted-foreground disabled:opacity-50"
            >
              Add {estimatedKmToAdd} km
            </button>
          </CardContent>
        </Card>
        <Card className="bg-card/40 border-border/50">
          <CardContent className="p-4">
            <Wrench className="w-5 h-5 text-amber-400 mb-2" />
            <p className="text-xs uppercase tracking-widest text-muted-foreground">162,000 km Service</p>
            <p className="text-xl font-bold text-amber-400">Upcoming</p>
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

      <Card className={`border ${espData?.overLimit ? "border-red-500/50 bg-red-500/10" : "border-border/50 bg-card/40"} backdrop-blur`}>
        <CardHeader className="pb-3 border-b border-border/20">
          <CardTitle className="flex flex-wrap items-center justify-between gap-3 text-sm uppercase tracking-widest text-muted-foreground">
            <span className="flex items-center gap-2">
              {espConnected ? <Wifi className="h-4 w-4 text-green-400" /> : <WifiOff className="h-4 w-4 text-muted-foreground" />}
              ESP WiFi Dash
            </span>
            <span className={`rounded-md border px-2 py-1 text-xs font-bold ${
              espDash.status === "connected"
                ? "border-green-500/40 bg-green-500/10 text-green-300"
                : espDash.status === "blocked" || espDash.status === "error"
                  ? "border-red-500/40 bg-red-500/10 text-red-300"
                  : "border-border/50 bg-background/50 text-muted-foreground"
            }`}>
              {espDash.status}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {(espDash.status === "blocked" || espDash.status === "error") && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-100">
              {espDash.error}
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Speed</p>
              <p className="font-mono text-2xl font-black">{formatEspValue(espData?.speedKmh)}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Limit</p>
              <p className="font-mono text-2xl font-black">{formatEspValue(espData?.speedLimitKmh)}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Trip</p>
              <p className="font-mono text-2xl font-black">{formatEspValue(espData?.tripKm, " km")}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground">GPS Fix</p>
              <p className="text-lg font-bold">{espData?.fix === undefined ? "--" : espData.fix ? "Yes" : "No"}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Satellites</p>
              <p className="font-mono text-2xl font-black">{formatEspValue(espData?.satellites)}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Heading</p>
              <p className="font-mono text-2xl font-black">{formatEspValue(espData?.headingDeg, " deg")}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Warning</p>
              <p className={`text-lg font-bold ${espData?.overLimit ? "text-red-300" : "text-green-300"}`}>
                {espData?.overLimit ? "Over" : "OK"}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Updated</p>
              <p className="text-sm font-semibold">{espLastUpdate}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => EspDashWifi.connect()} disabled={espDash.status === "connecting" || espConnected}>
              Connect WiFi Dash
            </Button>
            <Button size="sm" variant="outline" onClick={() => EspDashWifi.disconnect()} disabled={!espConnected}>
              Disconnect
            </Button>
            <Button size="sm" variant="outline" onClick={() => EspDashWifi.sendCommand("RESETTRIP")} disabled={!espConnected}>
              Reset Trip
            </Button>
            {[40, 50, 60, 80, 100].map((limit) => (
              <Button
                key={limit}
                size="sm"
                variant="secondary"
                onClick={() => EspDashWifi.sendCommand("LIMIT", limit)}
                disabled={!espConnected}
              >
                LIMIT {limit}
              </Button>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">
            Connect the tablet to WiFi network ForesterDash first. The website reads ESP GPS from http://192.168.4.1/api/dash. GitHub Pages is HTTPS, so some browsers may block local HTTP; if blocked, use local HTTP dev mode or the ESP page at 192.168.4.1.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className={`border ${health.bgColor} backdrop-blur`}>
          <CardHeader className="pb-2 border-b border-border/20">
            <CardTitle className="text-sm uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Car className="w-4 h-4" /> Vehicle Health
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 flex items-center gap-5">
            <div className="relative h-20 w-20 shrink-0">
              <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
                <circle cx="40" cy="40" r="34" fill="none" stroke="currentColor" strokeWidth="8" className="text-border/30" />
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeDasharray={`${(health.score / 100) * 213.6} 213.6`}
                  strokeLinecap="round"
                  className={health.color}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`font-mono text-xl font-black ${health.color}`}>{health.score}</span>
              </div>
            </div>
            <div>
              <p className={`text-2xl font-bold ${health.color}`}>{health.label}</p>
              <div className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                {tyreWarnings > 0 && <p className="text-red-400">- {tyreWarnings} tyre warning(s)</p>}
                {overdueServices.length > 0 && <p className="text-amber-400">- 162,000 km service needs booking</p>}
                <p>- {openRepairs.length} open repair(s)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/40 backdrop-blur">
          <CardHeader className="pb-2 border-b border-border/20">
            <CardTitle className="text-sm uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <CircleDot className="w-4 h-4" /> Tyre Health
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-3 grid grid-cols-2 gap-2">
            {tyres.filter((tyre) => tyre.position !== "Spare").map((tyre) => (
              <div key={tyre.id} className="flex items-center justify-between rounded-lg border border-border/30 bg-card/40 px-3 py-2">
                <span className="text-xs font-semibold text-muted-foreground">{tyre.position}</span>
                <span className={`text-xs font-black uppercase ${TYRE_CONDITION_COLOR[tyre.condition]}`}>
                  {tyre.condition === "Replace" ? "Danger" : tyre.condition}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border/50 bg-card/40 backdrop-blur">
          <CardHeader className="pb-2 border-b border-border/20">
            <CardTitle className="text-sm uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Wrench className="w-4 h-4" /> Service
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-3">
            {overdueServices.length > 0 ? (
              <div className="space-y-2">
                {overdueServices.map((service) => (
                  <div key={service.id} className="flex items-center justify-between rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2">
                    <span className="text-sm font-semibold">{service.type}</span>
                    <StatusBadge status="OVERDUE" />
                  </div>
                ))}
                <p className="text-xs text-muted-foreground pt-1">Last: JAX tyres fitted - 23 Jun 2026 @ 163,278 km</p>
              </div>
            ) : (
              <div className="flex items-center text-green-400">
                <CheckCircle2 className="w-5 h-5 mr-2" />
                <span className="text-sm font-bold">All services up to date</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/40 backdrop-blur">
          <CardHeader className="pb-2 border-b border-border/20">
            <CardTitle className="text-sm uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <TriangleAlert className="w-4 h-4" /> Active Repairs
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-3 space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Critical</span>
              <span className="font-mono text-lg font-bold text-red-400">{criticalRepairs.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">High</span>
              <span className="font-mono text-lg font-bold text-orange-400">{openRepairs.filter((repair) => repair.priority === "High").length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total Open</span>
              <span className="font-mono text-lg font-bold">{openRepairs.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/40 backdrop-blur">
          <CardHeader className="pb-2 border-b border-border/20">
            <CardTitle className="text-sm uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Rego & Insurance
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-3 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Rego</span>
              <span className="text-sm font-bold">{info.registrationExpiry}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Provider</span>
              <span className="text-sm font-bold">{info.insuranceProvider}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Type</span>
              <span className="text-sm font-semibold text-amber-400">{info.insuranceType}</span>
            </div>
            <div className="pt-1 border-t border-border/20">
              <p className="text-xs text-muted-foreground">{info.insurancePeriod}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-border/50 bg-card/40 backdrop-blur">
          <CardHeader className="pb-2 border-b border-border/20">
            <CardTitle className="text-sm uppercase tracking-widest text-muted-foreground">Commander Notes</CardTitle>
          </CardHeader>
          <CardContent className="pt-3">
            <Textarea
              value={quickNotes}
              onChange={(event) => updateQuickNotes(event.target.value)}
              placeholder="Quick notes..."
              className="min-h-[112px] resize-none bg-background/50 font-mono text-sm"
            />
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/40 backdrop-blur">
          <CardHeader className="pb-2 border-b border-border/20">
            <CardTitle className="text-sm uppercase tracking-widest text-muted-foreground">Upcoming</CardTitle>
          </CardHeader>
          <CardContent className="pt-3 space-y-2">
            {activeReminders.slice(0, 5).map((reminder) => (
              <div key={reminder.id} className="flex items-center justify-between gap-3 border-b border-border/10 py-1.5 last:border-0">
                <span className="truncate text-sm font-semibold">{reminder.title}</span>
                <span className="shrink-0 rounded-full border border-border/40 bg-background/50 px-2.5 py-1 text-xs font-bold text-muted-foreground">
                  {reminderLabel(reminder)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card/35 border-border/50">
        <CardContent className="p-4 text-sm text-muted-foreground">
          GPS odometer assist only counts movement from the trusted car tablet. It is an estimate from location, so the stored odometer changes only when you press the add button.
          <span className="block mt-1 font-mono text-xs">
            <MapPin className="mr-1 inline h-3.5 w-3.5" /> {sensorData.locationStatus}
            {sensorData.locationAccuracy !== null ? ` - +/- ${Math.round(sensorData.locationAccuracy)} m` : ""}
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
