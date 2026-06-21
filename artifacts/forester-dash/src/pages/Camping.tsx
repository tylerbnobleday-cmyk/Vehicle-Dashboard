import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function Camping() {
  const [checklist, setChecklist] = useState([
    { id: 1, label: 'Tent & Poles', checked: false, category: 'Shelter' },
    { id: 2, label: 'Sleeping Bags', checked: false, category: 'Sleeping' },
    { id: 3, label: 'Camp Stove', checked: false, category: 'Kitchen' },
    { id: 4, label: '12V Fridge', checked: false, category: 'Kitchen' },
    { id: 5, label: 'Recovery Boards', checked: false, category: 'Recovery' },
    { id: 6, label: 'First Aid Kit', checked: true, category: 'Safety' },
  ]);

  const [bootNotes, setBootNotes] = useState("Fridge on left slide. Drawers on right. Heavy recovery gear pushed against back seat. Water tank behind driver seat.");
  const [powerNotes, setPowerNotes] = useState("EcoFlow River 2 Max behind passenger seat. 120W Solar blanket in roof box. 12V socket in boot powers fridge.");

  const toggleCheck = (id: number) => {
    setChecklist(checklist.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto pb-32">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight uppercase">Overland Command</h1>

      <Tabs defaultValue="checklist" className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-2 bg-background p-0 mb-6">
          <TabsTrigger value="checklist" className="h-12 px-6 rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold uppercase tracking-wider text-sm bg-card">Checklist</TabsTrigger>
          <TabsTrigger value="boot" className="h-12 px-6 rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold uppercase tracking-wider text-sm bg-card">Boot Layout</TabsTrigger>
          <TabsTrigger value="power" className="h-12 px-6 rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold uppercase tracking-wider text-sm bg-card">Power Setup</TabsTrigger>
        </TabsList>

        <TabsContent value="checklist" className="space-y-4">
          <Card className="bg-card/40 border-border/50">
            <CardContent className="p-6 space-y-4">
              {['Shelter', 'Sleeping', 'Kitchen', 'Recovery', 'Safety'].map(cat => (
                <div key={cat} className="mb-6 last:mb-0">
                  <h3 className="text-lg font-bold uppercase tracking-widest text-primary mb-3 border-b border-border/50 pb-2">{cat}</h3>
                  <div className="space-y-3">
                    {checklist.filter(i => i.category === cat).map(item => (
                      <div key={item.id} className="flex items-center space-x-3 bg-background/50 p-3 rounded-lg border border-border/50">
                        <Checkbox 
                          id={`item-${item.id}`} 
                          checked={item.checked} 
                          onCheckedChange={() => toggleCheck(item.id)}
                          className="w-6 h-6 rounded border-2 border-primary data-[state=checked]:bg-primary"
                        />
                        <label 
                          htmlFor={`item-${item.id}`} 
                          className={`text-lg font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${item.checked ? 'line-through text-muted-foreground' : 'text-foreground'}`}
                        >
                          {item.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="boot" className="space-y-4">
          <Card className="bg-card/40 border-border/50">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold uppercase mb-4">Cargo Organization</h3>
              <Textarea 
                value={bootNotes} 
                onChange={e => setBootNotes(e.target.value)} 
                className="min-h-[300px] text-lg font-mono resize-none bg-background/50" 
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="power" className="space-y-4">
          <Card className="bg-card/40 border-border/50">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold uppercase mb-4">12V & Solar Setup</h3>
              <Textarea 
                value={powerNotes} 
                onChange={e => setPowerNotes(e.target.value)} 
                className="min-h-[300px] text-lg font-mono resize-none bg-background/50" 
              />
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </motion.div>
  );
}
