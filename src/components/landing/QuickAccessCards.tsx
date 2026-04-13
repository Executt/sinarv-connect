import { Users, Building2, Factory, ShieldCheck, ArrowUpRight } from "lucide-react";
import { useInView } from "@/hooks/use-in-view";

const portals = [
  {
    title: "Para Cidadãos e Catadores",
    description: "Aceda ao aplicativo de coleta e registre materiais recicláveis diretamente pelo seu telemóvel.",
    icon: Users,
    color: "bg-success/10 text-success",
    action: "Abrir Aplicativo",
    href: "https://latinha-eco-cidadania-brasil.lovable.app",
    external: true,
  },
  {
    title: "Para Cooperativas",
    description: "Gerencie pontos de coleta, pesagens e lotes de materiais recicláveis da sua cooperativa.",
    icon: Building2,
    color: "bg-info/10 text-info",
    action: "Acesso Cooperativas",
    href: "#",
  },
  {
    title: "Para Indústrias",
    description: "Consulte lotes disponíveis, comprove conformidade e acompanhe a cadeia de custódia.",
    icon: Factory,
    color: "bg-warning/10 text-warning",
    action: "Portal Industrial",
    href: "#",
  },
  {
    title: "Acesso Governamental",
    description: "Painel de telemetria, auditoria e monitoramento do ciclo completo de reciclagem.",
    icon: ShieldCheck,
    color: "bg-primary/10 text-primary",
    action: "Painel Gov",
    href: "/dashboard",
  },
];

const QuickAccessCards = () => {
  const { ref, inView } = useInView();

  return (
    <section id="acesso" className="bg-surface py-16 md:py-20">
      <div className="container max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-3">Acesso Rápido</h3>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Selecione o portal adequado ao seu perfil para acessar os serviços do SINARV.
          </p>
        </div>
        <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {portals.map((portal, i) => (
            <a
              key={portal.title}
              href={portal.href}
              target={portal.external ? "_blank" : undefined}
              rel={portal.external ? "noopener noreferrer" : undefined}
              className="group bg-card rounded-lg p-6 shadow-card hover:shadow-card-hover hover:border-primary/20 border border-border flex flex-col transition-all duration-500 hover:-translate-y-1"
              style={{
                opacity: inView ? 1 : 0,
                transform: inView ? "translateY(0)" : "translateY(24px)",
                transitionDelay: `${i * 100}ms`,
              }}
            >
              <div className={`w-11 h-11 rounded-lg flex items-center justify-center mb-4 ${portal.color}`}>
                <portal.icon className="h-5 w-5" />
              </div>
              <h4 className="font-semibold text-foreground mb-2">{portal.title}</h4>
              <p className="text-sm text-muted-foreground mb-4 flex-1">{portal.description}</p>
              <span className="inline-flex items-center text-sm font-medium text-accent group-hover:text-primary-glow transition-colors">
                {portal.action}
                <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default QuickAccessCards;
