import { ClipboardCheck, ShieldCheck, ShieldAlert, Search, ChevronDown, Eye } from "lucide-react";
import { useState } from "react";

type AuditStatus = "Conforme" | "Não Conforme" | "Pendente" | "Em Análise";

interface AuditRecord {
  id: string;
  entidade: string;
  tipo: string;
  data: string;
  auditor: string;
  status: AuditStatus;
  pontuacao: number;
}

const auditorias: AuditRecord[] = [
  { id: "AUD-2026-0312", entidade: "Ind. PlastBR Ltda", tipo: "Conformidade Ambiental", data: "12/04/2026", auditor: "Carlos M. Silva", status: "Conforme", pontuacao: 96 },
  { id: "AUD-2026-0311", entidade: "MetalSul S.A.", tipo: "Rastreabilidade", data: "11/04/2026", auditor: "Ana P. Santos", status: "Conforme", pontuacao: 91 },
  { id: "AUD-2026-0310", entidade: "Coop. Verde Vida BA", tipo: "Operacional", data: "10/04/2026", auditor: "Roberto L. Costa", status: "Pendente", pontuacao: 0 },
  { id: "AUD-2026-0309", entidade: "VidroClear Ltda", tipo: "Conformidade Ambiental", data: "09/04/2026", auditor: "Mariana F. Oliveira", status: "Não Conforme", pontuacao: 62 },
  { id: "AUD-2026-0308", entidade: "PapelNorte Ind.", tipo: "Rastreabilidade", data: "08/04/2026", auditor: "Carlos M. Silva", status: "Conforme", pontuacao: 88 },
  { id: "AUD-2026-0307", entidade: "PlastRecicla PR", tipo: "Operacional", data: "07/04/2026", auditor: "Ana P. Santos", status: "Em Análise", pontuacao: 74 },
  { id: "AUD-2026-0306", entidade: "AluBrasil S.A.", tipo: "Conformidade Ambiental", data: "06/04/2026", auditor: "Roberto L. Costa", status: "Conforme", pontuacao: 93 },
];

const statusConfig: Record<AuditStatus, string> = {
  "Conforme": "bg-success/10 text-success",
  "Não Conforme": "bg-destructive/10 text-destructive",
  "Pendente": "bg-warning/10 text-warning",
  "Em Análise": "bg-info/10 text-info",
};

const ScoreBar = ({ score }: { score: number }) => {
  if (score === 0) return <span className="text-xs text-muted-foreground">—</span>;
  const color = score >= 85 ? "bg-success" : score >= 70 ? "bg-warning" : "bg-destructive";
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-medium text-foreground">{score}%</span>
    </div>
  );
};

const Auditoria = () => {
  const [search, setSearch] = useState("");
  const filtered = auditorias.filter(a =>
    a.entidade.toLowerCase().includes(search.toLowerCase()) ||
    a.id.toLowerCase().includes(search.toLowerCase())
  );

  const conformes = auditorias.filter(a => a.status === "Conforme").length;
  const naoConformes = auditorias.filter(a => a.status === "Não Conforme").length;
  const pendentes = auditorias.filter(a => a.status === "Pendente" || a.status === "Em Análise").length;

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-lg p-5 shadow-card border border-border">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="h-5 w-5 text-success" />
            <span className="text-sm text-muted-foreground">Conformes</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{conformes}</p>
          <p className="text-xs text-success mt-1">Taxa: {((conformes / auditorias.length) * 100).toFixed(0)}%</p>
        </div>
        <div className="bg-card rounded-lg p-5 shadow-card border border-border">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="h-5 w-5 text-destructive" />
            <span className="text-sm text-muted-foreground">Não Conformes</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{naoConformes}</p>
          <p className="text-xs text-destructive mt-1">Requerem ação imediata</p>
        </div>
        <div className="bg-card rounded-lg p-5 shadow-card border border-border">
          <div className="flex items-center gap-2 mb-2">
            <ClipboardCheck className="h-5 w-5 text-warning" />
            <span className="text-sm text-muted-foreground">Pendentes / Em Análise</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{pendentes}</p>
          <p className="text-xs text-warning mt-1">Aguardando conclusão</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Pesquisar auditoria por entidade ou ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg shadow-card border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface text-muted-foreground text-xs uppercase tracking-wider">
                <th className="text-left px-5 py-3 font-medium">ID</th>
                <th className="text-left px-5 py-3 font-medium">Entidade</th>
                <th className="text-left px-5 py-3 font-medium">Tipo</th>
                <th className="text-left px-5 py-3 font-medium">Data</th>
                <th className="text-left px-5 py-3 font-medium">Auditor</th>
                <th className="text-left px-5 py-3 font-medium">Pontuação</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
                <th className="text-left px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} className="border-t border-border hover:bg-surface/50 transition-colors">
                  <td className="px-5 py-3 font-mono text-xs text-primary">{a.id}</td>
                  <td className="px-5 py-3 text-foreground font-medium">{a.entidade}</td>
                  <td className="px-5 py-3 text-muted-foreground">{a.tipo}</td>
                  <td className="px-5 py-3 text-muted-foreground">{a.data}</td>
                  <td className="px-5 py-3 text-foreground">{a.auditor}</td>
                  <td className="px-5 py-3"><ScoreBar score={a.pontuacao} /></td>
                  <td className="px-5 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[a.status]}`}>{a.status}</span>
                  </td>
                  <td className="px-5 py-3">
                    <button className="p-1.5 rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Auditoria;
