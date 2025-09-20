import DashboardLayout from "@/components/layout/DashboardLayout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays } from "lucide-react";

function ClassBlock({ title, subtitle, time, color }: { title: string; subtitle: string; time: string; color: "blue" | "green" | "orange" }) {
  const palette = {
    blue: "bg-blue-100 text-blue-900",
    green: "bg-emerald-100 text-emerald-900",
    orange: "bg-amber-100 text-amber-900",
  } as const;
  return (
    <div className={`rounded-md px-4 py-3 ${palette[color]} flex items-center justify-between`}> 
      <div>
        <div className="text-sm font-medium leading-tight">{title}</div>
        <div className="text-xs opacity-80">{subtitle}</div>
      </div>
      <div className="text-xs opacity-80">{time}</div>
    </div>
  );
}

export default function DashboardFaculty() {
  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Faculty Dashboard</h1>
            <p className="text-muted-foreground">Welcome back Dr Tk Gawali • Mathematics Department</p>
          </div>
          <Badge variant="secondary" className="rounded-md">Teaching Load: 75%</Badge>
        </div>

        <Alert>
          <AlertDescription>
            You have <span className="font-medium">2</span> unread notifications.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="schedule" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="schedule">My Schedule</TabsTrigger>
            <TabsTrigger value="load">Teaching Load</TabsTrigger>
            <TabsTrigger value="leave">Leave Management</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>
          <TabsContent value="schedule" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="lg:col-span-2">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-base">Weekly Schedule</CardTitle>
                  </div>
                  <p className="text-sm text-muted-foreground">Your complete teaching and administrative schedule for this week</p>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div>
                    <div className="mb-2 text-xs font-semibold text-muted-foreground">MONDAY</div>
                    <div className="space-y-3">
                      <ClassBlock title="Data Structures" subtitle="Room: 101 • CS-A" time="09:00–10:00 • theory" color="blue" />
                      <ClassBlock title="Algorithm Lab" subtitle="Lab: 201 • CS-B" time="11:00–12:00 • lab" color="green" />
                      <ClassBlock title="Software Engineering" subtitle="Room: 103 • CS-A" time="14:00–15:00 • theory" color="blue" />
                    </div>
                  </div>
                  <div>
                    <div className="mb-2 text-xs font-semibold text-muted-foreground">TUESDAY</div>
                    <div className="space-y-3">
                      <ClassBlock title="Data Structures" subtitle="Room: 102 • CS-C" time="10:00–11:00 • theory" color="blue" />
                      <ClassBlock title="Research Guidance" subtitle="Faculty Room • PG" time="15:00–16:00 • guidance" color="orange" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Today's Classes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-md bg-muted p-3">
                    <div className="text-sm font-medium">10:00–11:00</div>
                    <div className="text-xs text-muted-foreground">Data Structures • Room-102</div>
                  </div>
                  <div className="rounded-md bg-muted p-3">
                    <div className="text-sm font-medium">15:00–16:00</div>
                    <div className="text-xs text-muted-foreground">Research Guidance • Faculty Room</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="load" className="mt-4">
            <Card><CardContent>Teaching load analytics will appear here.</CardContent></Card>
          </TabsContent>
          <TabsContent value="leave" className="mt-4">
            <Card><CardContent>Leave requests and approvals interface coming soon.</CardContent></Card>
          </TabsContent>
          <TabsContent value="notifications" className="mt-4">
            <Card><CardContent>No new notifications.</CardContent></Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
