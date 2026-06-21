import { useState } from "react";
import { useVehicleStore, TyreRecord } from "@/store/vehicleStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { motion } from "framer-motion";
import { Settings, Check, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export default function Tyres() {
  const tyres = useVehicleStore(state => state.tyres);
  const updateTyre = useVehicleStore(state => state.updateTyre);
  
  const [editingTyre, setEditingTyre] = useState<TyreRecord | null>(null);

  const getPressureColor = (p: number, target: number) => {
    const diff = Math.abs(p - target);
    if (diff <= 1) return "text-green-500";
    if (diff <= 3) return "text-amber-500";
    return "text-red-500";
  };

  const formatInstallDate = (installDate: string) => {
    if (!installDate) return "date not set";

    const date = new Date(installDate);
    if (Number.isNaN(date.getTime())) return "date not set";

    return format(date, "MMM yyyy");
  };

  const handleSave = () => {
    if (editingTyre) {
      updateTyre(editingTyre.id, editingTyre);
      setEditingTyre(null);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-4 md:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto pb-32">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight uppercase">Tyre Management</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Car Diagram */}
        <Card className="bg-card/30 border-border/50 lg:col-span-1 min-h-[400px] flex items-center justify-center p-8">
          <div className="relative w-48 h-[400px] border-4 border-dashed border-border/30 rounded-3xl p-4 flex flex-col justify-between">
            <div className="text-center uppercase tracking-widest text-muted-foreground font-bold mb-4">Front</div>
            
            <div className="flex justify-between w-full absolute top-16 left-0 right-0 px-2 -mx-6">
              <div className="w-12 h-24 bg-card border-2 border-primary rounded-xl flex items-center justify-center font-bold">FL</div>
              <div className="w-12 h-24 bg-card border-2 border-primary rounded-xl flex items-center justify-center font-bold">FR</div>
            </div>

            <div className="flex justify-between w-full absolute bottom-16 left-0 right-0 px-2 -mx-6">
              <div className="w-12 h-24 bg-card border-2 border-primary rounded-xl flex items-center justify-center font-bold">RL</div>
              <div className="w-12 h-24 bg-card border-2 border-primary rounded-xl flex items-center justify-center font-bold">RR</div>
            </div>
            
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border-4 border-dashed border-muted-foreground/30 flex items-center justify-center text-xs font-bold text-muted-foreground uppercase">
              Spare
            </div>
            
            <div className="text-center uppercase tracking-widest text-muted-foreground font-bold mt-auto pt-4">Rear</div>
          </div>
        </Card>

        {/* Tyre Cards */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          {tyres.map(tyre => (
            <Card key={tyre.id} className="bg-card/40 border-border/50 shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-bold uppercase">{tyre.position}</h3>
                    <p className="text-muted-foreground font-medium text-lg">{tyre.brand}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-10 w-10 bg-background/50" onClick={() => setEditingTyre(tyre)}>
                    <Settings className="w-5 h-5" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-background/50 p-3 rounded-lg border border-border/50">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">Pressure</p>
                    <p className={`text-3xl font-mono font-bold ${getPressureColor(tyre.pressure, tyre.targetPressure)}`}>
                      {tyre.pressure}<span className="text-lg text-muted-foreground ml-1">psi</span>
                    </p>
                  </div>
                  <div className="bg-background/50 p-3 rounded-lg border border-border/50">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">Condition</p>
                    <div className="mt-1">
                      <StatusBadge status={tyre.condition} className="text-sm px-2 py-1" />
                    </div>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground flex items-center">
                  <Check className="w-4 h-4 mr-2" /> Installed {formatInstallDate(tyre.installDate)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={!!editingTyre} onOpenChange={(o) => !o && setEditingTyre(null)}>
        <DialogContent className="sm:max-w-[500px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-2xl uppercase">Edit {editingTyre?.position} Tyre</DialogTitle>
          </DialogHeader>
          {editingTyre && (
            <div className="space-y-6 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label>Brand & Model</Label>
                  <Input value={editingTyre.brand} onChange={e => setEditingTyre({...editingTyre, brand: e.target.value})} className="h-12 text-lg" />
                </div>
                <div className="space-y-2">
                  <Label>Current Pressure (psi)</Label>
                  <Input type="number" value={editingTyre.pressure} onChange={e => setEditingTyre({...editingTyre, pressure: parseInt(e.target.value)})} className="h-12 text-lg" />
                </div>
                <div className="space-y-2">
                  <Label>Condition</Label>
                  <select 
                    className="flex h-12 w-full rounded-md border border-input bg-transparent px-3 py-1 text-lg shadow-sm transition-colors"
                    value={editingTyre.condition} 
                    onChange={e => setEditingTyre({...editingTyre, condition: e.target.value as any})}
                  >
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                    <option value="Replace">Replace</option>
                  </select>
                </div>
              </div>
              <Button onClick={handleSave} size="lg" className="w-full h-14 text-lg">Save Changes</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
