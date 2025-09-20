import PrincipalLayout from "@/components/layout/PrincipalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useMemo, useState } from "react";

interface Submission { id:string; year:string; createdAt:number; times:string[]; plan:Record<string, any>; conflicts:string[] }

export default function PrincipalApprovals(){
  const [subs, setSubs] = useState<Submission[]>([]);
  const [decisions, setDecisions] = useState<Record<string, { status:string }>>({});
  const [selected, setSelected] = useState<string[]>([]);
  const [comments, setComments] = useState<Record<string,string>>(()=>{ try { return JSON.parse(localStorage.getItem('principalComments')||'{}'); } catch { return {}; } });
  const [year, setYear] = useState('All');

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
      };
      s = [ { id:'demo-1', year:'1', createdAt: Date.now()-86400000, times, plan }, { id:'demo-2', year:'2', createdAt: Date.now()-172800000, times, plan }, { id:'demo-3', year:'3', createdAt: Date.now()-259200000, times, plan } ];
    }
    if (!d || Object.keys(d).length===0){ d = { 'demo-1': { status:'approved' }, 'demo-2': { status:'approved' }, 'demo-3': { status:'rejected' } }; }

    setSubs(s); setDecisions(d);
  },[]);

  const list = useMemo(()=> subs.filter(s => year==='All' || s.year===year), [subs, year]);
  const chosen = useMemo(()=> list.filter(s => selected.includes(s.id)), [list, selected]);

  function toggle(id:string){ setSelected(arr => arr.includes(id)? arr.filter(x=>x!==id): [...arr, id].slice(-3)); }

  function saveComment(id:string){ const next = { ...comments, [id]: comments[id] || '' }; localStorage.setItem('principalComments', JSON.stringify(next)); }

  return (
    <PrincipalLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Approval Workflow</h1>
            <p className="text-muted-foreground">Compare, annotate, and track timetable approvals</p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span>Year</span>
            <select className="border rounded-md px-2 py-1" value={year} onChange={e=>setYear(e.target.value)}>
              {['All','1','2','3','4'].map(y=> <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Approved Timetables</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {list.filter(s=> (decisions[s.id]?.status||'pending')==='approved').map(s=> (
                <div key={s.id} className="border rounded-md p-2 flex items-center justify-between gap-2">
                  <div className="text-sm">Year {s.year} • {s.id.slice(-6)} • {new Date(s.createdAt).toLocaleString()}</div>
                  <div className="flex gap-2 items-center">
                    <label className="text-xs flex items-center gap-1"><input type="checkbox" checked={selected.includes(s.id)} onChange={()=>toggle(s.id)} /> Compare</label>
                    <Input placeholder="Comment/feedback" className="h-8" value={comments[s.id]||''} onChange={e=> setComments(c=> ({ ...c, [s.id]: e.target.value }))} onBlur={()=>saveComment(s.id)} />
                  </div>
                </div>
              ))}
              {list.filter(s=> (decisions[s.id]?.status||'pending')==='approved').length===0 && <div className="text-sm text-muted-foreground">No approved timetables yet.</div>}
            </div>
          </CardContent>
        </Card>

        {chosen.length>0 && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Side-by-side Comparison</CardTitle></CardHeader>
            <CardContent>
              <div className="grid" style={{ gridTemplateColumns: `repeat(${chosen.length}, 1fr)` }}>
                {chosen.map((s)=> (
                  <div key={s.id} className="p-2 border">
                    <div className="text-sm font-medium mb-2">Year {s.year} • {s.id.slice(-6)}</div>
                    <div className="grid" style={{ gridTemplateColumns: `100px repeat(5, 1fr)` }}>
                      <div className="text-[11px] p-1">Time</div>
                      {["Monday","Tuesday","Wednesday","Thursday","Friday"].map(d=> <div key={d} className="text-[11px] p-1 text-center">{d}</div>)}
                      {s.times.map((t)=> (
                        <div key={`${s.id}-${t}`} className="contents">
                          <div className="text-[11px] p-1 border-y">{t}</div>
                          {["Monday","Tuesday","Wednesday","Thursday","Friday"].map((d)=>{
                            const key = `${d}-${t}`; const vals = (s.plan[key]||[]) as any[];
                            return <div key={key} className={`p-1 border ${vals.length? 'bg-muted/40':''}`}>
                              <div className="text-[11px] space-y-1">
                                {vals.map((v,i)=> <div key={i}>{v.subject} • R-{v.room} • B{v.batch}</div>)}
                              </div>
                            </div>;
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">History</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {list.map(s=> (
                <div key={s.id} className="border rounded-md p-2 flex items-center justify-between">
                  <div>Year {s.year} • {s.id.slice(-6)} • {new Date(s.createdAt).toLocaleString()}</div>
                  <div className={`text-xs font-medium ${decisions[s.id]?.status==='approved'?'text-emerald-600':decisions[s.id]?.status==='rejected'?'text-rose-600':'text-amber-600'}`}>{decisions[s.id]?.status||'pending'}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </PrincipalLayout>
  );
}
