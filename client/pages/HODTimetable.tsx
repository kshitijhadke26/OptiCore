import HODLayout from "@/components/layout/HODLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useState, Fragment, useMemo } from "react";
import { Eye, Download, FileText, Calendar, Users, Clock } from "lucide-react";

type Slot = { subject: string; room: string; batch: number; faculty?: string; subjectType?: 'Lecture'|'Practical' };

export default function HODTimetable(){
  const [year, setYear] = useState("1");
  const [show, setShow] = useState(false);
  const [fullScreenView, setFullScreenView] = useState<{data: any, index: number} | null>(null);

  const data = (()=>{
    try{
      const subs = JSON.parse(localStorage.getItem('ttSubmissions')||'[]') as any[];
      const list = subs.filter((s:any)=> s.year===year);
      const map = JSON.parse(localStorage.getItem('hodApprovedByYear')||'{}') as Record<string,string>;
      const approvedId = map[year];
      if (approvedId){
        const found = list.find((s:any)=> s.id===approvedId);
        if (found) return found;
      }
      const decisions = JSON.parse(localStorage.getItem('hodDecisions')||'{}') as Record<string, any>;
      const anyApproved = list.find(s=> decisions[s.id]?.status==='approved');
      return anyApproved || null;
    }catch{return null;}
  })();

  const days = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

  const stats = useMemo(() => {
    if (!data) return null;
    
    const totalSlots = data.times.length * days.length;
    const filledSlots = Object.values(data.plan as Record<string, Slot[]>).reduce((acc, slots) => {
      return acc + (slots.filter(slot => slot.subject !== "RECESS BREAK").length > 0 ? 1 : 0);
    }, 0);
    
    const subjects = new Set<string>();
    const rooms = new Set<string>();
    const faculty = new Set<string>();
    
    Object.values(data.plan as Record<string, Slot[]>).forEach(slots => {
      slots.forEach(slot => {
        if (slot.subject !== "RECESS BREAK") {
          subjects.add(slot.subject);
          rooms.add(slot.room);
          if (slot.faculty) faculty.add(slot.faculty);
        }
      });
    });
    
    return {
      utilization: Math.round((filledSlots / totalSlots) * 100),
      subjects: subjects.size,
      rooms: rooms.size,
      faculty: faculty.size,
      totalSlots,
      filledSlots
    };
  }, [data]);

  function exportCSV() {
    if (!data) return;
    const rows = ["Day,Time,Subject,Room,Batch,Faculty,Type"];
    
    for (const day of days) {
      for (const time of data.times) {
        const key = `${day}-${time}`;
        const slots = data.plan[key] || [];
        
        if (slots.length === 0) {
          rows.push(`${day},${time},,,,,"Empty Slot"`);
        } else {
          slots.forEach((slot: Slot) => {
            rows.push(`${day},${time},"${slot.subject}","${slot.room}",${slot.batch === 0 ? 'All Batches' : `Batch ${slot.batch}`},"${slot.faculty || 'TBD'}","${slot.subjectType || 'Lecture'}"`);
          });
        }
      }
    }
    
    const blob = new Blob([rows.join("\n")], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hod-timetable-year-${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function openFullScreenView() {
    if (data) {
      setFullScreenView({ data, index: 0 });
    }
  }

  function closeFullScreenView() {
    setFullScreenView(null);
  }

  return (
    <HODLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Department Timetable View</h1>
            <p className="text-muted-foreground">View approved timetables for your department</p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span>Academic Year</span>
            <Select value={year} onValueChange={(v)=>{ setYear(v); setShow(false); }}>
              <SelectTrigger className="w-20">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="4">4</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={()=> setShow(true)} className="bg-[#079E74] hover:bg-[#068d67] text-white">
              <Eye className="h-4 w-4 mr-2" />
              View Timetable
            </Button>
          </div>
        </div>

        {show && !data && (
          <Card>
            <CardContent className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Approved Timetable</h3>
              <p className="text-muted-foreground mb-4">
                No HOD-approved timetable found for Year {year}. 
              </p>
              <Button variant="outline" onClick={() => window.location.href = '/hod-review'}>
                Go to Review & Approvals
              </Button>
            </CardContent>
          </Card>
        )}

        {show && data && (
          <>
            {/* Statistics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Utilization</p>
                      <p className="text-lg font-semibold">{stats?.utilization}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <FileText className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Subjects</p>
                      <p className="text-lg font-semibold">{stats?.subjects}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Users className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Faculty</p>
                      <p className="text-lg font-semibold">{stats?.faculty}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Clock className="h-4 w-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Time Slots</p>
                      <p className="text-lg font-semibold">{data.times.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-red-100 rounded-lg flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Days</p>
                      <p className="text-lg font-semibold">{days.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Timetable Display */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Year {year} Approved Timetable</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={exportCSV}>
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </Button>
                    <Button variant="outline" size="sm" onClick={openFullScreenView}>
                      <Eye className="h-4 w-4 mr-2" />
                      Full Screen
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <div className="grid" style={{ gridTemplateColumns: `100px repeat(${data.times.length}, 1fr)` }}>
                    {/* Header row with time slots */}
                    <div className="text-[11px] p-1 font-medium">Day</div>
                    {data.times.map((t: string) => (
                      <div key={t} className="text-[11px] p-1 text-center font-medium border-b">
                        {t}
                      </div>
                    ))}
                    
                    {/* Rows for each day */}
                    {days.map((d) => (
                      <Fragment key={d}>
                        <div className="text-[11px] p-1 border-r font-medium bg-gray-50">{d}</div>
                        {data.times.map((t: string) => {
                          const key = `${d}-${t}`;
                          const slots = (data.plan[key] || []) as Slot[];
                          const isRecess = slots.some(slot => slot.subject === "RECESS BREAK");
                          
                          return (
                            <div key={key} className={`p-1 border text-center ${
                              isRecess ? 'bg-orange-100' : 
                              slots.length > 0 ? (slots[0].subjectType === 'Practical' ? 'bg-green-100' : 'bg-blue-100') : 
                              'bg-gray-50'
                            }`}>
                              <div className="text-[10px] space-y-1">
                                {slots.map((slot, i) => (
                                  <div key={i} className="leading-tight">
                                    {slot.subject === "RECESS BREAK" ? (
                                      <span className="font-medium">🍽️ RECESS</span>
                                    ) : (
                                      <>
                                        <div className="font-medium">
                                          {slot.subjectType === 'Practical' ? '🧪' : '📚'} {slot.subject}
                                        </div>
                                        <div className="text-[9px] text-muted-foreground">
                                          R-{slot.room} • {slot.batch === 0 ? 'All Batches' : `Batch ${slot.batch}`}
                                        </div>
                                        {slot.faculty && (
                                          <div className="text-[8px] text-muted-foreground">{slot.faculty}</div>
                                        )}
                                      </>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </Fragment>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Full Screen Modal */}
        {fullScreenView && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full h-full max-w-7xl max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-xl font-semibold">Year {year} Timetable - Full View</h2>
                <Button variant="outline" onClick={closeFullScreenView}>Close</Button>
              </div>
              <div className="p-4 overflow-auto h-full">
                <div className="overflow-x-auto">
                  <div className="grid gap-1" style={{ gridTemplateColumns: `120px repeat(${fullScreenView.data.times.length}, 1fr)` }}>
                    {/* Header */}
                    <div className="text-sm p-2 font-medium bg-gray-100 border">Day</div>
                    {fullScreenView.data.times.map((t: string) => (
                      <div key={t} className="text-sm p-2 text-center font-medium bg-gray-100 border">
                        {t}
                      </div>
                    ))}
                    
                    {/* Body */}
                    {days.map((d) => (
                      <Fragment key={d}>
                        <div className="text-sm p-2 font-medium bg-gray-50 border">{d}</div>
                        {fullScreenView.data.times.map((t: string) => {
                          const key = `${d}-${t}`;
                          const slots = (fullScreenView.data.plan[key] || []) as Slot[];
                          const isRecess = slots.some(slot => slot.subject === "RECESS BREAK");
                          
                          return (
                            <div key={key} className={`p-2 border ${
                              isRecess ? 'bg-orange-100' : 
                              slots.length > 0 ? (slots[0].subjectType === 'Practical' ? 'bg-green-100' : 'bg-blue-100') : 
                              'bg-gray-50'
                            }`}>
                              <div className="text-sm space-y-2">
                                {slots.map((slot, i) => (
                                  <div key={i} className="p-2 bg-white rounded border">
                                    {slot.subject === "RECESS BREAK" ? (
                                      <div className="text-center font-medium text-orange-700">
                                        🍽️ RECESS BREAK
                                      </div>
                                    ) : (
                                      <>
                                        <div className="font-medium text-gray-900">
                                          {slot.subjectType === 'Practical' ? '🧪' : '📚'} {slot.subject}
                                        </div>
                                        <div className="text-sm text-gray-600">
                                          Room: {slot.room}
                                        </div>
                                        <div className="text-sm text-gray-600">
                                          {slot.batch === 0 ? 'All Batches' : `Batch ${slot.batch}`}
                                        </div>
                                        {slot.faculty && (
                                          <div className="text-sm text-gray-600">
                                            Faculty: {slot.faculty}
                                          </div>
                                        )}
                                        <div className="text-xs text-gray-500 mt-1">
                                          {slot.subjectType || 'Lecture'}
                                        </div>
                                      </>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </Fragment>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </HODLayout>
  );
}
