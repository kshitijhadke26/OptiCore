import { PropsWithChildren, useEffect, useRef, useState } from "react";
import { LayoutDashboard, CalendarSearch, ClipboardCheck, Users, Building2, BarChart2, LogOut, Mic } from "lucide-react";
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

function speak(text: string) {
  try {
    const synth = window.speechSynthesis; if (!synth) return; const u = new SpeechSynthesisUtterance(text); synth.cancel(); synth.speak(u);
  } catch {}
}

export default function PrincipalLayout({ children }: PropsWithChildren) {
  const navigate = useNavigate();
  const [listening, setListening] = useState(false);
  const recRef = useRef<any>(null);

  useEffect(()=>{
    const SR: any = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SR) return;
    const rec = new SR(); rec.lang = 'en-US'; rec.continuous = true; rec.interimResults = false;
    rec.onerror = () => setListening(false);
    rec.onresult = (e:any)=>{
      const t = e.results[e.results.length-1][0].transcript.toLowerCase().trim();
      if (/workload .* (computer science|cs|it|information technology|physics|math|mathematics)/.test(t)){
        const m = t.match(/workload .* (computer science|cs|it|information technology|physics|math|mathematics)/);
        const dept = m?.[1] || 'cs';
        const map: Record<string,string> = { 'computer science':'cs','cs':'cs','it':'it','information technology':'it','physics':'phy','math':'math','mathematics':'math' };
        const d = map[dept] || 'cs';
        navigate(`/dashboard/principal/workload?dept=${d}`);
        speak('Opening faculty workload'); return;
      }
      if (/underutilized.*(classrooms|rooms)/.test(t)){
        navigate('/dashboard/principal/resources?filter=underutilized&period=week'); speak('Showing underutilized classrooms'); return;
      }
      if (/approved timetables.*(this|current) semester/.test(t) || /list all approved timetables/.test(t)){
        navigate('/dashboard/principal/timetables?status=approved'); speak('Listing approved timetables'); return;
      }
      if (/utilization report.*labs?/.test(t)){
        navigate('/dashboard/principal/resources?type=labs'); speak('Showing lab utilization'); return;
      }
      if (/open (timetable|department) view/.test(t)){
        navigate('/dashboard/principal/timetables'); speak('Opening department timetables'); return;
      }
    };
    recRef.current = rec;
  }, [navigate]);

  function toggleVoice(){
    const r = recRef.current;
    if (!r) { alert('Voice recognition not supported in this browser.'); return; }
    if (listening){ r.stop(); setListening(false); }
    else { try { r.start(); } catch {} setListening(true); speak('Listening for principal commands.'); }
  }

  return (
    <SidebarProvider>
      <Sidebar className="bg-white">
        <SidebarHeader>
          <div className="px-2 py-1">
            <div className="text-sm font-semibold">Smart Classroom</div>
            <div className="text-xs text-muted-foreground">Welcome, Principal</div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => navigate("/dashboard/principal")}>
                    <LayoutDashboard /> <span>Dashboard</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => navigate("/dashboard/principal/timetables")}>
                    <CalendarSearch /> <span>View Timetables</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => navigate("/dashboard/principal/approvals")}>
                    <ClipboardCheck /> <span>Approval Workflow</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => navigate("/dashboard/principal/workload")}>
                    <Users /> <span>Faculty Workload</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => navigate("/dashboard/principal/resources")}>
                    <Building2 /> <span>Resource Utilization</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => navigate("/dashboard/principal/reports")}>
                    <BarChart2 /> <span>Reports & Analytics</span>
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
          <div className="text-lg font-semibold">Principal Panel</div>
          <div className="ml-auto">
            <Button size="sm" onClick={toggleVoice} className={`${listening? 'animate-pulse':''} rounded-full px-4 text-white border bg-[#079E74] hover:bg-[#068d67] focus-visible:ring-2 focus-visible:ring-[#079E74]/30 border-[#079E74]`}>
              <Mic className="h-4 w-4" /> Voicely
            </Button>
          </div>
        </div>
        <div className="px-4 py-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
