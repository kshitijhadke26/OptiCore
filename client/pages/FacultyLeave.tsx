import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

interface LeaveReq { id:string; start:string; end:string; type:string; reason:string; status:"Pending"|"Approved"|"Rejected"; created:string }

export default function FacultyLeave() {
  const [search] = useSearchParams();
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [type, setType] = useState("Casual Leave");
  const [reason, setReason] = useState(search.get("reason") || "");
  const [items, setItems] = useState<LeaveReq[]>(() => {
    const raw = localStorage.getItem("facultyLeave");
    return raw ? (JSON.parse(raw) as LeaveReq[]) : [];
  });

  useEffect(() => { localStorage.setItem("facultyLeave", JSON.stringify(items)); }, [items]);

  const recogRef = useRef<any>(null);
  function startVoice() {
    const SR:any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return alert("Voice recognition not supported.");
    const r = new SR();
    r.lang = "en-US"; r.continuous = false; r.onresult = (e:any)=>setReason(e.results[0][0].transcript);
    try { r.start(); } catch {}
    recogRef.current = r;
  }

  function submit() {
    if (!start || !end || !type || !reason.trim()) return alert("Please fill all fields");
    const req: LeaveReq = { id: String(Date.now()), start, end, type, reason, status: "Pending", created: new Date().toISOString() };
    setItems((arr)=>[req, ...arr]);
    setStart(""); setEnd(""); setType("Casual Leave"); setReason("");
    setTimeout(()=>{
      setItems((arr)=>arr.map((x)=> x.id===req.id ? { ...x, status: Math.random()>0.3?"Approved":"Rejected" } : x));
    }, 2000);
  }

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Leave Management</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Request Leave</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <div className="text-xs mb-1 text-muted-foreground">Start Date</div>
                  <input type="date" className="w-full rounded-md border p-2" value={start} onChange={(e)=>setStart(e.target.value)} />
                </div>
                <div>
                  <div className="text-xs mb-1 text-muted-foreground">End Date</div>
                  <input type="date" className="w-full rounded-md border p-2" value={end} onChange={(e)=>setEnd(e.target.value)} />
                </div>
              </div>
              <div>
                <div className="text-xs mb-1 text-muted-foreground">Leave Type</div>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Casual Leave">Casual Leave</SelectItem>
                    <SelectItem value="Medical Leave">Medical Leave</SelectItem>
                    <SelectItem value="Academic Leave">Academic Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <div className="text-xs mb-1 text-muted-foreground">Reason</div>
                <textarea value={reason} onChange={(e)=>setReason(e.target.value)} className="w-full min-h-24 rounded-md border p-2" placeholder="Please provide the reason for your leave request..." />
              </div>
              <div className="flex gap-2">
                <Button onClick={submit} className="bg-[#079E74] hover:bg-[#068d67] text-white">Submit Leave Request</Button>
                <Button variant="outline" onClick={startVoice}>Voicely: Speak</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Leave History</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {items.map((i)=> (
                  <li key={i.id} className="rounded-md border p-3">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{i.type}</div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${i.status==='Approved'?'bg-emerald-100 text-emerald-800': i.status==='Rejected'?'bg-red-100 text-red-800':'bg-amber-100 text-amber-800'}`}>{i.status.toLowerCase()}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">{new Date(i.created).toLocaleDateString()} • {i.start} – {i.end}</div>
                    <div className="text-sm mt-1">{i.reason}</div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
