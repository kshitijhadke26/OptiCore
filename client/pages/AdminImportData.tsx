import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DaySelector } from "@/components/ui/DaySelector";
import { CheckCircle, AlertCircle, Upload, FileText } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Subject = { name: string; perWeek: number; perDay?: number; facultyCount?: number; type?: 'Lecture'|'Practical'; sessionLength?: number; facultyNames?: string[] };

type FixedSlot = { subject: string; selectedDays: string[]; time?: string; allDay?: boolean; room?: string; batch?: number };

type RecessBreak = { selectedDays: string[]; start: string; end: string };

type Config = {
  year: string;
  classrooms: number;
  batches: number;
  subjects: Subject[];
  maxPerDay: number;
  avgFacultyLeaves: number;
  fixedSlots: FixedSlot[];
  recess: RecessBreak[];
  sourceFiles: { name: string; type: string }[];
  collegeStartTime: string;
  collegeEndTime: string;
  sessionDuration: number;
};

const days = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

function loadConfig(year: string): Config | null {
  try {
    const raw = localStorage.getItem(`adminTTConfig:${year}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function AdminImportData(){
  const [year, setYear] = useState("1");
  const [mappingPreview, setMappingPreview] = useState<{detected: string[], mapped: Record<string, string>} | null>(null);
  const [cfg, setCfg] = useState<Config>(() => loadConfig("1") || {
    year: "1",
    classrooms: 10,
    batches: 2,
    subjects: [
      { name: "Mathematics", perWeek: 3, perDay: 1, facultyCount: 3, type:'Lecture', sessionLength:60 },
      { name: "Physics", perWeek: 2, perDay: 1, facultyCount: 2, type:'Lecture', sessionLength:60 },
      { name: "Programming", perWeek: 3, perDay: 1, facultyCount: 4, type:'Practical', sessionLength:120 },
    ],
    maxPerDay: 5,
    avgFacultyLeaves: 1,
    fixedSlots: [],
    recess: [],
    sourceFiles: [],
    collegeStartTime: "09:00",
    collegeEndTime: "17:00",
    sessionDuration: 60,
  });

  useEffect(()=>{
    const existing = loadConfig(year);
    if (existing) setCfg(existing);
    else setCfg((c)=>({ ...c, year }));
  }, [year]);

  function parseCSV(text:string){
    const rows = text.split(/\r?\n/).map(r=>r.trim()).filter(Boolean);
    if (rows.length===0) return;
    const normalize = (s:string)=> s.toLowerCase().replace(/[^a-z0-9]+/g,'');
    const headerCols = rows[0].split(',').map(s=> s.replace(/^\"|\"$/g,'').trim());
    const headerMap: Record<string, number> = {};
    const synonyms: Record<string,string[]> = {
      name: ['subject','name','subjectname','course','coursename','module'],
      perWeek: ['classesweek','perweek','classesperweek','periodsweek','periodsperweek','weekly','weeklyperiods'],
      perDay: ['maxday','perday','maxperday','dailymax','maxdaily'],
      facultyCount: ['faculties','faculty','teachers','teachercount','instructors','staff','staffcount'],
      facultyNames: ['facultyname','facultynames','teacher','teachers','instructor','instructors','staffnames','assignedto'],
      type: ['type','kind','classtype','category','lectureorpractical','mode','sessiontype'],
      duration: ['duration','length','sessionlength','time','minutes','hours']
    };
    
    // Enhanced mapping with better detection
    const mappedFields: Record<string, string> = {};
    headerCols.forEach((h,idx)=>{
      const key = normalize(h);
      for (const [field, syns] of Object.entries(synonyms)){
        if (syns.includes(key)) {
          headerMap[field] = idx;
          mappedFields[field] = h;
        }
      }
      if (!("name" in headerMap) && key==='subject') {
        headerMap.name = idx;
        mappedFields.name = h;
      }
    });
    
    // Set mapping preview for user feedback
    setMappingPreview({
      detected: headerCols,
      mapped: mappedFields
    });
    
    const hasHeader = Object.keys(headerMap).length>0;

    const subjects: Subject[] = [];
    const start = hasHeader? 1: 0;
    for (let i=start;i<rows.length;i++){
      const cols = rows[i].split(',').map(s=> s.replace(/^\"|\"$/g,'').trim());
      const name = hasHeader? cols[headerMap.name ?? 0] : cols[0];
      if (!name) continue;
      const get = (idx:number|undefined, fallbackIndex:number|undefined)=>{
        if (hasHeader && idx!=null) return cols[idx];
        return fallbackIndex!=null? cols[fallbackIndex]: undefined;
      };
      const perWeekRaw = get(headerMap.perWeek, 1);
      const perDayRaw = get(headerMap.perDay, 2);
      const facultyCntRaw = get(headerMap.facultyCount, 3);
      const typeRaw = get(headerMap.type, undefined);
      const durationRaw = get(headerMap.duration, undefined);
      const facultyNamesRaw = get(headerMap.facultyNames, undefined);
      const perWeek = perWeekRaw? Number(perWeekRaw): 2;
      const perDay = perDayRaw? Number(perDayRaw): 1;
      const facultyCount = facultyCntRaw? Number(facultyCntRaw): undefined;
      const type = typeRaw? (/prac/i.test(typeRaw)? 'Practical':'Lecture') as 'Lecture'|'Practical' : undefined;
      const sessionLength = durationRaw? (/120|2h|2hr|2 hours/i.test(durationRaw)?120:60) : (type==='Practical'?120:60);
      const facultyNames = facultyNamesRaw? facultyNamesRaw.split(/;|\||,|\//).map(s=>s.trim()).filter(Boolean): undefined;
      subjects.push({ name, perWeek: isNaN(perWeek)?2:perWeek, perDay: isNaN(perDay)?1:perDay, facultyCount, type, sessionLength, facultyNames });
    }
    setCfg((c)=> ({ ...c, subjects }));
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>){
    const f = e.target.files?.[0]; if (!f) return;
    setCfg((c)=> ({ ...c, sourceFiles: [...c.sourceFiles, { name: f.name, type: f.type || (f.name.endsWith('.csv')? 'text/csv':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') }] }));
    const reader = new FileReader();
    if (f.name.endsWith(".csv")){
      reader.onload = () => { parseCSV(String(reader.result || "")); };
      reader.readAsText(f);
    } else {
      reader.onload = () => { /* XLSX requires a parsing library; preserve metadata only */ };
      reader.readAsArrayBuffer(f);
    }
  }

  function addSubject(){ setCfg((c)=> ({ ...c, subjects: [...c.subjects, { name: "", perWeek: 2, perDay: 1, facultyCount: 1, type:'Lecture', sessionLength:60, facultyNames: [] }] })); }
  function removeSubject(i:number){ setCfg((c)=> ({ ...c, subjects: c.subjects.filter((_,idx)=> idx!==i) })); }

  function addFixed(){ setCfg((c)=> ({ ...c, fixedSlots: [...c.fixedSlots, { subject: c.subjects[0]?.name || "", selectedDays: [days[0]], time: "09:00-10:00", allDay: false, room: "101", batch: 1 }] })); }
  function removeFixed(i:number){ setCfg((c)=> ({ ...c, fixedSlots: c.fixedSlots.filter((_,idx)=> idx!==i) })); }

  // Handle All Day functionality for fixed slots
  function handleAllDayToggle(index: number, checked: boolean) {
    setCfg(c => {
      const arr = [...c.fixedSlots];
      arr[index] = { 
        ...arr[index], 
        allDay: checked, 
        time: checked ? undefined : "09:00-10:00",
        selectedDays: checked ? days : (arr[index].selectedDays.length > 0 ? arr[index].selectedDays : [days[0]])
      };
      return { ...c, fixedSlots: arr };
    });
  }


  function save(){
    const toSave: Config = { ...cfg, year };
    localStorage.setItem(`adminTTConfig:${year}`, JSON.stringify(toSave));
    const allYearsRaw = localStorage.getItem('adminTTConfig:years');
    const setYears = new Set<string>(allYearsRaw? JSON.parse(allYearsRaw): []);
    setYears.add(year);
    localStorage.setItem('adminTTConfig:years', JSON.stringify(Array.from(setYears)));
    alert("Saved configuration for year "+year);
  }

  const totalSubjects = useMemo(()=> cfg.subjects.length, [cfg.subjects]);

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Import Data</h1>
            <p className="text-muted-foreground">Upload CSV/XLSX and manage timetable constraints</p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span>Academic Year</span>
            <select className="border rounded-md px-2 py-1" value={year} onChange={(e)=>setYear(e.target.value)}>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
            </select>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Smart Data Import
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Upload CSV/XLSX File</Label>
                <div className="relative">
                  <Input type="file" accept=".csv,.xlsx" onChange={onFile} className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#079E74] file:text-white hover:file:bg-[#068d67]" />
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  <strong>Auto-detected columns:</strong> Subject/Name, Classes/Week, Max/Day, Faculty Count, Faculty Names, Type, Duration
                </div>
              </div>
              <div>
                <Label>Uploaded Files</Label>
                <div className="border rounded-md p-3 text-sm min-h-[42px]">
                  {cfg.sourceFiles.length===0? (
                    <div className="text-muted-foreground flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      No files uploaded yet
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {cfg.sourceFiles.map((f,i)=>(
                        <li key={i} className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>{f.name}</span>
                          <Badge variant="secondary" className="text-xs">{f.type.includes('csv') ? 'CSV' : 'XLSX'}</Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>

            {/* Column Mapping Preview */}
            {mappingPreview && (
              <div className="border rounded-lg p-4 bg-green-50 border-green-200">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <h4 className="font-medium text-green-800">Column Mapping Detected</h4>
                </div>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-green-700">Detected Columns:</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {mappingPreview.detected.map((col, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{col}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-green-700">Auto-Mapped Fields:</Label>
                    <div className="space-y-1 mt-1">
                      {Object.entries(mappingPreview.mapped).map(([field, column]) => (
                        <div key={field} className="flex items-center gap-2 text-xs">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          <span className="font-medium">{field}:</span>
                          <span className="text-muted-foreground">{column}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Timetable Constraints</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {/* College Timing Section */}
            <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
              <h4 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                College Timing Configuration
              </h4>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium">College Start Time</Label>
                  <Input 
                    type="time" 
                    value={cfg.collegeStartTime} 
                    onChange={e=> setCfg(c=>({...c, collegeStartTime: e.target.value}))} 
                    className="bg-white"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">College End Time</Label>
                  <Input 
                    type="time" 
                    value={cfg.collegeEndTime} 
                    onChange={e=> setCfg(c=>({...c, collegeEndTime: e.target.value}))} 
                    className="bg-white"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Default Session Duration (minutes)</Label>
                  <select 
                    className="border rounded-md px-2 py-2 w-full bg-white" 
                    value={cfg.sessionDuration} 
                    onChange={e=> setCfg(c=>({...c, sessionDuration: Number(e.target.value)}))}
                  >
                    <option value={45}>45 minutes</option>
                    <option value={60}>60 minutes</option>
                    <option value={90}>90 minutes</option>
                    <option value={120}>120 minutes</option>
                  </select>
                </div>
              </div>
              <div className="mt-2 text-xs text-blue-700">
                Total available hours: {(() => {
                  const start = new Date(`2000-01-01T${cfg.collegeStartTime}:00`);
                  const end = new Date(`2000-01-01T${cfg.collegeEndTime}:00`);
                  const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                  return `${diff.toFixed(1)} hours`;
                })()}
              </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <Label>Number of Classrooms</Label>
                <Input type="number" value={cfg.classrooms} onChange={e=> setCfg(c=>({...c, classrooms: Number(e.target.value)}))} />
              </div>
              <div>
                <Label>Number of Student Batches</Label>
                <Input type="number" value={cfg.batches} onChange={e=> setCfg(c=>({...c, batches: Number(e.target.value)}))} />
              </div>
              <div>
                <Label>Maximum Classes per Day</Label>
                <Input type="number" value={cfg.maxPerDay} onChange={e=> setCfg(c=>({...c, maxPerDay: Number(e.target.value)}))} />
              </div>
              <div>
                <Label>Avg Faculty Leaves/Month</Label>
                <Input type="number" value={cfg.avgFacultyLeaves} onChange={e=> setCfg(c=>({...c, avgFacultyLeaves: Number(e.target.value)}))} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Subjects ({totalSubjects})</Label>
                <Button variant="outline" size="sm" onClick={addSubject}>Add Subject</Button>
              </div>
              <div className="mb-2 flex gap-2 items-center">
                <Input placeholder="Filter by subject" onChange={e=>{
                  const q = e.target.value.toLowerCase();
                  try{
                    const saved = loadConfig(year);
                    if (saved){
                      const filtered = saved.subjects.filter(s=> s.name.toLowerCase().includes(q));
                      setCfg(c=> ({ ...c, subjects: q? filtered : (saved.subjects||c.subjects) }));
                    }
                  }catch{}
                }} />
              </div>
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-muted-foreground">
                    <tr>
                      <th className="py-2">Name</th>
                      <th className="py-2">Type</th>
                      <th className="py-2">Duration</th>
                      <th className="py-2">Classes/Week</th>
                      <th className="py-2">Max/Day</th>
                      <th className="py-2">Faculty Count</th>
                      <th className="py-2">Faculty Names</th>
                      <th className="py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cfg.subjects.map((s, i)=> (
                      <tr key={i} className="border-t">
                        <td className="py-2 min-w-40"><Input value={s.name} onChange={e=> setCfg(c=>{ const arr=[...c.subjects]; arr[i] = { ...arr[i], name: e.target.value }; return { ...c, subjects: arr }; })} /></td>
                        <td className="py-2 w-32">
                          <select className="border rounded-md px-2 py-2 w-full" value={s.type||'Lecture'} onChange={e=> setCfg(c=>{ const arr=[...c.subjects]; const type = e.target.value as 'Lecture'|'Practical'; arr[i] = { ...arr[i], type, sessionLength: type==='Practical'?120:(arr[i].sessionLength||60) }; return { ...c, subjects: arr }; })}>
                            <option>Lecture</option>
                            <option>Practical</option>
                          </select>
                        </td>
                        <td className="py-2 w-32">
                          <select className="border rounded-md px-2 py-2 w-full" value={(s.sessionLength||60)} onChange={e=> setCfg(c=>{ const arr=[...c.subjects]; arr[i] = { ...arr[i], sessionLength: Number(e.target.value) }; return { ...c, subjects: arr }; })}>
                            <option value={60}>1 hour</option>
                            <option value={120}>2 hours</option>
                          </select>
                        </td>
                        <td className="py-2 w-28"><Input type="number" value={s.perWeek} onChange={e=> setCfg(c=>{ const arr=[...c.subjects]; arr[i] = { ...arr[i], perWeek: Number(e.target.value) }; return { ...c, subjects: arr }; })} /></td>
                        <td className="py-2 w-28"><Input type="number" value={s.perDay||1} onChange={e=> setCfg(c=>{ const arr=[...c.subjects]; arr[i] = { ...arr[i], perDay: Number(e.target.value) }; return { ...c, subjects: arr }; })} /></td>
                        <td className="py-2 w-28"><Input type="number" value={s.facultyCount|| (s.facultyNames?.length||1)} onChange={e=> setCfg(c=>{ const arr=[...c.subjects]; arr[i] = { ...arr[i], facultyCount: Number(e.target.value) }; return { ...c, subjects: arr }; })} /></td>
                        <td className="py-2 min-w-64"><Input placeholder="Comma/; separated" value={(s.facultyNames||[]).join(', ')} onChange={e=> setCfg(c=>{ const arr=[...c.subjects]; arr[i] = { ...arr[i], facultyNames: e.target.value.split(/;|\||,|\//).map(x=>x.trim()).filter(Boolean) }; return { ...c, subjects: arr }; })} /></td>
                        <td className="py-2"><Button variant="ghost" size="sm" onClick={()=>removeSubject(i)}>Remove</Button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-base font-medium">Special Fixed Slots</Label>
                <Button variant="outline" size="sm" onClick={addFixed}>Add Fixed Slot</Button>
              </div>
              <div className="space-y-4">
                {cfg.fixedSlots.length===0 && (
                  <div className="text-sm text-muted-foreground p-4 border border-dashed rounded-lg text-center">
                    No fixed slots added. Click "Add Fixed Slot" to create subject-specific time slots.
                  </div>
                )}
                {cfg.fixedSlots.map((f,i)=> (
                  <div key={i} className="p-4 border rounded-lg bg-gray-50 space-y-4">
                    {/* First Row: Basic Info */}
                    <div className="grid md:grid-cols-4 gap-3">
                      <div>
                        <Label className="text-sm font-medium">Subject</Label>
                        <Input value={f.subject} onChange={e=> setCfg(c=>{ const arr=[...c.fixedSlots]; arr[i] = { ...arr[i], subject: e.target.value }; return { ...c, fixedSlots: arr }; })} />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Time Slot</Label>
                        <Input 
                          type="text" 
                          placeholder="09:00-10:00" 
                          disabled={!!f.allDay} 
                          value={f.time||""} 
                          onChange={e=> setCfg(c=>{ const arr=[...c.fixedSlots]; arr[i] = { ...arr[i], time: e.target.value }; return { ...c, fixedSlots: arr }; })} 
                        />
                        {f.allDay && (
                          <div className="text-xs text-muted-foreground mt-1">Full day slot</div>
                        )}
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Room</Label>
                        <Input placeholder="101" value={f.room||""} onChange={e=> setCfg(c=>{ const arr=[...c.fixedSlots]; arr[i] = { ...arr[i], room: e.target.value }; return { ...c, fixedSlots: arr }; })} />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Batch</Label>
                        <Input type="number" value={f.batch||1} onChange={e=> setCfg(c=>{ const arr=[...c.fixedSlots]; arr[i] = { ...arr[i], batch: Number(e.target.value) }; return { ...c, fixedSlots: arr }; })} />
                      </div>
                    </div>

                    {/* Second Row: Day Selection and All Day Toggle */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <DaySelector
                        selectedDays={f.selectedDays || []}
                        onDaysChange={(selectedDays) => setCfg(c => {
                          const arr = [...c.fixedSlots];
                          arr[i] = { ...arr[i], selectedDays };
                          return { ...c, fixedSlots: arr };
                        })}
                        label="Apply to Days"
                      />
                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium">All Day Schedule</Label>
                          <div className="flex items-center gap-2 mt-2">
                            <input 
                              type="checkbox" 
                              className="h-4 w-4 text-[#079E74] rounded border-gray-300 focus:ring-[#079E74]" 
                              checked={!!f.allDay} 
                              onChange={e=> handleAllDayToggle(i, e.target.checked)} 
                            />
                            <span className="text-sm text-muted-foreground">
                              {f.allDay ? 'Occupies entire day' : 'Specific time slot only'}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <Button variant="ghost" size="sm" onClick={()=>removeFixed(i)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4 mt-4">
                <Label className="text-base font-medium">Recess Breaks Configuration</Label>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={()=> setCfg(c=> ({ ...c, recess: [...(c.recess||[]), { selectedDays: [days[0]], start: "12:00", end: "12:30" }] }))}
                >
                  Add Recess Break
                </Button>
              </div>

              <div className="space-y-4">
                {(cfg.recess||[]).length===0 && (
                  <div className="text-sm text-muted-foreground p-4 border border-dashed rounded-lg text-center">
                    No recess breaks configured. Click "Add Recess Break" to create break periods.
                  </div>
                )}
                
                {(cfg.recess||[]).map((r,i)=> (
                  <div key={i} className="p-4 border rounded-lg bg-gray-50 space-y-4">
                    {/* First Row: Time Configuration */}
                    <div className="grid md:grid-cols-3 gap-3">
                      <div>
                        <Label className="text-sm font-medium">Start Time</Label>
                        <Input type="time" value={r.start} onChange={e=> setCfg(c=>{ const arr=[...(c.recess||[])]; arr[i] = { ...arr[i], start: e.target.value }; return { ...c, recess: arr }; })} />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">End Time</Label>
                        <Input type="time" value={r.end} onChange={e=> setCfg(c=>{ const arr=[...(c.recess||[])]; arr[i] = { ...arr[i], end: e.target.value }; return { ...c, recess: arr }; })} />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Duration</Label>
                        <div className="text-sm text-muted-foreground py-2 px-3 bg-white border rounded-md">
                          {(() => {
                            const start = new Date(`2000-01-01T${r.start}:00`);
                            const end = new Date(`2000-01-01T${r.end}:00`);
                            const diff = (end.getTime() - start.getTime()) / (1000 * 60);
                            return `${diff} min`;
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* Second Row: Day Selection and Remove Button */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <DaySelector
                        selectedDays={r.selectedDays || []}
                        onDaysChange={(selectedDays) => setCfg(c => {
                          const arr = [...(c.recess || [])];
                          arr[i] = { ...arr[i], selectedDays };
                          return { ...c, recess: arr };
                        })}
                        label="Apply to Days"
                      />
                      <div className="flex justify-end items-end">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={()=> setCfg(c=> ({ ...c, recess: (c.recess||[]).filter((_,idx)=> idx!==i) }))}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <Button className="bg-[#079E74] hover:bg-[#068d67] text-white" onClick={save}>Save Configuration</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
