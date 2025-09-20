import HODLayout from "@/components/layout/HODLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2 } from "lucide-react";
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

const roomData = [
  { name: "Room 102", value: 85 },
  { name: "Lab 202", value: 90 },
  { name: "Lab 202", value: 78 },
  { name: "Seminar Hall", value: 55 },
  { name: "Room 305", value: 72 },
];

const pieData = [
  { name: "Optimal Load", value: 65, color: "#22c55e" },
  { name: "Underutilized", value: 15, color: "#f59e0b" },
  { name: "Overloaded", value: 20, color: "#ef4444" },
];

export default function DashboardHOD() {
  return (
    <HODLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">HOD Dashboard</h1>
            <p className="text-muted-foreground">Year-wise timetable management and approval</p>
          </div>
        </div>

        <Alert className="bg-emerald-50 border-emerald-200 text-emerald-900">
          <AlertDescription className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" /> System Status: Conflict-Free — All timetables are automatically optimized and conflict-free
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="review">Review & Approve</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Pending Timetables</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-3xl font-semibold">2</div>
                  <p className="text-xs text-muted-foreground">+2 since yesterday</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Faculty Load Balance</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2"><div className="text-lg font-medium">0%</div></div>
                  <Progress value={0} className="mt-2" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Room Utilization</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-lg font-medium">0%</div>
                  <p className="text-xs text-muted-foreground">+5% from last week</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Conflicts</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-3xl font-semibold">0</div>
                  <p className="text-xs text-muted-foreground">2 critical, 1 medium</p>
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
          </TabsContent>

          <TabsContent value="analytics" className="mt-4">
            <Card><CardContent>Advanced analytics coming soon.</CardContent></Card>
          </TabsContent>
          <TabsContent value="review" className="mt-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Recent Timetable Submissions</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm text-muted-foreground">Latest timetables submitted for review and approval</div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-xs">Filter Year</span>
                    <select className="border rounded-md px-2 py-1" defaultValue="all" onChange={(e)=>localStorage.setItem('hodFilterYear', e.target.value)}>
                      <option value="all">All</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                    </select>
                  </div>
                </div>
                <div className="overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-muted-foreground">
                      <tr>
                        <th className="py-2">Year</th>
                        <th className="py-2">Semester</th>
                        <th className="py-2">Status</th>
                        <th className="py-2">Score</th>
                        <th className="py-2">Submitted By</th>
                        <th className="py-2">Date</th>
                        <th className="py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[{yearLabel:'Year 1', sem:'Spring 2025', status:'pending', score:'92/100', by:'Dr. Smith', date:'01/09/2024', year: '1'}, {yearLabel:'Year 2', sem:'Spring 2025', status:'approved', score:'88/100', by:'Prof. Johnson', date:'30/08/2024', year:'2'}, {yearLabel:'Year 3', sem:'Fall 2024', status:'revision', score:'75/100', by:'Dr. Wilson', date:'28/08/2024', year:'3'}].map((r) => (
                        <tr key={r.yearLabel} className="border-t">
                          <td className="py-2 font-medium">{r.yearLabel}</td>
                          <td className="py-2">{r.sem}</td>
                          <td className="py-2"><span className={`text-xs font-medium px-2 py-0.5 rounded-full ${r.status==='approved'?'bg-emerald-100 text-emerald-800': r.status==='pending'?'bg-amber-100 text-amber-800':'bg-rose-100 text-rose-800'}`}>{r.status}</span></td>
                          <td className="py-2">{r.score}</td>
                          <td className="py-2">{r.by}</td>
                          <td className="py-2">{r.date}</td>
                          <td className="py-2 flex gap-2"><a className="px-2 py-1 border rounded-md" href={`/dashboard/hod/review?year=${r.year}`}>View</a> <a className="px-2 py-1 rounded-md bg-black text-white" href={`/dashboard/hod/review?year=${r.year}`}>Review</a></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </HODLayout>
  );
}
