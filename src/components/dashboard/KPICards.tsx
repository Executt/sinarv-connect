import { TrendingUp, Recycle, Scale, AlertTriangle } from "lucide-react";

const kpis = [
  { label: "Volume Processado (mês)", value: "38.920 t", change: "+12.4%", icon: Scale, positive: true },
  { label: "Transações Registadas", value: "142.318", change: "+8.2%", icon: Recycle, positive: true },
  { label: "Taxa de Conformidade", value: "94.7%", change: "+1.3%", icon: TrendingUp, positive: true },
  { label: "Alertas Pendentes", value: "23", change: "-5", icon: AlertTriangle, positive: false },
];

const KPICards = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi) => (
        <div key={kpi.label} className="bg-card rounded-lg p-5 shadow-card border border-border">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-primary-light flex items-center justify-center">
              <kpi.icon className="h-5 w-5 text-primary" />
            </div>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${kpi.positive ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
              {kpi.change}
            </span>
          </div>
          <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
          <p className="text-xs text-muted-foreground mt-1">{kpi.label}</p>
        </div>
      ))}
    </div>
  );
};

export default KPICards;
