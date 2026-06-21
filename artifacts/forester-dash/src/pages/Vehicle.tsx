import { useVehicleStore } from "@/store/vehicleStore";
import { VehicleApi } from "@/services/vehicleApi";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function Vehicle() {
  const sensorData = useVehicleStore(state => state.sensorData);

  const toggleSensor = (key: keyof typeof sensorData) => {
    VehicleApi.updateData({ [key]: !sensorData[key] });
  };

  const isAnyDoorOpen = sensorData.driverDoor || sensorData.passengerDoor || sensorData.rearLeftDoor || sensorData.rearRightDoor;

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto pb-32 animate-in fade-in duration-500">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight uppercase">Vehicle Status</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Diagram */}
        <Card className="bg-card/30 border-border/50 flex items-center justify-center p-8 min-h-[500px]">
          <div className="relative w-64 h-[450px]">
            {/* Base Car SVG Silhouette */}
            <svg viewBox="0 0 200 450" className="w-full h-full drop-shadow-[0_0_20px_rgba(0,112,192,0.1)]">
              {/* Chassis */}
              <rect x="30" y="20" width="140" height="410" rx="40" fill="#1e293b" stroke="#334155" strokeWidth="4" />
              
              {/* Windshield */}
              <path d="M 45 120 Q 100 100 155 120 L 165 180 L 35 180 Z" fill="#0f172a" stroke="#334155" strokeWidth="2" />
              
              {/* Rear Window */}
              <path d="M 45 350 Q 100 370 155 350 L 160 320 L 40 320 Z" fill="#0f172a" stroke="#334155" strokeWidth="2" />
              
              {/* Roof */}
              <rect x="45" y="180" width="110" height="140" fill="#1e293b" stroke="#334155" strokeWidth="2" />

              {/* Bonnet Area */}
              <path d="M 40 100 Q 100 80 160 100 L 150 30 Q 100 20 50 30 Z" 
                    fill={sensorData.bonnet ? "#ef4444" : "transparent"} 
                    className="transition-colors duration-300" />
              
              {/* Boot Area */}
              <path d="M 40 370 Q 100 390 160 370 L 150 425 Q 100 435 50 425 Z" 
                    fill={sensorData.boot ? "#ef4444" : "transparent"} 
                    className="transition-colors duration-300" />

              {/* Doors */}
              <rect x="25" y="150" width="10" height="60" rx="3" fill={sensorData.driverDoor ? "#ef4444" : "#475569"} className="transition-colors duration-300" />
              <rect x="165" y="150" width="10" height="60" rx="3" fill={sensorData.passengerDoor ? "#ef4444" : "#475569"} className="transition-colors duration-300" />
              <rect x="25" y="230" width="10" height="60" rx="3" fill={sensorData.rearLeftDoor ? "#ef4444" : "#475569"} className="transition-colors duration-300" />
              <rect x="165" y="230" width="10" height="60" rx="3" fill={sensorData.rearRightDoor ? "#ef4444" : "#475569"} className="transition-colors duration-300" />

              {/* Wheels */}
              <rect x="15" y="70" width="15" height="40" rx="5" fill="#020617" />
              <rect x="170" y="70" width="15" height="40" rx="5" fill="#020617" />
              <rect x="15" y="320" width="15" height="40" rx="5" fill="#020617" />
              <rect x="170" y="320" width="15" height="40" rx="5" fill="#020617" />
              
              {/* Headlights */}
              <ellipse cx="60" cy="25" rx="15" ry="5" fill={sensorData.headlights ? "#eab308" : "#334155"} className="transition-colors duration-300" />
              <ellipse cx="140" cy="25" rx="15" ry="5" fill={sensorData.headlights ? "#eab308" : "#334155"} className="transition-colors duration-300" />
              <ellipse cx="60" cy="25" rx="8" ry="3" fill={sensorData.headlights ? "#fef08a" : "transparent"} className="transition-colors duration-300" />
              <ellipse cx="140" cy="25" rx="8" ry="3" fill={sensorData.headlights ? "#fef08a" : "transparent"} className="transition-colors duration-300" />
              
              {/* Taillights */}
              <ellipse cx="50" cy="420" rx="15" ry="8" fill={sensorData.parkingLights ? "#ef4444" : "#7f1d1d"} className="transition-colors duration-300" />
              <ellipse cx="150" cy="420" rx="15" ry="8" fill={sensorData.parkingLights ? "#ef4444" : "#7f1d1d"} className="transition-colors duration-300" />
            </svg>
            
            {/* Overlays / Glows */}
            {sensorData.headlights && <div className="absolute -top-10 left-8 right-8 h-20 bg-yellow-200/20 blur-2xl rounded-full pointer-events-none" />}
            {sensorData.interiorLights && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-32 bg-white/10 blur-xl rounded-full pointer-events-none" />}
          </div>
        </Card>

        {/* Data & Controls */}
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-card/50 border-border/50 p-4">
              <p className="text-sm text-muted-foreground uppercase">Speed</p>
              <p className="text-3xl font-mono text-foreground font-bold">{sensorData.speed} <span className="text-lg text-muted-foreground">km/h</span></p>
            </Card>
            <Card className="bg-card/50 border-border/50 p-4">
              <p className="text-sm text-muted-foreground uppercase">Fuel Level</p>
              <p className="text-3xl font-mono text-foreground font-bold">{sensorData.fuelLevel.toFixed(0)}%</p>
            </Card>
          </div>

          <Card className="bg-card/30 border-border/50">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold uppercase tracking-wider mb-6 text-primary">Simulation Toggles</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center justify-between">
                  <Label className="text-base cursor-pointer" htmlFor="engineRunning">Engine Running</Label>
                  <Switch id="engineRunning" checked={sensorData.engineRunning} onCheckedChange={() => toggleSensor('engineRunning')} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-base cursor-pointer" htmlFor="handbrake">Handbrake</Label>
                  <Switch id="handbrake" checked={sensorData.handbrake} onCheckedChange={() => toggleSensor('handbrake')} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-base cursor-pointer" htmlFor="driverDoor">Driver Door</Label>
                  <Switch id="driverDoor" checked={sensorData.driverDoor} onCheckedChange={() => toggleSensor('driverDoor')} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-base cursor-pointer" htmlFor="passengerDoor">Passenger Door</Label>
                  <Switch id="passengerDoor" checked={sensorData.passengerDoor} onCheckedChange={() => toggleSensor('passengerDoor')} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-base cursor-pointer" htmlFor="bonnet">Bonnet</Label>
                  <Switch id="bonnet" checked={sensorData.bonnet} onCheckedChange={() => toggleSensor('bonnet')} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-base cursor-pointer" htmlFor="boot">Boot</Label>
                  <Switch id="boot" checked={sensorData.boot} onCheckedChange={() => toggleSensor('boot')} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-base cursor-pointer" htmlFor="headlights">Headlights</Label>
                  <Switch id="headlights" checked={sensorData.headlights} onCheckedChange={() => toggleSensor('headlights')} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-base cursor-pointer" htmlFor="interiorLights">Interior Lights</Label>
                  <Switch id="interiorLights" checked={sensorData.interiorLights} onCheckedChange={() => toggleSensor('interiorLights')} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
