import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutGrid,
  Building2,
  Factory,
  MapPin,
  Shield,
  Users,
  Settings,
} from "lucide-react";

interface Module {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  path: string;
  color: string;
}

const modules: Module[] = [
  {
    id: "gov",
    label: "Governo",
    description: "Painel governamental PNRS",
    icon: Shield,
    path: "/dashboard",
    color: "bg-[hsl(210,100%,30%)]",
  },
  {
    id: "cooperativa",
    label: "Cooperativas",
    description: "Gestão de recicláveis",
    icon: Building2,
    path: "/cooperativa/painel",
    color: "bg-[hsl(145,63%,42%)]",
  },
  {
    id: "industria",
    label: "Indústria",
    description: "Logística reversa e ESG",
    icon: Factory,
    path: "/industria/dashboard",
    color: "bg-[hsl(38,92%,50%)]",
  },
  {
    id: "ponto_coleta",
    label: "Ponto de Coleta",
    description: "Recebimento de materiais",
    icon: MapPin,
    path: "/ponto-coleta/dashboard",
    color: "bg-[hsl(210,90%,50%)]",
  },
  {
    id: "cidadao",
    label: "Cidadão",
    description: "App do cidadão reciclador",
    icon: Users,
    path: "/transparencia/mapa-reciclagem",
    color: "bg-[hsl(280,60%,50%)]",
  },
  {
    id: "super_admin",
    label: "Administração",
    description: "Parametrização do sistema",
    icon: Settings,
    path: "/admin/painel",
    color: "bg-[hsl(0,0%,30%)]",
  },
];

const AppSwitcher = () => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const currentModule = modules.find((m) =>
    location.pathname.startsWith(m.path.split("/").slice(0, 2).join("/"))
  );

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-lg hover:bg-white/10 transition-colors"
        title="Seletor de Módulos"
      >
        <LayoutGrid className="h-5 w-5 text-white" />
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-popover rounded-lg shadow-xl border border-border z-50 p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Módulos SINARV
          </p>
          <div className="grid grid-cols-2 gap-2">
            {modules.map((mod) => {
              const Icon = mod.icon;
              const isActive = currentModule?.id === mod.id;
              return (
                <button
                  key={mod.id}
                  onClick={() => {
                    navigate(mod.path);
                    setOpen(false);
                  }}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg text-center transition-all hover:bg-secondary ${
                    isActive ? "bg-primary/5 ring-1 ring-primary" : ""
                  }`}
                >
                  <div className={`${mod.color} p-2.5 rounded-lg`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground leading-tight">
                      {mod.label}
                    </p>
                    <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                      {mod.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AppSwitcher;
