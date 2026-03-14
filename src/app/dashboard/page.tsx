export const dynamic = "force-dynamic";

import Dashboard from "@/components/dashboard/Dashboard";

export default function DashboardPage() {
  // Mock businessId for now until auth is implemented in Sprint 3
  const mockBusinessId = "demo-business-id";

  return (
    <main className="min-h-screen bg-background p-4 sm:p-12">
      <div className="max-w-7xl mx-auto">
        <Dashboard businessId={mockBusinessId} />
      </div>
    </main>
  );
}
