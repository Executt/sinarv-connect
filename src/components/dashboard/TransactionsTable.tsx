import { useTransacoes } from "@/hooks/use-sinarv-data";
import { Skeleton } from "@/components/ui/skeleton";

const statusColorMap: Record<string, string> = {
  "Concluída": "bg-success/10 text-success",
  "Em Trânsito": "bg-info/10 text-info",
  "Pendente": "bg-warning/10 text-warning",
  "Auditoria": "bg-destructive/10 text-destructive",
};

const TransactionsTable = () => {
  const { data: transactions, isLoading } = useTransacoes();

  return (
    <div className="bg-card rounded-lg shadow-card border border-border overflow-hidden">
      <div className="p-5 border-b border-border">
        <h4 className="text-sm font-semibold text-foreground">Últimas Transações Registadas</h4>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface text-muted-foreground text-xs uppercase tracking-wider">
              <th className="text-left px-5 py-3 font-medium">ID</th>
              <th className="text-left px-5 py-3 font-medium">Origem</th>
              <th className="text-left px-5 py-3 font-medium">Destino</th>
              <th className="text-left px-5 py-3 font-medium">Material</th>
              <th className="text-left px-5 py-3 font-medium">Peso</th>
              <th className="text-left px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-t border-border">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-5 py-3"><Skeleton className="h-4 w-20" /></td>
                  ))}
                </tr>
              ))
            ) : (
              transactions?.map((tx) => (
                <tr key={tx.id} className="border-t border-border hover:bg-surface/50 transition-colors">
                  <td className="px-5 py-3 font-mono text-xs text-primary">{tx.codigo}</td>
                  <td className="px-5 py-3 text-foreground">{tx.origem}</td>
                  <td className="px-5 py-3 text-foreground">{tx.destino}</td>
                  <td className="px-5 py-3 text-muted-foreground">{tx.material}</td>
                  <td className="px-5 py-3 text-foreground font-medium">{tx.peso}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColorMap[tx.status] || "bg-muted text-muted-foreground"}`}>
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionsTable;
