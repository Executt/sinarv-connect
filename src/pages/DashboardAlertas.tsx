import { AlertTriangle, AlertCircle, Info, CheckCircle2, Clock, Bell, BellOff, Filter } from "lucide-react";
import { useState } from "react";
import { useAlertas } from "@/hooks/use-sinarv-data";
import { Skeleton } from "@/components/ui/skeleton";

type Severity = "critical" | "high" | "medium" | "low";
type AlertStatusType = "active" | "acknowledged" | "resolved";

const severityConfig: Record<Severity, { icon: typeof AlertTriangle; color: string; bg: string; label: string }> = {
  critical: { icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/10", label: "Crítico" },
  high: { icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10", label: "Alto" },
  medium: { icon: Info, color: "text-info", bg: "bg-info/10", label: "Médio" },
  low: { icon: Info, color: "text-muted-foreground", bg: "bg-muted", label: "Baixo" },
};

const statusConfig: Record<AlertStatusType, { icon: typeof Bell; label: string; color: string }> = {
  active: { icon: Bell, label: "Ativo", color: "bg-destructive/10 text-destructive" },
  acknowledged: { icon: Clock, label: "Reconhecido", color: "bg-warning/10 text-warning" },
  resolved: { icon: CheckCircle2, label: "Resolvido", color: "bg-success/10 text-success" },
};

const Alertas = () => {
  const [filterSeverity, setFilterSeverity] = useState<Severity | "all">("all");
  const [filterStatus, setFilterStatus] = useState<AlertStatusType | "all">("all");
  const { data: alerts, isLoading } = useAlertas();

  const list = alerts ?? [];
  const filtered = list.filter(a =>
    (filterSeverity === "all" || a.severity === filterSeverity) &&
    (filterStatus === "all" || a.status === filterStatus)
  );

  const activeCount = list.filter(a => a.status === "active").length;
  const criticalCount = list.filter(a => a.severity === "critical" && a.status === "active").length;
  const resolvedCount = list.filter(a => a.status === "resolved").length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-lg p-5 shadow-card border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Bell className="h-5 w-5 text-destructive" />
            <span className="text-sm text-muted-foreground">Alertas Ativos</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{isLoading ? <Skeleton className="h-7 w-8" /> : activeCount}</p>
        </div>
        <div className="bg-card rounded-lg p-5 shadow-card border border-border">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <span className="text-sm text-muted-foreground">Críticos Ativos</span>
          </div>
          <p className="text-2xl font-bold text-destructive">{isLoading ? <Skeleton className="h-7 w-8" /> : criticalCount}</p>
        </div>
        <div className="bg-card rounded-lg p-5 shadow-card border border-border">
          <div className="flex items-center gap-2 mb-2">
            <BellOff className="h-5 w-5 text-success" />
            <span className="text-sm text-muted-foreground">Resolvidos (mês)</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{isLoading ? <Skeleton className="h-7 w-8" /> : resolvedCount}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Severidade:</span>
          {(["all", "critical", "high", "medium", "low"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterSeverity(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filterSeverity === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-secondary"
              }`}
            >
              {s === "all" ? "Todos" : severityConfig[s].label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status:</span>
          {(["all", "active", "acknowledged", "resolved"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filterStatus === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-secondary"
              }`}
            >
              {s === "all" ? "Todos" : statusConfig[s].label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card rounded-lg p-5 shadow-card border border-border">
              <Skeleton className="h-20 w-full" />
            </div>
          ))
        ) : (
          filtered.map((alert) => {
            const sev = severityConfig[alert.severity as Severity];
            const stat = statusConfig[alert.status as AlertStatusType];
            const SevIcon = sev.icon;

            return (
              <div key={alert.id} className={`bg-card rounded-lg shadow-card border border-border overflow-hidden transition-shadow hover:shadow-card-hover ${alert.severity === "critical" && alert.status === "active" ? "border-l-4 border-l-destructive" : ""}`}>
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${sev.bg}`}>
                      <SevIcon className={`h-5 w-5 ${sev.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-muted-foreground">{alert.codigo}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sev.bg} ${sev.color}`}>{sev.label}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${stat.color}`}>{stat.label}</span>
                      </div>
                      <h4 className="text-sm font-semibold text-foreground mb-1">{alert.title}</h4>
                      <p className="text-xs text-muted-foreground mb-2">{alert.description}</p>
                      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                        <span>{alert.source}</span>
                        <span>{new Date(alert.created_at).toLocaleString("pt-BR")}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Alertas;
