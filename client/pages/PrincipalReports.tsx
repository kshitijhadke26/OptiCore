import PrincipalLayout from "@/components/layout/PrincipalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useMemo, useState } from "react";

export default function PrincipalReports(){
  const [subs, setSubs] = useState<any[]>([]);
  const [decisions, setDecisions] = useState<Record<string, { status:string; reason?:string }>>({});
  const [attendanceRate, setAttendanceRate] = useState<string>('');

  useEffect(()=>{
    let s:any[] = [];
    let d:Record<string, { status:string; reason?:string }> = {};
    try { s = JSON.parse(localStorage.getItem('ttSubmissions')||'[]'); } catch {}
    try { d = JSON.parse(localStorage.getItem('hodDecisions')||'{}'); } catch {}
    if (!s || s.length===0){
      s = [ { id:'demo-1', year:'1', createdAt: Date.now()-86400000, conflicts:["A" ] }, { id:'demo-2', year:'2', createdAt: Date.now()-172800000, conflicts:[] } ];
    }
    if (!d || Object.keys(d).length===0){ d = { 'demo-1': { status:'approved' }, 'demo-2': { status:'approved' } }; }
    setSubs(s); setDecisions(d);
    try { const r = localStorage.getItem('studentAttendanceRate'); setAttendanceRate(r? r+"%" : '92%'); } catch { setAttendanceRate('92%'); }
  },[]);

  const metrics = useMemo(()=>{
    const approved = subs.filter(s=> decisions[s.id]?.status==='approved');
    const conflicts = subs.reduce((n, s)=> n + (s.conflicts?.length||0), 0);
    const conflictsApproved = approved.reduce((n, s)=> n + (s.conflicts?.length||0), 0);
    const reduction = conflicts===0? 100 : Math.max(0, Math.round(100 - (conflictsApproved/conflicts)*100));
    const utilization = 78;
    const efficiency = Math.round((utilization + reduction)/2);
    return { efficiency, reduction, utilization };
  }, [subs, decisions]);

  return (
    <PrincipalLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-semibold">Reports & Analytics</h1>
          <p className="text-muted-foreground">Summary KPIs across departments</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Timetable Efficiency Score</CardTitle></CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{metrics.efficiency}</div>
              <div className="text-xs text-muted-foreground">0-100 composite</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Conflict Reduction</CardTitle></CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{metrics.reduction}%</div>
              <div className="text-xs text-muted-foreground">vs generated candidates</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Utilization</CardTitle></CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{metrics.utilization}%</div>
              <div className="text-xs text-muted-foreground">rooms & labs</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Attendance Overview</CardTitle></CardHeader>
          <CardContent>
            <div className="text-sm">Average Attendance Rate: <span className="font-medium">{attendanceRate || 'N/A'}</span></div>
            <div className="text-xs text-muted-foreground">Detailed breakdown is available for HOD/Faculty</div>
          </CardContent>
        </Card>
      </div>
    </PrincipalLayout>
  );
}
