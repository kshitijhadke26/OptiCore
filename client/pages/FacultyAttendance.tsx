import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useEffect, useMemo, useState } from "react";

type Student = { id: string; name: string; roll: string; present: boolean };

const demoStudents: Student[] = [
  { id: "1", name: "Ajinkya Sultane", roll: "CS-A-01", present: true },
  { id: "2", name: "Kshitij Hadke", roll: "CS-A-02", present: true },
  { id: "3", name: "Nishant Tarone", roll: "CS-A-03", present: true },
  { id: "4", name: "Shivraj Yadhav", roll: "CS-A-04", present: true },
  { id: "5", name: "Himanshu Firke", roll: "CS-A-05", present: true },
  { id: "6", name: "Neha Bosle", roll: "CS-A-06", present: true },
];

export default function FacultyAttendance() {
  const params = new URLSearchParams(window.location.search);
  const [year, setYear] = useState(params.get('year') || "1");
  const [students, setStudents] = useState<Student[]>(() => {
    const raw = localStorage.getItem("facultyAttendanceStudents");
    return raw ? (JSON.parse(raw) as Student[]) : demoStudents;
  });

  useEffect(() => {
    try { localStorage.setItem("facultyAttendanceStudents", JSON.stringify(students)); } catch {}
  }, [students]);

  const allPresent = useMemo(() => students.every((s) => s.present), [students]);

  useEffect(() => {
    const absent = params.get('absent');
    if (absent) {
      setStudents((arr)=> arr.map((x)=> x.name.toLowerCase().includes(absent.toLowerCase()) ? { ...x, present:false } : x));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      const rows = text.split(/\r?\n/).filter(Boolean);
      const parsed: Student[] = rows.map((r, i) => {
        const [roll, name] = r.split(",");
        return { id: String(i + 1), name: (name || roll || `Student ${i+1}`).trim(), roll: (roll || `R${i+1}`).trim(), present: true };
      });
      if (parsed.length) setStudents(parsed);
    };
    reader.readAsText(file);
  }

  function exportCSV() {
    const header = "roll,name,present\n";
    const lines = students.map((s) => `${s.roll},${s.name},${s.present ? "present" : "absent"}`).join("\n");
    const blob = new Blob([header + lines], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-year-${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function save() {
    try {
      localStorage.setItem("attendanceData", JSON.stringify({ year, date: new Date().toISOString(), students }));
      // update student portal demo value
      const presentCount = students.filter((s) => s.present).length;
      const rate = Math.round((presentCount / students.length) * 100);
      localStorage.setItem("studentAttendanceRate", String(rate));
      alert("Attendance saved.");
    } catch {}
  }

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Attendance</h1>
            <p className="text-muted-foreground">Mark attendance and import/export student lists</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStudents((s) => s.map((x) => ({ ...x, present: true })))}>Mark All Present</Button>
            <Button variant="outline" onClick={exportCSV}>Export (.csv)</Button>
            <Button onClick={save}>Save</Button>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Filters & Import</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <div className="text-xs mb-1 text-muted-foreground">Year</div>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1st Year</SelectItem>
                  <SelectItem value="2">2nd Year</SelectItem>
                  <SelectItem value="3">3rd Year</SelectItem>
                  <SelectItem value="4">4th Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2 flex items-end gap-3">
              <div>
                <div className="text-xs mb-1 text-muted-foreground">Import CSV (roll,name)</div>
                <input type="file" accept=".csv" onChange={handleImport} />
              </div>
              <div className="text-xs text-muted-foreground">Tip: Export from Excel as CSV and import here.</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Students</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-auto">
              <table className="w-full text-sm rounded-md overflow-hidden">
                <thead className="text-left text-muted-foreground">
                  <tr>
                    <th className="py-2">Roll</th>
                    <th className="py-2">Name</th>
                    <th className="py-2">Present</th>
                    <th className="py-2">Absent</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.id} className="border-t">
                      <td className="py-2">{s.roll}</td>
                      <td className="py-2">{s.name}</td>
                      <td className="py-2"><input type="radio" name={`p-${s.id}`} checked={s.present} onChange={() => setStudents((arr) => arr.map((x) => x.id===s.id?{...x,present:true}:x))} /></td>
                      <td className="py-2"><input type="radio" name={`p-${s.id}`} checked={!s.present} onChange={() => setStudents((arr) => arr.map((x) => x.id===s.id?{...x,present:false}:x))} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
