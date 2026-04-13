import { useMemo, useState } from "react";
import { useCooperativas, useLotesEntrada, useLotesSaida } from "@/hooks/use-schema-data";
import { useEstoqueCooperativa, useLicencasCooperativa } from "@/hooks/use-cooperativa-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Boxes, TrendingUp, TrendingDown, Scale, Filter, AlertTriangle, Package } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";

const CooperativaPainel = () => {
  const [selectedCoop, setSelectedCoop] = useState<string>("all");
  const { data: cooperativas, isLoading: loadingCoop } = useCooperativas();
  const { data: allEntradas, isLoading: loadingEnt } = useLotesEntrada();
  const { data: allSaidas, isLoading: loadingSai } = useLotesSaida();
  const { data: estoque } = useEstoqueCooperativa(selectedCoop === "all" ? undefined : selectedCoop);
  const { data: licencas } = useLicencasCooperativa(selectedCoop === "all" ? undefined : selectedCoop);

  const entradas = useMemo(() => {
    if (selectedCoop === "all" || !allEntradas) return allEntradas;
    return allEntradas.filter((e: any) => e.cooperativa_id === selectedCoop);
  }, [allEntradas, selectedCoop]);

  const saidas = useMemo(() => {
    if (selectedCoop === "all" || !allSaidas) return allSaidas;
    return allSaidas.filter((e: any) => e.cooperativa_id === selectedCoop);
  }, [allSaidas, selectedCoop]);

  const totalEntrada = useMemo(() => entradas?.reduce((s: number, e: any) => s + Number(e.peso_bruto_kg || 0), 0) ?? 0, [entradas]);
  const totalSaida = useMemo(() => saidas?.reduce((s: number, e: any) => s + Number(e.peso_liquido_kg || 0), 0) ?? 0, [saidas]);
  const totalFaturamento = useMemo(() => saidas?.reduce((s: number, e: any) => s + Number(e.valor_venda || 0), 0) ?? 0, [saidas]);
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

  const selectedLabel = selectedCoop === "all"
    ? "Todas as Cooperativas"
    : cooperativas?.find((c: any) => c.id === selectedCoop)?.nome || "—";

  return (
    <div className="space-y-5">
      {/* Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-foreground">Painel de Operações</h2>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedCoop} onValueChange={setSelectedCoop}>
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder="Filtrar por cooperativa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Cooperativas</SelectItem>
              {cooperativas?.map((c: any) => (
                <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

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

      {/* Alertas de licenças + Estoque */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Estoque atual */}
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary opacity-60" />
              <CardTitle className="text-base">Estoque Atual por Material</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {estoque && estoque.length > 0 ? (
              <div className="space-y-2">
                {estoque.map((e: any) => (
                  <div key={e.id} className="flex justify-between items-center py-1.5 border-b last:border-0">
                    <span className="text-sm font-medium">{e.tipo_material}</span>
                    <span className="font-mono text-sm font-bold">
                      {Number(e.saldo_kg).toLocaleString("pt-BR")} kg
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">Sem dados de estoque</p>
            )}
          </CardContent>
        </Card>

        {/* Licenças */}
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning opacity-60" />
              <CardTitle className="text-base">Status de Licenças</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {licencas && licencas.length > 0 ? (
              <div className="space-y-2">
                {licencas.map((l: any) => {
                  const dias = Math.ceil(
                    (new Date(l.data_validade).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                  );
                  return (
                    <div key={l.id} className="flex justify-between items-center py-1.5 border-b last:border-0">
                      <div>
                        <p className="text-sm font-medium">{l.tipo}</p>
                        <p className="text-xs text-muted-foreground">Nº {l.numero}</p>
                      </div>
                      <Badge
                        variant={dias <= 30 ? "destructive" : dias <= 90 ? "secondary" : "default"}
                        className="text-xs"
                      >
                        {dias <= 0 ? "Vencida" : `${dias}d restantes`}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">Sem licenças cadastradas</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Evolução Mensal — Peso Coletado vs Faturado (kg)</CardTitle>
            <p className="text-xs text-muted-foreground">{selectedLabel}</p>
          </CardHeader>
          <CardContent>
            {monthlyData.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">Sem dados para o filtro selecionado</p>
            ) : (
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
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Evolução Mensal — Faturamento (R$)</CardTitle>
            <p className="text-xs text-muted-foreground">{selectedLabel}</p>
          </CardHeader>
          <CardContent>
            {monthlyData.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">Sem dados para o filtro selecionado</p>
            ) : (
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
            )}
          </CardContent>
        </Card>
      </div>

      {/* Material breakdown */}
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Peso Coletado por Material (kg)</CardTitle>
          <p className="text-xs text-muted-foreground">{selectedLabel}</p>
        </CardHeader>
        <CardContent>
          {materialData.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">Sem dados para o filtro selecionado</p>
          ) : (
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
          )}
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
              {(!entradas || entradas.length === 0) && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    Nenhum lote encontrado para o filtro selecionado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default CooperativaPainel;
