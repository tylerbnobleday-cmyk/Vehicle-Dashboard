import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Bluetooth, DoorOpen, Lightbulb, ParkingCircle, Power, RadioTower, RotateCcw, Settings2 } from "lucide-react";
import { LightingColorName, LightingZoneId, useVehicleStore } from "@/store/vehicleStore";

const eventLabels: Record<string, string> = {
  doorOpen: "Door open",
  bootOpen: "Boot open",
  reverseGear: "Reverse gear",
  parkingMode: "Parking mode",
  vehicleStatus: "Vehicle status",
};

const zoneIcons: Record<LightingZoneId, typeof RadioTower> = {
  frontCabin: RadioTower,
  rearCabin: RadioTower,
  bootArea: Bluetooth,
};

export default function Lighting() {
  const lighting = useVehicleStore(state => state.lighting);
  const updateLightingZone = useVehicleStore(state => state.updateLightingZone);
  const setAllLighting = useVehicleStore(state => state.setAllLighting);
  const applyLightingPreset = useVehicleStore(state => state.applyLightingPreset);

  const colorNames = Object.keys(lighting.colors) as LightingColorName[];
  const allEnabled = lighting.zones.every(zone => zone.enabled);
  const averageBrightness = Math.round(
    lighting.zones.reduce((total, zone) => total + zone.brightness, 0) / lighting.zones.length
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto pb-32">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight uppercase">Unified Lighting</h1>
          <p className="text-muted-foreground text-sm mt-1">Front and rear Anko IR, plus boot Lotus Lantern Bluetooth LED control.</p>
        </div>
        <div className="flex gap-2">
          <Button variant={allEnabled ? "default" : "outline"} onClick={() => setAllLighting(true)}>
            <Power className="w-4 h-4" /> All On
          </Button>
          <Button variant="outline" onClick={() => setAllLighting(false)}>
            <Power className="w-4 h-4" /> All Off
          </Button>
        </div>
      </div>

      <Card className="bg-card/40 border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-widest text-muted-foreground">
            <Settings2 className="w-4 h-4" /> Group Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Colour</p>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
              {colorNames.map(color => (
                <Button
                  key={color}
                  variant="outline"
                  className="h-14 flex-col gap-1"
                  onClick={() => applyLightingPreset(color, averageBrightness)}
                >
                  <span className="w-5 h-5 rounded-full border border-white/30" style={{ backgroundColor: lighting.colors[color] }} />
                  <span className="text-xs">{color}</span>
                </Button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">All-zone brightness</p>
              <span className="font-mono font-bold">{averageBrightness}%</span>
            </div>
            <Slider
              value={[averageBrightness]}
              onValueChange={(value) => {
                const color = lighting.zones[0]?.color ?? "Purple";
                applyLightingPreset(color, value[0]);
              }}
              min={0}
              max={100}
              step={1}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {lighting.zones.map(zone => {
          const Icon = zoneIcons[zone.id];
          return (
            <Card key={zone.id} className={`bg-card/40 border-border/50 overflow-hidden ${zone.enabled ? "border-t-4 border-t-primary" : "opacity-70"}`}>
              <CardContent className="p-5 space-y-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Icon className="w-5 h-5 text-primary" />
                      <h2 className="text-xl font-bold uppercase">{zone.name}</h2>
                    </div>
                    <p className="text-sm text-muted-foreground">{zone.controllerName}</p>
                    <Badge variant={zone.status === "online" ? "default" : "outline"} className="uppercase">
                      {zone.controllerType} / {zone.status}
                    </Badge>
                  </div>
                  <Switch checked={zone.enabled} onCheckedChange={(enabled) => updateLightingZone(zone.id, { enabled })} />
                </div>

                <div className="rounded-lg border border-border/40 bg-background/30 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-muted-foreground">Current colour</p>
                      <p className="text-lg font-bold">{zone.color}</p>
                    </div>
                    <span className="w-12 h-12 rounded-full border border-white/20 shadow-inner" style={{ backgroundColor: zone.enabled ? lighting.colors[zone.color] : "#1e293b" }} />
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Zone colour</p>
                  <div className="grid grid-cols-4 gap-2">
                    {colorNames.map(color => (
                      <button
                        key={color}
                        type="button"
                        aria-label={`${zone.name} ${color}`}
                        className={`h-10 rounded-md border transition-all ${zone.color === color ? "border-primary ring-2 ring-primary/40" : "border-border/50"}`}
                        style={{ backgroundColor: lighting.colors[color] }}
                        onClick={() => updateLightingZone(zone.id, { color, enabled: true })}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Brightness</p>
                    <span className="font-mono font-bold">{zone.brightness}%</span>
                  </div>
                  <Slider
                    value={[zone.brightness]}
                    onValueChange={(value) => updateLightingZone(zone.id, { brightness: value[0], enabled: true })}
                    min={0}
                    max={100}
                    step={1}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-card/40 border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-widest text-muted-foreground">
            <RotateCcw className="w-4 h-4" /> Future Sensor Triggers
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {lighting.automationRules.map(rule => (
            <div key={rule.id} className="rounded-lg border border-border/40 bg-background/30 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-bold text-sm">{eventLabels[rule.event]}</p>
                {rule.event === "doorOpen" && <DoorOpen className="w-4 h-4 text-muted-foreground" />}
                {rule.event === "bootOpen" && <Lightbulb className="w-4 h-4 text-muted-foreground" />}
                {rule.event === "reverseGear" && <Lightbulb className="w-4 h-4 text-muted-foreground" />}
                {rule.event === "parkingMode" && <ParkingCircle className="w-4 h-4 text-muted-foreground" />}
                {rule.event === "vehicleStatus" && <Settings2 className="w-4 h-4 text-muted-foreground" />}
              </div>
              <p className="text-xs text-muted-foreground mt-2">{rule.color} / {rule.brightness}%</p>
              <p className="text-xs text-muted-foreground">{rule.enabled ? "Enabled" : "Prepared, disabled"}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}
