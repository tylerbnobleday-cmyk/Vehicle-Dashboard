import { useVehicleStore } from "@/store/vehicleStore";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { Battery, Zap, AlertTriangle, Droplet } from "lucide-react";
import { motion } from "framer-motion";

export default function Speedometer() {
  const sensorData = useVehicleStore(state => state.sensorData);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hasWarnings = sensorData.batteryVoltage < 12.0 || sensorData.cabinTemp > 40 || sensorData.boot || sensorData.bonnet || sensorData.driverDoor || sensorData.passengerDoor || sensorData.rearLeftDoor || sensorData.rearRightDoor;

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="fixed inset-0 bg-background flex flex-col justify-between p-6 pb-28 overflow-hidden"
    >
      {/* Top Status Bar */}
      <div className="flex justify-between items-center px-8 py-4 border-b border-border/30">
        <div className="flex gap-8 text-xl font-mono text-muted-foreground font-semibold">
          <span>OUT: {sensorData.outsideTemp.toFixed(1)}°</span>
          <span>CABIN: {sensorData.cabinTemp.toFixed(1)}°</span>
        </div>
        
        {/* Warning strip */}
        <div className="flex gap-4">
          {sensorData.handbrake && <div className="bg-red-600 text-white px-4 py-1 rounded-full font-bold uppercase animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.6)]">Brake</div>}
          {hasWarnings && <AlertTriangle className="w-8 h-8 text-red-500 animate-pulse" />}
          {sensorData.headlights && <div className="bg-green-500 text-black px-4 py-1 rounded-full font-bold uppercase shadow-[0_0_15px_rgba(34,197,94,0.6)]">Lights</div>}
        </div>

        <div className="text-2xl font-mono font-bold text-primary tracking-widest">
          {format(time, 'HH:mm:ss')}
        </div>
      </div>

      {/* Main Dial */}
      <div className="flex-1 flex flex-col items-center justify-center relative">
        {/* Decorative background circle */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[40vw] h-[40vw] rounded-full border border-primary/10 shadow-[inset_0_0_50px_rgba(0,112,192,0.05)]" />
        </div>

        <div className="text-[12rem] md:text-[18rem] leading-none font-bold font-mono tracking-tighter text-foreground drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">
          {sensorData.speed.toString().padStart(3, '0')}
        </div>
        <div className="text-4xl text-primary font-bold uppercase tracking-[0.5em] mt-4">
          km/h
        </div>
      </div>

      {/* Bottom Gauges */}
      <div className="grid grid-cols-3 gap-8 px-12">
        <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-card/40 border border-border/50">
          <Battery className={`w-10 h-10 mb-2 ${sensorData.batteryVoltage < 12 ? 'text-red-500' : 'text-primary'}`} />
          <span className="text-4xl font-mono font-bold">{sensorData.batteryVoltage.toFixed(1)}<span className="text-2xl text-muted-foreground">V</span></span>
          <span className="text-sm text-muted-foreground uppercase tracking-widest mt-2">Battery</span>
        </div>
        
        <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-card/40 border border-border/50">
          <Zap className="w-10 h-10 mb-2 text-primary" />
          <span className="text-4xl font-mono font-bold">{Math.round(sensorData.rpm)}<span className="text-2xl text-muted-foreground"></span></span>
          <span className="text-sm text-muted-foreground uppercase tracking-widest mt-2">RPM</span>
        </div>

        <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-card/40 border border-border/50">
          <Droplet className={`w-10 h-10 mb-2 ${sensorData.fuelLevel < 15 ? 'text-amber-500' : 'text-primary'}`} />
          <span className="text-4xl font-mono font-bold">{Math.round(sensorData.fuelLevel)}<span className="text-2xl text-muted-foreground">%</span></span>
          <span className="text-sm text-muted-foreground uppercase tracking-widest mt-2">Fuel</span>
        </div>
      </div>
    </motion.div>
  );
}
