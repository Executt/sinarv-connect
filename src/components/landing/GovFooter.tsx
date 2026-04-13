import { Recycle } from "lucide-react";

const GovFooter = () => {
  return (
    <footer className="bg-gov-header text-sidebar-foreground py-10">
      <div className="container max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Recycle className="h-5 w-5 text-primary-glow" />
              <span className="font-bold text-gov-header-foreground">SINARV</span>
            </div>
            <p className="text-sm text-sidebar-muted leading-relaxed">
              Sistema Nacional de Rastreabilidade e Valorização de Resíduos Sólidos. 
              Ministério do Meio Ambiente — Governo Federal.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gov-header-foreground text-sm mb-3">Links Úteis</h4>
            <ul className="space-y-2 text-sm text-sidebar-muted">
              <li><a href="#" className="hover:text-gov-header-foreground transition-colors">Política Nacional de Resíduos</a></li>
              <li><a href="#" className="hover:text-gov-header-foreground transition-colors">Dados Abertos</a></li>
              <li><a href="#" className="hover:text-gov-header-foreground transition-colors">API para Desenvolvedores</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gov-header-foreground text-sm mb-3">Contato</h4>
            <ul className="space-y-2 text-sm text-sidebar-muted">
              <li>sinarv@gov.br</li>
              <li>0800 123 4567</li>
              <li>Esplanada dos Ministérios — Brasília/DF</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-sidebar-border pt-6 text-center text-xs text-sidebar-muted">
          © 2026 SINARV — Governo Federal do Brasil. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
};

export default GovFooter;
