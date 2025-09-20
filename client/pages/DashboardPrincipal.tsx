import PrincipalLayout from "@/components/layout/PrincipalLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useEffect, useMemo, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2 } from "lucide-react";

function StatCard({ title, value, sub }: { title: string; value: string | number; sub?: string }){
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm">{title}</CardTitle></CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
        {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
      </CardContent>
    </Card>
  );
}

export default function DashboardPrincipal() {
  const [subs, setSubs] = useState<any[]>([]);
  const [decisions, setDecisions] = useState<Record<string, any>>({});
  const [leave, setLeave] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(()=>{
    let s:any[] = [];
    let d:Record<string, any> = {};
    let l:any[] = [];
    let n:any[] = [];
    try { s = JSON.parse(localStorage.getItem('ttSubmissions')||'[]'); } catch {}
    try { d = JSON.parse(localStorage.getItem('hodDecisions')||'{}'); } catch {}
    try { l = JSON.parse(localStorage.getItem('facultyLeave')||'[]'); } catch {}
    try { n = JSON.parse(localStorage.getItem('adminNotifications')||'[]'); } catch {}

    if (!s || s.length===0){
      const times = ["09:00-10:00","10:00-11:00","11:00-12:00","14:00-15:00","15:00-16:00"];
      const basePlan: Record<string, any[]> = {
        "Monday-09:00-10:00": [{ subject:"DS", room:"101", batch:1 }],
        "Tuesday-10:00-11:00": [{ subject:"DB", room:"202", batch:1 }],
        "Wednesday-11:00-12:00": [{ subject:"OS", room:"105", batch:2 }],
        "Thursday-15:00-16:00": [{ subject:"CN", room:"103", batch:1 }],
      };
      s = [
        { id:'demo-1', year:'1', createdAt: Date.now()-86400000, times, plan: basePlan, conflicts: [] },
        { id:'demo-2', year:'2', createdAt: Date.now()-172800000, times, plan: basePlan, conflicts: ["Overlap"] },
        { id:'demo-3', year:'3', createdAt: Date.now()-259200000, times, plan: basePlan, conflicts: [] },
      ];
    }
    if (!d || Object.keys(d).length===0){
      d = { 'demo-1': { status:'approved' }, 'demo-2': { status:'pending' }, 'demo-3': { status:'rejected', reason:'Adjust labs' } };
    }
    if (!l || l.length===0){
      l = [ { id:'leave-1', start:'2025-01-10', end:'2025-01-11', type:'Casual', reason:'Medical', status:'Pending', created:new Date().toISOString() } ];
    }
    if (!n || n.length===0){
      n = [ { id:'n1', title:'Year 4 timetable approved', detail:'HOD approved a conflict-free timetable.', time:'now' }, { id:'n2', title:'Underutilized Lab-201', detail:'Consider reallocating sessions', time:'today' } ];
    }

    setSubs(s); setDecisions(d); setLeave(l); setNotifications(n);
  },[]);

  const counts = useMemo(()=>{
    const created = subs.length;
    const approved = subs.filter(s => decisions[s.id]?.status==='approved').length;
    const pending = subs.filter(s => !decisions[s.id] || decisions[s.id].status==='pending').length;
    return { created, approved, pending };
  }, [subs, decisions]);

  const utilization = 80; // demo
  const balanced = 76; const overloaded = 24;
  const pendingLeaves = useMemo(()=> leave.filter(l=> l.status==='Pending').length, [leave]);

  return (
    <PrincipalLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Principal Dashboard</h1>
            <p className="text-muted-foreground">Overview of timetable status and institute health</p>
          </div>
          <Badge variant="secondary" className="rounded-md">Voicely ready</Badge>
        </div>

        <Alert className="bg-emerald-50 border-emerald-200 text-emerald-900">
          <AlertDescription className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" /> System Status: Healthy — No critical conflicts detected
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard title="Timetables Created" value={counts.created} sub="this semester" />
          <StatCard title="Pending Approval" value={counts.pending} />
          <StatCard title="Approved" value={counts.approved} />
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Classroom Utilization</CardTitle></CardHeader>
            <CardContent>
              <div className="text-lg font-medium">{utilization}% used</div>
              <Progress value={utilization} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Faculty Workload</CardTitle></CardHeader>
            <CardContent>
              <div className="text-sm">Balanced vs Overloaded</div>
              <div className="mt-2 flex items-center gap-3">
                <Badge className="bg-emerald-600 hover:bg-emerald-600">{balanced}% balanced</Badge>
                <Badge className="bg-rose-600 hover:bg-rose-600">{overloaded}% overloaded</Badge>
              </div>
            </CardContent>
          </Card>
          <StatCard title="Pending Leave Approvals" value={pendingLeaves} />
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Notifications</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {notifications.slice(0,4).map(n => (
                  <li key={n.id} className="border rounded-md px-3 py-2">
                    <div className="font-medium">{n.title}</div>
                    <div className="text-xs text-muted-foreground">{n.detail || n.time || ''}</div>
                  </li>
                ))}
                {notifications.length===0 && <li className="text-muted-foreground">No alerts</li>}
              </ul>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Department Overview</TabsTrigger>
            <TabsTrigger value="monitoring">Timetable Monitoring</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: 'Electrical Engg', head:'Dr. Sarah Johnson', load:87, util:92 },
                { name: 'Mechanical Engg', head:'Dr. Michael Brown', load:78, util:85 },
                { name: 'Electronics Engg', head:'Dr. Lisa Anderson', load:82, util:88 },
                { name: 'Civil Engg', head:'Dr. Robert Wilson', load:75, util:90 },
                { name: 'Instrument', head:'Dr. Priya Nair', load:74, util:83 },
                { name: 'Information Technology', head:'Dr. Amit Verma', load:81, util:89 },
                { name: 'Computer Science', head:'Dr. Neha Kapoor', load:86, util:91 },
              ].map((d)=> (
                <Card key={d.name}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">{d.name}</CardTitle>
                        <div className="text-xs text-muted-foreground">Head: {d.head}</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <div className="text-xl font-semibold">8</div>
                      <div className="text-xs text-muted-foreground">Faculty</div>
                    </div>
                    <div>
                      <div className="text-xl font-semibold">{d.load}%</div>
                      <div className="text-xs text-muted-foreground">Load</div>
                    </div>
                    <div>
                      <div className="text-xl font-semibold">{d.util}%</div>
                      <div className="text-xs text-muted-foreground">Utilization</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="monitoring" className="mt-4">
            <Card><CardContent>Realtime monitoring and approval tools coming next.</CardContent></Card>
          </TabsContent>
        </Tabs>
      </div>
    </PrincipalLayout>
  );
}
