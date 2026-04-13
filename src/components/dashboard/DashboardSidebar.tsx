import { LayoutDashboard, Route, ClipboardCheck, AlertTriangle, Recycle, LogOut, ChevronLeft, ChevronRight } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";

const menuItems = [
  { title: "Visão Geral", icon: LayoutDashboard, url: "/dashboard" },
  { title: "Rastreabilidade", icon: Route, url: "/dashboard/rastreabilidade" },
  { title: "Auditoria", icon: ClipboardCheck, url: "/dashboard/auditoria" },
  { title: "Alertas", icon: AlertTriangle, url: "/dashboard/alertas" },
];

const DashboardSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { signOut } = useAuth();

  return (
    <aside className={`bg-sidebar flex flex-col border-r border-sidebar-border transition-all duration-200 ${collapsed ? "w-16" : "w-60"}`}>
      {/* Logo */}
      <div className="p-4 flex items-center gap-2 border-b border-sidebar-border">
        <div className="bg-sidebar-primary rounded-md p-1.5 flex-shrink-0">
          <Recycle className="h-5 w-5 text-sidebar-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-sidebar-primary-foreground font-bold text-sm leading-tight">SINARV</p>
            <p className="text-sidebar-muted text-[10px] leading-tight">Painel Governamental</p>
          </div>
        )}
      </div>

      {/* Nav */}
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
            {!collapsed && <span>{item.title}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-sidebar-border space-y-1">
        <button
          onClick={signOut}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs text-sidebar-muted hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span>Sair</span>}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <><ChevronLeft className="h-4 w-4" /><span>Recolher</span></>}
        </button>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
