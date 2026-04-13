import { useLotesEntrada } from "@/hooks/use-schema-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const CooperativaLotesEntrada = () => {
  const { data: entradas, isLoading } = useLotesEntrada();

  if (isLoading) {
    return <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>;
  }

  const porTipo: Record<string, number> = {};
  entradas?.forEach((e: any) => {
    const mat = e.tipo_material || "Outros";
    porTipo[mat] = (porTipo[mat] || 0) + Number(e.peso_bruto_kg);
  });

  return (
    <div className="space-y-5">
      {/* Cards por material */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Object.entries(porTipo).map(([mat, peso]) => (
          <Card key={mat} className="shadow-card">
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">{mat}</p>
              <p className="text-lg font-bold text-foreground mt-1">{peso.toLocaleString("pt-BR")} kg</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabela completa */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Todos os Lotes de Entrada</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Origem</TableHead>
                <TableHead>Material</TableHead>
                <TableHead>Peso Bruto (kg)</TableHead>
                <TableHead>Data Recebimento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entradas?.map((e: any) => (
                <TableRow key={e.id}>
                  <TableCell>
                    <Badge variant={e.origem_tipo === "Cidadão" ? "default" : "secondary"} className="text-xs">
                      {e.origem_tipo}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{e.tipo_material || "—"}</TableCell>
                  <TableCell>{Number(e.peso_bruto_kg).toLocaleString("pt-BR")}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(e.data_recebimento).toLocaleDateString("pt-BR")}
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

export default CooperativaLotesEntrada;
