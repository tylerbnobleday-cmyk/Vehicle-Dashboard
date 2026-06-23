import { useVehicleStore } from "@/store/vehicleStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Save, Download, Upload, AlertTriangle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { VehicleApi } from "@/services/vehicleApi";

export default function Settings() {
  const info = useVehicleStore(state => state.info);
  const updateInfo = useVehicleStore(state => state.updateInfo);
  const resetData = useVehicleStore(state => state.resetData);
  
  const [localInfo, setLocalInfo] = useState(info);
  const [isTrustedLocationDevice, setIsTrustedLocationDevice] = useState(
    VehicleApi.isTrustedLocationDevice()
  );

  const handleSaveInfo = () => {
    updateInfo(localInfo);
    toast({ title: 'Vehicle info saved.', variant: 'default' });
  };

  const handleExport = () => {
    const dataStr = localStorage.getItem('vehicle-storage-v9');
    if (!dataStr) return;
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `forester-dash-backup-${new Date().toISOString().slice(0,10)}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    toast({ title: 'Backup exported successfully.' });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const obj = JSON.parse(event.target?.result as string);
        if (obj && obj.state) {
          localStorage.setItem('vehicle-storage-v9', event.target?.result as string);
          toast({ title: 'Backup restored. Reloading app...' });
          setTimeout(() => window.location.reload(), 1500);
        } else {
          toast({ title: 'Invalid backup file.', variant: 'destructive' });
        }
      } catch (e) {
        toast({ title: 'Failed to parse backup.', variant: 'destructive' });
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (confirm("Are you sure you want to completely reset all data? This cannot be undone!")) {
      resetData();
      toast({ title: 'Factory reset complete.' });
    }
  };

  const handleTrustedLocationDevice = (trusted: boolean) => {
    VehicleApi.setTrustedLocationDevice(trusted);
    setIsTrustedLocationDevice(trusted);
    toast({
      title: trusted ? "This device is now the car tablet." : "Location disabled on this device.",
      description: trusted
        ? "Only this browser will request vehicle location until you trust another device."
        : "This browser will not request or report location.",
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-4 md:p-6 lg:p-8 space-y-8 max-w-4xl mx-auto pb-32">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight uppercase">System Settings</h1>

      <Card className="bg-card/40 border-border/50">
        <CardHeader>
          <CardTitle className="uppercase tracking-widest text-lg text-primary">Vehicle Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Display Name</Label>
              <Input value={localInfo.name} onChange={e => setLocalInfo({...localInfo, name: e.target.value})} className="h-12 text-lg" />
            </div>
            <div className="space-y-2">
              <Label>Odometer</Label>
              <Input type="number" value={localInfo.odometer} onChange={e => setLocalInfo({...localInfo, odometer: parseInt(e.target.value)})} className="h-12 text-lg font-mono" />
            </div>
            <div className="space-y-2">
              <Label>Make</Label>
              <Input value={localInfo.make} onChange={e => setLocalInfo({...localInfo, make: e.target.value})} className="h-12 text-lg" />
            </div>
            <div className="space-y-2">
              <Label>Model</Label>
              <Input value={localInfo.model} onChange={e => setLocalInfo({...localInfo, model: e.target.value})} className="h-12 text-lg" />
            </div>
            <div className="space-y-2">
              <Label>Registration Number</Label>
              <Input value={localInfo.registration} onChange={e => setLocalInfo({...localInfo, registration: e.target.value})} className="h-12 text-lg font-mono uppercase" />
            </div>
            <div className="space-y-2">
              <Label>Registration Expiry</Label>
              <Input value={localInfo.registrationExpiry} onChange={e => setLocalInfo({...localInfo, registrationExpiry: e.target.value})} className="h-12 text-lg" />
            </div>
            <div className="space-y-2">
              <Label>VIN</Label>
              <Input value={localInfo.vin} onChange={e => setLocalInfo({...localInfo, vin: e.target.value})} className="h-12 text-lg font-mono uppercase" />
            </div>
            <div className="space-y-2">
              <Label>Engine Number</Label>
              <Input value={localInfo.engineNumber} onChange={e => setLocalInfo({...localInfo, engineNumber: e.target.value})} className="h-12 text-lg font-mono uppercase" />
            </div>
            <div className="space-y-2">
              <Label>Colour</Label>
              <Input value={localInfo.colour} onChange={e => setLocalInfo({...localInfo, colour: e.target.value})} className="h-12 text-lg" />
            </div>
            <div className="space-y-2">
              <Label>Roadworthy Certificate</Label>
              <Input value={localInfo.roadworthyCertificate} onChange={e => setLocalInfo({...localInfo, roadworthyCertificate: e.target.value})} className="h-12 text-lg font-mono uppercase" />
            </div>
            <div className="space-y-2">
              <Label>Insurance Provider</Label>
              <Input value={localInfo.insuranceProvider ?? ''} onChange={e => setLocalInfo({...localInfo, insuranceProvider: e.target.value})} className="h-12 text-lg" />
            </div>
          </div>
          <Button onClick={handleSaveInfo} size="lg" className="h-14 px-8 text-lg w-full md:w-auto mt-4">
            <Save className="w-5 h-5 mr-2" /> Save Details
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-card/40 border-border/50">
        <CardHeader>
          <CardTitle className="uppercase tracking-widest text-lg text-primary">Trusted Car Tablet</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-lg border border-border/50 bg-background/40 p-4">
            <div>
              <p className="font-bold uppercase tracking-wider">
                {isTrustedLocationDevice ? "Location enabled on this device" : "Location blocked on this device"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Mark only the tablet that stays in the car. Other devices will not request location or weather.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={isTrustedLocationDevice ? "default" : "outline"}
                onClick={() => handleTrustedLocationDevice(true)}
                className="h-11"
              >
                Trust This Device
              </Button>
              <Button
                variant="outline"
                onClick={() => handleTrustedLocationDevice(false)}
                className="h-11"
              >
                Disable
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/40 border-border/50">
        <CardHeader>
          <CardTitle className="uppercase tracking-widest text-lg text-primary">Data Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-background/50 p-6 rounded-lg border border-border/50 text-center flex flex-col items-center">
              <Download className="w-8 h-8 mb-4 text-muted-foreground" />
              <h3 className="font-bold uppercase tracking-wider mb-2">Export Backup</h3>
              <p className="text-sm text-muted-foreground mb-6">Download a full JSON backup of all vehicle data, history, and settings.</p>
              <Button onClick={handleExport} variant="outline" className="w-full h-12 text-base font-bold uppercase tracking-wider">Export JSON</Button>
            </div>
            
            <div className="bg-background/50 p-6 rounded-lg border border-border/50 text-center flex flex-col items-center">
              <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
              <h3 className="font-bold uppercase tracking-wider mb-2">Import Backup</h3>
              <p className="text-sm text-muted-foreground mb-6">Restore from a previous backup. This will overwrite current data.</p>
              <div className="relative w-full">
                <Input type="file" accept=".json" onChange={handleImport} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <Button variant="outline" className="w-full h-12 text-base font-bold uppercase tracking-wider border-primary text-primary hover:bg-primary/10">Select File</Button>
              </div>
            </div>
          </div>

          <div className="bg-destructive/10 border border-destructive/30 p-6 rounded-lg flex items-center justify-between">
            <div>
              <h3 className="font-bold text-destructive uppercase tracking-wider flex items-center"><AlertTriangle className="w-5 h-5 mr-2" /> Danger Zone</h3>
              <p className="text-sm text-muted-foreground mt-1">Permanently wipe all vehicle data and reset to factory defaults.</p>
            </div>
            <Button variant="destructive" onClick={handleReset} className="h-12 px-6 font-bold uppercase">Factory Reset</Button>
          </div>
        </CardContent>
      </Card>
      
      <div className="text-center text-muted-foreground/50 font-mono text-sm uppercase tracking-widest pt-8">
        Forester Dash OS v1.0.0
      </div>
    </motion.div>
  );
}
