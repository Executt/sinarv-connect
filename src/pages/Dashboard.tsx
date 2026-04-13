import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import KPICards from "@/components/dashboard/KPICards";
import DashboardCharts from "@/components/dashboard/DashboardCharts";
import TransactionsTable from "@/components/dashboard/TransactionsTable";
import { Bell, User } from "lucide-react";

const Dashboard = () => {
  return (
    <div className="flex min-h-screen bg-surface">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-card border-b border-border px-6 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-foreground">Visão Geral</h1>
            <p className="text-xs text-muted-foreground">Painel de Telemetria Nacional — Dados em tempo real</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg hover:bg-secondary transition-colors">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
            </button>
            <div className="flex items-center gap-2 pl-3 border-l border-border">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <User className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-sm font-medium text-foreground hidden md:inline">Admin Gov</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 space-y-5 overflow-auto">
          <KPICards />
          <DashboardCharts />
          <TransactionsTable />
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
