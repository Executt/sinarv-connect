import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Settings,
  ChevronDown,
  Sliders,
  Database,
  ScrollText,
  ListChecks,
  Users,
  UserCog,
  Building2,
  KeyRound,
  Webhook,
  FileCode2,
  Send,
  Plug,
  Boxes,
  MapPin,
  Cpu,
  Zap,
} from "lucide-react";

interface MenuItem {
  label: string;
  to: string;
  icon: typeof Settings;
  description: string;
  badge?: string;
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

const menuGroups: MenuGroup[] = [
  {
    title: "Sistema",
    items: [
      {
        label: "Painel",
        to: "/admin/painel",
        icon: Sliders,
        description: "Visão geral administrativa",
      },
      {
        label: "Regras de Negócio",
        to: "/admin/regras-negocio",
        icon: ListChecks,
        description: "Parâmetros e validações",
        badge: "novo",
      },
      {
        label: "Banco de Dados",
        to: "/admin/banco-dados",
        icon: Database,
        description: "Configuração e métricas",
        badge: "novo",
      },
      {
        label: "Logs",
        to: "/admin/logs",
        icon: ScrollText,
        description: "Auditoria e eventos",
        badge: "novo",
      },
      {
        label: "Parâmetros",
        to: "/admin/parametros",
        icon: Settings,
        description: "Config gerais legadas",
      },
    ],
  },
  {
    title: "Identidade & Acesso",
    items: [
      {
        label: "Usuários",
        to: "/admin/usuarios",
        icon: Users,
        description: "Cadastro e atribuições",
        badge: "novo",
      },
      {
        label: "Perfis de Usuário",
        to: "/admin/perfis-usuario",
        icon: UserCog,
        description: "Roles e permissões",
        badge: "novo",
      },
      {
        label: "Perfis de Entidade",
        to: "/admin/perfis-entidade",
        icon: Building2,
        description: "Templates por tipo",
        badge: "novo",
      },
      {
        label: "LDAP / AD",
        to: "/admin/ldap",
        icon: KeyRound,
        description: "Diretório corporativo",
        badge: "novo",
      },
    ],
  },
  {
    title: "Integrações",
    items: [
      {
        label: "Webhooks",
        to: "/admin/webhooks",
        icon: Webhook,
        description: "Eventos para sistemas externos",
        badge: "novo",
      },
      {
        label: "SEI",
        to: "/admin/sei",
        icon: FileCode2,
        description: "Sistema Eletrônico de Informações",
        badge: "novo",
      },
      {
        label: "Notificações",
        to: "/admin/notificacoes",
        icon: Send,
        description: "SMTP, Teams, SMS, WhatsApp, Telegram",
        badge: "novo",
      },
      {
        label: "APIs Externas",
        to: "/admin/integracoes",
        icon: Plug,
        description: "Conectores e credenciais",
      },
    ],
  },
  {
    title: "Operacional",
    items: [
      {
        label: "Contenedores",
        to: "/admin/contenedores",
        icon: Boxes,
        description: "Catálogo de tipos",
      },
      {
        label: "Localizações",
        to: "/admin/localizacoes",
        icon: MapPin,
        description: "Ecopontos e geolocalização",
      },
      {
        label: "Inventário IoT",
        to: "/admin/iot",
        icon: Cpu,
        description: "Dispositivos e modelos",
        badge: "novo",
      },
      {
        label: "Listas Suspensas",
        to: "/admin/listas",
        icon: ListChecks,
        description: "Catálogos de opções",
        badge: "novo",
      },
      {
        label: "Ações Automáticas",
        to: "/admin/acoes-automaticas",
        icon: Zap,
        description: "Triggers e automações",
        badge: "novo",
      },
    ],
  },
];

interface AdminMegaMenuProps {
  active: boolean;
}

const AdminMegaMenu = ({ active }: AdminMegaMenuProps) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-3 h-9 rounded-md text-sm transition-colors ${
          active
            ? "bg-[hsl(var(--topnav-active))] text-[hsl(var(--topnav-active-foreground))] font-medium"
            : "text-[hsl(var(--topnav-foreground))] hover:bg-[hsl(var(--topnav-hover))]"
        }`}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <Settings className="h-4 w-4" strokeWidth={1.75} />
        <span>Administração</span>
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
          strokeWidth={1.75}
        />
      </button>

      {open && (
        <div
          className="absolute left-0 top-full mt-1 w-[720px] max-w-[92vw] bg-popover border border-border rounded-lg shadow-fiori-3 p-4 z-50"
          role="menu"
        >
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            {menuGroups.map((group) => (
              <div key={group.title}>
                <h6 className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2 px-2">
                  {group.title}
                </h6>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.to}
                        onClick={() => {
                          navigate(item.to);
                          setOpen(false);
                        }}
                        className="w-full flex items-start gap-2.5 px-2 py-1.5 rounded-md hover:bg-secondary text-left transition-colors group"
                      >
                        <div className="mt-0.5 p-1.5 rounded-md bg-secondary group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                          <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium text-foreground">
                              {item.label}
                            </span>
                            {item.badge && (
                              <span className="text-[9px] font-semibold uppercase tracking-wide bg-primary/10 text-primary px-1 py-px rounded">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground leading-tight">
                            {item.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-[10px] text-muted-foreground px-2">
            <span>Centro de configuração SINARV</span>
            <button
              onClick={() => {
                navigate("/admin/painel");
                setOpen(false);
              }}
              className="text-primary hover:underline font-medium"
            >
              Ir ao painel admin →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMegaMenu;
