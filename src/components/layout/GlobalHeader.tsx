import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { NavLink } from "@/components/NavLink";
import AppSwitcher from "./AppSwitcher";
import {
  Recycle,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";
import { useState, useEffect } from "react";

interface NavItem {
  label: string;
  to: string;
  end?: boolean;
}

interface ModuleConfig {
  title: string;
  navItems: NavItem[];
}

const moduleConfigs: Record<string, ModuleConfig> = {
  "/dashboard": {
    title: "Painel Governamental",
    navItems: [
      { label: "Visão Geral", to: "/dashboard", end: true },
      { label: "Rastreabilidade", to: "/dashboard/rastreabilidade" },
      { label: "Auditoria", to: "/dashboard/auditoria" },
      { label: "Alertas", to: "/dashboard/alertas" },
      { label: "Usuários", to: "/dashboard/usuarios" },
    ],
  },
  "/cooperativa": {
    title: "Cooperativa",
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
    navItems: [
      { label: "Dashboard", to: "/ponto-coleta/dashboard" },
      { label: "Novo Recebimento", to: "/ponto-coleta/novo-recebimento" },
      { label: "Histórico", to: "/ponto-coleta/historico" },
      { label: "Metas", to: "/ponto-coleta/metas" },
      { label: "Credenciamento", to: "/ponto-coleta/credenciamento" },
    ],
  },
};

function getModuleConfig(pathname: string): ModuleConfig | null {
  for (const prefix of Object.keys(moduleConfigs)) {
    if (pathname.startsWith(prefix)) return moduleConfigs[prefix];
  }
  return null;
}

const GlobalHeader = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, hasRole } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isSuperAdmin = hasRole("super_admin" as any);

  const config = getModuleConfig(location.pathname);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <>
      {/* Primary bar */}
      <header className="bg-[hsl(210,100%,18%)] text-white sticky top-0 z-40">
        <div className="flex items-center justify-between h-12 px-4 lg:px-6">
          {/* Left: brand + module title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-1.5 rounded hover:bg-white/10"
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => navigate("/")}
            >
              <div className="bg-white/20 rounded-md p-1">
                <Recycle className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-sm hidden sm:inline">SINARV</span>
            </div>
            {config && (
              <>
                <span className="text-white/30 hidden sm:inline">|</span>
                <span className="text-white/80 text-sm font-medium hidden sm:inline">
                  {config.title}
                </span>
              </>
            )}
          </div>

          {/* Center: desktop nav */}
          {config && (
            <nav className="hidden lg:flex items-center gap-1">
              {config.navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className="px-3 py-1.5 rounded text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                  activeClassName="text-white bg-white/15 font-medium"
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          )}

          {/* Right: actions */}
          <div className="flex items-center gap-2">
            {isSuperAdmin && <AppSwitcher />}
            <button className="relative p-2 rounded-lg hover:bg-white/10 transition-colors">
              <Bell className="h-4 w-4 text-white/80" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-400 rounded-full" />
            </button>
            <div className="hidden md:flex items-center gap-2 pl-2 border-l border-white/20">
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                <User className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-xs text-white/80 max-w-[120px] truncate">
                {user?.email || "Usuário"}
              </span>
            </div>
            <button
              onClick={signOut}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              title="Sair"
            >
              <LogOut className="h-4 w-4 text-white/70" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile nav drawer */}
      {mobileOpen && config && (
        <div className="fixed inset-0 z-30 lg:hidden" style={{ top: 48 }}>
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <nav className="relative bg-white shadow-xl w-64 h-full flex flex-col py-2">
            <p className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase">
              {config.title}
            </p>
            {config.navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className="px-4 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors"
                activeClassName="bg-primary/10 text-primary font-medium border-l-2 border-primary"
              >
                {item.label}
              </NavLink>
            ))}
            <div className="mt-auto border-t border-border p-3">
              <button
                onClick={() => {
                  navigate("/");
                  setMobileOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-xs text-muted-foreground hover:text-foreground"
              >
                ← Voltar ao Portal
              </button>
            </div>
          </nav>
        </div>
      )}
    </>
  );
};

export default GlobalHeader;
