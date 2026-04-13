import { Search, Filter, MapPin, ArrowRight, Package, Truck, Factory, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { useState } from "react";

const lotes = [
  { id: "LOT-2026-00482", material: "PET Transparente", peso: "4.200 kg", origem: "Cooperativa Recicla SP", destino: "Ind. PlastBR Ltda", etapas: 4, etapaAtual: 4, status: "Entregue", statusColor: "bg-success/10 text-success" },
  { id: "LOT-2026-00481", material: "Alumínio Latas", peso: "1.350 kg", origem: "Assoc. Catadores RJ", destino: "MetalSul S.A.", etapas: 4, etapaAtual: 3, status: "Em Trânsito", statusColor: "bg-info/10 text-info" },
  { id: "LOT-2026-00480", material: "Papelão Ondulado", peso: "6.800 kg", origem: "Coop. Verde Vida BA", destino: "PapelNorte Ind.", etapas: 4, etapaAtual: 4, status: "Entregue", statusColor: "bg-success/10 text-success" },
  { id: "LOT-2026-00479", material: "HDPE Colorido", peso: "2.100 kg", origem: "EcoPonto Curitiba", destino: "PlastRecicla PR", etapas: 4, etapaAtual: 2, status: "Em Processamento", statusColor: "bg-warning/10 text-warning" },
  { id: "LOT-2026-00478", material: "Vidro Misto", peso: "3.500 kg", origem: "Reciclagem Manaus", destino: "VidroClear Ltda", etapas: 4, etapaAtual: 1, status: "Coletado", statusColor: "bg-primary/10 text-primary" },
  { id: "LOT-2026-00477", material: "Alumínio Industrial", peso: "890 kg", origem: "MetalColet MG", destino: "AluBrasil S.A.", etapas: 4, etapaAtual: 3, status: "Em Trânsito", statusColor: "bg-info/10 text-info" },
];

const etapasLabels = ["Coleta", "Triagem", "Transporte", "Entrega"];
const etapasIcons = [Package, CheckCircle2, Truck, Factory];

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
  const filtered = lotes.filter(l =>
    l.id.toLowerCase().includes(search.toLowerCase()) ||
    l.material.toLowerCase().includes(search.toLowerCase()) ||
    l.origem.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Search bar */}
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

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Lotes Ativos", value: "1.247", icon: Package, color: "text-primary" },
          { label: "Em Trânsito", value: "342", icon: Truck, color: "text-info" },
          { label: "Entregues (mês)", value: "856", icon: CheckCircle2, color: "text-success" },
          { label: "Pendentes", value: "49", icon: Clock, color: "text-warning" },
        ].map((s) => (
          <div key={s.label} className="bg-card rounded-lg p-4 shadow-card border border-border">
            <div className="flex items-center gap-2 mb-2">
              <s.icon className={`h-4 w-4 ${s.color}`} />
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
            <p className="text-xl font-bold text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Lotes list */}
      <div className="space-y-3">
        {filtered.map((lote) => (
          <div key={lote.id} className="bg-card rounded-lg p-5 shadow-card border border-border hover:shadow-card-hover transition-shadow">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-mono text-sm font-semibold text-primary">{lote.id}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${lote.statusColor}`}>{lote.status}</span>
                </div>
                <p className="text-sm text-foreground font-medium">{lote.material} — {lote.peso}</p>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>{lote.origem}</span>
                  <ArrowRight className="h-3 w-3" />
                  <span>{lote.destino}</span>
                </div>
              </div>

              {/* Timeline */}
              <div className="flex items-center gap-0">
                {etapasLabels.map((_, i) => (
                  <TimelineStep key={i} index={i} current={lote.etapaAtual} total={lote.etapas} />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Rastreabilidade;
