import { PropsWithChildren, useEffect, useRef, useState } from "react";
import { BookOpen, Calendar, LayoutDashboard, LogOut, Moon, Sun, ClipboardList, Mic, Users } from "lucide-react";
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

function toggleTheme() {
  const root = document.documentElement;
  root.classList.toggle("dark");
}

function speak(text: string) {
  try {
    const synth = window.speechSynthesis;
    if (!synth) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1;
    utter.pitch = 1;
    synth.cancel();
    synth.speak(utter);
  } catch {}
}

export default function DashboardLayout({ children }: PropsWithChildren) {
  const navigate = useNavigate();
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const recog = new SR();
    recog.lang = "en-US";
    recog.continuous = true;
    recog.interimResults = false;
    recog.onerror = () => setListening(false);
    recog.onresult = (e: any) => {
      const transcript = e.results[e.results.length - 1][0].transcript.toLowerCase();
      // leave request: request for leave ...
      if (/request (for )?leave/.test(transcript)) {
        const reason = transcript.replace(/.*request (for )?leave\s*/,'').trim();
        navigate(`/dashboard/faculty/leave?reason=${encodeURIComponent(reason)}`);
        speak("Opening leave request");
        return;
      }
      // demand lecture
      if (/demand lecture|request .* lecture/.test(transcript)) {
        const reason = transcript.replace(/.*(demand lecture|request .* lecture)\s*/,'').trim();
        navigate(`/dashboard/faculty/demand-lecture?reason=${encodeURIComponent(reason)}`);
        speak("Opening demand lecture request");
        return;
      }
      // open attendance for year ... all present except ...
      const att = transcript.match(/(fill|mark).*?(first|1st|second|2nd|third|3rd|fourth|4th).*?year.*?(lab|lecture)?.*?(all present(?: except (.*))?)/);
      if (att) {
        const yearWord = att[2];
        const yearMap: Record<string,string> = { first:'1', '1st':'1', second:'2', '2nd':'2', third:'3', '3rd':'3', fourth:'4', '4th':'4' };
        const year = yearMap[yearWord] || '1';
        const except = att[5] ? encodeURIComponent(att[5]) : '';
        navigate(`/dashboard/faculty/attendance?year=${year}${except?`&absent=${except}`:''}`);
        speak(`Opening year ${year} attendance`);
        return;
      }
      if (/open timetable|generate timetable|timetable view|show timetable/.test(transcript)) {
        navigate('/dashboard/faculty/timetable');
        speak('Opening timetable view');
        return;
      }
    };
    recognitionRef.current = recog;
  }, [navigate]);

  const toggleListen = () => {
    const recog = recognitionRef.current;
    if (!recog) {
      alert('Voice recognition not supported in this browser.');
      return;
    }
    if (listening) {
      recog.stop();
      setListening(false);
    } else {
      setListening(true);
      try { recog.start(); } catch {}
      speak('Listening. You can say request leave, demand lecture, open timetable, or fill attendance.');
    }
  };

  return (
    <SidebarProvider>
      <Sidebar className="bg-white">
        <SidebarHeader>
          <div className="px-2 py-1">
            <div className="text-sm font-semibold">Smart Classroom</div>
            <div className="text-xs text-muted-foreground">Welcome, Dr Tk Gawali</div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => navigate("/dashboard/faculty")}> 
                    <LayoutDashboard /> <span>Dashboard</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => navigate('/dashboard/faculty/timetable')}>
                    <Calendar /> <span>Timetable View</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => navigate('/dashboard/faculty/schedule')}>
                    <BookOpen /> <span>My Schedule</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => navigate('/dashboard/faculty/attendance')}>
                    <Users /> <span>Attendance</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => navigate('/dashboard/faculty/leave')}>
                    <ClipboardList /> <span>Leave Management</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => navigate('/dashboard/faculty/demand-lecture')}>
                    <ClipboardList /> <span>Demand Lecture</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarSeparator />
        <SidebarFooter>
          <div className="flex items-center justify-between px-2">
            <Button variant="ghost" size="sm" onClick={toggleTheme} className="gap-1">
              <Sun className="h-4 w-4" /> / <Moon className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}> <LogOut className="h-4 w-4" /> Logout</Button>
          </div>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <div className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger />
          <div className="text-lg font-semibold">Smart Classroom Scheduler</div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/faculty/timetable')}>Generate My Schedule</Button>
            <Button size="sm" onClick={() => navigate('/dashboard/faculty/leave')}>Request Leave</Button>
            <Button size="sm" onClick={toggleListen} className={`${listening ? 'animate-pulse' : ''} rounded-full px-4 text-white border bg-[#079E74] hover:bg-[#068d67] focus-visible:ring-2 focus-visible:ring-[#079E74]/30 border-[#079E74]`}>
              <Mic className="h-4 w-4" /> Voicely
            </Button>
          </div>
        </div>
        <div className="px-4 py-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
