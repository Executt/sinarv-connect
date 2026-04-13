import { useEstacoesColeta, useEntidadesCredenciadas } from "@/hooks/use-schema-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Building2, CheckCircle2, Wrench } from "lucide-react";

const statusIcons: Record<string, any> = {
  "Ativo": { icon: CheckCircle2, color: "text-success" },
  "Inativo": { icon: Building2, color: "text-muted-foreground" },
  "Manutenção": { icon: Wrench, color: "text-warning" },
};

const PontoColetaDashboard = () => {
  const { data: entidades, isLoading: loadingEnt } = useEntidadesCredenciadas();
  const { data: estacoes, isLoading: loadingEst } = useEstacoesColeta();

  if (loadingEnt || loadingEst) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const ativas = estacoes?.filter((e: any) => e.status_operacional === "Ativo").length ?? 0;
  const capTotal = estacoes?.reduce((s, e: any) => s + Number(e.capacidade_toneladas || 0), 0) ?? 0;

  const kpis = [
    { label: "Entidades Credenciadas", value: String(entidades?.length ?? 0), icon: Building2, color: "text-primary" },
    { label: "Estações Ativas", value: String(ativas), icon: CheckCircle2, color: "text-success" },
    { label: "Capacidade Total", value: `${capTotal.toLocaleString("pt-BR")} ton`, icon: MapPin, color: "text-accent" },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="shadow-card">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">{kpi.label}</p>
                  <p className={`text-xl font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
                </div>
                <kpi.icon className={`h-8 w-8 ${kpi.color} opacity-30`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Estações */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Estações de Coleta</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Endereço</TableHead>
                <TableHead>Cidade/UF</TableHead>
                <TableHead>Capacidade</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {estacoes?.map((e: any) => {
                const st = statusIcons[e.status_operacional] || statusIcons["Inativo"];
                return (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.endereco}</TableCell>
                    <TableCell className="text-muted-foreground">{e.cidade}/{e.estado}</TableCell>
                    <TableCell>{Number(e.capacidade_toneladas).toLocaleString("pt-BR")} ton</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs gap-1 ${st.color}`}>
                        <st.icon className="h-3 w-3" />
                        {e.status_operacional}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default PontoColetaDashboard;
