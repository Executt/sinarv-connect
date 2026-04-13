import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { Bell, User, Menu } from "lucide-react";
import { Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": { title: "Visão Geral", subtitle: "Painel de Telemetria Nacional — Dados em tempo real" },
  "/dashboard/rastreabilidade": { title: "Rastreabilidade", subtitle: "Cadeia de custódia e rastreio de materiais recicláveis" },
  "/dashboard/auditoria": { title: "Auditoria", subtitle: "Registos de conformidade e verificações do sistema" },
  "/dashboard/alertas": { title: "Alertas", subtitle: "Notificações, anomalias e eventos críticos" },
};

const DashboardLayout = () => {
  const location = useLocation();
  const page = pageTitles[location.pathname] || pageTitles["/dashboard"];
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-surface">
      <DashboardSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-card border-b border-border px-4 md:px-6 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="md:hidden p-1.5 rounded-md hover:bg-secondary">
              <Menu className="h-5 w-5 text-foreground" />
            </button>
            <div className="min-w-0">
              <h1 className="text-base md:text-lg font-bold text-foreground truncate">{page.title}</h1>
              <p className="text-xs text-muted-foreground truncate hidden sm:block">{page.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <button className="relative p-2 rounded-lg hover:bg-secondary transition-colors">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
            </button>
            <div className="flex items-center gap-2 pl-3 border-l border-border">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <User className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-sm font-medium text-foreground hidden lg:inline">{user?.email || "Admin"}</span>
            </div>
          </div>
        </header>
        <main className="flex-1 p-3 md:p-6 space-y-5 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
