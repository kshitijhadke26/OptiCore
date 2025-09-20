import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEffect, useMemo, useState } from "react";

interface Submission { id:string; year:string; createdAt:number; status:string; conflicts:string[]; }

export default function AdminReviewApproval(){
  const [year, setYear] = useState("all");
  const [subs, setSubs] = useState<Submission[]>([]);
  const [hodDecisions, setHodDecisions] = useState<Record<string,{ status:'approved'|'rejected'|'pending'; reason?:string }>>({});
  const [adminDecisions, setAdminDecisions] = useState<Record<string,{ status:'approved'|'rejected'|'pending'; reason?:string }>>({});

  useEffect(()=>{
    try{
      const raw = localStorage.getItem('ttSubmissions');
      const arr = raw? JSON.parse(raw): [];
      setSubs(arr);
    }catch{ setSubs([]); }
    try{
      const raw = localStorage.getItem('hodDecisions');
      setHodDecisions(raw? JSON.parse(raw): {});
    }catch{ setHodDecisions({}); }
    try{
      const araw = localStorage.getItem('adminFinalDecisions');
      setAdminDecisions(araw? JSON.parse(araw): {});
    }catch{ setAdminDecisions({}); }
  }, []);

  const display = useMemo(()=> subs.filter(s=> (year==='all' || s.year===year) && (hodDecisions[s.id]?.status==='approved')), [subs, year, hodDecisions]);


  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Review & Approval</h1>
            <p className="text-muted-foreground">Approve or reject HOD-approved timetables (add reason on rejection)</p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span>Filter Year</span>
            <select className="border rounded-md px-2 py-1" value={year} onChange={(e)=>setYear(e.target.value)}>
              <option value="all">All</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
            </select>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Submissions</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr>
                    <th className="py-2">ID</th>
                    <th className="py-2">Year</th>
                    <th className="py-2">Conflicts</th>
                    <th className="py-2">Created</th>
                    <th className="py-2">HOD Status</th>
                    <th className="py-2">Admin Status</th>
                    <th className="py-2">Reason</th>
                    <th className="py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {display.map(s=>{
                    const h = hodDecisions[s.id] || { status: 'pending' as const };
                    const a = adminDecisions[s.id] || { status: 'pending' as const };
                    return (
                      <tr key={s.id} className="border-t">
                        <td className="py-2 font-mono text-xs">{s.id.slice(-8)}</td>
                        <td className="py-2">{s.year}</td>
                        <td className="py-2">{s.conflicts.length}</td>
                        <td className="py-2">{new Date(s.createdAt).toLocaleString()}</td>
                        <td className="py-2">
                          <Badge className={h.status==='approved'? 'bg-emerald-600 hover:bg-emerald-600': h.status==='rejected'? 'bg-rose-600 hover:bg-rose-600': ''}>{h.status}</Badge>
                        </td>
                        <td className="py-2">
                          <Badge className={a.status==='approved'? 'bg-emerald-600 hover:bg-emerald-600': a.status==='rejected'? 'bg-rose-600 hover:bg-rose-600': ''}>{a.status}</Badge>
                        </td>
                        <td className="py-2 text-xs text-muted-foreground">{a.reason || ''}</td>
                        <td className="py-2 flex gap-2">
                          <Button variant="outline" size="sm" onClick={()=>{
                            const next = { ...adminDecisions, [s.id]: { status:'approved' as const } };
                            setAdminDecisions(next); localStorage.setItem('adminFinalDecisions', JSON.stringify(next));
                          }}>Approve</Button>
                          <Button variant="outline" size="sm" onClick={()=>{
                            const reason = prompt('Enter reason for rejection') || 'No reason provided';
                            const next = { ...adminDecisions, [s.id]: { status:'rejected' as const, reason } };
                            setAdminDecisions(next); localStorage.setItem('adminFinalDecisions', JSON.stringify(next));
                          }}>Reject</Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
