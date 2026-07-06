import { LayoutDashboard, Route, ClipboardCheck, AlertTriangle, Recycle, LogOut, ChevronLeft, ChevronRight, X, Users, BarChart3, Trash2, Radio } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "react-router-dom";

const menuItems = [
  { title: "Visão Geral", icon: LayoutDashboard, url: "/dashboard" },
  { title: "Rastreabilidade", icon: Route, url: "/dashboard/rastreabilidade" },
  { title: "Auditoria", icon: ClipboardCheck, url: "/dashboard/auditoria" },
  { title: "Alertas", icon: AlertTriangle, url: "/dashboard/alertas" },
  { title: "Usuários", icon: Users, url: "/dashboard/usuarios" },
  { title: "Benchmarks", icon: BarChart3, url: "/dashboard/benchmarks" },
  { title: "Lixões", icon: Trash2, url: "/dashboard/lixoes" },
  { title: "Radar de Rejeitos", icon: Radio, url: "/dashboard/radar-rejeitos" },
];

interface DashboardSidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

const DashboardSidebar = ({ mobileOpen, setMobileOpen }: DashboardSidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const { signOut } = useAuth();
  const location = useLocation();

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const sidebarContent = (showCollapse: boolean) => (
    <>
      <div className="p-4 flex items-center gap-2 border-b border-sidebar-border">
        <div className="bg-sidebar-primary rounded-md p-1.5 flex-shrink-0">
          <Recycle className="h-5 w-5 text-sidebar-primary-foreground" />
        </div>
        {(!showCollapse || !collapsed) && (
          <div className="overflow-hidden">
            <p className="text-sidebar-primary-foreground font-bold text-sm leading-tight">SINARV</p>
            <p className="text-sidebar-muted text-[10px] leading-tight">Painel Governamental</p>
          </div>
        )}
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.title}
            to={item.url}
            end={item.url === "/dashboard"}
            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
            activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
          >
            <item.icon className="h-4 w-4 flex-shrink-0" />
            {(!showCollapse || !collapsed) && <span>{item.title}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="p-2 border-t border-sidebar-border space-y-1">
        <button
          onClick={signOut}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs text-sidebar-muted hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {(!showCollapse || !collapsed) && <span>Sair</span>}
        </button>
        {showCollapse && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <><ChevronLeft className="h-4 w-4" /><span>Recolher</span></>}
          </button>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={`hidden md:flex bg-sidebar flex-col border-r border-sidebar-border transition-all duration-200 ${collapsed ? "w-16" : "w-60"}`}>
        {sidebarContent(true)}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 h-full bg-sidebar flex flex-col shadow-xl">
            <button onClick={() => setMobileOpen(false)} className="absolute top-3 right-3 p-1 rounded-md hover:bg-sidebar-accent z-10">
              <X className="h-5 w-5 text-sidebar-foreground" />
            </button>
            {sidebarContent(false)}
          </aside>
        </div>
      )}
    </>
  );
};

export default DashboardSidebar;
