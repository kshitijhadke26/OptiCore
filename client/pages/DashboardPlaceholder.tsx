import DashboardLayout from "@/components/layout/DashboardLayout";

export default function DashboardPlaceholder() {
  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl text-center py-20">
        <h1 className="text-2xl font-semibold mb-2">This dashboard is coming next</h1>
        <p className="text-muted-foreground">
          Continue prompting to fill in this page’s content (HOD/Principal views, analytics, approvals, etc.).
        </p>
      </div>
    </DashboardLayout>
  );
}
