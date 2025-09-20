import HODLayout from "@/components/layout/HODLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

interface LeaveReq { id:string; start:string; end:string; type:string; reason:string; status:"Pending"|"Approved"|"Rejected"; created:string }

export default function HODLeaveApprovals(){
  const [items, setItems] = useState<LeaveReq[]>(() => {
    const raw = localStorage.getItem("facultyLeave");
    return raw ? (JSON.parse(raw) as LeaveReq[]) : [];
  });

  useEffect(()=>{ try { localStorage.setItem("facultyLeave", JSON.stringify(items)); } catch {} }, [items]);

  function setStatus(id:string, status: LeaveReq["status"]) {
    setItems(arr => arr.map(i => i.id===id ? { ...i, status } : i));
  }

  return (
    <HODLayout>
      <div className="space-y-5">
        <h1 className="text-2xl font-semibold">Leave Approvals</h1>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Pending & Recent</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {items.length===0 && <li className="text-sm text-muted-foreground">No requests yet.</li>}
              {items.map(i=> (
                <li key={i.id} className="rounded-md border p-3 flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium">{i.type}</div>
                    <div className="text-xs text-muted-foreground">{i.start} – {i.end}</div>
                    <div className="text-sm">{i.reason}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${i.status==='Approved'?'bg-emerald-100 text-emerald-800': i.status==='Rejected'?'bg-red-100 text-red-800':'bg-amber-100 text-amber-800'}`}>{i.status.toLowerCase()}</span>
                    <Button size="sm" variant="outline" onClick={()=>setStatus(i.id,'Approved')}>Approve</Button>
                    <Button size="sm" variant="outline" onClick={()=>setStatus(i.id,'Rejected')}>Reject</Button>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </HODLayout>
  );
}
