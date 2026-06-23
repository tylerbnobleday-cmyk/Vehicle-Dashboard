import { useEffect, useState } from "react";
import { useVehicleStore } from "@/store/vehicleStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle, Thermometer, CheckCircle2,
  Wrench, CircleDot, ShieldCheck, Activity, Car, TriangleAlert, MapPin
} from "lucide-react";
import { format } from "date-fns";
import foresterHero from "@/assets/forester-hero.png";
import { TyreRecord, ServiceRecord, RepairRecord } from "@/store/vehicleStore";

function computeHealthScore(
  tyres: TyreRecord[],
  services: ServiceRecord[],
  repairs: RepairRecord[]
): { score: number; label: string; color: string; bgColor: string } {
  let score = 100;
  const dangerousTyres = tyres.filter(t => t.condition === 'Replace').length;
  score -= dangerousTyres * 25;
  const hasOverdueService = services.some(s => s.status === 'OVERDUE');
  if (hasOverdueService) score -= 15;
  const hasCEL = repairs.some(r =>
    r.title.toLowerCase().includes('engine light') ||
    r.title.toLowerCase().includes('cel') ||
    r.title.toLowerCase().includes('p0028') ||
    r.notes.toLowerCase().includes('pending dtc') ||
    r.notes.toLowerCase().includes('p0028') ||
    r.notes.toLowerCase().includes('check engine')
  );
  if (hasCEL) score -= 10;
  const openRepairs = repairs.filter(r => r.status !== 'Completed').length;
  score -= openRepairs * 5;
  score = Math.max(0, score);

  if (score >= 80) return { score, label: 'Excellent', color: 'text-green-400', bgColor: 'bg-green-500/10 border-green-500/30' };
  if (score >= 60) return { score, label: 'Good', color: 'text-blue-400', bgColor: 'bg-blue-500/10 border-blue-500/30' };
  if (score >= 40) return { score, label: 'Fair', color: 'text-amber-400', bgColor: 'bg-amber-500/10 border-amber-500/30' };
  if (score >= 20) return { score, label: 'Needs Attention', color: 'text-orange-400', bgColor: 'bg-orange-500/10 border-orange-500/30' };
  return { score, label: 'Unsafe', color: 'text-red-400', bgColor: 'bg-red-500/10 border-red-500/30' };
}

const TYRE_CONDITION_COLOR: Record<string, string> = {
  Excellent: 'text-green-400',
  Good: 'text-green-400',
  Fair: 'text-amber-400',
  Poor: 'text-orange-400',
  Replace: 'text-red-500',
};

