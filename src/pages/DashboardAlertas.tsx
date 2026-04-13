import { AlertTriangle, AlertCircle, Info, CheckCircle2, Clock, Bell, BellOff, Filter } from "lucide-react";
import { useState } from "react";

type Severity = "critical" | "high" | "medium" | "low";
type AlertStatus = "active" | "acknowledged" | "resolved";

interface Alert {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  status: AlertStatus;
  source: string;
  timestamp: string;
  module: string;
}

const alerts: Alert[] = [
  { id: "ALR-0047", title: "Peso divergente no lote LOT-2026-00479", description: "Diferença de 340kg entre peso declarado e peso na balança de destino. Possível perda ou desvio de material.", severity: "critical", status: "active", source: "Módulo Rastreabilidade", timestamp: "13/04/2026 09:12", module: "Rastreabilidade" },
  { id: "ALR-0046", title: "Certificado ambiental expirado — VidroClear Ltda", description: "Licença ambiental de operação vencida em 01/04/2026. Empresa continua a receber lotes.", severity: "critical", status: "active", source: "Módulo Auditoria", timestamp: "13/04/2026 08:45", module: "Auditoria" },
  { id: "ALR-0045", title: "Alta taxa de rejeição na triagem — Coop. Verde Vida BA", description: "Taxa de rejeição de 38% nos últimos 7 dias, acima do limiar de 25%.", severity: "high", status: "active", source: "Módulo Operacional", timestamp: "12/04/2026 17:30", module: "Operacional" },
  { id: "ALR-0044", title: "Atraso de entrega superior a 72h", description: "Lote LOT-2026-00471 está em trânsito há 96 horas sem atualização de GPS.", severity: "high", status: "acknowledged", source: "Módulo Logística", timestamp: "12/04/2026 14:20", module: "Rastreabilidade" },
  { id: "ALR-0043", title: "Tentativa de acesso não autorizado", description: "5 tentativas falhas de login na conta de auditor Roberto L. Costa nas últimas 2 horas.", severity: "high", status: "resolved", source: "Módulo Segurança", timestamp: "12/04/2026 11:05", module: "Segurança" },
  { id: "ALR-0042", title: "Capacidade de armazenamento próxima do limite", description: "EcoPonto Curitiba está a 92% da capacidade de armazenamento máxima.", severity: "medium", status: "active", source: "Módulo Operacional", timestamp: "11/04/2026 16:40", module: "Operacional" },
  { id: "ALR-0041", title: "Nova cooperativa pendente de validação", description: "Cooperativa ReciclaVale RS solicitou cadastro há 5 dias sem verificação.", severity: "low", status: "active", source: "Módulo Cadastro", timestamp: "11/04/2026 10:15", module: "Cadastro" },
  { id: "ALR-0040", title: "Relatório mensal gerado automaticamente", description: "Relatório de março/2026 disponível para download no painel de relatórios.", severity: "low", status: "resolved", source: "Sistema", timestamp: "10/04/2026 08:00", module: "Sistema" },
];

const severityConfig: Record<Severity, { icon: typeof AlertTriangle; color: string; bg: string; label: string }> = {
  critical: { icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/10", label: "Crítico" },
  high: { icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10", label: "Alto" },
  medium: { icon: Info, color: "text-info", bg: "bg-info/10", label: "Médio" },
  low: { icon: Info, color: "text-muted-foreground", bg: "bg-muted", label: "Baixo" },
};

const statusConfig: Record<AlertStatus, { icon: typeof Bell; label: string; color: string }> = {
  active: { icon: Bell, label: "Ativo", color: "bg-destructive/10 text-destructive" },
  acknowledged: { icon: Clock, label: "Reconhecido", color: "bg-warning/10 text-warning" },
  resolved: { icon: CheckCircle2, label: "Resolvido", color: "bg-success/10 text-success" },
};

const Alertas = () => {
  const [filterSeverity, setFilterSeverity] = useState<Severity | "all">("all");
  const [filterStatus, setFilterStatus] = useState<AlertStatus | "all">("all");

  const filtered = alerts.filter(a =>
    (filterSeverity === "all" || a.severity === filterSeverity) &&
    (filterStatus === "all" || a.status === filterStatus)
  );

  const activeCount = alerts.filter(a => a.status === "active").length;
  const criticalCount = alerts.filter(a => a.severity === "critical" && a.status === "active").length;

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-lg p-5 shadow-card border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Bell className="h-5 w-5 text-destructive" />
            <span className="text-sm text-muted-foreground">Alertas Ativos</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{activeCount}</p>
        </div>
        <div className="bg-card rounded-lg p-5 shadow-card border border-border">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <span className="text-sm text-muted-foreground">Críticos Ativos</span>
          </div>
          <p className="text-2xl font-bold text-destructive">{criticalCount}</p>
        </div>
        <div className="bg-card rounded-lg p-5 shadow-card border border-border">
          <div className="flex items-center gap-2 mb-2">
            <BellOff className="h-5 w-5 text-success" />
            <span className="text-sm text-muted-foreground">Resolvidos (mês)</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{alerts.filter(a => a.status === "resolved").length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Severidade:</span>
          {(["all", "critical", "high", "medium", "low"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterSeverity(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filterSeverity === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-secondary"
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
                filterStatus === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-secondary"
              }`}
            >
              {s === "all" ? "Todos" : statusConfig[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* Alert list */}
      <div className="space-y-3">
        {filtered.map((alert) => {
          const sev = severityConfig[alert.severity];
          const stat = statusConfig[alert.status];
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
                      <span className="font-mono text-xs text-muted-foreground">{alert.id}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sev.bg} ${sev.color}`}>{sev.label}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${stat.color}`}>{stat.label}</span>
                    </div>
                    <h4 className="text-sm font-semibold text-foreground mb-1">{alert.title}</h4>
                    <p className="text-xs text-muted-foreground mb-2">{alert.description}</p>
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span>{alert.source}</span>
                      <span>{alert.timestamp}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Alertas;
