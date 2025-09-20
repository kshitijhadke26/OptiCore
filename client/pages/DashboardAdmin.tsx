import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function DashboardAdmin() {
  const [notifications, setNotifications] = useState<any[]>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("adminNotifications");
      setNotifications(raw ? JSON.parse(raw) : []);
    } catch {
      setNotifications([]);
    }
  }, []);

  const roomData = useMemo(() => [
    { name: "Room 102", value: 85 },
    { name: "Lab 202", value: 90 },
    { name: "Room 210", value: 78 },
    { name: "Seminar Hall", value: 55 },
    { name: "Room 305", value: 72 },
  ], []);

  const pieData = useMemo(() => [
    { name: "Optimal Load", value: 65, color: "#22c55e" },
    { name: "Underutilized", value: 15, color: "#f59e0b" },
    { name: "Overloaded", value: 20, color: "#ef4444" },
  ], []);

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
            <p className="text-muted-foreground">System-wide timetable management and insights</p>
          </div>
        </div>

        <Alert className="bg-emerald-50 border-emerald-200 text-emerald-900">
          <AlertDescription className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" /> System Status: Conflict-Free — All timetables are automatically optimized and conflict-free
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Pending Timetables</CardTitle></CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{(JSON.parse(localStorage.getItem('ttSubmissions')||'[]') as any[]).filter(x=>x.status==='sent').length}</div>
              <p className="text-xs text-muted-foreground">awaiting HOD review</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Faculties</CardTitle></CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">48</div>
              <p className="text-xs text-muted-foreground">active</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Students</CardTitle></CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">612</div>
              <p className="text-xs text-muted-foreground">across all years</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Room Utilization</CardTitle></CardHeader>
            <CardContent>
              <div className="text-lg font-medium">72%</div>
              <Progress value={72} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Room Utilization Analysis</CardTitle></CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roomData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <ReTooltip />
                  <Bar dataKey="value" fill="#3b82f6" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Faculty Workload Distribution</CardTitle></CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={80} paddingAngle={4}>
                    {pieData.map((e, i) => (
                      <Cell key={i} fill={e.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                {pieData.map((p) => (
                  <div key={p.name} className="flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: p.color }} /> {p.name} {p.value}%
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Recent Notifications</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {notifications.length === 0 && <div className="text-sm text-muted-foreground">No notifications yet.</div>}
              {notifications.slice(0,5).map(n => (
                <div key={n.id} className="flex items-center justify-between border rounded-md px-3 py-2">
                  <div>
                    <div className="text-sm font-medium">{n.title}</div>
                    <div className="text-xs text-muted-foreground">{n.detail || n.time || ''}</div>
                  </div>
                  <Badge variant="secondary">new</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
