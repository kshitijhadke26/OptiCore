import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useMemo, useState } from "react";

interface Faculty { id:string; name:string; dept:string; subjects:string[]; }
interface Student { id:string; name:string; year:number; batch:number; }
interface Subject { code:string; name:string; year:number; }

const FACULTIES: Faculty[] = [
  { id:"F001", name:"Dr Tk Gawali", dept:"CS", subjects:["Mathematics","Programming"] },
  { id:"F002", name:"Prof . S.D.Cheke", dept:"CS", subjects:["Physics","Operating Systems"] },
  { id:"F003", name:"K.R.Sarode", dept:"IT", subjects:["Databases","Networks"] },
  { id:"F004", name:"D. Chaudari", dept:"IT", subjects:["Data Structures","Algorithms"] },
];
const STUDENTS: Student[] = [
  { id:"S1001", name:"Ajinkya Sultane", year:1, batch:1 },
  { id:"S1002", name:"Kshitij Hadke", year:2, batch:1 },
  { id:"S1003", name:"Nishant Tarone", year:3, batch:2 },
  { id:"S1004", name:"Shivraj Yadhav", year:4, batch:1 },
  { id:"S1005", name:"Himanshu Firke", year:2, batch:2 },
  { id:"S1006", name:"Neha Bosle", year:1, batch:2 },
];
const SUBJECTS: Subject[] = [
  { code:"MA101", name:"Mathematics", year:1 },
  { code:"PH101", name:"Physics", year:1 },
  { code:"CS201", name:"Data Structures", year:2 },
  { code:"CS202", name:"Databases", year:2 },
  { code:"CS301", name:"Operating Systems", year:3 },
  { code:"CS302", name:"Computer Networks", year:3 },
  { code:"CS401", name:"Machine Learning", year:4 },
];

export default function AdminUserManagement(){
  const [year, setYear] = useState("all");
  const [q, setQ] = useState("");

  const f = useMemo(()=> FACULTIES.filter(x => !q || x.name.toLowerCase().includes(q.toLowerCase())), [q]);
  const s = useMemo(()=> STUDENTS.filter(x => (year==='all' || x.year===Number(year)) && (!q || x.name.toLowerCase().includes(q.toLowerCase()))), [q, year]);
  const sub = useMemo(()=> SUBJECTS.filter(x => year==='all' || x.year===Number(year)), [year]);

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">User Management</h1>
            <p className="text-muted-foreground">View faculties, students, and subjects</p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span>Year</span>
            <select className="border rounded-md px-2 py-1" value={year} onChange={(e)=>setYear(e.target.value)}>
              <option value="all">All</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
            </select>
            <Input placeholder="Search by name" className="w-56" value={q} onChange={e=>setQ(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Faculties ({f.length})</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-80 overflow-auto">
                {f.map(x => (
                  <div key={x.id} className="border rounded-md p-2 text-sm hover:bg-muted/50 transition-colors">
                    <div className="font-medium">{x.name}</div>
                    <div className="text-xs text-muted-foreground">Dept: {x.dept} • Subjects: {x.subjects.join(', ')}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Students ({s.length})</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-80 overflow-auto">
                {s.map(x => (
                  <div key={x.id} className="border rounded-md p-2 text-sm hover:bg-muted/50 transition-colors">
                    <div className="font-medium">{x.name}</div>
                    <div className="text-xs text-muted-foreground">Year {x.year} • Batch {x.batch}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Subjects ({sub.length})</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-80 overflow-auto">
                {sub.map(x => (
                  <div key={x.code} className="border rounded-md p-2 text-sm hover:bg-muted/50 transition-colors">
                    <div className="font-medium">{x.code} — {x.name}</div>
                    <div className="text-xs text-muted-foreground">Year {x.year}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
