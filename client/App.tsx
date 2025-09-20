import "./global.css";
import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LoadingSpinner } from "./components/ui/loading";

// Lazy load all pages
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const DashboardFaculty = lazy(() => import("./pages/DashboardFaculty"));
const DashboardHOD = lazy(() => import("./pages/DashboardHOD"));
const DashboardPrincipal = lazy(() => import("./pages/DashboardPrincipal"));
const PrincipalTimetables = lazy(() => import("./pages/PrincipalTimetables"));
const PrincipalApprovals = lazy(() => import("./pages/PrincipalApprovals"));
const PrincipalWorkload = lazy(() => import("./pages/PrincipalWorkload"));
const PrincipalResources = lazy(() => import("./pages/PrincipalResources"));
const PrincipalReports = lazy(() => import("./pages/PrincipalReports"));
const FacultyTimetable = lazy(() => import("./pages/FacultyTimetable"));
const FacultyAttendance = lazy(() => import("./pages/FacultyAttendance"));
const FacultyLeave = lazy(() => import("./pages/FacultyLeave"));
const FacultyDemandLecture = lazy(() => import("./pages/FacultyDemandLecture"));
const FacultyMySchedule = lazy(() => import("./pages/FacultyMySchedule"));
const HODReview = lazy(() => import("./pages/HODReview"));
const HODTimetable = lazy(() => import("./pages/HODTimetable"));
const HODLeaveApprovals = lazy(() => import("./pages/HODLeaveApprovals"));
const DashboardStudent = lazy(() => import("./pages/DashboardStudent"));
const StudentTimetable = lazy(() => import("./pages/StudentTimetable"));
const DashboardAdmin = lazy(() => import("./pages/DashboardAdmin"));
const AdminImportData = lazy(() => import("./pages/AdminImportData"));
const AdminGenerateTimetable = lazy(
  () => import("./pages/AdminGenerateTimetable"),
);
const AdminReviewApproval = lazy(() => import("./pages/AdminReviewApproval"));
const AdminUserManagement = lazy(() => import("./pages/AdminUserManagement"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/dashboard/faculty" element={<DashboardFaculty />} />
            <Route
              path="/dashboard/faculty/timetable"
              element={<FacultyTimetable />}
            />
            <Route
              path="/dashboard/faculty/attendance"
              element={<FacultyAttendance />}
            />
            <Route path="/dashboard/faculty/leave" element={<FacultyLeave />} />
            <Route
              path="/dashboard/faculty/demand-lecture"
              element={<FacultyDemandLecture />}
            />
            <Route
              path="/dashboard/faculty/schedule"
              element={<FacultyMySchedule />}
            />
            <Route path="/dashboard/hod" element={<DashboardHOD />} />
            <Route
              path="/dashboard/principal"
              element={<DashboardPrincipal />}
            />
            <Route
              path="/dashboard/principal/timetables"
              element={<PrincipalTimetables />}
            />
            <Route
              path="/dashboard/principal/approvals"
              element={<PrincipalApprovals />}
            />
            <Route
              path="/dashboard/principal/workload"
              element={<PrincipalWorkload />}
            />
            <Route
              path="/dashboard/principal/resources"
              element={<PrincipalResources />}
            />
            <Route
              path="/dashboard/principal/reports"
              element={<PrincipalReports />}
            />
            <Route path="/dashboard/hod/timetable" element={<HODTimetable />} />
            <Route path="/dashboard/hod/review" element={<HODReview />} />
            <Route
              path="/dashboard/hod/leave-approvals"
              element={<HODLeaveApprovals />}
            />
            <Route path="/dashboard/student" element={<DashboardStudent />} />
            <Route
              path="/dashboard/student/timetable"
              element={<StudentTimetable />}
            />

            {/* Admin */}
            <Route path="/dashboard/admin" element={<DashboardAdmin />} />
            <Route
              path="/dashboard/admin/import"
              element={<AdminImportData />}
            />
            <Route
              path="/dashboard/admin/generate"
              element={<AdminGenerateTimetable />}
            />
            <Route
              path="/dashboard/admin/review"
              element={<AdminReviewApproval />}
            />
            <Route
              path="/dashboard/admin/users"
              element={<AdminUserManagement />}
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
