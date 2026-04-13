import { TrendingUp, Recycle, Scale, Leaf } from "lucide-react";

const indicators = [
  { label: "Toneladas Recicladas Hoje", value: "1.247", icon: Recycle, suffix: "t" },
  { label: "Materiais Rastreados (mês)", value: "38.920", icon: Scale, suffix: "t" },
  { label: "Cooperativas Ativas", value: "2.841", icon: TrendingUp, suffix: "" },
  { label: "CO₂ Evitado (ano)", value: "124.500", icon: Leaf, suffix: "t" },
];

const SustainabilityIndicators = () => {
  return (
    <section id="indicadores" className="bg-background py-16 md:py-20">
      <div className="container max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-3">Indicadores Públicos de Sustentabilidade</h3>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Dados atualizados em tempo real a partir da rede nacional de rastreabilidade.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {indicators.map((ind) => (
            <div
              key={ind.label}
              className="bg-card rounded-lg p-6 shadow-card border border-border text-center"
            >
              <div className="w-12 h-12 rounded-full bg-primary-light flex items-center justify-center mx-auto mb-4">
                <ind.icon className="h-6 w-6 text-primary" />
              </div>
              <p className="text-3xl md:text-4xl font-bold text-primary mb-1">
                {ind.value}<span className="text-lg text-muted-foreground ml-1">{ind.suffix}</span>
              </p>
              <p className="text-sm text-muted-foreground">{ind.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SustainabilityIndicators;
