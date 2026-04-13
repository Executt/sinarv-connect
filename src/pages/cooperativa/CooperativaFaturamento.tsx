import { useLotesSaida } from "@/hooks/use-schema-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const CooperativaFaturamento = () => {
  const { data: saidas, isLoading } = useLotesSaida();

  if (isLoading) {
    return <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>;
  }

  const totalFaturado = saidas?.reduce((s, e) => s + Number(e.valor_venda || 0), 0) ?? 0;
  const totalPeso = saidas?.reduce((s, e) => s + Number(e.peso_liquido_kg || 0), 0) ?? 0;

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="shadow-card">
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-muted-foreground">Notas Emitidas</p>
            <p className="text-2xl font-bold text-foreground mt-1">{saidas?.length ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-muted-foreground">Peso Total Faturado</p>
            <p className="text-2xl font-bold text-primary mt-1">{totalPeso.toLocaleString("pt-BR")} kg</p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-muted-foreground">Receita Total</p>
            <p className="text-2xl font-bold text-success mt-1">R$ {totalFaturado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de saídas */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Notas Fiscais de Saída</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nota Fiscal</TableHead>
                <TableHead>CNPJ Comprador</TableHead>
                <TableHead>Material</TableHead>
                <TableHead>Peso Líq. (kg)</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Data Despacho</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {saidas?.map((s: any) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <Badge variant="secondary" className="font-mono text-xs">{s.numero_nota_fiscal}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{s.industria_destino_cnpj}</TableCell>
                  <TableCell className="font-medium">{s.tipo_material || "—"}</TableCell>
                  <TableCell>{Number(s.peso_liquido_kg).toLocaleString("pt-BR")}</TableCell>
                  <TableCell className="text-success font-medium">
                    R$ {Number(s.valor_venda).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(s.data_despacho).toLocaleDateString("pt-BR")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default CooperativaFaturamento;
