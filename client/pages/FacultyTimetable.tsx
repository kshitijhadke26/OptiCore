import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Fragment, useState } from "react";

const times = ["08:00-09:00","09:00-10:00","10:00-11:00","11:00-12:00","12:00-13:00","13:00-14:00","14:00-15:00","15:00-16:00","16:00-17:00"];
const days = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

const grid: Record<string, { title:string; color:string; year:number }|undefined> = {
  "Monday-09:00-10:00": { title:"Data Structures", color:"bg-sky-600", year:1 },
  "Monday-10:00-11:00": { title:"Algorithm Lab", color:"bg-amber-500", year:1 },
  "Tuesday-10:00-11:00": { title:"Database Systems", color:"bg-sky-600", year:2 },
  "Wednesday-14:00-15:00": { title:"AI Lab", color:"bg-amber-500", year:3 },
  "Thursday-15:00-16:00": { title:"Project Work", color:"bg-violet-600", year:4 },
};

export default function FacultyTimetable() {
  const [year, setYear] = useState("1");
  const [day, setDay] = useState(days[0]);
  const [view, setView] = useState("weekly");
  const displayDays = view === "weekly" ? days : [day];

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-semibold">Timetable View</h1>
          <p className="text-muted-foreground">Generate and view timetable with filters</p>
        </div>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Filters</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <div className="text-xs mb-1 text-muted-foreground">Year</div>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1st Year</SelectItem>
                  <SelectItem value="2">2nd Year</SelectItem>
                  <SelectItem value="3">3rd Year</SelectItem>
                  <SelectItem value="4">4th Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="text-xs mb-1 text-muted-foreground">View</div>
              <Select value={view} onValueChange={setView}>
                <SelectTrigger><SelectValue placeholder="View" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {view === "daily" && (
              <div>
                <div className="text-xs mb-1 text-muted-foreground">Day</div>
                <Select value={day} onValueChange={setDay}>
                  <SelectTrigger><SelectValue placeholder="Day" /></SelectTrigger>
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

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Computed Timetable</CardTitle></CardHeader>
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
                        const k = `${d}-${t}`;
                        const s = grid[k];
                        const match = s && String(s.year) === year;
                        if (!match) return <div key={k} className="p-2 border text-center text-[11px] text-muted-foreground/70 bg-muted/30">Free</div>;
                        return (
                          <div key={k} className={`p-2 border ${s!.color} text-white rounded-md m-1 shadow-sm`}>
                            <div className="text-sm font-medium leading-tight">{s!.title}</div>
                            <Badge className="mt-1 rounded-sm bg-white/20 text-white border-0">Year {s!.year}</Badge>
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
      </div>
    </DashboardLayout>
  );
}
