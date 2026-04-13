import { useMemo } from "react";
import { useCooperativas, useLotesEntrada, useLotesSaida } from "@/hooks/use-schema-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Boxes, TrendingUp, TrendingDown, Scale } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";

const CooperativaPainel = () => {
  const { data: cooperativas, isLoading: loadingCoop } = useCooperativas();
  const { data: entradas, isLoading: loadingEnt } = useLotesEntrada();
  const { data: saidas, isLoading: loadingSai } = useLotesSaida();

  if (loadingCoop || loadingEnt || loadingSai) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const totalEntrada = entradas?.reduce((s, e) => s + Number(e.peso_bruto_kg || 0), 0) ?? 0;
  const totalSaida = saidas?.reduce((s, e) => s + Number(e.peso_liquido_kg || 0), 0) ?? 0;
  const totalFaturamento = saidas?.reduce((s, e) => s + Number(e.valor_venda || 0), 0) ?? 0;
  const balanco = totalEntrada - totalSaida;

  const kpis = [
    { label: "Total Entrada", value: `${totalEntrada.toLocaleString("pt-BR")} kg`, icon: TrendingUp, color: "text-primary" },
    { label: "Total Saída", value: `${totalSaida.toLocaleString("pt-BR")} kg`, icon: TrendingDown, color: "text-success" },
    { label: "Balanço de Massa", value: `${balanco.toLocaleString("pt-BR")} kg`, icon: Scale, color: "text-warning" },
    { label: "Faturamento Total", value: `R$ ${totalFaturamento.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, icon: Boxes, color: "text-accent" },
  ];

  // Monthly evolution chart data
  const monthlyData = useMemo(() => {
    const months: Record<string, { entrada: number; saida: number; faturamento: number }> = {};

    entradas?.forEach((e: any) => {
      const d = new Date(e.data_recebimento);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!months[key]) months[key] = { entrada: 0, saida: 0, faturamento: 0 };
      months[key].entrada += Number(e.peso_bruto_kg || 0);
    });

    saidas?.forEach((e: any) => {
      const d = new Date(e.data_despacho);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!months[key]) months[key] = { entrada: 0, saida: 0, faturamento: 0 };
      months[key].saida += Number(e.peso_liquido_kg || 0);
      months[key].faturamento += Number(e.valor_venda || 0);
    });

    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, v]) => {
        const [y, m] = key.split("-");
        const label = new Date(Number(y), Number(m) - 1).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
        return { mes: label, Entrada: Math.round(v.entrada), Saída: Math.round(v.saida), Faturamento: v.faturamento };
      });
  }, [entradas, saidas]);

  // Material breakdown
  const materialData = useMemo(() => {
    const mats: Record<string, number> = {};
    entradas?.forEach((e: any) => {
      const m = e.tipo_material || "Outros";
      mats[m] = (mats[m] || 0) + Number(e.peso_bruto_kg || 0);
    });
    return Object.entries(mats)
      .sort(([, a], [, b]) => b - a)
      .map(([material, peso]) => ({ material, peso: Math.round(peso) }));
  }, [entradas]);

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* Últimos lotes de entrada */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Últimos Lotes de Entrada</CardTitle>
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
              {entradas?.slice(0, 10).map((e: any) => (
                <TableRow key={e.id}>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{e.origem_tipo}</Badge>
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

export default CooperativaPainel;
