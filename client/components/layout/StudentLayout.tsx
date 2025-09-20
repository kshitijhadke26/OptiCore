import { PropsWithChildren, useEffect, useRef, useState } from "react";
import { LayoutDashboard, Bell, Calendar, LogOut, Mic, Volume2 } from "lucide-react";
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
    const synth = window.speechSynthesis;
    if (!synth) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1;
    utter.pitch = 1;
    synth.cancel();
    synth.speak(utter);
  } catch {}
}

export default function StudentLayout({ children }: PropsWithChildren) {
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
      const transcript = e.results[0][0].transcript.toLowerCase();
      const say = (t: string) => speak(t);

      // open timetable view
      if (/(open|show).*(timetable|schedule)|timetable view|show my timetable/.test(transcript)) {
        say("Opening your timetable view.");
        navigate("/dashboard/student/timetable");
        return;
      }

      // read notifications
      if (/read notification|read notifications|open notification/.test(transcript) || transcript.includes("notifications")) {
        navigate("/dashboard/student#notifications");
        const raw = localStorage.getItem("studentNotifications");
        const items = raw ? JSON.parse(raw) : (window as any).__studentNotifications || [];
        if (items && items.length) {
          const msg = items.slice(0, 3).map((n: any) => `${n.title}. ${n.detail}`).join(". ");
          say(`You have ${items.length} notifications. ${msg}`);
        } else {
          say("You have no new notifications.");
        }
        return;
      }

      if (transcript.includes("dashboard")) {
        navigate("/dashboard/student");
        say("Taking you to your dashboard.");
        return;
      }
    };
    recog.onend = () => setListening(false);
    recognitionRef.current = recog;
  }, [navigate]);

  const toggleListen = () => {
    const recog = recognitionRef.current;
    if (!recog) {
      alert("Voice recognition not supported in this browser. You can still click sections manually.");
      return;
    }
    if (listening) {
      recog.stop();
      setListening(false);
    } else {
      setListening(true);
      try { recog.start(); } catch {}
      speak("Listening. Say open timetable view or read notifications.");
    }
  };

  return (
    <SidebarProvider>
      <Sidebar className="bg-white">
        <SidebarHeader>
          <div className="px-2 py-1">
            <div className="text-sm font-semibold">Smart Classroom</div>
            <div className="text-xs text-muted-foreground">Welcome, Ajinkya Sultane</div>
            <div className="text-[10px] text-muted-foreground">STUDENT • COMPUTER SCIENCE</div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => navigate("/dashboard/student")}> 
                    <LayoutDashboard /> <span>Dashboard</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => navigate("/dashboard/student/timetable")}>
                    <Calendar /> <span>Timetable View</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => navigate("/dashboard/student#notifications")}>
                    <Bell /> <span>Notifications</span>
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
          <div className="text-lg font-semibold">Smart Classroom Scheduler</div>
          <div className="ml-auto flex items-center gap-2">
            <Button
              size="sm"
              onClick={toggleListen}
              className={`${listening ? "animate-pulse" : ""} rounded-full px-4 text-white border bg-[#079E74] hover:bg-[#068d67] focus-visible:ring-2 focus-visible:ring-[#079E74]/30 border-[#079E74]`}
            >
              <Mic className="h-4 w-4" /> {listening ? "Listening…" : "Voicely"}
            </Button>
          </div>
        </div>
        <div className="px-4 py-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
