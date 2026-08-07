import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { NavLink } from "@/components/NavLink";
import AppSwitcher from "./AppSwitcher";
import AdminMegaMenu from "./AdminMegaMenu";
import {
  Recycle,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  Search,
  LayoutDashboard,
  Building2,
  Factory,
  PackageOpen,
  Settings,
  Eye,
  Trash2,
  Radio,
  Biohazard,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";

interface NavItem {
  label: string;
  to: string;
  end?: boolean;
  icon?: typeof LayoutDashboard;
}

interface ModuleConfig {
  title: string;
  icon: typeof LayoutDashboard;
  navItems: NavItem[];
}

const moduleConfigs: Record<string, ModuleConfig> = {
  "/dashboard": {
    title: "Painel Governamental",
    icon: LayoutDashboard,
    navItems: [
      { label: "Visão Geral", to: "/dashboard", end: true },
      { label: "Rastreabilidade", to: "/dashboard/rastreabilidade" },
      { label: "Auditoria", to: "/dashboard/auditoria" },
      { label: "Alertas", to: "/dashboard/alertas" },
      { label: "Usuários", to: "/dashboard/usuarios" },
      { label: "Benchmarks", to: "/dashboard/benchmarks" },
      { label: "Lixões", to: "/dashboard/lixoes", icon: Trash2 },
      { label: "Sustentabilidade", to: "/dashboard/sustentabilidade" },
      { label: "Radar de Rejeitos", to: "/dashboard/radar-rejeitos", icon: Radio },
      { label: "Resíduos Críticos", to: "/dashboard/residuos-criticos", icon: Biohazard },
    ],
  },
  "/cooperativa": {
    title: "Cooperativa",
    icon: Building2,
    navItems: [
      { label: "Painel", to: "/cooperativa/painel" },
      { label: "Recepção", to: "/cooperativa/recepcao" },
      { label: "Lotes de Entrada", to: "/cooperativa/lotes-entrada" },
      { label: "Despacho", to: "/cooperativa/despacho" },
      { label: "Faturamento", to: "/cooperativa/faturamento" },
      { label: "Cadastro", to: "/cooperativa/cadastro" },
    ],
  },
  "/industria": {
    title: "Indústria",
    icon: Factory,
    navItems: [
      { label: "Dashboard ESG", to: "/industria/dashboard" },
      { label: "Metas PNRS", to: "/industria/metas-logisticas" },
      { label: "Integração", to: "/industria/integracao" },
      { label: "Certificados", to: "/industria/certificados" },
      { label: "Cadastro", to: "/industria/cadastro" },
    ],
  },
  "/ponto-coleta": {
    title: "Ponto de Coleta",
    icon: PackageOpen,
    navItems: [
      { label: "Dashboard", to: "/ponto-coleta/dashboard" },
      { label: "Novo Recebimento", to: "/ponto-coleta/novo-recebimento" },
      { label: "Histórico", to: "/ponto-coleta/historico" },
      { label: "Metas", to: "/ponto-coleta/metas" },
      { label: "Serviços", to: "/ponto-coleta/servicos" },
      { label: "Configurações", to: "/ponto-coleta/configuracoes" },
      { label: "Credenciamento", to: "/ponto-coleta/credenciamento" },
    ],
  },
  "/admin": {
    title: "Administração",
    icon: Settings,
    navItems: [], // uses AdminMegaMenu instead
  },
  "/transparencia": {
    title: "Transparência",
    icon: Eye,
    navItems: [
      { label: "Mapa de Reciclagem", to: "/transparencia/mapa-reciclagem" },
    ],
  },
};

function getModuleConfig(pathname: string): { key: string; config: ModuleConfig } | null {
  for (const prefix of Object.keys(moduleConfigs)) {
    if (pathname.startsWith(prefix)) return { key: prefix, config: moduleConfigs[prefix] };
  }
  return null;
}

const GlobalHeader = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, hasRole } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const isSuperAdmin = hasRole("super_admin" as any);

  const match = getModuleConfig(location.pathname);
  const config = match?.config;
  const moduleKey = match?.key;

  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  // close user menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <>
      {/* ─── Top Bar (CRM Desktop style) ─── */}
      <header className="bg-[hsl(var(--topnav-background))] text-[hsl(var(--topnav-foreground))] sticky top-0 z-40 border-b border-[hsl(var(--topnav-border))]">
        <div className="flex items-center h-14 px-4 lg:px-6 gap-4">
          {/* Left: brand + module crumb */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-1.5 rounded hover:bg-[hsl(var(--topnav-hover))]"
              aria-label="Abrir menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 group"
            >
              <div className="bg-primary rounded-md p-1.5 shadow-fiori-1">
                <Recycle className="h-4 w-4 text-primary-foreground" strokeWidth={2.25} />
              </div>
              <div className="flex flex-col items-start leading-none">
                <span className="font-bold text-sm tracking-tight">SINARV</span>
                <span className="text-[10px] text-[hsl(var(--topnav-muted))] hidden sm:inline">
                  Sistema Nacional de Reciclagem
                </span>
              </div>
            </button>
          </div>

          {/* Center: primary nav (modules) */}
          <nav className="hidden lg:flex items-center gap-0.5 ml-4">
            {(["/dashboard", "/cooperativa", "/industria", "/ponto-coleta"] as const).map((path) => {
              const cfg = moduleConfigs[path];
              const Icon = cfg.icon;
              const active = location.pathname.startsWith(path);
              return (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  className={`flex items-center gap-1.5 px-3 h-9 rounded-md text-sm transition-colors ${
                    active
                      ? "bg-[hsl(var(--topnav-active))] text-[hsl(var(--topnav-active-foreground))] font-medium"
                      : "text-[hsl(var(--topnav-foreground))] hover:bg-[hsl(var(--topnav-hover))]"
                  }`}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                  <span>{cfg.title}</span>
                </button>
              );
            })}

            {/* Admin mega-menu */}
            {isSuperAdmin && <AdminMegaMenu active={location.pathname.startsWith("/admin")} />}
          </nav>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Right: search + actions */}
          <div className="hidden md:flex items-center relative w-56 lg:w-64">
            <Search className="absolute left-2.5 h-3.5 w-3.5 text-[hsl(var(--topnav-muted))] pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar..."
              className="w-full h-9 pl-8 pr-3 text-xs rounded-md border border-[hsl(var(--topnav-border))] bg-background text-foreground placeholder:text-[hsl(var(--topnav-muted))] focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-1">
            {isSuperAdmin && <AppSwitcher />}

            <button
              onClick={toggleTheme}
              className="p-2 rounded-md hover:bg-[hsl(var(--topnav-hover))] transition-colors"
              title={resolvedTheme === "dark" ? "Tema claro" : "Tema escuro"}
              aria-label="Alternar tema"
            >
              {resolvedTheme === "dark" ? (
                <Sun className="h-4 w-4" strokeWidth={1.75} />
              ) : (
                <Moon className="h-4 w-4" strokeWidth={1.75} />
              )}
            </button>

            <button
              className="relative p-2 rounded-md hover:bg-[hsl(var(--topnav-hover))] transition-colors"
              aria-label="Notificações"
            >
              <Bell className="h-4 w-4" strokeWidth={1.75} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-destructive rounded-full" />
            </button>

            {/* User menu */}
            <div ref={userMenuRef} className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-2 h-9 rounded-md hover:bg-[hsl(var(--topnav-hover))] transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                  {(user?.email?.[0] || "U").toUpperCase()}
                </div>
                <span className="hidden md:inline text-xs max-w-[140px] truncate">
                  {user?.email || "Usuário"}
                </span>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-56 bg-popover border border-border rounded-lg shadow-fiori-3 py-1 z-50">
                  <div className="px-3 py-2 border-b border-border">
                    <p className="text-xs font-medium text-foreground truncate">
                      {user?.email}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {isSuperAdmin ? "Super Administrador" : "Usuário"}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      navigate("/selecionar-perfil");
                      setUserMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-foreground hover:bg-secondary flex items-center gap-2"
                  >
                    <User className="h-3.5 w-3.5" strokeWidth={1.75} />
                    Trocar perfil
                  </button>
                  <button
                    onClick={signOut}
                    className="w-full text-left px-3 py-2 text-xs text-destructive hover:bg-destructive/10 flex items-center gap-2"
                  >
                    <LogOut className="h-3.5 w-3.5" strokeWidth={1.75} />
                    Sair
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── Sub Bar: contextual nav for current module (non-admin only) ─── */}
        {config && config.navItems.length > 0 && moduleKey !== "/admin" && (
          <div className="hidden lg:flex items-center gap-0.5 px-4 lg:px-6 h-10 border-t border-[hsl(var(--topnav-border))] bg-[hsl(var(--topnav-background))] overflow-x-auto">
            {config.navItems.map((item) => {
              const ItemIcon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className="px-3 h-8 flex items-center gap-1.5 rounded-md text-xs text-[hsl(var(--topnav-muted))] hover:text-[hsl(var(--topnav-foreground))] hover:bg-[hsl(var(--topnav-hover))] transition-colors whitespace-nowrap"
                  activeClassName="text-[hsl(var(--topnav-active-foreground))] bg-[hsl(var(--topnav-active))] font-medium"
                >
                  {ItemIcon && <ItemIcon className="h-3.5 w-3.5" strokeWidth={1.75} />}
                  {item.label}
                </NavLink>
              );
            })}
          </div>
        )}
      </header>

      {/* ─── Mobile drawer ─── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-30 lg:hidden" style={{ top: 56 }}>
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <nav className="relative bg-card shadow-fiori-3 w-72 h-full flex flex-col py-2 overflow-y-auto">
            <p className="px-4 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
              Módulos
            </p>
            {Object.entries(moduleConfigs).map(([path, cfg]) => {
              if (path === "/admin" && !isSuperAdmin) return null;
              if (path === "/transparencia") return null;
              const Icon = cfg.icon;
              return (
                <button
                  key={path}
                  onClick={() => {
                    navigate(path);
                    setMobileOpen(false);
                  }}
                  className="px-4 py-2.5 text-sm text-foreground hover:bg-secondary flex items-center gap-3 text-left"
                >
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                  {cfg.title}
                </button>
              );
            })}
            {config && config.navItems.length > 0 && (
              <>
                <div className="border-t border-border mt-2 pt-2">
                  <p className="px-4 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                    {config.title}
                  </p>
                  {config.navItems.map((item) => {
                    const ItemIcon = item.icon;
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        onClick={() => setMobileOpen(false)}
                        className="px-4 py-2.5 text-sm text-foreground hover:bg-secondary flex items-center gap-2"
                        activeClassName="bg-primary/10 text-primary font-medium border-l-2 border-primary"
                      >
                        {ItemIcon && <ItemIcon className="h-4 w-4" strokeWidth={1.75} />}
                        {item.label}
                      </NavLink>
                    );
                  })}
                </div>
              </>
            )}
          </nav>
        </div>
      )}
    </>
  );
};

export default GlobalHeader;
