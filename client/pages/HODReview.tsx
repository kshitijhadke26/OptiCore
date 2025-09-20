import HODLayout from "@/components/layout/HODLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Fragment, useMemo, useState } from "react";

interface Submission { id:string; year:string; createdAt:number; times:string[]; plan:Record<string, { subject:string; room:string; batch:number }[]> }

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

function detectConflictsFromSubmission(sub: Submission){
  const issues = new Set<string>();
  for (const d of DAYS){
    for (const t of sub.times){
      const key = `${d}-${t}`;
      const vals = sub.plan[key] || [];
      const seenRooms = new Set<string>();
      const seenBatch = new Set<number>();
      for (const v of vals){
        if (seenRooms.has(v.room)) issues.add(`Room ${v.room} double booked at ${key}`);
        if (seenBatch.has(v.batch)) issues.add(`Batch ${v.batch} double booked at ${key}`);
        seenRooms.add(v.room); seenBatch.add(v.batch);
      }
    }
  }
  return Array.from(issues);
}

export default function HODReview(){
  const search = new URLSearchParams(window.location.search);
  const [year, setYear] = useState(search.get('year') || '1');
  const [selected, setSelected] = useState(0);
  const [editing, setEditing] = useState(false);

  // Load submissions for year; take latest 3 as A/B/C; fallback to synthetic if none
  const plans: Submission[] = useMemo(()=>{
    try{
      const subs: Submission[] = JSON.parse(localStorage.getItem('ttSubmissions')||'[]');
      const list = subs.filter(s=> s.year===year).sort((a,b)=> b.createdAt - a.createdAt).slice(0,3);
      if (list.length) return list;
    }catch{}
    const times = ["09:00-10:00","10:00-11:00","11:00-12:00","14:00-15:00","15:00-16:00"];
    const mk = (id:string, items: Record<string, { room:string; course:string }>)=>{
      const plan: Submission["plan"] = {} as any;
      for (const [k,v] of Object.entries(items)){ plan[k] = [{ subject: (v as any).course, room: v.room, batch: 1 }]; }
      return { id, year, createdAt: Date.now(), times, plan } as Submission;
    };
    return [
      mk('local-A', {"Monday-09:00-10:00": { room:"101", course:"DS" },"Tuesday-10:00-11:00": { room:"201", course:"DB" },"Tuesday-11:00-12:00": { room:"201", course:"SE" },"Thursday-15:00-16:00": { room:"103", course:"CN" }}),
      mk('local-B', {"Monday-09:00-10:00": { room:"101", course:"DS" },"Tuesday-10:00-11:00": { room:"202", course:"DB" },"Wednesday-11:00-12:00": { room:"105", course:"OS" },"Thursday-15:00-16:00": { room:"103", course:"CN" }}),
      mk('local-C', {"Monday-09:00-10:00": { room:"101", course:"DS" },"Wednesday-11:00-12:00": { room:"105", course:"OS" },"Thursday-15:00-16:00": { room:"103", course:"SE" }})
    ];
  }, [year]);

  const summaries = useMemo(()=> plans.map((p)=>({ id: p.id, conflicts: detectConflictsFromSubmission(p) })), [plans]);

  const approvedByYear: Record<string,string> = useMemo(()=>{ try{ return JSON.parse(localStorage.getItem('hodApprovedByYear')||'{}'); }catch{ return {}; } }, [year]);
  const approvedId = approvedByYear[year];

  const visiblePlans = approvedId && !editing ? plans.filter(p=> p.id===approvedId) : plans;

  function exportCSV(planIndex:number){
    const sub = plans[planIndex];
    const rows = ["day,time,details"];
    for (const day of DAYS) {
      for (const time of sub.times) {
        const key = `${day}-${time}`;
        const vals = sub.plan[key] || [];
        if (vals.length) rows.push(`${day},${time},${vals.map(v=> `${v.subject} R-${v.room} B${v.batch}`).join(' | ')}`);
      }
    }
    const blob = new Blob([rows.join("\n")], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `timetable-${sub.id}.csv`; a.click(); URL.revokeObjectURL(url);
  }

  function exportExcel(planIndex:number){
    const sub = plans[planIndex];
    const header = `<tr><th>Time</th>${DAYS.map(d=>`<th>${d}</th>`).join('')}</tr>`;
    const body = sub.times.map(t=>{
      const cells = DAYS.map(d=>{
        const key = `${d}-${t}`; const vals = sub.plan[key]||[];
        return `<td>${vals.map(v=> `${v.subject} R-${v.room} B${v.batch}`).join('<br/>')}</td>`;
      }).join('');
      return `<tr><td>${t}</td>${cells}</tr>`;
    }).join('');
    const html = `<html><head><meta charset="UTF-8"></head><body><table border="1">${header}${body}</table></body></html>`;
    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `timetable-${sub.id}.xls`; a.click(); URL.revokeObjectURL(url);
  }

  function saveSelection(){
    const sub = plans[selected]; if (!sub) return;
    try{
      const raw = localStorage.getItem('hodSelectedByYear');
      const map = raw? JSON.parse(raw): {};
      map[year] = sub.id;
      localStorage.setItem('hodSelectedByYear', JSON.stringify(map));
      alert('Saved selection for year '+year);
    }catch{}
  }

  function notifyAll(){
    const push = (key:string, title:string, detail:string)=>{
      try{
        const raw = localStorage.getItem(key); const arr = raw? JSON.parse(raw): [];
        arr.unshift({ id: String(Date.now()), title, detail, time: 'now' });
        localStorage.setItem(key, JSON.stringify(arr));
      }catch{}
    };
    push('adminNotifications', `Year ${year} timetable approved`, 'HOD approved a plan and sent for final admin approval.');
    push('facultyNotifications', `Year ${year} timetable approved by HOD`, 'Awaiting admin final approval.');
    push('studentNotifications', `Year ${year} timetable updated`, 'Pending admin final approval.');
  }

  const chosenConflicts = summaries[selected]?.conflicts || [];
  const canApprove = chosenConflicts.length === 0 && !!plans[selected];

  return (
    <HODLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">HOD Review & Approval</h1>
            <p className="text-muted-foreground">Select A/B/C for the selected year, save, export, and approve one plan only</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs">Year</div>
            <Select value={year} onValueChange={(v)=>{ setYear(v); setSelected(0); }}>
              <SelectTrigger className="w-28"><SelectValue placeholder="Year" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="4">4</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className={`grid grid-cols-1 lg:grid-cols-${approvedId && !editing? '1':'3'} gap-4`}>
          {visiblePlans.map((sub, idx)=> {
            const pIndex = plans.findIndex(p=> p.id===sub.id);
            const idxLabel = String.fromCharCode(65 + (pIndex>=0? pIndex: idx));
            const summary = summaries[pIndex>=0? pIndex: idx];
            return (
              <Card key={sub.id} className={selected===pIndex? 'ring-2 ring-primary': ''}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Plan {idxLabel}</CardTitle>
                  <div className={`text-xs font-medium ${summary?.conflicts?.length? 'text-rose-600':'text-emerald-600'}`}>
                    {summary?.conflicts?.length? `${summary.conflicts.length} conflicts detected` : 'Conflict-free'}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-3 text-xs text-muted-foreground">Preview</div>
                  <div className="grid" style={{ gridTemplateColumns: `100px repeat(${DAYS.length}, 1fr)` }}>
                    <div className="text-[11px] p-1">Time</div>
                    {DAYS.map(d=> <div key={d} className="text-[11px] p-1 text-center">{d}</div>)}
                    {sub.times.map((t)=> (
                      <Fragment key={t}>
                        <div className="text-[11px] p-1 border-y">{t}</div>
                        {DAYS.map((d)=>{
                          const key = `${d}-${t}`; const vals = sub.plan[key]||[];
                          return <div key={key} className={`p-1 border ${vals.length? 'bg-muted/40':''}`}>
                            <div className="text-[11px] space-y-1">
                              {vals.map((v,i)=> <div key={i}>{v.subject} • R-{v.room} • B{v.batch}</div>)}
                            </div>
                          </div>;
                        })}
                      </Fragment>
                    ))}
                  </div>
                  {(!approvedId || editing) && (
                    <div className="mt-3 flex gap-2">
                      <Button variant="outline" onClick={()=>setSelected(pIndex)}>Select</Button>
                      <Button variant="outline" onClick={()=>exportCSV(pIndex)}>Export CSV</Button>
                      <Button variant="outline" onClick={()=>exportExcel(pIndex)}>Export Excel</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Actions</CardTitle></CardHeader>
          <CardContent className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="text-sm">
              {approvedId && !editing ? 'Already approved. Only the approved plan is visible.' : (canApprove? 'Selected plan is conflict-free.' : `Resolve conflicts before approval: ${chosenConflicts.join('; ')}`)}
            </div>
            <div className="flex flex-wrap gap-2">
              {approvedId && !editing && <Button variant="outline" onClick={()=> setEditing(true)}>Edit</Button>}
              {approvedId && editing && <Button variant="outline" onClick={()=> setEditing(false)}>Cancel Edit</Button>}
              {!approvedId && <Button variant="outline" onClick={saveSelection}>Save</Button>}
              <Button variant="outline" onClick={()=>exportCSV(selected)} disabled={!plans[selected]}>Export CSV</Button>
              <Button variant="outline" onClick={()=>exportExcel(selected)} disabled={!plans[selected]}>Export Excel</Button>
              <Button onClick={()=>window.print()} disabled={!plans[selected]}>Print PDF</Button>
              {(!approvedId || editing) && (
                <>
                  <Button disabled={!canApprove} className="bg-[#079E74] hover:bg-[#068d67] text-white" onClick={()=>{
                    try{
                      const sub = plans[selected]; if (!sub) return;
                      const raw = localStorage.getItem('hodDecisions');
                      const dec = raw? JSON.parse(raw): {};
                      dec[sub.id] = { status:'approved' };
                      localStorage.setItem('hodDecisions', JSON.stringify(dec));
                      const mraw = localStorage.getItem('hodApprovedByYear');
                      const map = mraw? JSON.parse(mraw): {};
                      map[year] = sub.id; localStorage.setItem('hodApprovedByYear', JSON.stringify(map));
                    }catch{}
                    notifyAll();
                    window.location.reload();
                  }}>Approve</Button>
                  <Button variant="outline" onClick={()=>{
                    try{
                      const sub = plans[selected]; if (!sub) return;
                      const reason = prompt('Enter reason for rejection') || 'No reason provided';
                      const raw = localStorage.getItem('hodDecisions');
                      const dec = raw? JSON.parse(raw): {};
                      dec[sub.id] = { status:'rejected', reason };
                      localStorage.setItem('hodDecisions', JSON.stringify(dec));
                      alert('Marked as rejected');
                    }catch{}
                  }}>Reject</Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </HODLayout>
  );
}
