import { TrendingUp, Recycle, Scale, AlertTriangle } from "lucide-react";
import { useTelemetriaConsolidada } from "@/hooks/use-schema-data";
import { useAlertas } from "@/hooks/use-sinarv-data";
import { Skeleton } from "@/components/ui/skeleton";

const KPICards = () => {
  const { data: telemetria, isLoading: loadingTel } = useTelemetriaConsolidada();
  const { data: alertas, isLoading: loadingAlertas } = useAlertas();

  const isLoading = loadingTel || loadingAlertas;

  // Aggregate latest month telemetry
  const latestDate = telemetria?.[0]?.data_referencia;
  const latestMonth = telemetria?.filter((t: any) => t.data_referencia === latestDate) ?? [];
  const volumeProcessado = latestMonth.reduce((s: number, t: any) => s + Number(t.volume_total_coletado_ton || 0), 0);
  const volumeReciclado = latestMonth.reduce((s: number, t: any) => s + Number(t.volume_total_reciclado_ton || 0), 0);
  const taxaConformidade = volumeProcessado > 0 ? ((volumeReciclado / volumeProcessado) * 100) : 0;
  const alertasPendentes = alertas?.filter((a) => a.status === "active").length ?? 0;

  // Previous month for comparison
  const dates = [...new Set(telemetria?.map((t: any) => t.data_referencia) ?? [])].sort().reverse();
  const prevDate = dates[1];
  const prevMonth = telemetria?.filter((t: any) => t.data_referencia === prevDate) ?? [];
  const prevVolume = prevMonth.reduce((s: number, t: any) => s + Number(t.volume_total_coletado_ton || 0), 0);
  const volumeChange = prevVolume > 0 ? (((volumeProcessado - prevVolume) / prevVolume) * 100).toFixed(1) : "—";

  const kpis = [
    {
      label: "Volume Processado (mês)",
      value: `${volumeProcessado.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} t`,
      change: volumeChange !== "—" ? `${Number(volumeChange) >= 0 ? "+" : ""}${volumeChange}%` : "—",
      icon: Scale,
      positive: volumeChange === "—" || Number(volumeChange) >= 0,
    },
    {
      label: "Volume Reciclado (mês)",
      value: `${volumeReciclado.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} t`,
      change: `${latestMonth.length} estados`,
      icon: Recycle,
      positive: true,
    },
    {
      label: "Taxa Conversão (Col→Rec)",
      value: `${taxaConformidade.toFixed(1)}%`,
      change: "Coletado vs Reciclado",
      icon: TrendingUp,
      positive: taxaConformidade > 20,
    },
    {
      label: "Alertas Ativos",
      value: String(alertasPendentes),
      change: alertasPendentes === 0 ? "Nenhum" : `${alertasPendentes} pendente${alertasPendentes > 1 ? "s" : ""}`,
      icon: AlertTriangle,
      positive: alertasPendentes === 0,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi) => (
        <div key={kpi.label} className="bg-card rounded-lg p-5 shadow-fiori-1 hover:shadow-fiori-2 transition-shadow border border-border">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-primary-light flex items-center justify-center">
              {isLoading ? <Skeleton className="h-5 w-5 rounded" /> : <kpi.icon className="h-5 w-5 text-primary" />}
            </div>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${kpi.positive ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
              {isLoading ? <Skeleton className="h-3 w-12" /> : kpi.change}
            </span>
          </div>
          {isLoading ? (
            <Skeleton className="h-7 w-24 mb-1" />
          ) : (
            <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">{kpi.label}</p>
        </div>
      ))}
    </div>
  );
};

export default KPICards;
