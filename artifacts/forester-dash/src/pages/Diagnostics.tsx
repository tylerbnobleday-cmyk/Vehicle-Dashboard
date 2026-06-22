import { useVehicleStore } from "@/store/vehicleStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { motion } from "framer-motion";
import { Activity, Wifi, Terminal } from "lucide-react";
import { format } from "date-fns";

export default function Diagnostics() {
  const sensorData = useVehicleStore(state => state.sensorData);
  
  const sensors = [
    { name: 'Vehicle Speed', value: `${sensorData.speed} km/h`, status: 'Simulated' },
    { name: 'Outside Temp', value: sensorData.outsideTemp === null ? '--' : `${sensorData.outsideTemp.toFixed(1)} C`, status: 'Weather' },
    { name: sensorData.locationStatus === 'cached' ? 'Last Tablet Location' : 'Location', value: sensorData.latitude === null || sensorData.longitude === null ? sensorData.locationStatus : `${sensorData.latitude.toFixed(4)}, ${sensorData.longitude.toFixed(4)}`, status: sensorData.locationStatus === 'cached' ? 'Cached' : 'Browser' },
    { name: 'Driver Door (RH)', value: sensorData.driverDoor ? 'OPEN' : 'CLOSED', status: 'Simulated' },
    { name: 'Passenger Door (LH)', value: sensorData.passengerDoor ? 'OPEN' : 'CLOSED', status: 'Simulated' },
    { name: 'Boot', value: sensorData.boot ? 'OPEN' : 'CLOSED', status: 'Simulated' },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-4 md:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto pb-32">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight uppercase">System Diagnostics</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card/40 border-green-500/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-2">
              <div className="bg-green-500/20 p-3 rounded-full">
                <Wifi className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Connection</p>
                <h3 className="text-xl font-bold text-green-500 uppercase">Browser Mode</h3>
              </div>
            </div>
            <p className="text-sm text-muted-foreground font-mono mt-4">Last update: {format(sensorData.timestamp, 'HH:mm:ss.SSS')}</p>
          </CardContent>
        </Card>

        <Card className="bg-card/40 border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-2">
              <div className="bg-primary/20 p-3 rounded-full">
                <Terminal className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Device ID</p>
                <h3 className="text-xl font-bold uppercase">Forester Dash v1.0</h3>
              </div>
            </div>
            <p className="text-sm text-muted-foreground font-mono mt-4">Platform: Browser (Local)</p>
          </CardContent>
        </Card>

        <Card className="bg-card/40 border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-2">
              <div className="bg-amber-500/20 p-3 rounded-full">
                <Activity className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Hardware</p>
                <h3 className="text-xl font-bold uppercase text-amber-500">Not Connected</h3>
              </div>
            </div>
            <p className="text-sm text-muted-foreground font-mono mt-4">Location uses browser geolocation when allowed</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card/40 border-border/50 shadow-lg">
        <CardHeader className="border-b border-border/50">
          <CardTitle className="uppercase tracking-widest text-lg">Live Sensor Data</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="uppercase font-bold tracking-wider">Sensor</TableHead>
                <TableHead className="uppercase font-bold tracking-wider">Value</TableHead>
                <TableHead className="uppercase font-bold tracking-wider text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="font-mono text-base">
              {sensors.map((s, i) => (
                <TableRow key={i} className="border-border/20">
                  <TableCell className="font-bold text-foreground/80">{s.name}</TableCell>
                  <TableCell className="text-primary font-bold">{s.value}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{s.status}</TableCell>
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
        <CardContent className="p-4 h-[200px] overflow-y-auto text-sm space-y-2 text-green-500/80">
          <p>[{format(Date.now() - 50000, 'HH:mm:ss')}] APP_INIT: LocalStorage driver mounted.</p>
          <p>[{format(Date.now() - 49000, 'HH:mm:ss')}] DATA_SYNC: Loaded state successfully.</p>
          <p>[{format(Date.now() - 48000, 'HH:mm:ss')}] LOCATION: Browser geolocation requested.</p>
          <p>[{format(Date.now() - 20000, 'HH:mm:ss')}] WEATHER: Outside temperature sync active.</p>
          <p className="text-primary">[{format(sensorData.timestamp, 'HH:mm:ss')}] HEARTBEAT: OK.</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
