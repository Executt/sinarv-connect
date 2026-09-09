import { TrendingUp, Recycle, Scale, Leaf, DollarSign, Box } from "lucide-react";
import { useInView, useCountUp } from "@/hooks/use-in-view";
import { useIndicadores, useEconomiaEstado } from "@/hooks/use-sinarv-data";

const iconMap: Record<string, typeof Recycle> = {
  "Toneladas Recicladas Hoje": Recycle,
  "CO₂ Evitado (mês)": Leaf,
  "Cooperativas Ativas": TrendingUp,
  "Empregos Gerados": Scale,
  "Economia Gerada (R$ mi)": DollarSign,
  "Volume Desviado (mil m³)": Box,
};

const fallbackIndicators = [
  { label: "Toneladas Recicladas Hoje", value: 1247, suffix: "t" },
  { label: "CO₂ Evitado (mês)", value: 3842, suffix: "t" },
  { label: "Cooperativas Ativas", value: 1893, suffix: "" },
  { label: "Empregos Gerados", value: 24500, suffix: "" },
];

const formatNumber = (n: number) => n.toLocaleString("pt-BR");

const CounterCard = ({ label, numericValue, suffix, index, inView }: { label: string; numericValue: number; suffix: string; index: number; inView: boolean }) => {
  const count = useCountUp(numericValue, 1800, inView);
  const Icon = iconMap[label] || Recycle;

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
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <p className="text-3xl md:text-4xl font-bold text-primary mb-1">
        {formatNumber(count)}<span className="text-lg text-muted-foreground ml-1">{suffix}</span>
      </p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
};

const SustainabilityIndicators = () => {
  const { ref, inView } = useInView();
  const { data: dbIndicators } = useIndicadores();
  const { data: economia } = useEconomiaEstado();

  const baseIndicators = dbIndicators && dbIndicators.length > 0
    ? dbIndicators.map((ind) => ({ label: ind.label, value: Number(ind.value), suffix: ind.suffix }))
    : fallbackIndicators;

  const totalEconomiaMi = economia
    ? Math.round(economia.reduce((sum, e) => sum + Number(e.economia_total_rs || 0), 0) / 1_000_000)
    : 0;
  const totalVolumeMilM3 = economia
    ? Math.round(economia.reduce((sum, e) => sum + Number(e.volume_reciclado_m3 || 0), 0) / 1_000)
    : 0;

  const usandoDemo = !dbIndicators || dbIndicators.length === 0;

  const indicators = totalEconomiaMi > 0
    ? [
        ...baseIndicators,
        { label: "Economia Gerada (R$ mi)", value: totalEconomiaMi, suffix: "" },
        { label: "Volume Desviado (mil m³)", value: totalVolumeMilM3, suffix: "" },
      ]
    : baseIndicators;

  return (
    <section id="indicadores" className="bg-background py-16 md:py-20">
      <div className="container max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-3">Indicadores Públicos de Sustentabilidade</h3>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Dados atualizados a partir da rede nacional de rastreabilidade.
          </p>
          {usandoDemo && (
            <p className="mt-3 inline-block rounded-md border border-border bg-muted px-3 py-1.5 text-xs text-muted-foreground">
              Números ilustrativos de demonstração — ainda sem dados oficiais carregados.
            </p>
          )}
        </div>
        <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {indicators.map((ind, i) => (
            <CounterCard key={ind.label} label={ind.label} numericValue={ind.value} suffix={ind.suffix} index={i} inView={inView} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default SustainabilityIndicators;
