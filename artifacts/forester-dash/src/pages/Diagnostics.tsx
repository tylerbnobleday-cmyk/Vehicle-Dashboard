import { useVehicleStore } from "@/store/vehicleStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { motion } from "framer-motion";
import { Database, MapPin, Terminal, WifiOff } from "lucide-react";
import { format } from "date-fns";

export default function Diagnostics() {
  const sensorData = useVehicleStore(state => state.sensorData);
  const services = useVehicleStore(state => state.services);
  const tyres = useVehicleStore(state => state.tyres);
  const repairs = useVehicleStore(state => state.repairs);
  const reminders = useVehicleStore(state => state.reminders);

  const rows = [
    { name: "Vehicle records", value: `${services.length} service entries`, status: "LocalStorage" },
    { name: "Tyre records", value: `${tyres.length} tyres`, status: "Manual" },
    { name: "Repair records", value: `${repairs.length} items`, status: "Manual" },
    { name: "Reminder records", value: `${reminders.length} reminders`, status: "Manual" },
    {
      name: sensorData.locationStatus === "cached" ? "Last tablet location" : "Tablet location",
      value: sensorData.latitude === null || sensorData.longitude === null
        ? sensorData.locationStatus
        : `${sensorData.latitude.toFixed(4)}, ${sensorData.longitude.toFixed(4)}`,
      status: sensorData.locationStatus === "available" ? "Browser GPS" : sensorData.locationStatus,
    },
    {
      name: "GPS odometer assist",
      value: `${sensorData.estimatedDistanceKm.toFixed(1)} km pending`,
      status: "Estimate",
    },
    {
      name: "Outside temperature",
      value: sensorData.outsideTemp === null ? "--" : `${sensorData.outsideTemp.toFixed(1)} C`,
      status: "Weather API",
    },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-4 md:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto pb-32">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight uppercase">System Diagnostics</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card/40 border-green-500/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-2">
              <div className="bg-green-500/20 p-3 rounded-full">
                <Database className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Records</p>
                <h3 className="text-xl font-bold text-green-500 uppercase">Local</h3>
              </div>
            </div>
            <p className="text-sm text-muted-foreground font-mono mt-4">Saved in this browser</p>
          </CardContent>
        </Card>

        <Card className="bg-card/40 border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-2">
              <div className="bg-primary/20 p-3 rounded-full">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Location</p>
                <h3 className="text-xl font-bold uppercase">{sensorData.locationStatus}</h3>
              </div>
            </div>
            <p className="text-sm text-muted-foreground font-mono mt-4">
              {sensorData.locationAccuracy === null ? "No accuracy report" : `Accuracy +/- ${Math.round(sensorData.locationAccuracy)} m`}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/40 border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-2">
              <div className="bg-amber-500/20 p-3 rounded-full">
                <WifiOff className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Car Hardware</p>
                <h3 className="text-xl font-bold uppercase text-amber-500">Not Connected</h3>
              </div>
            </div>
            <p className="text-sm text-muted-foreground font-mono mt-4">No door, speed, handbrake, RPM, fuel, or engine sensors are wired.</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card/40 border-border/50 shadow-lg">
        <CardHeader className="border-b border-border/50">
          <CardTitle className="uppercase tracking-widest text-lg">Real Data Sources</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="uppercase font-bold tracking-wider">Item</TableHead>
                <TableHead className="uppercase font-bold tracking-wider">Value</TableHead>
                <TableHead className="uppercase font-bold tracking-wider text-right">Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="font-mono text-base">
              {rows.map((row) => (
                <TableRow key={row.name} className="border-border/20">
                  <TableCell className="font-bold text-foreground/80">{row.name}</TableCell>
                  <TableCell className="text-primary font-bold">{row.value}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{row.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="bg-[#0f172a] border-border/50 font-mono shadow-lg">
        <CardHeader className="border-b border-border/20 pb-4">
          <CardTitle className="uppercase tracking-widest text-sm text-muted-foreground flex items-center">
            <Terminal className="w-4 h-4 mr-2" /> System Log
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 h-[160px] overflow-y-auto text-sm space-y-2 text-green-500/80">
          <p>[{format(Date.now() - 50000, "HH:mm:ss")}] APP_INIT: Local record store mounted.</p>
          <p>[{format(Date.now() - 49000, "HH:mm:ss")}] DATA_SYNC: Vehicle records loaded.</p>
          <p>[{format(Date.now() - 48000, "HH:mm:ss")}] HARDWARE: No vehicle sensor bridge configured.</p>
          <p>[{format(Date.now() - 20000, "HH:mm:ss")}] LOCATION: {sensorData.locationStatus}.</p>
          <p className="text-primary">[{format(sensorData.timestamp, "HH:mm:ss")}] STATE: Ready.</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
