import { Recycle, ChevronDown, Users, Truck, Building2, Factory, MapPin, Landmark } from "lucide-react";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const accessOptions = [
  { label: "Cidadão", icon: Users, href: "https://latinha-eco-cidadania-brasil.lovable.app", external: true, desc: "Aplicativo cidadão" },
  { label: "Coletor", icon: Truck, href: "https://latinha-eco-cidadania-brasil.lovable.app", external: true, desc: "Registre coletas pelo app" },
  { label: "Cooperativa", icon: Building2, href: "/cooperativa/painel", desc: "Pesagens, lotes e faturamento" },
  { label: "Indústria", icon: Factory, href: "/industria/metas-logisticas", desc: "Metas e certificados" },
  { label: "Ponto de Coleta", icon: MapPin, href: "/ponto-coleta/dashboard", desc: "Recebimento e metas" },
  { label: "Governo", icon: Landmark, href: "/dashboard", desc: "Painel de telemetria e auditoria" },
];

const GovHeader = () => {
  return (
    <header className="bg-gov-header border-b border-sidebar-border">
      {/* Top strip */}
      <div className="bg-primary py-1">
        <div className="container max-w-7xl mx-auto px-4 flex items-center justify-between">
          <span className="text-primary-foreground text-xs tracking-wide opacity-90">
            GOVERNO FEDERAL — REPÚBLICA FEDERATIVA DO BRASIL
          </span>
          <div className="flex gap-4 text-xs text-primary-foreground opacity-80">
            <a href="#" className="hover:opacity-100 transition-opacity">Acessibilidade</a>
            <a href="#" className="hover:opacity-100 transition-opacity">Mapa do Site</a>
          </div>
        </div>
      </div>
      {/* Main header */}
      <div className="container max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-3">
          <div className="bg-primary rounded-lg p-2">
            <Recycle className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-gov-header-foreground font-bold text-lg leading-tight tracking-tight">SINARV</h1>
            <p className="text-sidebar-muted text-xs leading-tight">Sistema Nacional de Rastreabilidade e Valorização de Resíduos Sólidos</p>
          </div>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm text-sidebar-foreground">
          <a href="#sobre" className="hover:text-primary transition-colors">Sobre</a>
          <a href="#mapa" className="hover:text-primary transition-colors">Mapa</a>
          <a href="#indicadores" className="hover:text-primary transition-colors">Indicadores</a>
          <Link to="/regras-triagem" className="hover:text-primary transition-colors">Regras de Triagem</Link>
          <Link to="/transparencia/mapa-reciclagem" className="hover:text-primary transition-colors">Transparência</Link>

          <DropdownMenu>
            <DropdownMenuTrigger className="bg-primary hover:bg-primary-glow text-primary-foreground px-4 py-2 rounded-md text-sm font-medium transition-colors inline-flex items-center gap-1.5 outline-none focus-visible:ring-2 focus-visible:ring-ring">
              Acessar
              <ChevronDown className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 bg-popover">
              <DropdownMenuLabel>Selecione seu perfil</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {accessOptions.map((opt) => {
                const Icon = opt.icon;
                const item = (
                  <DropdownMenuItem key={opt.label} className="cursor-pointer py-2.5">
                    <Icon className="h-4 w-4 mr-2 text-primary" />
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{opt.label}</span>
                      <span className="text-xs text-muted-foreground">{opt.desc}</span>
                    </div>
                  </DropdownMenuItem>
                );
                return opt.external ? (
                  <a key={opt.label} href={opt.href} target="_blank" rel="noopener noreferrer">{item}</a>
                ) : (
                  <Link key={opt.label} to={opt.href}>{item}</Link>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>
    </header>
  );
};

export default GovHeader;
