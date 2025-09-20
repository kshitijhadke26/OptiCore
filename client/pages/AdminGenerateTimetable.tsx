import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Fragment, useMemo, useState } from "react";

const days = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

function timesFromMax(maxPerDay:number){
  const base = ["09:00-10:00","10:00-11:00","11:00-12:00","12:00-13:00","14:00-15:00","15:00-16:00","16:00-17:00","17:00-18:00"];
  return base.slice(0, Math.max(1, Math.min(base.length, maxPerDay)));
}

type Subject = { name: string; perWeek: number; perDay?: number; facultyCount?: number; type?: 'Lecture'|'Practical'; sessionLength?: number };

type FixedSlot = { subject: string; day: string; time?: string; allDay?: boolean; repeatAllDays?: boolean; room?: string; batch?: number };

type Config = {
  year: string;
  classrooms: number;
  batches: number;
  subjects: Subject[];
  maxPerDay: number;
  avgFacultyLeaves: number;
  fixedSlots: FixedSlot[];
};

type Slot = { subject: string; room: string; batch: number };

function loadConfig(year: string): Config | null {
  try { const raw = localStorage.getItem(`adminTTConfig:${year}`); return raw? JSON.parse(raw): null; } catch { return null; }
}

function randomInt(n:number){ return Math.floor(Math.random()*n); }

function generatePlan(cfg: Config, seed:number){
  let rand = seed;
  const rng = ()=>{ rand = (rand * 9301 + 49297) % 233280; return rand / 233280; };
  const rint = (n:number)=> Math.floor(rng()*n);

  const times = timesFromMax(cfg.maxPerDay);
  const plan: Record<string, Slot[]> = {};

  const assign = (day:string, time:string, slot: Slot)=>{
    const key = `${day}-${time}`; plan[key] ||= [];
    plan[key].push(slot);
  };

  // place fixed slots first
  for (const f of cfg.fixedSlots){
    if (!f.subject || !f.day) continue;
    const batch = f.batch && f.batch>=1 && f.batch<=cfg.batches? f.batch : 1;
    const room = f.room || String(100 + rint(cfg.classrooms));
    const dlist = f.repeatAllDays? days : [f.day];
    for (const d of dlist){
      if (f.allDay){
        for (const t of times){ assign(d, t, { subject: f.subject, room, batch }); }
      } else if (f.time){
        assign(d, f.time, { subject: f.subject, room, batch });
      }
    }
  }

  // per batch schedule matrix: day -> count
  const perDayCount: Record<number, Record<string, number>> = {};
  for (let b=1;b<=cfg.batches;b++){ perDayCount[b] = {}; days.forEach(d=> perDayCount[b][d] = 0); }

  // helper: find next available (day,time) for a batch respecting per day max
  function findSlot(batch:number){
    const orderDays = [...days].sort(()=> rng()-0.5);
    for (const d of orderDays){
      if (perDayCount[batch][d] >= cfg.maxPerDay) continue;
      const shuffled = [...times].sort(()=> rng()-0.5);
      for (const t of shuffled){
        const key = `${d}-${t}`;
        const used = plan[key]?.filter(s=> s.batch===batch).length || 0;
        if (used===0) return { d, t };
      }
    }
    return null;
  }

  function findDoubleSlot(batch:number){
    const orderDays = [...days].sort(()=> rng()-0.5);
    for (const d of orderDays){
      if (perDayCount[batch][d] >= cfg.maxPerDay) continue;
      for (let i=0;i<times.length-1;i++){
        const t1 = times[i], t2 = times[i+1];
        const k1 = `${d}-${t1}`; const k2 = `${d}-${t2}`;
        const u1 = plan[k1]?.filter(s=> s.batch===batch).length || 0;
        const u2 = plan[k2]?.filter(s=> s.batch===batch).length || 0;
        if (u1===0 && u2===0) return { d, t1, t2 };
      }
    }
    return null;
  }

  // schedule required sessions per subject per batch
  for (let b=1;b<=cfg.batches;b++){
    for (const subj of cfg.subjects){
      let remaining = Math.max(1, (subj.perWeek as number)|0);
      let dayAllocs: Record<string, number> = {}; days.forEach(d=> dayAllocs[d]=0);
      while (remaining>0){
        const dur = (subj as any).sessionLength===120? 120: 60;
        if (dur===120){
          const pick2 = findDoubleSlot(b);
          if (!pick2) break;
          if (subj.perDay && dayAllocs[pick2.d] >= subj.perDay){
            const alt = days.find(d=> dayAllocs[d] < (subj.perDay||1) && perDayCount[b][d] < cfg.maxPerDay);
            if (alt){
              let placed = false;
              for (let i=0;i<times.length-1;i++){
                const t1 = times[i], t2 = times[i+1];
                const k1 = `${alt}-${t1}`; const k2 = `${alt}-${t2}`;
                const u = (plan[k1]?.filter(s=> s.batch===b).length || 0) + (plan[k2]?.filter(s=> s.batch===b).length || 0);
                if (u===0){
                  const room = String(100 + rint(cfg.classrooms));
                  assign(alt, t1, { subject: subj.name, room, batch: b });
                  assign(alt, t2, { subject: subj.name, room, batch: b });
                  perDayCount[b][alt] += 2;
                  dayAllocs[alt] += 2;
                  remaining--;
                  placed = true;
                  break;
                }
              }
              if (placed) continue;
            }
          }
          const room = String(100 + rint(cfg.classrooms));
          assign(pick2.d, pick2.t1, { subject: subj.name, room, batch: b });
          assign(pick2.d, pick2.t2, { subject: subj.name, room, batch: b });
          perDayCount[b][pick2.d] += 2;
          dayAllocs[pick2.d] += 2;
          remaining--;
        } else {
          const pick = findSlot(b);
          if (!pick) break;
          if (subj.perDay && dayAllocs[pick.d] >= subj.perDay){
            const alt = days.find(d=> dayAllocs[d] < (subj.perDay||1) && perDayCount[b][d] < cfg.maxPerDay);
            if (alt){
              const tt = times[rint(times.length)];
              const key = `${alt}-${tt}`;
              const used = plan[key]?.filter(s=> s.batch===b).length || 0;
              if (used===0){
                const room = String(100 + rint(cfg.classrooms));
                assign(alt, tt, { subject: subj.name, room, batch: b });
                perDayCount[b][alt]++;
                dayAllocs[alt]++;
                remaining--;
                continue;
              }
            }
          }
          const room = String(100 + rint(cfg.classrooms));
          assign(pick.d, pick.t, { subject: subj.name, room, batch: b });
          perDayCount[b][pick.d]++;
          dayAllocs[pick.d]++;
          remaining--;
        }
      }
    }
  }

  return { times, plan };
}

