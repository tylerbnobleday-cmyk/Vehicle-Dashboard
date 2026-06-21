import { useState } from "react";
import { useVehicleStore } from "@/store/vehicleStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { PlusCircle, Info, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function Service() {
  const info = useVehicleStore(state => state.info);
  const updateInfo = useVehicleStore(state => state.updateInfo);
  const services = useVehicleStore(state => state.services);
  const addService = useVehicleStore(state => state.addService);
  const updateService = useVehicleStore(state => state.updateService);

  const [odometerInput, setOdometerInput] = useState(info.odometer.toString());
  const [isAdding, setIsAdding] = useState(false);
  const [newService, setNewService] = useState({ type: '', date: format(new Date(), 'yyyy-MM-dd'), odometer: info.odometer, notes: '', status: 'OK' as any });

  const handleUpdateOdo = () => {
    updateInfo({ odometer: parseInt(odometerInput) });
  };

  const handleAdd = () => {
    addService({
      type: newService.type,
      date: new Date(newService.date).toISOString(),
      odometer: newService.odometer,
      notes: newService.notes,
      status: newService.status,
    });
    setIsAdding(false);
    setNewService({ type: '', date: format(new Date(), 'yyyy-MM-dd'), odometer: info.odometer, notes: '', status: 'OK' });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-4 md:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto pb-32">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight uppercase">Service History</h1>
        <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <DialogTrigger asChild>
            <Button size="lg" className="h-14 px-6 text-lg"><PlusCircle className="mr-2 w-6 h-6" /> Log Service</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-2xl uppercase">Log New Service</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Service Type</Label>
                  <Input value={newService.type} onChange={e => setNewService({...newService, type: e.target.value})} placeholder="e.g. Oil Change" className="h-12 text-lg" />
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" value={newService.date} onChange={e => setNewService({...newService, date: e.target.value})} className="h-12 text-lg" />
                </div>
                <div className="space-y-2">
                  <Label>Odometer</Label>
                  <Input type="number" value={newService.odometer} onChange={e => setNewService({...newService, odometer: parseInt(e.target.value)})} className="h-12 text-lg" />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <select 
                    className="flex h-12 w-full rounded-md border border-input bg-transparent px-3 py-1 text-lg shadow-sm transition-colors"
                    value={newService.status} 
                    onChange={e => setNewService({...newService, status: e.target.value as any})}
                  >
                    <option value="OK">OK</option>
                    <option value="DUE SOON">Due Soon</option>
                    <option value="OVERDUE">Overdue</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea value={newService.notes} onChange={e => setNewService({...newService, notes: e.target.value})} placeholder="Parts used, observations..." className="min-h-[100px] text-lg" />
              </div>
              <Button onClick={handleAdd} size="lg" className="w-full h-14 text-lg">Save Record</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Odometer Bar */}
      <Card className="bg-card/40 border-primary/20 shadow-[0_0_15px_rgba(0,112,192,0.1)]">
        <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-primary/20 p-4 rounded-full">
              <Info className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-widest font-bold">Current Odometer</p>
              <p className="text-4xl font-mono font-bold">{info.odometer.toLocaleString()} <span className="text-xl text-muted-foreground">km</span></p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Input 
              type="number" 
              value={odometerInput} 
              onChange={(e) => setOdometerInput(e.target.value)}
              className="h-14 text-2xl font-mono w-48 font-bold bg-background/50 border-border/80"
            />
            <Button size="lg" onClick={handleUpdateOdo} className="h-14 px-8 text-lg font-bold">
              Update
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Service List */}
      <div className="space-y-4">
        {services.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(service => (
          <Card key={service.id} className="bg-card/30 border-border/50 hover:bg-card/50 transition-colors">
            <CardContent className="p-6 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-4">
                  <h3 className="text-2xl font-bold">{service.type}</h3>
                  <StatusBadge status={service.status} className="px-3 py-1 text-sm" />
                </div>
                <div className="flex gap-6 text-muted-foreground font-mono text-lg">
                  <span>{format(new Date(service.date), 'dd MMM yyyy')}</span>
                  <span>{service.odometer.toLocaleString()} km</span>
                </div>
                {service.notes && <p className="text-foreground/80 mt-2 text-lg">{service.notes}</p>}
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="lg" 
                  onClick={() => updateService(service.id, { status: 'OK', date: new Date().toISOString(), odometer: info.odometer })}
                  className="h-12 border-green-500/30 text-green-500 hover:bg-green-500/10"
                >
                  <Check className="mr-2 w-5 h-5" /> Mark Done
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}
