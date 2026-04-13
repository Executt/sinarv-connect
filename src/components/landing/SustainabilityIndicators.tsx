import { TrendingUp, Recycle, Scale, Leaf } from "lucide-react";
import { useInView, useCountUp } from "@/hooks/use-in-view";

const indicators = [
  { label: "Toneladas Recicladas Hoje", numericValue: 1247, displayPrefix: "", icon: Recycle, suffix: "t" },
  { label: "Materiais Rastreados (mês)", numericValue: 38920, displayPrefix: "", icon: Scale, suffix: "t" },
  { label: "Cooperativas Ativas", numericValue: 2841, displayPrefix: "", icon: TrendingUp, suffix: "" },
  { label: "CO₂ Evitado (ano)", numericValue: 124500, displayPrefix: "", icon: Leaf, suffix: "t" },
];

const formatNumber = (n: number) => n.toLocaleString("pt-BR");

const CounterCard = ({ ind, index, inView }: { ind: typeof indicators[0]; index: number; inView: boolean }) => {
  const count = useCountUp(ind.numericValue, 1800, inView);

  return (
    <div
      className="bg-card rounded-lg p-6 shadow-card border border-border text-center transition-all duration-500"
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(24px)",
        transitionDelay: `${index * 120}ms`,
      }}
    >
      <div className="w-12 h-12 rounded-full bg-primary-light flex items-center justify-center mx-auto mb-4">
        <ind.icon className="h-6 w-6 text-primary" />
      </div>
      <p className="text-3xl md:text-4xl font-bold text-primary mb-1">
        {formatNumber(count)}<span className="text-lg text-muted-foreground ml-1">{ind.suffix}</span>
      </p>
      <p className="text-sm text-muted-foreground">{ind.label}</p>
    </div>
  );
};

const SustainabilityIndicators = () => {
  const { ref, inView } = useInView();

  return (
    <section id="indicadores" className="bg-background py-16 md:py-20">
      <div className="container max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-3">Indicadores Públicos de Sustentabilidade</h3>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Dados atualizados em tempo real a partir da rede nacional de rastreabilidade.
          </p>
        </div>
        <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {indicators.map((ind, i) => (
            <CounterCard key={ind.label} ind={ind} index={i} inView={inView} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default SustainabilityIndicators;
