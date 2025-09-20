import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import DashboardFaculty from "./pages/DashboardFaculty";
import DashboardHOD from "./pages/DashboardHOD";
import DashboardPrincipal from "./pages/DashboardPrincipal";
import PrincipalTimetables from "./pages/PrincipalTimetables";
import PrincipalApprovals from "./pages/PrincipalApprovals";
import PrincipalWorkload from "./pages/PrincipalWorkload";
import PrincipalResources from "./pages/PrincipalResources";
import PrincipalReports from "./pages/PrincipalReports";
import FacultyTimetable from "./pages/FacultyTimetable";
import FacultyAttendance from "./pages/FacultyAttendance";
import FacultyLeave from "./pages/FacultyLeave";
import FacultyDemandLecture from "./pages/FacultyDemandLecture";
import FacultyMySchedule from "./pages/FacultyMySchedule";
import HODReview from "./pages/HODReview";
import HODTimetable from "./pages/HODTimetable";
import HODLeaveApprovals from "./pages/HODLeaveApprovals";
import DashboardStudent from "./pages/DashboardStudent";
import StudentTimetable from "./pages/StudentTimetable";
import DashboardAdmin from "./pages/DashboardAdmin";
import AdminImportData from "./pages/AdminImportData";
import AdminGenerateTimetable from "./pages/AdminGenerateTimetable";
import AdminReviewApproval from "./pages/AdminReviewApproval";
import AdminUserManagement from "./pages/AdminUserManagement";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard/faculty" element={<DashboardFaculty />} />
          <Route path="/dashboard/faculty/timetable" element={<FacultyTimetable />} />
          <Route path="/dashboard/faculty/attendance" element={<FacultyAttendance />} />
          <Route path="/dashboard/faculty/leave" element={<FacultyLeave />} />
          <Route path="/dashboard/faculty/demand-lecture" element={<FacultyDemandLecture />} />
          <Route path="/dashboard/faculty/schedule" element={<FacultyMySchedule />} />
          <Route path="/dashboard/hod" element={<DashboardHOD />} />
          <Route path="/dashboard/principal" element={<DashboardPrincipal />} />
          <Route path="/dashboard/principal/timetables" element={<PrincipalTimetables />} />
          <Route path="/dashboard/principal/approvals" element={<PrincipalApprovals />} />
          <Route path="/dashboard/principal/workload" element={<PrincipalWorkload />} />
          <Route path="/dashboard/principal/resources" element={<PrincipalResources />} />
          <Route path="/dashboard/principal/reports" element={<PrincipalReports />} />
          <Route path="/dashboard/hod/timetable" element={<HODTimetable />} />
          <Route path="/dashboard/hod/review" element={<HODReview />} />
          <Route path="/dashboard/hod/leave-approvals" element={<HODLeaveApprovals />} />
          <Route path="/dashboard/student" element={<DashboardStudent />} />
          <Route path="/dashboard/student/timetable" element={<StudentTimetable />} />

          {/* Admin */}
          <Route path="/dashboard/admin" element={<DashboardAdmin />} />
          <Route path="/dashboard/admin/import" element={<AdminImportData />} />
          <Route path="/dashboard/admin/generate" element={<AdminGenerateTimetable />} />
          <Route path="/dashboard/admin/review" element={<AdminReviewApproval />} />
          <Route path="/dashboard/admin/users" element={<AdminUserManagement />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
