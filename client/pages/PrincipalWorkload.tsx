import PrincipalLayout from "@/components/layout/PrincipalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMemo, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip } from "recharts";

interface Faculty { name:string; dept:string; weekly:number; semester:number; leaves:number; substitutions:number }

const DATA: Faculty[] = [
  { name:'Dr Tk Gawali', dept:'CS', weekly: 12, semester: 180, leaves: 2, substitutions: 3 },
  { name:'Prof . S.D.Cheke', dept:'CS', weekly: 10, semester: 160, leaves: 1, substitutions: 1 },
  { name:'K.R.Sarode', dept:'IT', weekly: 14, semester: 190, leaves: 3, substitutions: 2 },
  { name:'D. Chaudari', dept:'IT', weekly: 8, semester: 120, leaves: 0, substitutions: 4 },
  { name:'Dr Tk Gawali', dept:'Math', weekly: 9, semester: 130, leaves: 1, substitutions: 2 },
];

export default function PrincipalWorkload(){
  const params = new URLSearchParams(window.location.search);
  const [dept, setDept] = useState((params.get('dept')||'all').toUpperCase());
  const [period, setPeriod] = useState<'week'|'semester'>('week');

  const list = useMemo(()=> DATA.filter(x=> dept==='ALL' || x.dept===dept), [dept]);
  const chart = useMemo(()=> list.map(x=> ({ name: x.name, load: period==='week'? x.weekly: x.semester })), [list, period]);

  return (
    <PrincipalLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Faculty Workload Monitoring</h1>
            <p className="text-muted-foreground">Workload distribution, leave and substitution trends</p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <select className="border rounded-md px-2 py-1" value={dept} onChange={e=>setDept(e.target.value)}>
              {['ALL','CS','IT','MATH','PHYSICS'].map(d=> <option key={d} value={d}>{d}</option>)}
            </select>
            <select className="border rounded-md px-2 py-1" value={period} onChange={e=>setPeriod(e.target.value as any)}>
              <option value="week">Per Week</option>
              <option value="semester">Per Semester</option>
            </select>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Load Distribution ({period})</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <ReTooltip />
                <Bar dataKey="load" fill="#3b82f6" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Leave & Substitution Trends</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              {list.map(x=> (
                <div key={x.name} className="border rounded-md p-3">
                  <div className="font-medium">{x.name}</div>
                  <div className="text-xs text-muted-foreground">Dept: {x.dept}</div>
                  <div className="mt-1">Leaves: {x.leaves} • Substitutions: {x.substitutions}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </PrincipalLayout>
  );
}
