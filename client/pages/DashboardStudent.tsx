import StudentLayout from "@/components/layout/StudentLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, CalendarDays, Clock, User } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Notification = { id: string; title: string; detail: string; time: string };

const notificationsSeed: Notification[] = [
  { id: "1", title: "Assignment Due: Data Structures", detail: "Submit by Friday 6 pm.", time: "2h ago" },
  { id: "2", title: "Room Change for ML Lab", detail: "Lab-301 → Lab-202 for tomorrow.", time: "Yesterday" },
  { id: "3", title: "Seminar: AI Ethics", detail: "Friday 11am at Seminar Hall.", time: "2 days ago" },
];

function ClassPill({ title, tag, color }: { title: string; tag: string; color: string }) {
  return (
    <div className={`rounded-md ${color} text-white px-4 py-3 flex items-center justify-between shadow-sm`}> 
      <span className="font-medium text-sm">{title}</span>
      <span className="text-xs bg-white/20 px-2 py-0.5 rounded-md">{tag}</span>
    </div>
  );
}

export default function DashboardStudent() {
  const [tab, setTab] = useState("schedule");
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    try {
      const raw = localStorage.getItem("studentNotifications");
      return raw ? (JSON.parse(raw) as Notification[]) : notificationsSeed;
    } catch {
      return notificationsSeed;
    }
  });

  useEffect(() => {
    (window as any).__studentNotifications = notifications;
    try { localStorage.setItem("studentNotifications", JSON.stringify(notifications)); } catch {}
  }, [notifications]);

  useEffect(() => {
    if (window.location.hash.includes("notifications")) setTab("notifications");
  }, []);

  const stats = useMemo(
    () => [
      { label: "Classes This Week", value: 24, color: "text-blue-600" },
      { label: "Attendance Rate", value: "92%", color: "text-emerald-600" },
      { label: "Electives Selected", value: 3, color: "text-violet-600" },
      { label: "Pending Assignments", value: 2, color: "text-amber-600" },
    ],
    [],
  );

  return (
    <StudentLayout>
      <div className="space-y-5">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-semibold">My Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, Ajinkya Sultane</p>
          </div>
          <Card className="w-full max-w-sm">
            <CardContent className="pt-6 grid grid-cols-2 gap-3">
              <div className="col-span-2 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-muted grid place-items-center"><User className="h-5 w-5" /></div>
                <div>
                  <div className="font-medium">Ajinkya Sultane</div>
                  <div className="text-xs text-muted-foreground">Student ID: 2023CS001</div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">Department:</div><div className="text-sm">Computer Science</div>
              <div className="text-xs text-muted-foreground">Batch:</div><div className="text-sm">CS-A</div>
              <div className="text-xs text-muted-foreground">Semester:</div><div className="text-sm">5</div>
              <div className="text-xs text-muted-foreground">Attendance:</div>
              <div id="attendance-card" className="text-sm"><Badge className="rounded-md">92%</Badge></div>
            </CardContent>
          </Card>
        </div>

        <div className="rounded-md border p-3 text-sm flex items-center justify-between bg-white">
          <div className="flex items-center gap-2"><Bell className="h-4 w-4" /> Important Updates: You have 3 urgent notifications</div>
          <Button size="sm" variant="secondary" onClick={() => setTab("notifications")}>View All</Button>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 rounded-md">
            <TabsTrigger value="schedule">My Schedule</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="schedule" className="mt-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2"><CalendarDays className="h-5 w-5 text-muted-foreground" /><CardTitle className="text-base">Weekly Schedule</CardTitle></div>
                <p className="text-sm text-muted-foreground">Complete view of your weekly class schedule</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="mb-2 text-xs font-semibold text-muted-foreground">MONDAY <Badge variant="secondary" className="ml-2 rounded-sm">3 CLASSES</Badge></div>
                  <div className="grid md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <div className="font-medium text-sm">Data Structures</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2"><Clock className="h-3.5 w-3.5" /> 09:00–10:00 • Room-101</div>
                      <Badge variant="secondary" className="rounded-sm w-fit">core</Badge>
                    </div>
                    <ClassPill title="Machine Learning" tag="elective" color="bg-emerald-600" />
                    <ClassPill title="Web Development Lab" tag="lab" color="bg-amber-500" />
                  </div>
                </div>

                <div>
                  <div className="mb-2 text-xs font-semibold text-muted-foreground">TUESDAY <Badge variant="secondary" className="ml-2 rounded-sm">2 CLASSES</Badge></div>
                  <div className="grid md:grid-cols-2 gap-3">
                    <ClassPill title="Database Systems" tag="core" color="bg-sky-600" />
                    <ClassPill title="Software Engineering" tag="core" color="bg-sky-600" />
                  </div>
                </div>

                <div>
                  <div className="mb-2 text-xs font-semibold text-muted-foreground">WEDNESDAY <Badge variant="secondary" className="ml-2 rounded-sm">2 CLASSES</Badge></div>
                  <div className="grid md:grid-cols-2 gap-3">
                    <ClassPill title="Computer Networks" tag="core" color="bg-sky-600" />
                    <ClassPill title="AI Lab" tag="lab" color="bg-amber-500" />
                  </div>
                </div>

                <div>
                  <div className="mb-2 text-xs font-semibold text-muted-foreground">THURSDAY <Badge variant="secondary" className="ml-2 rounded-sm">2 CLASSES</Badge></div>
                  <div className="grid md:grid-cols-2 gap-3">
                    <ClassPill title="Operating Systems" tag="core" color="bg-sky-600" />
                    <ClassPill title="Project Work" tag="project" color="bg-violet-600" />
                  </div>
                </div>

                <div>
                  <div className="mb-2 text-xs font-semibold text-muted-foreground">FRIDAY <Badge variant="secondary" className="ml-2 rounded-sm">2 CLASSES</Badge></div>
                  <div id="today-classes" className="grid md:grid-cols-2 gap-3">
                    <ClassPill title="Algorithm Design" tag="core" color="bg-sky-600" />
                    <ClassPill title="Seminar" tag="special" color="bg-red-600" />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {stats.map((s) => (
                    <Card key={s.label} className="text-center">
                      <CardContent className="pt-6">
                        <div className={`text-2xl font-semibold ${s.color}`}>{s.value}</div>
                        <div className="text-xs text-muted-foreground">{s.label}</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="mt-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2"><Bell className="h-5 w-5 text-muted-foreground" /><CardTitle className="text-base">Notifications</CardTitle></div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {notifications.map((n) => (
                    <li key={n.id} className="rounded-md border p-3 flex items-start gap-3">
                      <span className="mt-1 h-2.5 w-2.5 rounded-full bg-primary" />
                      <div className="flex-1">
                        <div className="text-sm font-medium">{n.title}</div>
                        <div className="text-xs text-muted-foreground">{n.detail}</div>
                      </div>
                      <div className="text-xs text-muted-foreground whitespace-nowrap">{n.time}</div>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setNotifications([])}>Mark all as read</Button>
                  <Button size="sm" onClick={() => setNotifications(notificationsSeed)}>Reload demo</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </StudentLayout>
  );
}
