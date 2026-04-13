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

  const totalEntrada = useMemo(() => entradas?.reduce((s, e) => s + Number(e.peso_bruto_kg || 0), 0) ?? 0, [entradas]);
  const totalSaida = useMemo(() => saidas?.reduce((s, e) => s + Number(e.peso_liquido_kg || 0), 0) ?? 0, [saidas]);
  const totalFaturamento = useMemo(() => saidas?.reduce((s, e) => s + Number(e.valor_venda || 0), 0) ?? 0, [saidas]);
  const balanco = totalEntrada - totalSaida;

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

  const isLoading = loadingCoop || loadingEnt || loadingSai;

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const kpis = [
    { label: "Total Entrada", value: `${totalEntrada.toLocaleString("pt-BR")} kg`, icon: TrendingUp, color: "text-primary" },
    { label: "Total Saída", value: `${totalSaida.toLocaleString("pt-BR")} kg`, icon: TrendingDown, color: "text-success" },
    { label: "Balanço de Massa", value: `${balanco.toLocaleString("pt-BR")} kg`, icon: Scale, color: "text-warning" },
    { label: "Faturamento Total", value: `R$ ${totalFaturamento.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, icon: Boxes, color: "text-accent" },
  ];

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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Evolução Mensal - Peso */}
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Evolução Mensal — Peso Coletado vs Faturado (kg)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                  formatter={(value: number) => `${value.toLocaleString("pt-BR")} kg`}
                />
                <Legend />
                <Bar dataKey="Entrada" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Saída" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Evolução Mensal - Faturamento */}
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Evolução Mensal — Faturamento (R$)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                  formatter={(value: number) => `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                />
                <Legend />
                <Line type="monotone" dataKey="Faturamento" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Material breakdown */}
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Peso Coletado por Material (kg)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={materialData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
              <XAxis type="number" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
              <YAxis dataKey="material" type="category" width={90} tick={{ fontSize: 12 }} className="fill-muted-foreground" />
              <Tooltip
                contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                formatter={(value: number) => `${value.toLocaleString("pt-BR")} kg`}
              />
              <Bar dataKey="peso" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Peso (kg)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

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
