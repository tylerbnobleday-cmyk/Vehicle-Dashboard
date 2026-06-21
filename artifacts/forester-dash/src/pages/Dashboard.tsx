import { useEffect, useState } from "react";
import { Activity } from "lucide-react";
import { useVehicleStore } from "@/store/vehicleStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Battery, Thermometer, Wind, CheckCircle2, Wrench } from "lucide-react";
import { format } from "date-fns";

export default function Dashboard() {
  const info = useVehicleStore(state => state.info);
  const sensorData = useVehicleStore(state => state.sensorData);
  const services = useVehicleStore(state => state.services);
  const repairs = useVehicleStore(state => state.repairs);
  const reminders = useVehicleStore(state => state.reminders);
  const quickNotes = useVehicleStore(state => state.quickNotes);
  const updateQuickNotes = useVehicleStore(state => state.updateQuickNotes);
  
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const overdueServices = services.filter(s => s.status === 'OVERDUE');
  const activeAlerts = [];
  if (sensorData.driverDoor || sensorData.passengerDoor || sensorData.rearLeftDoor || sensorData.rearRightDoor) activeAlerts.push("Door Open");
  if (sensorData.boot) activeAlerts.push("Boot Open");
  if (sensorData.bonnet) activeAlerts.push("Bonnet Open");
  if (sensorData.batteryVoltage < 12.0) activeAlerts.push("Low Battery");
  if (sensorData.cabinTemp > 40) activeAlerts.push("High Cabin Temp");
  
  const getVoltColor = (v: number) => {
    if (v < 12.0) return "text-red-500";
    if (v < 12.5) return "text-amber-500";
    return "text-green-500";
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto pb-32 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-primary drop-shadow-[0_0_15px_rgba(0,112,192,0.3)]">{info.name}</h1>
          <p className="text-muted-foreground mt-1 text-lg">{info.odometer.toLocaleString()} km</p>
        </div>
        <div className="text-right">
          <div className="text-5xl md:text-6xl font-mono font-bold tracking-tighter">{format(time, 'HH:mm')}</div>
          <div className="text-xl text-muted-foreground uppercase tracking-widest">{format(time, 'EEEE, d MMM')}</div>
        </div>
      </div>

      {/* Alerts */}
      {activeAlerts.length > 0 && (
        <div className="flex flex-col gap-2">
          {activeAlerts.map((alert, i) => (
            <div key={i} className="bg-destructive/20 border border-destructive text-destructive px-4 py-3 rounded-lg flex items-center shadow-[0_0_15px_rgba(255,0,0,0.1)]">
              <AlertCircle className="w-6 h-6 mr-3" />
              <span className="font-bold uppercase tracking-wider">{alert}</span>
            </div>
          ))}
        </div>
      )}

      {/* Status Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-wider">Battery</p>
              <p className={`text-3xl font-mono font-bold ${getVoltColor(sensorData.batteryVoltage)}`}>{sensorData.batteryVoltage.toFixed(1)}V</p>
            </div>
            <Battery className="w-8 h-8 text-muted-foreground/30" />
          </CardContent>
        </Card>
        
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-wider">Cabin</p>
              <p className="text-3xl font-mono font-bold text-foreground">{sensorData.cabinTemp.toFixed(1)}°</p>
            </div>
            <Thermometer className="w-8 h-8 text-muted-foreground/30" />
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-wider">Outside</p>
              <p className="text-3xl font-mono font-bold text-foreground">{sensorData.outsideTemp.toFixed(1)}°</p>
            </div>
            <Wind className="w-8 h-8 text-muted-foreground/30" />
          </CardContent>
        </Card>
        
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-wider">Engine</p>
              <p className={`text-2xl font-bold uppercase ${sensorData.engineRunning ? 'text-green-500' : 'text-muted-foreground'}`}>
                {sensorData.engineRunning ? 'Running' : 'Off'}
              </p>
            </div>
            <Activity className="w-8 h-8 text-muted-foreground/30" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Service Card */}
        <Card className="border-border/50 bg-card/40 backdrop-blur shadow-lg">
          <CardHeader className="pb-2 border-b border-border/20">
            <CardTitle className="text-lg uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Wrench className="w-5 h-5" /> Service Status
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {overdueServices.length > 0 ? (
              <div className="space-y-3">
                {overdueServices.map(s => (
                  <div key={s.id} className="flex justify-between items-center bg-red-500/10 p-3 rounded border border-red-500/20">
                    <span className="font-semibold">{s.type}</span>
                    <StatusBadge status="OVERDUE" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center text-green-500">
                <CheckCircle2 className="w-6 h-6 mr-2" />
                <span className="font-bold tracking-wide">All services up to date</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Repairs Summary */}
        <Card className="border-border/50 bg-card/40 backdrop-blur shadow-lg">
          <CardHeader className="pb-2 border-b border-border/20">
            <CardTitle className="text-lg uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Wrench className="w-5 h-5" /> Active Projects
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Critical / High</span>
              <span className="font-mono text-xl text-red-500 font-bold">
                {repairs.filter(r => r.priority === 'Critical' || r.priority === 'High').length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">In Progress</span>
              <span className="font-mono text-xl text-primary font-bold">
                {repairs.filter(r => r.status === 'In Progress').length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Open</span>
              <span className="font-mono text-xl font-bold">
                {repairs.filter(r => r.status !== 'Completed').length}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Quick Notes */}
        <Card className="border-border/50 bg-card/40 backdrop-blur shadow-lg flex flex-col">
          <CardHeader className="pb-2 border-b border-border/20">
            <CardTitle className="text-lg uppercase tracking-widest text-muted-foreground">Commander Notes</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 flex-1 flex flex-col">
            <Textarea 
              value={quickNotes}
              onChange={(e) => updateQuickNotes(e.target.value)}
              placeholder="Enter quick vehicle notes here..."
              className="flex-1 min-h-[120px] resize-none bg-background/50 border-border/50 font-mono text-sm leading-relaxed focus-visible:ring-primary"
            />
          </CardContent>
        </Card>

        {/* Reminders */}
        <Card className="border-border/50 bg-card/40 backdrop-blur shadow-lg md:col-span-2 lg:col-span-3">
          <CardHeader className="pb-2 border-b border-border/20">
            <CardTitle className="text-lg uppercase tracking-widest text-muted-foreground">Upcoming Operations</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {reminders.slice(0, 3).map(r => (
                <div key={r.id} className="bg-background/50 border border-border/50 p-4 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-foreground">{r.title}</span>
                    <StatusBadge status={r.status} />
                  </div>
                  <div className="text-sm text-muted-foreground font-mono">
                    {r.dueDate && format(new Date(r.dueDate), 'MMM d, yyyy')}
                    {r.dueOdometer && ` @ ${r.dueOdometer.toLocaleString()} km`}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
