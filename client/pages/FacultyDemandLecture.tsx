import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

interface DLReq { id:string; subject:string; classYear:string; reason:string; status:"Pending"|"Approved"; created:string }

export default function FacultyDemandLecture() {
  const [search] = useSearchParams();
  const [subject, setSubject] = useState("Data Structures");
  const [classYear, setClassYear] = useState("1");
  const [reason, setReason] = useState(search.get("reason") || "");
  const [items, setItems] = useState<DLReq[]>(() => {
    const raw = localStorage.getItem("facultyDemandLecture");
    return raw ? JSON.parse(raw) as DLReq[] : [];
  });

  useEffect(() => { localStorage.setItem("facultyDemandLecture", JSON.stringify(items)); }, [items]);

  const recogRef = useRef<any>(null);
  function speakReason() {
    const SR:any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return alert("Voice recognition not supported.");
    const r = new SR(); r.lang = 'en-US'; r.continuous = false; r.onresult = (e:any)=>setReason(e.results[0][0].transcript);
    try { r.start(); } catch {}
    recogRef.current = r;
  }

  function submit() {
    if (!reason.trim()) return alert("Enter a reason");
    const req: DLReq = { id: String(Date.now()), subject, classYear, reason, status: "Pending", created: new Date().toISOString() };
    setItems((arr)=>[req, ...arr]);
    setReason("");
    setTimeout(()=>{
      setItems((arr)=>arr.map((x)=> x.id===req.id ? { ...x, status: Math.random()>0.5?"Approved":"Pending" } : x));
    }, 2000);
  }

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <h1 className="text-2xl font-semibold">Demand Lecture</h1>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Request a Lecture</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <div className="text-xs mb-1 text-muted-foreground">Subject</div>
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger><SelectValue placeholder="Subject" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Data Structures">Data Structures</SelectItem>
                    <SelectItem value="Software Engineering">Software Engineering</SelectItem>
                    <SelectItem value="AI Lab">AI Lab</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <div className="text-xs mb-1 text-muted-foreground">Class (Year)</div>
                <Select value={classYear} onValueChange={setClassYear}>
                  <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1st Year</SelectItem>
                    <SelectItem value="2">2nd Year</SelectItem>
                    <SelectItem value="3">3rd Year</SelectItem>
                    <SelectItem value="4">4th Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <div className="text-xs mb-1 text-muted-foreground">Reason</div>
              <textarea value={reason} onChange={(e)=>setReason(e.target.value)} className="w-full min-h-24 rounded-md border p-2" placeholder="Reason and preferred slot..." />
            </div>
            <div className="flex gap-2">
              <Button onClick={submit} className="bg-[#079E74] hover:bg-[#068d67] text-white">Submit</Button>
              <Button variant="outline" onClick={speakReason}>Voicely: Speak</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Status</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {items.map(i=> (
                <li key={i.id} className="rounded-md border p-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{i.subject} • Year {i.classYear}</div>
                    <div className="text-xs text-muted-foreground">{new Date(i.created).toLocaleString()}</div>
                    <div className="text-sm">{i.reason}</div>
                  </div>
                  <div className={`text-xs font-medium ${i.status==='Approved'?'text-emerald-600':'text-amber-600'}`}>{i.status}</div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
