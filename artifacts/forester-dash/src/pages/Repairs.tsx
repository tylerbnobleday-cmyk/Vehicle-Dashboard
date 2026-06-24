import { useState } from "react";
import { useVehicleStore, RepairRecord } from "@/store/vehicleStore";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { PlusCircle, Wrench, Edit, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";

export default function Repairs() {
  const repairs = useVehicleStore(state => state.repairs);
  const addRepair = useVehicleStore(state => state.addRepair);
  const updateRepair = useVehicleStore(state => state.updateRepair);
  const deleteRepair = useVehicleStore(state => state.deleteRepair);

  const [statusFilter, setStatusFilter] = useState("All");
  const [isAdding, setIsAdding] = useState(false);
  const [editingRepair, setEditingRepair] = useState<RepairRecord | null>(null);
  const [newRepair, setNewRepair] = useState({ title: '', priority: 'Medium' as any, status: 'Not Started' as any, notes: '' });

  const filteredRepairs = repairs
    .filter(r => statusFilter === "All" || r.status === statusFilter)
    .sort((a, b) => {
      const completionOrder = Number(a.status === "Completed") - Number(b.status === "Completed");
      if (completionOrder !== 0) return completionOrder;
      return new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime();
    });

  const handleSaveAdd = () => {
    addRepair(newRepair);
    setIsAdding(false);
    setNewRepair({ title: '', priority: 'Medium', status: 'Not Started', notes: '' });
  };

  const handleSaveEdit = () => {
    if (editingRepair) {
      updateRepair(editingRepair.id, editingRepair);
      setEditingRepair(null);
    }
  };

  const statuses = ['All', 'Not Started', 'Waiting for Parts', 'In Progress', 'Booked', 'Completed'];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-4 md:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight uppercase">Projects & Repairs</h1>
        
        <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <DialogTrigger asChild>
            <Button size="lg" className="h-14 px-6 text-lg"><PlusCircle className="mr-2 w-6 h-6" /> Add Project</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-2xl uppercase">New Project/Repair</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 pt-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={newRepair.title} onChange={e => setNewRepair({...newRepair, title: e.target.value})} className="h-12 text-lg" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <select 
                    className="flex h-12 w-full rounded-md border border-input bg-transparent px-3 py-1 text-lg"
                    value={newRepair.priority} 
                    onChange={e => setNewRepair({...newRepair, priority: e.target.value as any})}
                  >
                    <option>Critical</option>
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <select 
                    className="flex h-12 w-full rounded-md border border-input bg-transparent px-3 py-1 text-lg"
                    value={newRepair.status} 
                    onChange={e => setNewRepair({...newRepair, status: e.target.value as any})}
                  >
                    <option>Not Started</option>
                    <option>Waiting for Parts</option>
                    <option>In Progress</option>
                    <option>Booked</option>
                    <option>Completed</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea value={newRepair.notes} onChange={e => setNewRepair({...newRepair, notes: e.target.value})} className="min-h-[100px]" />
              </div>
              <Button onClick={handleSaveAdd} size="lg" className="w-full h-14 text-lg">Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {statuses.map(s => (
          <Button 
            key={s} 
            variant={statusFilter === s ? "default" : "outline"} 
            className="h-12 text-base font-bold whitespace-nowrap rounded-full"
            onClick={() => setStatusFilter(s)}
          >
            {s} ({s === 'All' ? repairs.length : repairs.filter(r => r.status === s).length})
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredRepairs.map(repair => (
          <Card key={repair.id} className="bg-card/40 border-border/50 hover:bg-card/60 transition-all shadow-md group">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold pr-8">{repair.title}</h3>
                <Button variant="ghost" size="icon" onClick={() => setEditingRepair(repair)} className="absolute top-4 right-4 opacity-50 group-hover:opacity-100">
                  <Edit className="w-5 h-5" />
                </Button>
              </div>
              <div className="flex gap-3 mb-4">
                <StatusBadge status={repair.priority} />
                <StatusBadge status={repair.status} />
              </div>
              <p className="text-muted-foreground text-lg mb-4 line-clamp-2">{repair.notes || "No notes provided."}</p>
              <div className="text-sm text-muted-foreground font-mono">
                Created {format(new Date(repair.dateCreated), 'MMM dd, yyyy')}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!editingRepair} onOpenChange={(o) => !o && setEditingRepair(null)}>
        <DialogContent className="sm:max-w-[500px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-2xl uppercase">Edit Project</DialogTitle>
          </DialogHeader>
          {editingRepair && (
            <div className="space-y-6 pt-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={editingRepair.title} onChange={e => setEditingRepair({...editingRepair, title: e.target.value})} className="h-12 text-lg" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <select 
                    className="flex h-12 w-full rounded-md border border-input bg-transparent px-3 py-1 text-lg"
                    value={editingRepair.priority} 
                    onChange={e => setEditingRepair({...editingRepair, priority: e.target.value as any})}
                  >
                    <option>Critical</option>
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <select 
                    className="flex h-12 w-full rounded-md border border-input bg-transparent px-3 py-1 text-lg"
                    value={editingRepair.status} 
                    onChange={e => setEditingRepair({...editingRepair, status: e.target.value as any})}
                  >
                    <option>Not Started</option>
                    <option>Waiting for Parts</option>
                    <option>In Progress</option>
                    <option>Booked</option>
                    <option>Completed</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea value={editingRepair.notes} onChange={e => setEditingRepair({...editingRepair, notes: e.target.value})} className="min-h-[150px] text-lg" />
              </div>
              <div className="flex justify-between items-center pt-4">
                <Button variant="destructive" size="lg" onClick={() => { deleteRepair(editingRepair.id); setEditingRepair(null); }}>
                  <Trash2 className="w-5 h-5 mr-2" /> Delete
                </Button>
                <Button onClick={handleSaveEdit} size="lg" className="h-14 px-8 text-lg">Save</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
