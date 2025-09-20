import HODLayout from "@/components/layout/HODLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useState, Fragment } from "react";

export default function HODTimetable(){
  const [year, setYear] = useState("1");
  const [show, setShow] = useState(false);

  const data = (()=>{
    try{
      const subs = JSON.parse(localStorage.getItem('ttSubmissions')||'[]') as any[];
      const list = subs.filter((s:any)=> s.year===year);
      const map = JSON.parse(localStorage.getItem('hodApprovedByYear')||'{}') as Record<string,string>;
      const approvedId = map[year];
      if (approvedId){
        const found = list.find((s:any)=> s.id===approvedId);
        if (found) return found;
      }
      const decisions = JSON.parse(localStorage.getItem('hodDecisions')||'{}') as Record<string, any>;
      const anyApproved = list.find(s=> decisions[s.id]?.status==='approved');
      return anyApproved || null;
    }catch{return null;}
  })();

  const days = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

  return (
    <HODLayout>
      <div className="space-y-5">
        <h1 className="text-2xl font-semibold">Timetable View</h1>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Filters</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <div className="text-xs mb-1 text-muted-foreground">Year</div>
              <Select value={year} onValueChange={(v)=>{ setYear(v); setShow(false); }}>
                <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2 flex items-end">
              <Button onClick={()=> setShow(true)} className="bg-[#079E74] hover:bg-[#068d67] text-white">Show Timetable</Button>
            </div>
          </CardContent>
        </Card>

        {show && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Year {year} Timetable</CardTitle></CardHeader>
            <CardContent>
              {!data && <div className="text-sm text-muted-foreground">No HOD-approved timetable found for this year. Go to Review & Approvals to approve one.</div>}
              {data && (
                <div className="grid" style={{ gridTemplateColumns: `120px repeat(${days.length}, 1fr)` }}>
                  <div className="text-[11px] p-1">Time</div>
                  {days.map(d=> <div key={d} className="text-[11px] p-1 text-center">{d}</div>)}
                  {data.times.map((t:string)=> (
                    <Fragment key={t}>
                      <div className="text-[11px] p-1 border-y">{t}</div>
                      {days.map((d)=>{
                        const key = `${d}-${t}`; const vals = (data.plan[key]||[]) as any[];
                        return <div key={key} className={`p-1 border ${vals.length? 'bg-muted/40':''}`}>
                          <div className="text-[11px] space-y-1">
                            {vals.map((v,i)=> <div key={i}>{v.subject} • R-{v.room} • B{v.batch}</div>)}
                          </div>
                        </div>;
                      })}
                    </Fragment>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </HODLayout>
  );
}
