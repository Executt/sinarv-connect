const transactions = [
  { id: "TRX-001847", origem: "Cooperativa Recicla SP", destino: "Ind. PlastBR Ltda", material: "Plástico PET", peso: "2.450 kg", status: "Concluída", statusColor: "bg-success/10 text-success" },
  { id: "TRX-001846", origem: "Assoc. Catadores RJ", destino: "MetalSul S.A.", material: "Alumínio", peso: "890 kg", status: "Em Trânsito", statusColor: "bg-info/10 text-info" },
  { id: "TRX-001845", origem: "Coop. Verde Vida BA", destino: "PapelNorte Ind.", material: "Papelão", peso: "3.200 kg", status: "Concluída", statusColor: "bg-success/10 text-success" },
  { id: "TRX-001844", origem: "EcoPonto Curitiba", destino: "VidroClear Ltda", material: "Vidro", peso: "1.100 kg", status: "Pendente", statusColor: "bg-warning/10 text-warning" },
  { id: "TRX-001843", origem: "Reciclagem Manaus", destino: "Ind. PlastBR Ltda", material: "Plástico HDPE", peso: "1.780 kg", status: "Auditoria", statusColor: "bg-destructive/10 text-destructive" },
];

const TransactionsTable = () => {
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
            {transactions.map((tx) => (
              <tr key={tx.id} className="border-t border-border hover:bg-surface/50 transition-colors">
                <td className="px-5 py-3 font-mono text-xs text-primary">{tx.id}</td>
                <td className="px-5 py-3 text-foreground">{tx.origem}</td>
                <td className="px-5 py-3 text-foreground">{tx.destino}</td>
                <td className="px-5 py-3 text-muted-foreground">{tx.material}</td>
                <td className="px-5 py-3 text-foreground font-medium">{tx.peso}</td>
                <td className="px-5 py-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${tx.statusColor}`}>
                    {tx.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionsTable;
