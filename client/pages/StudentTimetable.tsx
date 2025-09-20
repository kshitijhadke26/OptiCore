import StudentLayout from "@/components/layout/StudentLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Fragment, useState } from "react";

const times = [
  "08:00-09:00",
  "09:00-10:00",
  "10:00-11:00",
  "11:00-12:00",
  "12:00-13:00",
  "13:00-14:00",
  "14:00-15:00",
  "15:00-16:00",
  "16:00-17:00",
];
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type Slot = { title?: string; room?: string; tag?: string; color?: string; free?: boolean; lunch?: boolean };

const grid: Record<string, Slot> = {
  "Monday-09:00-10:00": { title: "Data Structures", room: "Room-101", tag: "core", color: "bg-sky-600" },
  "Monday-10:00-11:00": { title: "Algorithm Lab", room: "Lab-201", tag: "lab", color: "bg-amber-500" },
  "Monday-11:00-12:00": { title: "Machine Learning", room: "Room-103", tag: "elective", color: "bg-emerald-600" },
  "Tuesday-10:00-11:00": { title: "Database Systems", room: "Room-103", tag: "core", color: "bg-sky-600" },
  "Tuesday-11:00-12:00": { title: "Software Eng.", room: "Room-104", tag: "core", color: "bg-sky-600" },
  "Wednesday-10:00-11:00": { title: "Computer Networks", room: "Room-105", tag: "core", color: "bg-sky-600" },
  "Wednesday-14:00-15:00": { title: "AI Lab", room: "Lab-301", tag: "lab", color: "bg-amber-500" },
  "Thursday-10:00-11:00": { title: "Operating Systems", room: "Room-106", tag: "core", color: "bg-sky-600" },
  "Thursday-15:00-16:00": { title: "Project Work", room: "Lab-204", tag: "project", color: "bg-violet-600" },
  "Friday-09:00-10:00": { title: "Algorithm Design", room: "Room-107", tag: "core", color: "bg-sky-600" },
  "Friday-11:00-12:00": { title: "Seminar", room: "Seminar Hall", tag: "special", color: "bg-red-600" },
};

export default function StudentTimetable() {
  const [view, setView] = useState<"weekly" | "daily">("weekly");
  const [typeFilter, setTypeFilter] = useState<"all" | "core" | "lab" | "elective" | "project" | "special">("all");
  const [day, setDay] = useState<string>(days[0]);
  const displayDays = view === "weekly" ? days : [day];

  return (
    <StudentLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-semibold">Timetable View</h1>
          <p className="text-muted-foreground">Visual representation of class schedules and room assignments</p>
        </div>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Filter & View Options</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <div className="text-xs mb-1 text-muted-foreground">View Type</div>
              <Select value={view} onValueChange={(v: any) => setView(v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly View</SelectItem>
                  <SelectItem value="daily">Daily View</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="text-xs mb-1 text-muted-foreground">Filter By</div>
              <Select value={typeFilter} onValueChange={(v: any) => setTypeFilter(v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  <SelectItem value="core">Core</SelectItem>
                  <SelectItem value="lab">Lab</SelectItem>
                  <SelectItem value="elective">Elective</SelectItem>
                  <SelectItem value="project">Project</SelectItem>
                  <SelectItem value="special">Special</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {view === "daily" && (
              <div>
                <div className="text-xs mb-1 text-muted-foreground">Day</div>
                <Select value={day} onValueChange={setDay}>
                  <SelectTrigger><SelectValue placeholder="Select day" /></SelectTrigger>
                  <SelectContent>
                    {days.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-3 items-center text-xs">
          <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-sky-600" /> Core</div>
          <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-emerald-600" /> Elective</div>
          <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-amber-500" /> Lab</div>
          <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-red-600" /> Fixed Sessions</div>
          <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-violet-600" /> Project</div>
          <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-zinc-300" /> Free/Lunch</div>
        </div>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Computer Science – Week View</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-auto">
              <div className="min-w-[900px]">
                <div className="grid" style={{ gridTemplateColumns: `120px repeat(${displayDays.length}, 1fr)` }}>
                  <div className="text-xs font-medium text-muted-foreground p-2">Time</div>
                  {displayDays.map((d) => (
                    <div key={d} className="text-xs font-medium text-muted-foreground p-2 text-center">{d}</div>
                  ))}
                  {times.map((t) => (
                    <Fragment key={`row-${t}`}>
                      <div className="p-2 text-xs text-muted-foreground border-y">{t}</div>
                      {displayDays.map((d) => {
                        const key = `${d}-${t}`;
                        const s = grid[key];
                        const show = s && (typeFilter === "all" || s.tag === typeFilter);
                        if (!show) return <div key={key} className="p-2 border text-center text-[11px] text-muted-foreground/70 bg-muted/30">Free</div>;
                        return (
                          <div key={key} className={`p-2 border ${s!.color} text-white rounded-md m-1 shadow-sm`}>
                            <div className="text-sm font-medium leading-tight">{s!.title}</div>
                            <div className="text-[11px] opacity-90">{s!.room}</div>
                            <Badge className="mt-1 rounded-sm bg-white/20 text-white border-0">{s!.tag}</Badge>
                          </div>
                        );
                      })}
                    </Fragment>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card><CardContent className="pt-6 text-center"><div className="text-2xl font-semibold text-blue-600">11</div><div className="text-xs text-muted-foreground">Total Classes</div></CardContent></Card>
          <Card><CardContent className="pt-6 text-center"><div className="text-2xl font-semibold text-emerald-600">23%</div><div className="text-xs text-muted-foreground">Utilization Rate</div></CardContent></Card>
          <Card><CardContent className="pt-6 text-center"><div className="text-2xl font-semibold text-violet-600">9</div><div className="text-xs text-muted-foreground">Active Faculty</div></CardContent></Card>
        </div>
      </div>
    </StudentLayout>
  );
}
