import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, GraduationCap, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Index() {
  const [tab, setTab] = useState("staff");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("faculty");
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-indigo-100 flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-xl shadow-lg border border-slate-200/70">
        <CardHeader className="pb-4 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <CardTitle className="text-xl">Team OptiCore Prototype</CardTitle>
          <p className="text-sm text-muted-foreground">
            Smart Classroom Scheduler - SIH Project Demo
          </p>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="staff">Staff Login</TabsTrigger>
              <TabsTrigger value="student">Student Login</TabsTrigger>
            </TabsList>

            <TabsContent value="staff" className="mt-6">
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (role === "admin") navigate("/dashboard/admin");
                  else if (role === "principal") navigate("/dashboard/principal");
                  else if (role === "hod") navigate("/dashboard/hod");
                  else navigate("/dashboard/faculty");
                }}
              >
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="your.email@college.edu"
                      className="pl-9"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      className="pl-9 pr-9"
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Role</label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="principal">Principal</SelectItem>
                      <SelectItem value="hod">HOD</SelectItem>
                      <SelectItem value="faculty">Faculty</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" className="w-full">Staff Sign In</Button>

                <div className="text-center">
                  <a className="text-sm text-muted-foreground hover:text-foreground" href="#">Forgot Password?</a>
                </div>

                <div className="rounded-md border p-4 text-xs text-muted-foreground">
                  <p className="font-medium mb-1">Demo Staff Credentials:</p>
                  <p>Admin: admin@college.edu / password123</p>
                  <p>Principal: principal@college.edu / password123</p>
                  <p>HOD: hod@c.edu / password123</p>
                  <p>Faculty: faculty@math.edu / password123</p>
                </div>

                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <GraduationCap className="h-3.5 w-3.5" />
                  Team OptiCore - Smart India Hackathon 2025
                </div>
              </form>
            </TabsContent>

            <TabsContent value="student" className="mt-6">
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  navigate("/dashboard/student");
                }}
              >
                <div className="space-y-2">
                  <label className="text-sm font-medium">Student Email</label>
                  <Input type="email" placeholder="student@college.edu" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Password</label>
                  <Input type="password" placeholder="Enter your password" required />
                </div>
                <Button type="submit" className="w-full" onClick={() => navigate("/dashboard/student")}>Student Sign In</Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
