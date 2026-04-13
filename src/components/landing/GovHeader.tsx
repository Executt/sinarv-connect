import { Recycle } from "lucide-react";
import { Link } from "react-router-dom";

const GovHeader = () => {
  return (
    <header className="bg-gov-header border-b border-sidebar-border">
      {/* Top strip */}
      <div className="bg-primary py-1">
        <div className="container max-w-7xl mx-auto px-4 flex items-center justify-between">
          <span className="text-primary-foreground text-xs tracking-wide opacity-80">
            GOVERNO FEDERAL — REPÚBLICA FEDERATIVA DO BRASIL
          </span>
          <div className="flex gap-4 text-xs text-primary-foreground opacity-70">
            <a href="#" className="hover:opacity-100 transition-opacity">Acessibilidade</a>
            <a href="#" className="hover:opacity-100 transition-opacity">Mapa do Site</a>
          </div>
        </div>
      </div>
      {/* Main header */}
      <div className="container max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary-glow rounded-lg p-2">
            <Recycle className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-gov-header-foreground font-bold text-lg leading-tight tracking-tight">SINARV</h1>
            <p className="text-sidebar-muted text-xs leading-tight">Sistema Nacional de Rastreabilidade e Valorização de Resíduos Sólidos</p>
          </div>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm text-sidebar-foreground">
          <a href="#sobre" className="hover:text-primary-foreground transition-colors">Sobre</a>
          <a href="#acesso" className="hover:text-primary-foreground transition-colors">Acesso</a>
          <a href="#indicadores" className="hover:text-primary-foreground transition-colors">Indicadores</a>
          <Link to="/dashboard" className="bg-primary-glow hover:bg-accent text-primary-foreground px-4 py-2 rounded-md text-sm font-medium transition-colors">
            Painel Gov
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default GovHeader;
