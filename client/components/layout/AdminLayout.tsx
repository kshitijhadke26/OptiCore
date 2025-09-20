import { PropsWithChildren } from "react";
import { LayoutDashboard, UploadCloud, CalendarCog, ClipboardCheck, Users, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

export default function AdminLayout({ children }: PropsWithChildren) {
  const navigate = useNavigate();
  return (
    <SidebarProvider>
      <Sidebar className="bg-white">
        <SidebarHeader>
          <div className="px-2 py-1">
            <div className="text-sm font-semibold">Smart Classroom</div>
            <div className="text-xs text-muted-foreground">Welcome, Admin</div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => navigate("/dashboard/admin")}>
                    <LayoutDashboard /> <span>Dashboard</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => navigate("/dashboard/admin/import")}>
                    <UploadCloud /> <span>Import Data</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => navigate("/dashboard/admin/generate")}>
                    <CalendarCog /> <span>Generate Timetable</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => navigate("/dashboard/admin/review")}>
                    <ClipboardCheck /> <span>Review & Approval</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => navigate("/dashboard/admin/users")}>
                    <Users /> <span>User Management</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarSeparator />
        <SidebarFooter>
          <div className="flex items-center justify-between px-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}> <LogOut className="h-4 w-4" /> Logout</Button>
          </div>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <div className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger />
          <div className="text-lg font-semibold">Admin Panel</div>
        </div>
        <div className="px-4 py-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
