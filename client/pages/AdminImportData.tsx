import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useMemo, useState } from "react";

type Subject = { name: string; perWeek: number; perDay?: number; facultyCount?: number; type?: 'Lecture'|'Practical'; sessionLength?: number; facultyNames?: string[] };

type FixedSlot = { subject: string; day: string; time?: string; allDay?: boolean; repeatAllDays?: boolean; room?: string; batch?: number };

type RecessBreak = { day: string; start: string; end: string };

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
      name: ['subject','name','subjectname'],
      perWeek: ['classesweek','perweek','classesperweek','periodsweek','periodsperweek'],
      perDay: ['maxday','perday','maxperday'],
      facultyCount: ['faculties','faculty','teachers','teachercount'],
      facultyNames: ['facultyname','facultynames','teacher','teachers','instructor','instructors'],
      type: ['type','kind','classtype','category','lectureorpractical'],
      duration: ['duration','length','sessionlength']
    };
    headerCols.forEach((h,idx)=>{
      const key = normalize(h);
      for (const [field, syns] of Object.entries(synonyms)){
        if (syns.includes(key)) headerMap[field] = idx;
      }
      if (!("name" in headerMap) && key==='subject') headerMap.name = idx;
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

  function addFixed(){ setCfg((c)=> ({ ...c, fixedSlots: [...c.fixedSlots, { subject: c.subjects[0]?.name || "", day: days[0], time: "09:00-10:00", allDay: false, repeatAllDays: false, room: "101", batch: 1 }] })); }
  function removeFixed(i:number){ setCfg((c)=> ({ ...c, fixedSlots: c.fixedSlots.filter((_,idx)=> idx!==i) })); }

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
          <CardHeader className="pb-2"><CardTitle className="text-base">Upload</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Upload CSV/XLSX</Label>
                <Input type="file" accept=".csv,.xlsx" onChange={onFile} />
                <div className="mt-2 text-xs text-muted-foreground">CSV columns supported: Subject, Classes/Week, Max/Day, Faculties (count), Faculty Names, Type (Lecture/Practical), Duration (60/120)</div>
              </div>
              <div>
                <Label>Uploaded Files</Label>
                <div className="border rounded-md p-2 text-sm min-h-[42px]">
                  {cfg.sourceFiles.length===0? <div className="text-muted-foreground">No files uploaded</div> : (
                    <ul className="list-disc pl-4 space-y-1">{cfg.sourceFiles.map((f,i)=>(<li key={i}>{f.name}</li>))}</ul>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Timetable Constraints</CardTitle></CardHeader>
          <CardContent className="space-y-4">
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
                <Label>Special Fixed Slots</Label>
                <Button variant="outline" size="sm" onClick={addFixed}>Add Fixed Slot</Button>
              </div>
              <div className="space-y-2">
                {cfg.fixedSlots.length===0 && <div className="text-sm text-muted-foreground">No fixed slots added</div>}
                {cfg.fixedSlots.map((f,i)=> (
                  <div key={i} className="grid md:grid-cols-7 gap-2 items-end">
                    <div>
                      <Label>Subject</Label>
                      <Input value={f.subject} onChange={e=> setCfg(c=>{ const arr=[...c.fixedSlots]; arr[i] = { ...arr[i], subject: e.target.value }; return { ...c, fixedSlots: arr }; })} />
                    </div>
                    <div>
                      <Label>Day</Label>
                      <select className="border rounded-md px-2 py-2 w-full" value={f.day} onChange={e=> setCfg(c=>{ const arr=[...c.fixedSlots]; arr[i] = { ...arr[i], day: e.target.value }; return { ...c, fixedSlots: arr }; })}>
                        {days.map(d=> <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <Label>All Day</Label>
                      <input type="checkbox" className="h-4 w-4" checked={!!f.allDay} onChange={e=> setCfg(c=>{ const arr=[...c.fixedSlots]; arr[i] = { ...arr[i], allDay: e.target.checked, time: e.target.checked? undefined : (arr[i].time||"09:00-10:00") }; return { ...c, fixedSlots: arr }; })} />
                    </div>
                    <div>
                      <Label>Repeat All Days</Label>
                      <input type="checkbox" className="h-4 w-4" checked={!!f.repeatAllDays} onChange={e=> setCfg(c=>{ const arr=[...c.fixedSlots]; arr[i] = { ...arr[i], repeatAllDays: e.target.checked }; return { ...c, fixedSlots: arr }; })} />
                    </div>
                    <div>
                      <Label>Time</Label>
                      <Input type="text" placeholder="09:00-10:00" disabled={!!f.allDay} value={f.time||""} onChange={e=> setCfg(c=>{ const arr=[...c.fixedSlots]; arr[i] = { ...arr[i], time: e.target.value }; return { ...c, fixedSlots: arr }; })} />
                    </div>
                    <div>
                      <Label>Room</Label>
                      <Input placeholder="101" value={f.room||""} onChange={e=> setCfg(c=>{ const arr=[...c.fixedSlots]; arr[i] = { ...arr[i], room: e.target.value }; return { ...c, fixedSlots: arr }; })} />
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Label>Batch</Label>
                        <Input type="number" value={f.batch||1} onChange={e=> setCfg(c=>{ const arr=[...c.fixedSlots]; arr[i] = { ...arr[i], batch: Number(e.target.value) }; return { ...c, fixedSlots: arr }; })} />
                      </div>
                      <Button variant="ghost" onClick={()=>removeFixed(i)}>Remove</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2 mt-4">
                <Label>Recess Breaks</Label>
                <Button variant="outline" size="sm" onClick={()=> setCfg(c=> ({ ...c, recess: [...(c.recess||[]), { day: days[0], start: "12:00", end: "12:30" }] }))}>Add Recess</Button>
              </div>
              <div className="space-y-2">
                {(cfg.recess||[]).length===0 && <div className="text-sm text-muted-foreground">No recess breaks configured</div>}
                {(cfg.recess||[]).map((r,i)=> (
                  <div key={i} className="grid md:grid-cols-5 gap-2 items-end">
                    <div>
                      <Label>Day</Label>
                      <select className="border rounded-md px-2 py-2 w-full" value={r.day} onChange={e=> setCfg(c=>{ const arr=[...(c.recess||[])]; arr[i] = { ...arr[i], day: e.target.value }; return { ...c, recess: arr }; })}>
                        {days.map(d=> <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <Label>Start</Label>
                      <Input type="time" value={r.start} onChange={e=> setCfg(c=>{ const arr=[...(c.recess||[])]; arr[i] = { ...arr[i], start: e.target.value }; return { ...c, recess: arr }; })} />
                    </div>
                    <div>
                      <Label>End</Label>
                      <Input type="time" value={r.end} onChange={e=> setCfg(c=>{ const arr=[...(c.recess||[])]; arr[i] = { ...arr[i], end: e.target.value }; return { ...c, recess: arr }; })} />
                    </div>
                    <div className="md:col-span-2">
                      <Button variant="ghost" onClick={()=> setCfg(c=> ({ ...c, recess: (c.recess||[]).filter((_,idx)=> idx!==i) }))}>Remove</Button>
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
