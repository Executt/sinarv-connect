import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useIndustrias } from "@/hooks/use-schema-data";
import { useMetasPnrs, useLotesRecebidos } from "@/hooks/use-industria-data";
import { Target, Recycle, Award, Leaf, Filter, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const IndustriaDashboardESG = () => {
  const [selectedInd, setSelectedInd] = useState<string>("all");
  const { data: industrias, isLoading: loadInd } = useIndustrias();
  const { data: metas, isLoading: loadMetas } = useMetasPnrs(
    selectedInd === "all" ? undefined : selectedInd
  );
  const { data: lotes } = useLotesRecebidos(
    selectedInd === "all" ? undefined : selectedInd
  );

  const isLoading = loadInd || loadMetas;

  const metasAno = useMemo(() =>
    metas?.filter((m: any) => m.ano_referencia === 2026) ?? [], [metas]);

  const totalMeta = metasAno.reduce((s: number, m: any) => s + Number(m.meta_peso_kg || 0), 0);
  const totalAtingido = metasAno.reduce((s: number, m: any) => s + Number(m.atingido_peso_kg || 0), 0);
  const percentual = totalMeta > 0 ? (totalAtingido / totalMeta) * 100 : 0;

  const volumeMes = useMemo(() => {
    const now = new Date();
    return lotes?.filter((l: any) => {
      const d = new Date(l.data_recebimento);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && l.status === "Aprovado";
    }).reduce((s: number, l: any) => s + Number(l.peso_kg || 0), 0) ?? 0;
  }, [lotes]);

  const co2Evitado = Math.round(totalAtingido * 0.0021); // ~2.1 kg CO2/kg reciclado

  const chartData = metasAno.map((m: any) => ({
    material: m.tipo_material,
    Meta: Number(m.meta_peso_kg),
    Atingido: Number(m.atingido_peso_kg),
  }));

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const kpis = [
    { label: "Meta Anual PNRS", value: `${percentual.toFixed(1)}%`, icon: Target, color: "text-primary" },
    { label: "Volume Adquirido (mês)", value: `${(volumeMes / 1000).toFixed(1)} ton`, icon: Recycle, color: "text-success" },
    { label: "Certificados Emitidos", value: String(lotes?.filter((l: any) => l.status === "Consolidado").length ?? 0), icon: Award, color: "text-accent" },
    { label: "CO₂ Evitado (est.)", value: `${co2Evitado.toLocaleString("pt-BR")} kg`, icon: Leaf, color: "text-success" },
  ];

  return (
    <div className="space-y-5">
      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={selectedInd} onValueChange={setSelectedInd}>
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Filtrar por indústria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Indústrias</SelectItem>
            {industrias?.map((i: any) => (
              <SelectItem key={i.id} value={i.id}>{i.razao_social || i.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
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

      {/* Progress global */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Progresso Global — Meta PNRS 2026
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Logística Reversa</span>
            <span className="font-bold">{percentual.toFixed(1)}%</span>
          </div>
          <Progress value={Math.min(percentual, 100)} className="h-3" />
          <p className="text-xs text-muted-foreground">
            {(totalAtingido / 1000).toFixed(1)} ton de {(totalMeta / 1000).toFixed(1)} ton necessárias
          </p>
        </CardContent>
      </Card>

      {/* Metas por material */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Cumprimento por Material</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">Sem metas definidas</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                  <XAxis dataKey="material" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                    formatter={(v: number) => `${(v / 1000).toFixed(1)} ton`}
                  />
                  <Legend />
                  <Bar dataKey="Meta" fill="hsl(var(--muted-foreground))" opacity={0.3} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Atingido" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Detalhamento por material */}
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Detalhamento das Metas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {metasAno.map((m: any) => {
              const pct = Number(m.meta_peso_kg) > 0
                ? (Number(m.atingido_peso_kg) / Number(m.meta_peso_kg)) * 100
                : 0;
              return (
                <div key={m.id} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{m.tipo_material}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">
                        {(Number(m.atingido_peso_kg) / 1000).toFixed(1)} / {(Number(m.meta_peso_kg) / 1000).toFixed(1)} ton
                      </span>
                      <Badge variant={pct >= 100 ? "default" : pct >= 50 ? "secondary" : "destructive"} className="text-xs">
                        {pct.toFixed(0)}%
                      </Badge>
                    </div>
                  </div>
                  <Progress value={Math.min(pct, 100)} className="h-2" />
                </div>
              );
            })}
            {metasAno.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhuma meta definida para 2026</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default IndustriaDashboardESG;
