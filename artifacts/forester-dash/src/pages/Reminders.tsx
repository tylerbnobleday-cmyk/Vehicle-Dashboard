import { useState } from "react";
import { useVehicleStore, ReminderRecord } from "@/store/vehicleStore";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { PlusCircle, Calendar, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { format, formatDistanceToNowStrict } from "date-fns";

export default function Reminders() {
  const reminders = useVehicleStore(state => state.reminders);
  const addReminder = useVehicleStore(state => state.addReminder);
  const deleteReminder = useVehicleStore(state => state.deleteReminder);

  const [isAdding, setIsAdding] = useState(false);
  const [newReminder, setNewReminder] = useState<Omit<ReminderRecord, 'id'>>({ 
    title: '', type: 'Custom', dueDate: '', dueOdometer: undefined, notes: '', recurring: false, status: 'Upcoming' 
  });

  const handleSaveAdd = () => {
    addReminder(newReminder);
    setIsAdding(false);
    setNewReminder({ title: '', type: 'Custom', dueDate: '', dueOdometer: undefined, notes: '', recurring: false, status: 'Upcoming' });
  };

  const getStatusColor = (status: string) => {
    if (status === 'Due Soon') return 'border-amber-500/50 bg-amber-500/5';
    if (status === 'Completed') return 'border-green-500/30 opacity-60';
    return 'border-border/50';
  };

  const reminderStatusText = (reminder: ReminderRecord) => {
    if ((reminder.type === 'Rego' || reminder.type === 'Insurance') && reminder.dueDate) {
      const due = new Date(reminder.dueDate);
      if (!Number.isNaN(due.getTime())) {
        const distance = formatDistanceToNowStrict(due, { addSuffix: false });
        return due.getTime() >= Date.now() ? `Expires in ${distance}` : `Expired ${distance} ago`;
      }
    }
    return reminder.status;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-4 md:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight uppercase">Reminders</h1>
        
        <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <DialogTrigger asChild>
            <Button size="lg" className="h-14 px-6 text-lg"><PlusCircle className="mr-2 w-6 h-6" /> Add Reminder</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-2xl uppercase">New Reminder</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 pt-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={newReminder.title} onChange={e => setNewReminder({...newReminder, title: e.target.value})} className="h-12 text-lg" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <select 
                    className="flex h-12 w-full rounded-md border border-input bg-transparent px-3 py-1 text-lg"
                    value={newReminder.type} 
                    onChange={e => setNewReminder({...newReminder, type: e.target.value as any})}
                  >
                    <option>Rego</option>
                    <option>Insurance</option>
                    <option>Service</option>
                    <option>Tyre</option>
                    <option>Oil</option>
                    <option>Camping</option>
                    <option>Custom</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <select 
                    className="flex h-12 w-full rounded-md border border-input bg-transparent px-3 py-1 text-lg"
                    value={newReminder.status} 
                    onChange={e => setNewReminder({...newReminder, status: e.target.value as any})}
                  >
                    <option>Upcoming</option>
                    <option>Due Soon</option>
                    <option>Completed</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Due Date (Optional)</Label>
                  <Input type="date" value={newReminder.dueDate} onChange={e => setNewReminder({...newReminder, dueDate: e.target.value})} className="h-12" />
                </div>
                <div className="space-y-2">
                  <Label>Due Odometer (Optional)</Label>
                  <Input type="number" value={newReminder.dueOdometer || ''} onChange={e => setNewReminder({...newReminder, dueOdometer: e.target.value ? parseInt(e.target.value) : undefined})} className="h-12" />
                </div>
              </div>
              <div className="flex items-center space-x-2 border p-4 rounded-lg bg-background/50">
                <Switch id="recurring" checked={newReminder.recurring} onCheckedChange={c => setNewReminder({...newReminder, recurring: c})} />
                <Label htmlFor="recurring" className="text-lg cursor-pointer">Recurring Reminder</Label>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea value={newReminder.notes} onChange={e => setNewReminder({...newReminder, notes: e.target.value})} />
              </div>
              <Button onClick={handleSaveAdd} size="lg" className="w-full h-14 text-lg">Save Reminder</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {reminders.sort((a,b) => {
          if (a.status === 'Due Soon' && b.status !== 'Due Soon') return -1;
          if (b.status === 'Due Soon' && a.status !== 'Due Soon') return 1;
          return 0;
        }).map(r => (
          <Card key={r.id} className={`bg-card/40 transition-all shadow-md relative ${getStatusColor(r.status)}`}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold pr-4">{r.title}</h3>
                  <div className="text-primary font-bold text-sm uppercase tracking-widest mt-1">{r.type}</div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => deleteReminder(r.id)} className="opacity-40 hover:opacity-100 hover:text-destructive -mt-2 -mr-2">
                  <Trash2 className="w-5 h-5" />
                </Button>
              </div>
              
              <div className="space-y-2 mb-4 font-mono text-base">
                {r.dueDate && (
                  <div className="flex items-center text-foreground/90">
                    <Calendar className="w-4 h-4 mr-3 text-muted-foreground" />
                    {format(new Date(r.dueDate), 'MMMM do, yyyy')}
                  </div>
                )}
                {r.dueOdometer && (
                  <div className="flex items-center text-foreground/90">
                    <span className="font-sans font-bold text-muted-foreground mr-3">KM</span>
                    {r.dueOdometer.toLocaleString()}
                  </div>
                )}
              </div>

              {r.notes && <p className="text-muted-foreground text-sm mb-4">{r.notes}</p>}
              
              <div className="flex justify-between items-center mt-auto pt-4 border-t border-border/20">
                {(r.type === 'Rego' || r.type === 'Insurance') ? (
                  <span className="rounded-full border border-border/40 bg-background/50 px-2.5 py-1 text-xs font-bold text-muted-foreground">
                    {reminderStatusText(r)}
                  </span>
                ) : (
                  <StatusBadge status={r.status} />
                )}
                {r.recurring && <span className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Recurring</span>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}
