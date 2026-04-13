import { ClipboardCheck, ShieldCheck, ShieldAlert, Search, Eye } from "lucide-react";
import { useState } from "react";
import { useAuditorias } from "@/hooks/use-sinarv-data";
import { Skeleton } from "@/components/ui/skeleton";

type AuditStatus = "Conforme" | "Não Conforme" | "Pendente" | "Em Análise";

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

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("pt-BR");
};

const Auditoria = () => {
  const [search, setSearch] = useState("");
  const { data: auditorias, isLoading } = useAuditorias();

  const list = auditorias ?? [];
  const filtered = list.filter(a =>
    a.entidade.toLowerCase().includes(search.toLowerCase()) ||
    a.codigo.toLowerCase().includes(search.toLowerCase())
  );

  const conformes = list.filter(a => a.status === "Conforme").length;
  const naoConformes = list.filter(a => a.status === "Não Conforme").length;
  const pendentes = list.filter(a => a.status === "Pendente" || a.status === "Em Análise").length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-lg p-5 shadow-card border border-border">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="h-5 w-5 text-success" />
            <span className="text-sm text-muted-foreground">Conformes</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{isLoading ? <Skeleton className="h-7 w-8" /> : conformes}</p>
          {!isLoading && list.length > 0 && <p className="text-xs text-success mt-1">Taxa: {((conformes / list.length) * 100).toFixed(0)}%</p>}
        </div>
        <div className="bg-card rounded-lg p-5 shadow-card border border-border">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="h-5 w-5 text-destructive" />
            <span className="text-sm text-muted-foreground">Não Conformes</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{isLoading ? <Skeleton className="h-7 w-8" /> : naoConformes}</p>
          <p className="text-xs text-destructive mt-1">Requerem ação imediata</p>
        </div>
        <div className="bg-card rounded-lg p-5 shadow-card border border-border">
          <div className="flex items-center gap-2 mb-2">
            <ClipboardCheck className="h-5 w-5 text-warning" />
            <span className="text-sm text-muted-foreground">Pendentes / Em Análise</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{isLoading ? <Skeleton className="h-7 w-8" /> : pendentes}</p>
          <p className="text-xs text-warning mt-1">Aguardando conclusão</p>
        </div>
      </div>

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
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-t border-border">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-5 py-3"><Skeleton className="h-4 w-16" /></td>
                    ))}
                  </tr>
                ))
              ) : (
                filtered.map((a) => (
                  <tr key={a.id} className="border-t border-border hover:bg-surface/50 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-primary">{a.codigo}</td>
                    <td className="px-5 py-3 text-foreground font-medium">{a.entidade}</td>
                    <td className="px-5 py-3 text-muted-foreground">{a.tipo}</td>
                    <td className="px-5 py-3 text-muted-foreground">{formatDate(a.data)}</td>
                    <td className="px-5 py-3 text-foreground">{a.auditor}</td>
                    <td className="px-5 py-3"><ScoreBar score={a.pontuacao} /></td>
                    <td className="px-5 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[a.status as AuditStatus] || "bg-muted text-muted-foreground"}`}>{a.status}</span>
                    </td>
                    <td className="px-5 py-3">
                      <button className="p-1.5 rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Auditoria;
