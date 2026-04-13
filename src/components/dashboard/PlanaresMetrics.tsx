import { useMetricasPlanares } from "@/hooks/use-schema-data";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Target } from "lucide-react";

const metaLabels: Record<string, string> = {
  "Fim Lixões": "Eliminação de Lixões",
  "% Reciclagem Urbana": "Reciclagem Urbana",
  "Recuperação Áreas Degradadas": "Recuperação de Áreas",
  "Inclusão Catadores": "Inclusão de Catadores",
  "Logística Reversa": "Logística Reversa",
};

const PlanaresMetrics = () => {
  const { data: metricas, isLoading } = useMetricasPlanares();

  // Get latest year
  const latestYear = metricas?.[0]?.ano_referencia;
  const latestMetrics = metricas?.filter((m: any) => m.ano_referencia === latestYear) ?? [];

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg p-5 shadow-card border border-border">
        <Skeleton className="h-5 w-64 mb-4" />
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      </div>
    );
  }

  if (latestMetrics.length === 0) return null;

  return (
    <div className="bg-card rounded-lg p-5 shadow-card border border-border">
      <div className="flex items-center gap-2 mb-5">
        <Target className="h-5 w-5 text-primary" />
        <h4 className="text-sm font-semibold text-foreground">
          Metas Planares — {latestYear}
        </h4>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {latestMetrics.map((m: any) => {
          const alvo = Number(m.valor_alvo);
          const atingido = Number(m.valor_atingido);
          const pct = alvo > 0 ? Math.min((atingido / alvo) * 100, 100) : 0;
          const label = metaLabels[m.tipo_meta] || m.tipo_meta;

          return (
            <div key={m.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-foreground">{label}</span>
                <span className={`text-xs font-bold ${pct >= 50 ? "text-success" : pct >= 25 ? "text-warning" : "text-destructive"}`}>
                  {pct.toFixed(1)}%
                </span>
              </div>
              <Progress value={pct} className="h-2" />
              <p className="text-[10px] text-muted-foreground">
                {atingido.toLocaleString("pt-BR")} de {alvo.toLocaleString("pt-BR")}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PlanaresMetrics;
