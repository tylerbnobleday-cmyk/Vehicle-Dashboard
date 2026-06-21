import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Lightbulb, Info } from "lucide-react";

export default function Lighting() {
  const [zones, setZones] = useState([
    { id: 1, name: 'Driver Footwell', active: true, color: '#0070c0' },
    { id: 2, name: 'Passenger Footwell', active: true, color: '#0070c0' },
    { id: 3, name: 'Rear Footwell', active: false, color: '#0070c0' },
    { id: 4, name: 'Boot Area', active: true, color: '#ffffff' },
    { id: 5, name: 'Ambient Strip', active: true, color: '#0070c0' },
  ]);

  const [brightness, setBrightness] = useState(80);

  const toggleZone = (id: number) => {
    setZones(zones.map(z => z.id === id ? { ...z, active: !z.active } : z));
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-4 md:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto pb-32">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight uppercase">Interior Lighting</h1>

      <div className="bg-primary/20 border border-primary/50 text-primary-foreground p-4 rounded-lg flex items-start gap-4">
        <Info className="w-6 h-6 text-primary mt-1" />
        <div>
          <h4 className="font-bold uppercase tracking-wider text-primary">Simulation Mode Active</h4>
          <p className="text-primary-foreground/80 mt-1">Hardware integration for ESP32 WLED controller coming soon. Controls below are simulated.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card className="bg-card/40 border-border/50 shadow-lg border-t-4 border-t-primary">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-bold uppercase">Zone Controller A</h3>
                  <p className="text-green-500 font-mono text-sm uppercase tracking-widest mt-1">● Online (Simulated)</p>
                </div>
                <Lightbulb className="w-8 h-8 text-primary" />
              </div>
              
              <div className="space-y-4">
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Master Brightness</p>
                <div className="flex items-center gap-4">
                  <Slider 
                    value={[brightness]} 
                    onValueChange={(v) => setBrightness(v[0])} 
                    max={100} 
                    step={1}
                    className="flex-1"
                  />
                  <span className="font-mono font-bold w-12 text-right text-xl">{brightness}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/20 border-border/20 shadow-none opacity-60">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold uppercase text-muted-foreground">Zone Controller B</h3>
                  <p className="text-muted-foreground font-mono text-sm uppercase tracking-widest mt-1">○ Offline</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-bold text-muted-foreground uppercase tracking-widest mb-4">Lighting Zones</h3>
          {zones.map(zone => (
            <Card key={zone.id} className={`bg-card/40 border-border/50 transition-all ${zone.active ? 'border-l-4 border-l-primary' : ''}`}>
              <CardContent className="p-5 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full shadow-inner border border-white/20" style={{ backgroundColor: zone.active ? zone.color : '#1e293b' }} />
                  <span className="text-xl font-bold">{zone.name}</span>
                </div>
                <Switch checked={zone.active} onCheckedChange={() => toggleZone(zone.id)} className="scale-125" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
