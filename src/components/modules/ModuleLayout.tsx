import { Outlet, useLocation } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { ArrowLeft, LogOut, Menu, X, type LucideIcon } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";

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
  const { user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const sidebarContent = (
    <>
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

      <div className="p-3 border-t border-border space-y-1">
        <button onClick={signOut} className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
          <LogOut className="h-3.5 w-3.5" />
          <span>Sair</span>
        </button>
        <NavLink
          to="/"
          className="flex items-center gap-2 px-3 py-2 rounded-md text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Voltar ao Portal</span>
        </NavLink>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 bg-card flex-col border-r border-border">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 h-full bg-card flex flex-col shadow-xl">
            <button onClick={() => setMobileOpen(false)} className="absolute top-3 right-3 p-1 rounded-md hover:bg-secondary">
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main content */}
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
            <span className="text-xs text-muted-foreground hidden lg:inline">{user?.email}</span>
            <button onClick={signOut} className="hidden md:flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors">
              <LogOut className="h-3.5 w-3.5" />
              Sair
            </button>
          </div>
        </header>
        <main className="flex-1 p-3 md:p-6 space-y-5 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ModuleLayout;
