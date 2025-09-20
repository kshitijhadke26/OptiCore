import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const data = [
  { id:1, class:"CS-A", subject:"Data Structures", day:"Monday", time:"09:00-10:00" },
  { id:2, class:"CS-B", subject:"Algorithm Lab", day:"Monday", time:"10:00-11:00" },
  { id:3, class:"CS-A", subject:"Software Engineering", day:"Tuesday", time:"14:00-15:00" },
];

import * as React from "react";

export default function FacultyMySchedule(){
  const classes = Array.from(new Set(data.map(d=>d.class)));
  const subjects = Array.from(new Set(data.map(d=>d.subject)));
  const days = Array.from(new Set(data.map(d=>d.day)));

  const [selectedClass, setSelectedClass] = React.useState<string|"all">("all");
  const [selectedSubject, setSelectedSubject] = React.useState<string|"all">("all");
  const [selectedDay, setSelectedDay] = React.useState<string|"all">("all");

  const filtered = data.filter(d =>
    (selectedClass==='all'||d.class===selectedClass) &&
    (selectedSubject==='all'||d.subject===selectedSubject) &&
    (selectedDay==='all'||d.day===selectedDay)
  );

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <h1 className="text-2xl font-semibold">My Schedule</h1>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Filters</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <div className="text-xs mb-1 text-muted-foreground">Class</div>
              <Select value={selectedClass} onValueChange={(v:any)=>setSelectedClass(v)}>
                <SelectTrigger><SelectValue placeholder="Class" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {classes.map(c=> <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="text-xs mb-1 text-muted-foreground">Subject</div>
              <Select value={selectedSubject} onValueChange={(v:any)=>setSelectedSubject(v)}>
                <SelectTrigger><SelectValue placeholder="Subject" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {subjects.map(s=> <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="text-xs mb-1 text-muted-foreground">Day</div>
              <Select value={selectedDay} onValueChange={(v:any)=>setSelectedDay(v)}>
                <SelectTrigger><SelectValue placeholder="Day" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {days.map(d=> <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Lectures</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {filtered.map((l)=>(
                <li key={l.id} className="rounded-md border p-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{l.subject}</div>
                    <div className="text-xs text-muted-foreground">{l.class} • {l.day} • {l.time}</div>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
