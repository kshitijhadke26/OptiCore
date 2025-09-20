import PrincipalLayout from "@/components/layout/PrincipalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect, useMemo, useState } from "react";

interface Submission { id:string; year:string; createdAt:number; times:string[]; plan:Record<string, any>; }

const DEPTS = ["All","Electrical Engg","Mechanical Engg","Electronics Engg","Civil Engg","Instrument","Information Technology","Computer Science"];
const YEARS = ["All","1","2","3","4"];

export default function PrincipalTimetables(){
  const params = new URLSearchParams(window.location.search);
  const [dept, setDept] = useState(params.get('dept')? params.get('dept')!.toString(): 'All');
  const [year, setYear] = useState(params.get('year') || 'All');
  const [subs, setSubs] = useState<Submission[]>([]);
  const [decisions, setDecisions] = useState<Record<string, { status:string }>>({});

  useEffect(()=>{
    let s:any[] = [];
    let d:Record<string, { status:string }> = {};
    try { s = JSON.parse(localStorage.getItem('ttSubmissions')||'[]'); } catch {}
    try { d = JSON.parse(localStorage.getItem('hodDecisions')||'{}'); } catch {}

    if (!s || s.length===0){
      const times = ["09:00-10:00","10:00-11:00","11:00-12:00","14:00-15:00","15:00-16:00"];
      const plan: Record<string, any[]> = {
        "Monday-09:00-10:00": [{ subject:"DS", room:"101", batch:1 }],
        "Tuesday-10:00-11:00": [{ subject:"DB", room:"202", batch:1 }],
        "Wednesday-11:00-12:00": [{ subject:"OS", room:"105", batch:2 }],
        "Thursday-15:00-16:00": [{ subject:"CN", room:"103", batch:1 }],
        "Friday-09:00-10:00": [{ subject:"AI", room:"201", batch:1 }],
        "Saturday-10:00-11:00": [{ subject:"ML", room:"204", batch:1 }],
      };
      s = [ { id:'demo-1', dept:'Computer Science', year:'1', createdAt: Date.now()-86400000, times, plan }, { id:'demo-2', dept:'Information Technology', year:'2', createdAt: Date.now()-172800000, times, plan } ];
    }
    if (!d || Object.keys(d).length===0){ d = { 'demo-1': { status:'approved' }, 'demo-2': { status:'pending' } }; }

    setSubs(s); setDecisions(d);
  },[]);

  const filtered = useMemo(()=>{
    let list = subs.filter(s=> (decisions[s.id]?.status||'pending')==='approved');
    if (year!=='All') list = list.filter(s=> s.year===year);
    if (dept!=='All') list = list.filter((s:any)=> s.dept===dept);
    return list;
  }, [subs, decisions, year, dept]);

  function exportCSV(sub: Submission){
    const rows = ["day,time,details"]; const days = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    for (const d of days){ for (const t of sub.times){ const key = `${d}-${t}`; const vals = (sub.plan[key]||[]) as any[]; if (vals.length){ rows.push(`${d},${t},${vals.map(v=> `${v.subject} R-${v.room} B${v.batch}`).join(' | ')}`); } } }
    const blob = new Blob([rows.join("\n")], { type: 'text/csv;charset=utf-8;' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `timetable-${sub.id}.csv`; a.click(); URL.revokeObjectURL(url);
  }

  function exportDOC(sub: Submission){
    const days = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    const html = [`<html><body><h2>Timetable</h2><table border=1 cellspacing=0 cellpadding=4><tr><th>Time</th>${days.map(d=>`<th>${d}</th>`).join('')}</tr>`];
    for (const t of sub.times){
      html.push(`<tr><td>${t}</td>`);
      for (const d of days){
        const key = `${d}-${t}`; const vals = (sub.plan[key]||[]) as any[];
        html.push(`<td>${vals.map(v=> `${v.subject} R-${v.room} B${v.batch}`).join('<br/>')}</td>`);
      }
      html.push(`</tr>`);
    }
    html.push(`</table></body></html>`);
    const blob = new Blob([html.join('')], { type: 'application/msword' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `timetable-${sub.id}.doc`; a.click(); URL.revokeObjectURL(url);
  }

  return (
    <PrincipalLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Department Timetables</h1>
            <p className="text-muted-foreground">Filter and export approved schedules</p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <select className="border rounded-md px-2 py-1" value={dept} onChange={e=>setDept(e.target.value)}>{DEPTS.map(d=> <option key={d} value={d}>{d}</option>)}</select>
            <select className="border rounded-md px-2 py-1" value={year} onChange={e=>setYear(e.target.value)}>{YEARS.map(d=> <option key={d} value={d}>{d}</option>)}</select>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Results</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filtered.length===0 && <div className="text-sm text-muted-foreground">No timetables match filters.</div>}
              {filtered.map(s=> (
                <div key={s.id} className="border rounded-md p-3 flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium">Submission {s.id.slice(-6)}</div>
                    <div className="text-xs text-muted-foreground">Year {s.year} • {new Date(s.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={()=>window.print()}>Print PDF</Button>
                    <Button variant="outline" size="sm" onClick={()=>exportCSV(s)}>Export CSV</Button>
                    <Button variant="outline" size="sm" onClick={()=>exportDOC(s)}>Export Word</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </PrincipalLayout>
  );
}