export default function Dashboard() {
  const info = useVehicleStore(state => state.info);
  const sensorData = useVehicleStore(state => state.sensorData);
  const services = useVehicleStore(state => state.services);
  const repairs = useVehicleStore(state => state.repairs);
  const reminders = useVehicleStore(state => state.reminders);
  const tyres = useVehicleStore(state => state.tyres);
  const quickNotes = useVehicleStore(state => state.quickNotes);
  const updateQuickNotes = useVehicleStore(state => state.updateQuickNotes);

  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const overdueServices = services.filter(s => s.status === 'OVERDUE');
  const openRepairs = repairs.filter(r => r.status !== 'Completed');
  const criticalRepairs = openRepairs.filter(r => r.priority === 'Critical');
  const health = computeHealthScore(tyres, services, repairs);

  const activeAlerts: string[] = [];
  if (sensorData.driverDoor || sensorData.passengerDoor || sensorData.rearLeftDoor || sensorData.rearRightDoor)
    activeAlerts.push("Door Open");
  if (sensorData.boot) activeAlerts.push("Boot Open");
  if (sensorData.bonnet) activeAlerts.push("Bonnet Open");

  const tyrePosLabel: Record<string, string> = { FL: 'Front L', FR: 'Front R', RL: 'Rear L', RR: 'Rear R', Spare: 'Spare' };
  const outsideTemp = sensorData.outsideTemp === null ? '--' : sensorData.outsideTemp.toFixed(1);
  const hasLocation = sensorData.latitude !== null && sensorData.longitude !== null;
  const locationText =
    hasLocation ? `${sensorData.latitude!.toFixed(4)}, ${sensorData.longitude!.toFixed(4)}`
      : sensorData.locationStatus === 'denied' ? 'Permission denied'
        : sensorData.locationStatus === 'requesting' ? 'Requesting...'
          : sensorData.locationStatus === 'disabled' ? 'Not car tablet'
            : 'No location';
  const locationLabel = sensorData.locationStatus === 'cached' ? 'Last tablet location' : 'Location';

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto pb-32 animate-in fade-in duration-500">

      {/* Hero header */}
      <div className="relative rounded-2xl overflow-hidden border border-border/30 bg-card/40 min-h-[100px]">
        <img src={foresterHero} alt="Steamy" className="absolute inset-0 w-full h-full object-cover opacity-25" draggable={false} />
        <div className="absolute inset-0 bg-gradient-to-r from-background/96 via-background/65 to-background/15" />
        <div className="relative flex justify-between items-center p-5">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-primary drop-shadow-[0_0_15px_rgba(0,112,192,0.4)]">
                {info.nickname || info.name}
              </h1>
              <span className="px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-primary text-sm font-mono font-bold">
                {info.registration}
              </span>
            </div>
            <p className="text-muted-foreground mt-0.5 text-base">{info.name} · {info.odometer.toLocaleString()} km</p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-4xl md:text-5xl font-mono font-bold tracking-tighter">{format(time, 'HH:mm')}</div>
            <div className="text-sm text-muted-foreground uppercase tracking-widest">{format(time, 'EEE, d MMM')}</div>
          </div>
        </div>
      </div>

      {/* Active sensor alerts */}
      {activeAlerts.length > 0 && (
        <div className="flex flex-col gap-2">
          {activeAlerts.map((alert, i) => (
            <div key={i} className="bg-destructive/15 border border-destructive/60 text-destructive px-4 py-3 rounded-xl flex items-center gap-3 shadow-[0_0_12px_rgba(239,68,68,0.1)]">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span className="font-bold uppercase tracking-wider">{alert}</span>
            </div>
          ))}
        </div>
      )}

      {/* Live sensor strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Outside</p>
              <p className="text-3xl font-mono font-bold">{outsideTemp} C</p>
            </div>
            <Thermometer className="w-7 h-7 text-muted-foreground/25" />
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{locationLabel}</p>
              <p className="text-lg font-mono font-bold truncate">{locationText}</p>
            </div>
            <MapPin className="w-7 h-7 text-muted-foreground/25 shrink-0" />
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Engine</p>
              <p className={`text-2xl font-bold uppercase ${sensorData.engineRunning ? 'text-green-400' : 'text-muted-foreground'}`}>
                {sensorData.engineRunning ? 'Running' : 'Off'}
              </p>
            </div>
            <Activity className="w-7 h-7 text-muted-foreground/25" />
          </CardContent>
        </Card>
      </div>

      {/* Top row: Health score + Tyre health */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Vehicle Health Score */}
        <Card className={`border ${health.bgColor} backdrop-blur`}>
          <CardHeader className="pb-2 border-b border-border/20">
            <CardTitle className="text-sm uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Car className="w-4 h-4" /> Vehicle Health Score
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 flex items-center gap-5">
            <div className="relative w-20 h-20 shrink-0">
              <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                <circle cx="40" cy="40" r="34" fill="none" stroke="currentColor" strokeWidth="8" className="text-border/30" />
                <circle
                  cx="40" cy="40" r="34" fill="none"
                  stroke="currentColor" strokeWidth="8"
                  strokeDasharray={`${(health.score / 100) * 213.6} 213.6`}
                  strokeLinecap="round"
                  className={health.color}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-xl font-black font-mono ${health.color}`}>{health.score}</span>
              </div>
            </div>
            <div>
              <p className={`text-2xl font-bold ${health.color}`}>{health.label}</p>
              <div className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                {tyres.filter(t => t.condition === 'Replace').length > 0 && (
                  <p className="text-red-400">· {tyres.filter(t => t.condition === 'Replace').length} dangerous tyre(s)</p>
                )}
                {overdueServices.length > 0 && <p className="text-amber-400">· Service overdue</p>}
                {repairs.some(r =>
                  r.notes.toLowerCase().includes('check engine') ||
                  r.notes.toLowerCase().includes('pending dtc') ||
                  r.notes.toLowerCase().includes('p0028') ||
                  r.title.toLowerCase().includes('engine light') ||
                  r.title.toLowerCase().includes('p0028')
                ) && (
                  <p className="text-amber-400">· Pending OBD fault needs diagnosis</p>
                )}
                <p className="text-muted-foreground">· {openRepairs.length} open repair(s)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tyre Health */}
        <Card className="border-border/50 bg-card/40 backdrop-blur">
          <CardHeader className="pb-2 border-b border-border/20">
            <CardTitle className="text-sm uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <CircleDot className="w-4 h-4" /> Tyre Health
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-3 grid grid-cols-2 gap-2">
            {tyres.filter(t => t.position !== 'Spare').map(t => (
              <div key={t.id} className={`flex items-center justify-between px-3 py-2 rounded-lg border
                ${t.condition === 'Replace' ? 'bg-red-500/10 border-red-500/30' :
                  t.condition === 'Poor' ? 'bg-orange-500/10 border-orange-500/30' :
                  t.condition === 'Fair' ? 'bg-amber-500/10 border-amber-500/30' :
                  'bg-card/40 border-border/30'}`}>
                <span className="text-xs font-semibold text-muted-foreground">{tyrePosLabel[t.position]}</span>
                <span className={`text-xs font-black uppercase ${TYRE_CONDITION_COLOR[t.condition]}`}>
                  {t.condition === 'Replace' ? 'DANGER' : t.condition}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Middle row: Service + Active Repairs + Insurance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Service Status */}
        <Card className="border-border/50 bg-card/40 backdrop-blur">
          <CardHeader className="pb-2 border-b border-border/20">
            <CardTitle className="text-sm uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Wrench className="w-4 h-4" /> Service Status
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-3">
            {overdueServices.length > 0 ? (
              <div className="space-y-2">
                {overdueServices.map(s => (
                  <div key={s.id} className="flex justify-between items-center bg-red-500/10 px-3 py-2 rounded-lg border border-red-500/20">
                    <span className="text-sm font-semibold">{s.type}</span>
                    <StatusBadge status="OVERDUE" />
                  </div>
                ))}
                <p className="text-xs text-muted-foreground pt-1">
                  Last: JAX tyres fitted — 23 Jun 2026 @ 163,278 km
                </p>
              </div>
            ) : (
              <div className="flex items-center text-green-400">
                <CheckCircle2 className="w-5 h-5 mr-2" />
                <span className="font-bold text-sm">All services up to date</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Repairs */}
        <Card className="border-border/50 bg-card/40 backdrop-blur">
          <CardHeader className="pb-2 border-b border-border/20">
            <CardTitle className="text-sm uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <TriangleAlert className="w-4 h-4" /> Active Repairs
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-3 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Critical</span>
              <span className="font-mono text-lg text-red-400 font-bold">
                {openRepairs.filter(r => r.priority === 'Critical').length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">High</span>
              <span className="font-mono text-lg text-orange-400 font-bold">
                {openRepairs.filter(r => r.priority === 'High').length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Open</span>
              <span className="font-mono text-lg font-bold">{openRepairs.length}</span>
            </div>
            {criticalRepairs.length > 0 && (
              <div className="pt-1 border-t border-border/20 space-y-1">
                {criticalRepairs.slice(0, 2).map(r => (
                  <p key={r.id} className="text-xs text-red-400 truncate">· {r.title}</p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Registration and Insurance Summary */}
        <Card className="border-border/50 bg-card/40 backdrop-blur">
          <CardHeader className="pb-2 border-b border-border/20">
            <CardTitle className="text-sm uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Rego & Insurance
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-3 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Rego Expiry</span>
              <span className="text-sm font-bold">{info.registrationExpiry}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Roadworthy</span>
              <span className="text-sm font-bold text-green-400">{info.roadworthyCertificate}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Provider</span>
              <span className="text-sm font-bold">{info.insuranceProvider}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Type</span>
              <span className="text-sm font-semibold text-amber-400">{info.insuranceType}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Status</span>
              <span className="text-sm font-bold text-green-400">Active</span>
            </div>
            <div className="pt-1 border-t border-border/20">
              <p className="text-xs text-muted-foreground">{info.insurancePeriod}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Door Status */}
      <Card className="border-border/50 bg-card/40 backdrop-blur">
        <CardHeader className="pb-2 border-b border-border/20">
          <CardTitle className="text-sm uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Car className="w-4 h-4" /> Door Status
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-3">
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {[
              { label: 'Driver RH', open: sensorData.driverDoor },
              { label: 'Pass LH', open: sensorData.passengerDoor },
              { label: 'Rear L', open: sensorData.rearLeftDoor },
              { label: 'Rear R', open: sensorData.rearRightDoor },
              { label: 'Boot', open: sensorData.boot },
              { label: 'Bonnet', open: sensorData.bonnet },
            ].map(({ label, open }) => (
              <div key={label} className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-center transition-all duration-300
                ${open ? 'bg-red-500/10 border-red-500/40' : 'bg-card/30 border-border/30'}`}>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
                <span className={`text-xs font-black ${open ? 'text-red-400' : 'text-green-400'}`}>
                  {open ? 'OPEN' : 'Closed'}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bottom row: Notes + Reminders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-border/50 bg-card/40 backdrop-blur flex flex-col">
          <CardHeader className="pb-2 border-b border-border/20">
            <CardTitle className="text-sm uppercase tracking-widest text-muted-foreground">Commander Notes</CardTitle>
          </CardHeader>
          <CardContent className="pt-3 flex-1 flex flex-col">
            <Textarea
              value={quickNotes}
              onChange={e => updateQuickNotes(e.target.value)}
              placeholder="Quick notes..."
              className="flex-1 min-h-[100px] resize-none bg-background/50 border-border/50 font-mono text-sm leading-relaxed"
              data-testid="textarea-quick-notes"
            />
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/40 backdrop-blur">
          <CardHeader className="pb-2 border-b border-border/20">
            <CardTitle className="text-sm uppercase tracking-widest text-muted-foreground">Upcoming</CardTitle>
          </CardHeader>
          <CardContent className="pt-3 space-y-2">
            {reminders.slice(0, 5).map(r => (
              <div key={r.id} className="flex justify-between items-center py-1.5 border-b border-border/10 last:border-0">
                <span className="text-sm font-semibold truncate pr-2">{r.title}</span>
                <StatusBadge status={r.status} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
