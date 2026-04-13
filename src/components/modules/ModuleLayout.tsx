import { Outlet, useLocation } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { ArrowLeft, type LucideIcon } from "lucide-react";
import { useState } from "react";

interface ModuleLayoutProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  accentColor: string;
  menuItems: { title: string; url: string; icon: LucideIcon }[];
  pageTitles: Record<string, { title: string; subtitle: string }>;
}

const ModuleLayout = ({ title, subtitle, icon: Icon, accentColor, menuItems, pageTitles }: ModuleLayoutProps) => {
  const location = useLocation();
  const page = pageTitles[location.pathname] || { title, subtitle };

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Sidebar */}
      <aside className="w-60 bg-card flex flex-col border-r border-border">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className={`rounded-md p-1.5 ${accentColor}`}>
              <Icon className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="font-bold text-sm text-foreground leading-tight">{title}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">{subtitle}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-4 px-2 space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.url}
              to={item.url}
              end={item.url === menuItems[0]?.url}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              activeClassName="bg-primary/10 text-primary font-medium"
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              <span>{item.title}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-border">
          <NavLink
            to="/"
            className="flex items-center gap-2 px-3 py-2 rounded-md text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Voltar ao Portal</span>
          </NavLink>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-card border-b border-border px-6 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-foreground">{page.title}</h1>
            <p className="text-xs text-muted-foreground">{page.subtitle}</p>
          </div>
        </header>
        <main className="flex-1 p-6 space-y-5 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ModuleLayout;
