import { useState } from "react";
import { useVehicleStore } from "@/store/vehicleStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format, differenceInYears, differenceInMonths } from "date-fns";
import { motion } from "framer-motion";
import {
  PlusCircle, Check, Award, LayoutList, Clock, TableProperties, TrendingUp
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

type ViewMode = "timeline" | "cards" | "table" | "graph";

const PROVIDER_COLORS: Record<string, string> = {
  "Autonexus Altona": "bg-blue-500/20 border-blue-500/40 text-blue-400",
  "Subaru Mentone": "bg-blue-600/20 border-blue-600/40 text-blue-300",
  "Competition Tyres & More": "bg-purple-500/20 border-purple-500/40 text-purple-400",
  "Carnegie Automotive": "bg-teal-500/20 border-teal-500/40 text-teal-400",
  "Ultra Tune McKinnon": "bg-orange-500/20 border-orange-500/40 text-orange-400",
  "Strathmore Car Care": "bg-amber-500/20 border-amber-500/40 text-amber-400",
  "JAX Tyres": "bg-red-500/20 border-red-500/40 text-red-400",
};

const providerStyle = (p?: string) =>
  p && PROVIDER_COLORS[p] ? PROVIDER_COLORS[p] : "bg-muted/20 border-border/40 text-muted-foreground";

const DELIVERY_DATE = new Date("2010-11-04");
const TODAY = new Date("2026-06-21");

export default function Service() {
  const info = useVehicleStore(state => state.info);
  const updateInfo = useVehicleStore(state => state.updateInfo);
  const services = useVehicleStore(state => state.services);
  const addService = useVehicleStore(state => state.addService);
  const updateService = useVehicleStore(state => state.updateService);

  const [view, setView] = useState<ViewMode>("timeline");
  const [odometerInput, setOdometerInput] = useState(info.odometer.toString());
  const [isAdding, setIsAdding] = useState(false);
  const [newService, setNewService] = useState({
    type: '', provider: '', date: format(new Date(), 'yyyy-MM-dd'),
    odometer: info.odometer, notes: '', status: 'OK' as const
  });

  const sorted = [...services].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const chronological = [...services].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const ageYears = differenceInYears(TODAY, DELIVERY_DATE);
  const ageMonths = differenceInMonths(TODAY, DELIVERY_DATE) % 12;
  const avgKmPerYear = Math.round(info.odometer / (differenceInMonths(TODAY, DELIVERY_DATE) / 12));

  const graphData = chronological.map(s => ({
    date: format(new Date(s.date), 'MMM yy'),
    year: new Date(s.date).getFullYear(),
    odometer: s.odometer,
    label: format(new Date(s.date), 'd MMM yyyy'),
  }));

  const handleUpdateOdo = () => updateInfo({ odometer: parseInt(odometerInput) });

  const handleAdd = () => {
    addService({
      type: newService.type, provider: newService.provider,
      date: new Date(newService.date).toISOString(),
      odometer: newService.odometer, notes: newService.notes, status: newService.status,
    });
    setIsAdding(false);
    setNewService({ type: '', provider: '', date: format(new Date(), 'yyyy-MM-dd'), odometer: info.odometer, notes: '', status: 'OK' });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto pb-32">

      {/* Title row */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight uppercase">Service History</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{services.length} records · from delivery</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAdding} onOpenChange={setIsAdding}>
            <DialogTrigger asChild>
              <Button size="lg" className="h-12 px-5">
                <PlusCircle className="mr-2 w-5 h-5" /> Log Service
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-xl uppercase">Log New Service</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Service Type</Label>
                    <Input value={newService.type} onChange={e => setNewService({...newService, type: e.target.value})} placeholder="e.g. Oil Change" className="h-11" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Provider</Label>
                    <Input value={newService.provider} onChange={e => setNewService({...newService, provider: e.target.value})} placeholder="e.g. JAX Tyres" className="h-11" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Date</Label>
                    <Input type="date" value={newService.date} onChange={e => setNewService({...newService, date: e.target.value})} className="h-11" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Odometer (km)</Label>
                    <Input type="number" value={newService.odometer} onChange={e => setNewService({...newService, odometer: parseInt(e.target.value)})} className="h-11 font-mono" />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <Label>Status</Label>
                    <select className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm" value={newService.status} onChange={e => setNewService({...newService, status: e.target.value as 'OK'})}>
                      <option value="OK">OK</option>
                      <option value="DUE SOON">Due Soon</option>
                      <option value="OVERDUE">Overdue</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Notes</Label>
                  <Textarea value={newService.notes} onChange={e => setNewService({...newService, notes: e.target.value})} placeholder="Parts used, observations..." className="min-h-[80px]" />
                </div>
                <Button onClick={handleAdd} size="lg" className="w-full h-12">Save Record</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Vehicle History Badge + Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card className="md:col-span-1 bg-blue-500/10 border-blue-500/30 flex items-center justify-center p-4">
          <div className="text-center">
            <Award className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <p className="text-xs text-blue-400 font-bold uppercase tracking-wider leading-tight">Service Records</p>
            <p className="text-xs text-blue-400/70 font-semibold uppercase tracking-wide">Available From Delivery</p>
          </div>
        </Card>
        <Card className="bg-card/40 border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Vehicle Age</p>
            <p className="text-2xl font-bold font-mono mt-1">{ageYears}<span className="text-base text-muted-foreground"> yr</span> {ageMonths}<span className="text-base text-muted-foreground"> mo</span></p>
            <p className="text-xs text-muted-foreground mt-0.5">Since 4 Nov 2010</p>
          </CardContent>
        </Card>
        <Card className="bg-card/40 border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Distance</p>
            <p className="text-2xl font-bold font-mono mt-1">{info.odometer.toLocaleString()}<span className="text-base text-muted-foreground"> km</span></p>
            <div className="flex items-center gap-2 mt-1">
              <Input type="number" value={odometerInput} onChange={e => setOdometerInput(e.target.value)} className="h-7 text-sm font-mono w-28 bg-background/50 border-border/60 px-2" />
              <Button size="sm" onClick={handleUpdateOdo} className="h-7 px-2 text-xs">Update</Button>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/40 border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Avg km / Year</p>
            <p className="text-2xl font-bold font-mono mt-1">{avgKmPerYear.toLocaleString()}<span className="text-base text-muted-foreground"> km</span></p>
            <p className="text-xs text-muted-foreground mt-0.5">{services.length} service records</p>
          </CardContent>
        </Card>
      </div>

      {/* View Switcher */}
      <div className="flex gap-1 bg-muted/20 p-1 rounded-xl w-fit">
        {([
          { key: "timeline", icon: Clock, label: "Timeline" },
          { key: "cards", icon: LayoutList, label: "Cards" },
          { key: "table", icon: TableProperties, label: "Table" },
          { key: "graph", icon: TrendingUp, label: "Graph" },
        ] as const).map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => setView(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              view === key ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>

      {/* ── TIMELINE VIEW ── */}
      {view === "timeline" && (
        <div className="relative pl-6">
          <div className="absolute left-2 top-0 bottom-0 w-px bg-border/40" />
          {sorted.map((service, i) => (
            <motion.div key={service.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.025 }}
              className="relative mb-4">
              <div className={`absolute -left-[22px] top-3 w-3 h-3 rounded-full border-2 ${service.status === 'OVERDUE' ? 'bg-red-500 border-red-400' : 'bg-primary border-primary/60'}`} />
              <Card className={`border ${service.status === 'OVERDUE' ? 'border-red-500/30 bg-red-500/5' : 'border-border/40 bg-card/30'} hover:bg-card/50 transition-colors`}>
                <CardContent className="p-4 flex flex-col md:flex-row md:items-center gap-3 justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-bold text-base truncate">{service.type}</h3>
                      {service.status !== 'OK' && <StatusBadge status={service.status} />}
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground font-mono">
                      <span>{format(new Date(service.date), 'dd MMM yyyy')}</span>
                      {service.odometer > 0 && <span>{service.odometer.toLocaleString()} km</span>}
                      {service.provider && (
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${providerStyle(service.provider)}`}>
                          {service.provider}
                        </span>
                      )}
                    </div>
                    {service.notes && <p className="text-sm text-foreground/70 mt-1.5">{service.notes}</p>}
                  </div>
                  {service.status === 'OVERDUE' && (
                    <Button variant="outline" size="sm" onClick={() => updateService(service.id, { status: 'OK', date: new Date().toISOString(), odometer: info.odometer })}
                      className="h-9 border-green-500/30 text-green-400 hover:bg-green-500/10 shrink-0">
                      <Check className="mr-1.5 w-4 h-4" /> Mark Done
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── CARDS VIEW ── */}
      {view === "cards" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {sorted.map((service, i) => (
            <motion.div key={service.id} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.02 }}>
              <Card className={`border h-full ${service.status === 'OVERDUE' ? 'border-red-500/30 bg-red-500/5' : 'border-border/40 bg-card/30'}`}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-sm leading-tight">{service.type}</h3>
                    {service.status !== 'OK' && <StatusBadge status={service.status} />}
                  </div>
                  <div className="text-xs font-mono text-muted-foreground space-y-0.5">
                    <p>{format(new Date(service.date), 'dd MMM yyyy')}</p>
                    {service.odometer > 0 && <p>{service.odometer.toLocaleString()} km</p>}
                  </div>
                  {service.provider && (
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold border ${providerStyle(service.provider)}`}>
                      {service.provider}
                    </span>
                  )}
                  {service.notes && <p className="text-xs text-foreground/60 leading-relaxed">{service.notes}</p>}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── TABLE VIEW ── */}
      {view === "table" && (
        <Card className="border-border/50 bg-card/30 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40 bg-muted/10">
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground font-semibold">Date</th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground font-semibold">Service</th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground font-semibold">Provider</th>
                  <th className="text-right px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground font-semibold">Odometer</th>
                  <th className="text-center px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((s, i) => (
                  <tr key={s.id} className={`border-b border-border/20 transition-colors hover:bg-muted/10 ${i % 2 === 0 ? '' : 'bg-muted/5'}`}>
                    <td className="px-4 py-3 font-mono text-muted-foreground whitespace-nowrap">
                      {format(new Date(s.date), 'dd MMM yyyy')}
                    </td>
                    <td className="px-4 py-3 font-semibold">{s.type}</td>
                    <td className="px-4 py-3">
                      {s.provider ? (
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${providerStyle(s.provider)}`}>{s.provider}</span>
                      ) : <span className="text-muted-foreground/40">—</span>}
                    </td>
                    <td className="px-4 py-3 font-mono text-right text-muted-foreground">
                      {s.odometer > 0 ? s.odometer.toLocaleString() + ' km' : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={s.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── GRAPH VIEW ── */}
      {view === "graph" && (
        <div className="space-y-4">
          <Card className="border-border/50 bg-card/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Odometer Over Time
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2 pb-4">
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={graphData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="odoGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0070c0" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#0070c0" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="year" tick={{ fill: '#666', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}k`} tick={{ fill: '#666', fontSize: 11 }} tickLine={false} axisLine={false} width={42} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: '#888' }}
                    formatter={(v: number) => [`${v.toLocaleString()} km`, 'Odometer']}
                    labelFormatter={(_, payload) => payload?.[0]?.payload?.label ?? ''}
                  />
                  <Area type="monotone" dataKey="odometer" stroke="#0070c0" strokeWidth={2} fill="url(#odoGrad)" dot={{ fill: '#0070c0', r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Card className="border-border/50 bg-card/30">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Dealer Services</p>
                <p className="text-3xl font-bold font-mono mt-1 text-blue-400">
                  {services.filter(s => s.provider?.toLowerCase().includes('subaru')).length}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Subaru Mentone</p>
              </CardContent>
            </Card>
            <Card className="border-border/50 bg-card/30">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Ultra Tune Services</p>
                <p className="text-3xl font-bold font-mono mt-1 text-orange-400">
                  {services.filter(s => s.provider?.toLowerCase().includes('ultra tune')).length}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">McKinnon</p>
              </CardContent>
            </Card>
            <Card className="border-border/50 bg-card/30">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Most Recent</p>
                <p className="text-base font-bold mt-1">{sorted[0]?.type}</p>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">
                  {sorted[0] ? format(new Date(sorted[0].date), 'dd MMM yyyy') : '—'}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

    </motion.div>
  );
}
