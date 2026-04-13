import { Search, Filter, MapPin, ArrowRight, Package, Truck, Factory, CheckCircle2, Clock } from "lucide-react";
import { useState } from "react";
import { useLotes } from "@/hooks/use-sinarv-data";
import { Skeleton } from "@/components/ui/skeleton";

const etapasLabels = ["Coleta", "Triagem", "Transporte", "Entrega"];
const etapasIcons = [Package, CheckCircle2, Truck, Factory];

const statusColorMap: Record<string, string> = {
  "Coletado": "bg-primary/10 text-primary",
  "Em Processamento": "bg-warning/10 text-warning",
  "Em Trânsito": "bg-info/10 text-info",
  "Entregue": "bg-success/10 text-success",
};

const TimelineStep = ({ index, current, total }: { index: number; current: number; total: number }) => {
  const Icon = etapasIcons[index];
  const done = index < current;
  const active = index === current - 1;

  return (
    <div className="flex items-center gap-1">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${done ? "bg-success text-success-foreground" : active ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      {index < total - 1 && (
        <div className={`w-6 h-0.5 ${done ? "bg-success" : "bg-border"}`} />
      )}
    </div>
  );
};

const Rastreabilidade = () => {
  const [search, setSearch] = useState("");
  const { data: lotes, isLoading } = useLotes();

  const filtered = (lotes ?? []).filter(l =>
    l.codigo.toLowerCase().includes(search.toLowerCase()) ||
    l.material.toLowerCase().includes(search.toLowerCase()) ||
    l.origem.toLowerCase().includes(search.toLowerCase())
  );

  const totals = {
    ativos: lotes?.length ?? 0,
    transito: lotes?.filter(l => l.status === "Em Trânsito").length ?? 0,
    entregues: lotes?.filter(l => l.status === "Entregue").length ?? 0,
    pendentes: lotes?.filter(l => l.status === "Coletado" || l.status === "Em Processamento").length ?? 0,
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Pesquisar por ID do lote, material ou origem..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-lg text-sm text-foreground hover:bg-secondary transition-colors">
          <Filter className="h-4 w-4" />
          Filtros
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Lotes Ativos", value: totals.ativos, icon: Package, color: "text-primary" },
          { label: "Em Trânsito", value: totals.transito, icon: Truck, color: "text-info" },
          { label: "Entregues", value: totals.entregues, icon: CheckCircle2, color: "text-success" },
          { label: "Pendentes", value: totals.pendentes, icon: Clock, color: "text-warning" },
        ].map((s) => (
          <div key={s.label} className="bg-card rounded-lg p-4 shadow-card border border-border">
            <div className="flex items-center gap-2 mb-2">
              <s.icon className={`h-4 w-4 ${s.color}`} />
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
            <p className="text-xl font-bold text-foreground">{isLoading ? <Skeleton className="h-6 w-12" /> : s.value}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card rounded-lg p-5 shadow-card border border-border">
              <Skeleton className="h-16 w-full" />
            </div>
          ))
        ) : (
          filtered.map((lote) => (
            <div key={lote.id} className="bg-card rounded-lg p-5 shadow-card border border-border hover:shadow-card-hover transition-shadow">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-sm font-semibold text-primary">{lote.codigo}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColorMap[lote.status] || "bg-muted text-muted-foreground"}`}>{lote.status}</span>
                  </div>
                  <p className="text-sm text-foreground font-medium">{lote.material} — {lote.peso}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span>{lote.origem}</span>
                    <ArrowRight className="h-3 w-3" />
                    <span>{lote.destino}</span>
                  </div>
                </div>
                <div className="flex items-center gap-0">
                  {etapasLabels.map((_, i) => (
                    <TimelineStep key={i} index={i} current={lote.etapa_atual} total={4} />
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Rastreabilidade;
