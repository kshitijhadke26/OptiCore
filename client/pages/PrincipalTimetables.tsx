import PrincipalLayout from "@/components/layout/PrincipalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect, useMemo, useState, Fragment } from "react";
import { Download, Eye, FileText, Printer } from "lucide-react";

interface TimetableData { 
  id: string; 
  year: string; 
  department: string;
  createdAt: number; 
  times: string[]; 
  plan: Record<string, any[]>; 
  conflicts: string[];
  status: 'approved' | 'pending' | 'rejected';
}

const DEPTS = ["All","Computer Science","Information Technology","Electronics Engg","Electrical Engg","Mechanical Engg","Civil Engg","Instrument"];
const YEARS = ["All","1","2","3","4"];
const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

export default function PrincipalTimetables(){
  const params = new URLSearchParams(window.location.search);
  const [dept, setDept] = useState(params.get('dept')? params.get('dept')!.toString(): 'All');
  const [year, setYear] = useState(params.get('year') || 'All');
  const [timetables, setTimetables] = useState<TimetableData[]>([]);
  const [fullScreenView, setFullScreenView] = useState<{data: TimetableData, index: number} | null>(null);

  useEffect(()=>{
    // Load actual generated timetables from Admin
    let adminTimetables: any[] = [];
    let hodDecisions: Record<string, { status: string }> = {};
    
    try { 
      adminTimetables = JSON.parse(localStorage.getItem('adminTimetables') || '[]'); 
    } catch {}
    
    try { 
      hodDecisions = JSON.parse(localStorage.getItem('hodDecisions') || '{}'); 
    } catch {}

    // Convert admin timetables to principal view format
    const convertedTimetables: TimetableData[] = adminTimetables.map((tt: any, index: number) => ({
      id: `plan-${String.fromCharCode(65 + index)}-${tt.year || '1'}`,
      year: tt.year || '1',
      department: tt.department || 'Computer Science',
      createdAt: tt.createdAt || Date.now(),
      times: tt.times || [],
      plan: tt.plan || {},
      conflicts: tt.conflicts || [],
      status: (hodDecisions[`plan-${String.fromCharCode(65 + index)}-${tt.year || '1'}`]?.status as any) || 'approved'
    }));

    // If no real timetables, create comprehensive sample data for all departments and years
    if (convertedTimetables.length === 0) {
      const generateComprehensiveTimetables = (): TimetableData[] => {
        const departments = ["Computer Science", "Information Technology", "Electronics Engg", "Electrical Engg", "Mechanical Engg", "Civil Engg"];
        const years = ["1", "2", "3", "4"];
        const times = ["09:00-10:00","10:00-11:00","11:00-12:00","12:00-13:00","13:00-13:30","13:30-14:30","14:30-15:30","15:30-16:30"];
        
        // Subject mappings for each department and year
        const subjectsByDeptYear: Record<string, Record<string, string[]>> = {
          "Computer Science": {
            "1": ["Mathematics", "Physics", "Chemistry", "Programming Fundamentals", "Computer Fundamentals", "English"],
            "2": ["Data Structures", "Database Systems", "Operating Systems", "Computer Networks", "Software Engineering", "Web Development"],
            "3": ["Algorithms", "Machine Learning", "Artificial Intelligence", "Compiler Design", "Computer Graphics", "Mobile Development"],
            "4": ["Project Management", "Cyber Security", "Cloud Computing", "Advanced AI", "Blockchain", "Industry Project"]
          },
          "Information Technology": {
            "1": ["Mathematics", "Physics", "IT Fundamentals", "Programming", "Digital Logic", "Communication Skills"],
            "2": ["Data Structures", "DBMS", "Computer Networks", "System Analysis", "Web Technologies", "Software Testing"],
            "3": ["Advanced Programming", "Network Security", "Data Mining", "Mobile Computing", "Cloud Technologies", "IT Project"],
            "4": ["Enterprise Systems", "Big Data", "IoT", "Advanced Security", "Industry Training", "Final Project"]
          },
          "Electronics Engg": {
            "1": ["Mathematics", "Physics", "Basic Electronics", "Circuit Analysis", "Digital Electronics", "Engineering Drawing"],
            "2": ["Analog Circuits", "Digital Systems", "Microprocessors", "Communication Systems", "Control Systems", "Electronic Devices"],
            "3": ["VLSI Design", "Embedded Systems", "Signal Processing", "Power Electronics", "Antenna Theory", "Project Work"],
            "4": ["Advanced VLSI", "Robotics", "Wireless Communication", "Industry Project", "Seminar", "Internship"]
          },
          "Electrical Engg": {
            "1": ["Mathematics", "Physics", "Basic Electrical", "Circuit Theory", "Electrical Machines", "Engineering Mechanics"],
            "2": ["Power Systems", "Control Systems", "Electrical Drives", "Power Electronics", "Instrumentation", "Electrical Design"],
            "3": ["High Voltage Engineering", "Renewable Energy", "Smart Grid", "Protection Systems", "Project", "Industrial Training"],
            "4": ["Advanced Power Systems", "Energy Management", "Electric Vehicles", "Final Project", "Seminar", "Industry Work"]
          },
          "Mechanical Engg": {
            "1": ["Mathematics", "Physics", "Engineering Mechanics", "Thermodynamics", "Material Science", "Workshop Technology"],
            "2": ["Fluid Mechanics", "Machine Design", "Manufacturing Processes", "Heat Transfer", "Dynamics", "CAD/CAM"],
            "3": ["Automobile Engineering", "Industrial Engineering", "Refrigeration", "Mechanical Vibrations", "Project", "Training"],
            "4": ["Advanced Manufacturing", "Robotics", "Renewable Energy", "Final Project", "Seminar", "Industry Project"]
          },
          "Civil Engg": {
            "1": ["Mathematics", "Physics", "Engineering Mechanics", "Building Materials", "Surveying", "Engineering Drawing"],
            "2": ["Structural Analysis", "Concrete Technology", "Fluid Mechanics", "Soil Mechanics", "Highway Engineering", "Environmental Engg"],
            "3": ["Steel Structures", "Foundation Engineering", "Water Resources", "Transportation", "Project Management", "Project Work"],
            "4": ["Advanced Structures", "Construction Management", "Urban Planning", "Final Project", "Seminar", "Industry Training"]
          }
        };

        const timetables: TimetableData[] = [];
        let planCounter = 0;

        departments.forEach(dept => {
          years.forEach(year => {
            const subjects = subjectsByDeptYear[dept]?.[year] || ["Subject 1", "Subject 2", "Subject 3", "Subject 4", "Subject 5", "Subject 6"];
            const plan: Record<string, any[]> = {};

            // Add recess breaks for all days
            DAYS.forEach(day => {
              plan[`${day}-13:00-13:30`] = [{ subject: "RECESS BREAK", room: "ALL", batch: 0 }];
            });

            // Fill timetable with maximum subjects - ensure comprehensive coverage
            let subjectIndex = 0;
            let roomCounter = 101;
            const nonRecessTimes = times.filter(t => t !== "13:00-13:30");
            const totalSlots = DAYS.length * nonRecessTimes.length;
            
            // Create a balanced distribution of lectures and practicals
            const subjectSchedule: Array<{subject: string, type: 'Lecture' | 'Practical', batch?: number}> = [];
            
            // Each subject should appear multiple times across the week
            subjects.forEach(subject => {
              const isLabSubject = subject.includes("Programming") || subject.includes("Lab") || subject.includes("Project") || 
                                 subject.includes("CAD") || subject.includes("Workshop") || subject.includes("Design") ||
                                 subject.includes("Practical") || subject.includes("Training");
              
              // Add lectures for all subjects
              subjectSchedule.push({ subject, type: 'Lecture' });
              
              // Add practicals for lab subjects with different batches
              if (isLabSubject) {
                subjectSchedule.push({ subject, type: 'Practical', batch: 1 });
                subjectSchedule.push({ subject, type: 'Practical', batch: 2 });
              } else {
                // Add additional lecture sessions for theory subjects
                subjectSchedule.push({ subject, type: 'Lecture' });
              }
            });
            
            // Repeat the schedule to fill all available slots
            while (subjectSchedule.length < totalSlots) {
              subjects.forEach(subject => {
                if (subjectSchedule.length < totalSlots) {
                  subjectSchedule.push({ subject, type: 'Lecture' });
                }
              });
            }
            
            // Distribute subjects across the timetable
            let scheduleIndex = 0;
            DAYS.forEach(day => {
              nonRecessTimes.forEach(time => {
                if (scheduleIndex < subjectSchedule.length) {
                  const scheduleItem = subjectSchedule[scheduleIndex];
                  
                  if (scheduleItem.type === 'Practical') {
                    plan[`${day}-${time}`] = [{
                      subject: scheduleItem.subject,
                      room: `Lab${Math.floor(roomCounter/20) + 1}`,
                      batch: scheduleItem.batch || 1,
                      subjectType: "Practical"
                    }];
                  } else {
                    plan[`${day}-${time}`] = [{
                      subject: scheduleItem.subject,
                      room: `${roomCounter}`,
                      batch: 0,
                      subjectType: "Lecture"
                    }];
                  }
                  
                  scheduleIndex++;
                  roomCounter++;
                  if (roomCounter > 299) roomCounter = 101;
                }
              });
            });

            timetables.push({
              id: `plan-${String.fromCharCode(65 + planCounter)}-${year}`,
              year,
              department: dept,
              createdAt: Date.now() - (planCounter * 3600000), // Stagger creation times
              times,
              plan,
              conflicts: [],
              status: 'approved'
            });
            
            planCounter++;
          });
        });

        return timetables;
      };

      const comprehensiveTimetables = generateComprehensiveTimetables();
      setTimetables(comprehensiveTimetables);
    } else {
      setTimetables(convertedTimetables);
    }
  },[]);

  const filtered = useMemo(()=>{
    let list = timetables.filter(t => t.status === 'approved');
    if (year !== 'All') list = list.filter(t => t.year === year);
    if (dept !== 'All') list = list.filter(t => t.department === dept);
    return list;
  }, [timetables, year, dept]);

  function exportCSV(timetable: TimetableData){
    const rows = ["Day,Time,Subject,Room,Batch,Type"];
    for (const d of DAYS) {
      for (const t of timetable.times) {
        const key = `${d}-${t}`;
        const vals = timetable.plan[key] || [];
        if (vals.length) {
          vals.forEach(v => {
            const batchDisplay = v.batch === 0 ? 'All Batches' : `Batch ${v.batch}`;
            rows.push(`${d},${t},${v.subject},${v.room},${batchDisplay},${v.subjectType || 'N/A'}`);
          });
        }
      }
    }
    const blob = new Blob([rows.join("\n")], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timetable-${timetable.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportDOC(timetable: TimetableData){
    const html = [`<html><body><h2>Timetable - ${timetable.department} Year ${timetable.year}</h2><table border=1 cellspacing=0 cellpadding=4><tr><th>Time</th>${DAYS.map(d=>`<th>${d}</th>`).join('')}</tr>`];
    for (const t of timetable.times){
      html.push(`<tr><td>${t}</td>`);
      for (const d of DAYS){
        const key = `${d}-${t}`;
        const vals = timetable.plan[key] || [];
        const cellContent = vals.map(v => {
          if (v.subject === "RECESS BREAK") return "🍽️ RECESS BREAK";
          const batchDisplay = v.batch === 0 ? 'All Batches' : `Batch ${v.batch}`;
          const icon = v.subjectType === 'Practical' ? '🧪' : '📚';
          return `${icon} ${v.subject}<br/>Room: ${v.room}<br/>${batchDisplay}`;
        }).join('<br/><br/>');
        html.push(`<td>${cellContent}</td>`);
      }
      html.push(`</tr>`);
    }
    html.push(`</table></body></html>`);
    const blob = new Blob([html.join('')], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timetable-${timetable.id}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function openFullScreen(timetable: TimetableData, index: number) {
    setFullScreenView({ data: timetable, index });
  }

  function closeFullScreenView() {
    setFullScreenView(null);
  }

  return (
    <PrincipalLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Department Timetables</h1>
            <p className="text-muted-foreground">
              Filter and export approved schedules • {filtered.length} timetable{filtered.length !== 1 ? 's' : ''} found
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <select className="border rounded-md px-2 py-1" value={dept} onChange={e=>setDept(e.target.value)}>
              {DEPTS.map(d=> <option key={d} value={d}>{d}</option>)}
            </select>
            <select className="border rounded-md px-2 py-1" value={year} onChange={e=>setYear(e.target.value)}>
              {YEARS.map(d=> <option key={d} value={d}>Year {d}</option>)}
            </select>
          </div>
        </div>

        {/* Summary Statistics */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{timetables.length}</div>
                <div className="text-sm text-muted-foreground">Total Timetables</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {new Set(timetables.map(t => t.department)).size}
                </div>
                <div className="text-sm text-muted-foreground">Departments</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {new Set(timetables.map(t => t.year)).size}
                </div>
                <div className="text-sm text-muted-foreground">Year Levels</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">100%</div>
                <div className="text-sm text-muted-foreground">Coverage</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          {filtered.length === 0 && (
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No approved timetables match the selected filters.</p>
                  <p className="text-sm mt-2">Try adjusting the department or year filters.</p>
                </div>
              </CardContent>
            </Card>
          )}
          
          {filtered.map((timetable, index) => (
            <Card key={timetable.id} className="overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {timetable.department} - Year {timetable.year}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Plan {timetable.id.split('-')[1]} • Generated {new Date(timetable.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openFullScreen(timetable, index)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => exportCSV(timetable)}>
                      <Download className="h-4 w-4 mr-2" />
                      CSV
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => exportDOC(timetable)}>
                      <FileText className="h-4 w-4 mr-2" />
                      Word
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => window.print()}>
                      <Printer className="h-4 w-4 mr-2" />
                      Print
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Compact Timetable Preview */}
                <div className="overflow-x-auto">
                  <div className="grid gap-1 min-w-[800px]" style={{ gridTemplateColumns: `100px repeat(${timetable.times.length}, 1fr)` }}>
                    {/* Header */}
                    <div className="text-xs p-2 font-medium bg-gray-100 border">Day</div>
                    {timetable.times.map(t => (
                      <div key={t} className="text-xs p-2 text-center font-medium bg-gray-100 border">
                        {t}
                      </div>
                    ))}
                    
                    {/* Body */}
                    {DAYS.map(d => (
                      <Fragment key={d}>
                        <div className="text-xs p-2 font-medium bg-gray-50 border">{d}</div>
                        {timetable.times.map(t => {
                          const key = `${d}-${t}`;
                          const vals = timetable.plan[key] || [];
                          const hasRecessBreak = vals.some(v => v.subject === "RECESS BREAK");
                          
                          const displayVals = hasRecessBreak ? 
                            vals.filter(v => v.subject === "RECESS BREAK") : 
                            vals.filter(v => v.subject !== "RECESS BREAK");
                          
                          return (
                            <div key={key} className={`p-1 border text-xs ${
                              hasRecessBreak ? 'bg-orange-100 border-orange-300' : 
                              displayVals.length > 0 ? (displayVals.some(v => v.subjectType === 'Practical') ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200') : 
                              'bg-gray-50'
                            }`}>
                              <div className="space-y-1">
                                {displayVals.length === 0 ? (
                                  <div className="text-center text-gray-400 text-xs">Empty</div>
                                ) : (
                                  displayVals.map((v, i) => (
                                    <div key={i} className={hasRecessBreak ? 'text-orange-700 font-medium text-center' : (v.subjectType === 'Practical' ? 'text-green-700' : 'text-blue-700')}>
                                      {v.subject === "RECESS BREAK" ? "🍽️" : (
                                        <div className="space-y-0.5">
                                          <div className="font-medium flex items-center gap-1">
                                            {v.subjectType === 'Practical' ? '🧪' : '📚'}
                                            <span className="text-xs">{v.subjectType === 'Practical' ? 'P' : 'L'}</span>
                                          </div>
                                          <div className="text-[9px]">{v.subject}</div>
                                          <div className="text-[8px] text-muted-foreground">
                                            R-{v.room} {v.batch === 0 ? 'All' : `B${v.batch}`}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ))
                                )}
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
          ))}
        </div>

        {/* Full Screen Modal */}
        {fullScreenView && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full h-full max-w-7xl max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-xl font-semibold">
                  {fullScreenView.data.department} - Year {fullScreenView.data.year} Timetable
                </h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => exportCSV(fullScreenView.data)}>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                  <Button variant="outline" onClick={closeFullScreenView}>Close</Button>
                </div>
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
                    {DAYS.map((d) => (
                      <Fragment key={d}>
                        <div className="text-sm p-2 font-medium bg-gray-50 border">{d}</div>
                        {fullScreenView.data.times.map((t: string) => {
                          const key = `${d}-${t}`;
                          const vals = fullScreenView.data.plan[key] || [];
                          const hasRecessBreak = vals.some((v: any) => v.subject === "RECESS BREAK");
                          
                          const displayVals = hasRecessBreak ? 
                            vals.filter((v: any) => v.subject === "RECESS BREAK") : 
                            vals.filter((v: any) => v.subject !== "RECESS BREAK");
                          
                          return (
                            <div key={key} className={`p-2 border min-h-[100px] ${
                              hasRecessBreak ? 'bg-orange-100 border-orange-300' : 
                              displayVals.length > 0 ? (displayVals.some((v: any) => v.subjectType === 'Practical') ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200') : 
                              'bg-gray-50'
                            }`}>
                              <div className="text-sm space-y-2">
                                {displayVals.length === 0 ? (
                                  <div className="text-center text-gray-400 text-xs">Empty</div>
                                ) : (
                                  displayVals.map((v: any, i: number) => (
                                    <div key={i} className={`p-2 rounded ${hasRecessBreak ? 'text-orange-700 font-medium bg-orange-200' : (v.subjectType === 'Practical' ? 'text-green-700 bg-green-100' : 'text-blue-700 bg-blue-100')}`}>
                                      {v.subject === "RECESS BREAK" ? "🍽️ RECESS BREAK" : (
                                        <div className="space-y-1">
                                          <div className="font-medium flex items-center gap-2">
                                            {v.subjectType === 'Practical' ? '🧪' : '📚'}
                                            <span className="text-xs px-2 py-1 rounded bg-white bg-opacity-70">
                                              {v.subjectType === 'Practical' ? 'PRACTICAL' : 'LECTURE'}
                                            </span>
                                            <span className="font-semibold">{v.subject}</span>
                                          </div>
                                          <div className="text-sm text-gray-600">
                                            <div>Room: {v.room}</div>
                                            <div>{v.batch === 0 ? 'All Batches' : `Batch ${v.batch}`}</div>
                                            {v.faculty && <div>Faculty: {v.faculty}</div>}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ))
                                )}
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
    </PrincipalLayout>
  );
}