function detectConflicts(cfg: Config, times:string[], plan: Record<string, Slot[]>) {
  const issues: string[] = [];
  // room capacity conflicts
  for (const d of days){
    for (const t of times){
      const key = `${d}-${t}`;
      const slots = plan[key] || [];
      if (slots.length > cfg.classrooms){
        issues.push(`Overbooked rooms at ${key} (${slots.length}/${cfg.classrooms})`);
      }
      // same batch double-booked check (shouldn't happen by construction)
      const seenBatch = new Set<number>();
      for (const s of slots){
        if (seenBatch.has(s.batch)) issues.push(`Batch ${s.batch} double booked at ${key}`);
        seenBatch.add(s.batch);
      }
    }
  }
  return Array.from(new Set(issues));
}

export default function AdminGenerateTimetable(){
  const [year, setYear] = useState("1");
  const [results, setResults] = useState<{ id:string; times:string[]; plan:Record<string, Slot[]>; conflicts:string[] }[]>([]);

  const cfg = useMemo(()=> loadConfig(year), [year]);

  function generate(){
    const conf = loadConfig(year);
    if (!conf){ alert("No configuration for selected year. Please import data first."); return; }
    const variants = [1,2,3].map((i)=>{
      const res = generatePlan(conf, i*100 + Math.floor(Math.random()*100));
      const conflicts = detectConflicts(conf, res.times, res.plan);
      return { id: `${Date.now()}-${i}`, times: res.times, plan: res.plan, conflicts };
    });
    setResults(variants);
  }

  function sendToHOD(resIndex:number){
    const item = results[resIndex];
    const submission = { id: item.id, year, createdAt: Date.now(), status: 'sent', times: item.times, plan: item.plan, conflicts: item.conflicts };
    const raw = localStorage.getItem('ttSubmissions');
    const arr = raw? JSON.parse(raw): [];
    arr.unshift(submission);
    localStorage.setItem('ttSubmissions', JSON.stringify(arr));
    alert('Sent to HOD for approval');
  }

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Generate Timetable</h1>
            <p className="text-muted-foreground">Create multiple candidate timetables for HOD review</p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span>Year</span>
            <select className="border rounded-md px-2 py-1" value={year} onChange={(e)=>setYear(e.target.value)}>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
            </select>
            <Button onClick={generate} className="bg-[#079E74] hover:bg-[#068d67] text-white">Generate</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {results.map((r, idx)=> (
            <Card key={r.id} className={r.conflicts.length===0? 'ring-2 ring-emerald-500':''}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Plan {String.fromCharCode(65+idx)}</CardTitle>
                <div className={`text-xs font-medium ${r.conflicts.length? 'text-red-600':'text-emerald-600'}`}>
                  {r.conflicts.length? `${r.conflicts.length} conflicts detected` : 'Conflict-free'}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid" style={{ gridTemplateColumns: `100px repeat(${days.length}, 1fr)` }}>
                  <div className="text-[11px] p-1">Time</div>
                  {days.map(d=> <div key={d} className="text-[11px] p-1 text-center">{d}</div>)}
                  {r.times.map((t)=> (
                    <Fragment key={t}>
                      <div className="text-[11px] p-1 border-y">{t}</div>
                      {days.map((d)=>{
                        const key = `${d}-${t}`; const vals = r.plan[key] || [];
                        return <div key={key} className={`p-1 border ${vals.length? 'bg-muted/40':''}`}>
                          <div className="text-[11px] space-y-1">
                            {vals.map((v,i)=> <div key={i}>{v.subject} • R-{v.room} • B{v.batch}</div>)}
                          </div>
                        </div>;
                      })}
                    </Fragment>
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <Button variant="outline" onClick={()=>sendToHOD(idx)}>Send to HOD</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
