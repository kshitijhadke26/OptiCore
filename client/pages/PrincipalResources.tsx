import PrincipalLayout from "@/components/layout/PrincipalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useMemo, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip } from "recharts";

interface Usage { name:string; type:'room'|'lab'; used:number; capacity:number }

const BASE: Usage[] = [
  { name:'Room-101', type:'room', used: 28, capacity: 35 },
  { name:'Room-102', type:'room', used: 20, capacity: 35 },
  { name:'Lab-201', type:'lab', used: 12, capacity: 25 },
  { name:'Lab-202', type:'lab', used: 25, capacity: 25 },
  { name:'Seminar', type:'room', used: 5, capacity: 20 },
];

export default function PrincipalResources(){
  const params = new URLSearchParams(window.location.search);
  const [type, setType] = useState((params.get('type')||'all').toLowerCase());
  const [period, setPeriod] = useState((params.get('period')||'week').toLowerCase());
  const [filter, setFilter] = useState((params.get('filter')||'all').toLowerCase());
  const [fixed, setFixed] = useState<any[]>([]);

  useEffect(()=>{
    try {
      const years = JSON.parse(localStorage.getItem('adminTTConfig:years')||'[]') as string[];
      const slots: any[] = [];
      for (const y of years){
        const cfg = JSON.parse(localStorage.getItem(`adminTTConfig:${y}`)||'null');
        if (cfg && cfg.fixedSlots) slots.push(...cfg.fixedSlots);
      }
      setFixed(slots);
    } catch {}
  },[]);

  const list = useMemo(()=> BASE.filter(x=> type==='all' || x.type===type), [type]);
  const chart = useMemo(()=> list.map(x=> ({ name: x.name, value: Math.round((x.used/x.capacity)*100) })), [list]);
  const under = useMemo(()=> list.filter(x=> (x.used/x.capacity) < 0.4), [list]);

  return (
    <PrincipalLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Resource Utilization</h1>
            <p className="text-muted-foreground">Usage reports and underutilized rooms/labs</p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <select className="border rounded-md px-2 py-1" value={type} onChange={e=>setType(e.target.value)}>
              {['all','room','lab'].map(d=> <option key={d} value={d}>{d}</option>)}
            </select>
            <select className="border rounded-md px-2 py-1" value={period} onChange={e=>setPeriod(e.target.value)}>
              {['day','week','semester'].map(d=> <option key={d} value={d}>{d}</option>)}
            </select>
            <select className="border rounded-md px-2 py-1" value={filter} onChange={e=>setFilter(e.target.value)}>
              {['all','underutilized'].map(d=> <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Utilization (% of capacity)</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <ReTooltip />
                <Bar dataKey="value" fill="#10b981" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Underutilized</CardTitle></CardHeader>
          <CardContent>
            <ul className="text-sm space-y-2">
              {(filter==='underutilized'? under : list).map(x=> (
                <li key={x.name} className="border rounded-md p-2 flex items-center justify-between">
                  <div>{x.name} • {x.type.toUpperCase()}</div>
                  <div className="text-xs text-muted-foreground">{x.used}/{x.capacity} sessions used</div>
                </li>
              ))}
              {(filter==='underutilized'? under : list).length===0 && <li className="text-muted-foreground">None</li>}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Special Class Allocations</CardTitle></CardHeader>
          <CardContent>
            <ul className="text-sm space-y-2">
              {fixed.length===0 && <li className="text-muted-foreground">No special slots saved</li>}
              {fixed.map((f, i)=> (
                <li key={i} className="border rounded-md p-2">{f.subject} — {f.day} {f.time} {f.room? `• Room ${f.room}`:''} {f.batch? `• Batch ${f.batch}`:''}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </PrincipalLayout>
  );
}
