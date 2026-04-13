import { useTelemetriaConsolidada, useMetricasPlanares } from "@/hooks/use-schema-data";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Recycle, TrendingUp, MapPin, BarChart3, Target } from "lucide-react";
import { Link } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Treemap, Cell,
} from "recharts";

const TREEMAP_COLORS = [
  "hsl(210 90% 40%)", "hsl(210 90% 50%)", "hsl(210 80% 60%)",
  "hsl(145 63% 42%)", "hsl(145 50% 55%)",
  "hsl(38 92% 50%)", "hsl(38 80% 60%)",
  "hsl(0 72% 51%)", "hsl(210 10% 70%)",
];

const stateNames: Record<string, string> = {
  SP: "São Paulo", RJ: "Rio de Janeiro", MG: "Minas Gerais", RS: "Rio Grande do Sul",
  SC: "Santa Catarina", BA: "Bahia", AM: "Amazonas", PR: "Paraná",
  PE: "Pernambuco", CE: "Ceará", GO: "Goiás", DF: "Distrito Federal",
  PA: "Pará", MA: "Maranhão", ES: "Espírito Santo", MT: "Mato Grosso",
};

const metaLabels: Record<string, string> = {
  "Fim Lixões": "Eliminação de Lixões",
  "% Reciclagem Urbana": "Reciclagem Urbana",
  "Recuperação Áreas Degradadas": "Recuperação de Áreas",
  "Inclusão Catadores": "Inclusão de Catadores",
  "Logística Reversa": "Logística Reversa",
};

const TransparenciaMapaReciclagem = () => {
  const { data: telemetria, isLoading: loadingTel } = useTelemetriaConsolidada();
  const { data: metricas, isLoading: loadingMet } = useMetricasPlanares();

  const isLoading = loadingTel || loadingMet;

  // Latest month data
  const latestDate = telemetria?.[0]?.data_referencia;
  const latestMonth = telemetria?.filter((t: any) => t.data_referencia === latestDate) ?? [];

  // Totals
  const totalColetado = latestMonth.reduce((s: number, t: any) => s + Number(t.volume_total_coletado_ton || 0), 0);
  const totalReciclado = latestMonth.reduce((s: number, t: any) => s + Number(t.volume_total_reciclado_ton || 0), 0);
  const taxaConversao = totalColetado > 0 ? ((totalReciclado / totalColetado) * 100) : 0;

  // Bar chart data by state
  const barData = latestMonth
    .map((t: any) => ({
      estado: t.estado_ibge,
      nome: stateNames[t.estado_ibge] || t.estado_ibge,
      coletado: Math.round(Number(t.volume_total_coletado_ton)),
      reciclado: Math.round(Number(t.volume_total_reciclado_ton)),
    }))
    .sort((a: any, b: any) => b.coletado - a.coletado);

  // Treemap data
  const treemapData = latestMonth
    .map((t: any) => ({
      name: stateNames[t.estado_ibge] || t.estado_ibge,
      size: Math.round(Number(t.volume_total_reciclado_ton)),
    }))
    .filter((d: any) => d.size > 0)
    .sort((a: any, b: any) => b.size - a.size);

  // Planares for latest year
  const latestYear = metricas?.[0]?.ano_referencia;
  const latestPlanares = metricas?.filter((m: any) => m.ano_referencia === latestYear) ?? [];

  // Rankings
  const topEstados = [...barData].sort((a, b) => b.reciclado - a.reciclado).slice(0, 5);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="container max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Portal
          </Link>
          <div className="h-5 w-px bg-border" />
          <div>
            <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Recycle className="h-5 w-5 text-primary" />
              Transparência — Mapa de Reciclagem do Brasil
            </h1>
            <p className="text-xs text-muted-foreground">
              Dados abertos de telemetria do SINARV • Referência: {latestDate ? new Date(latestDate + "T00:00:00").toLocaleDateString("pt-BR", { month: "long", year: "numeric" }) : "—"}
            </p>
          </div>
        </div>
      </header>

      <main className="container max-w-7xl mx-auto px-4 py-6 space-y-6">
        {isLoading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
            </div>
            <Skeleton className="h-96 rounded-xl" />
          </div>
        ) : (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="shadow-card">
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Volume Coletado</p>
                      <p className="text-2xl font-bold text-foreground mt-1">
                        {totalColetado.toLocaleString("pt-BR")} t
                      </p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-primary opacity-30" />
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-card">
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Volume Reciclado</p>
                      <p className="text-2xl font-bold text-success mt-1">
                        {totalReciclado.toLocaleString("pt-BR")} t
                      </p>
                    </div>
                    <Recycle className="h-8 w-8 text-success opacity-30" />
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-card">
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Taxa de Conversão</p>
                      <p className="text-2xl font-bold text-accent mt-1">{taxaConversao.toFixed(1)}%</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-accent opacity-30" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Bar chart */}
              <Card className="shadow-card lg:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    Volume por Estado (toneladas)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={barData} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(210 20% 90%)" />
                      <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(210 10% 50%)" }} />
                      <YAxis type="category" dataKey="nome" tick={{ fontSize: 11, fill: "hsl(210 10% 50%)" }} width={110} />
                      <Tooltip
                        contentStyle={{ borderRadius: 8, border: "1px solid hsl(210 20% 90%)", fontSize: 13 }}
                        formatter={(value: number, name: string) => [
                          `${value.toLocaleString("pt-BR")} t`,
                          name === "coletado" ? "Coletado" : "Reciclado",
                        ]}
                      />
                      <Bar dataKey="coletado" fill="hsl(210 90% 50%)" radius={[0, 4, 4, 0]} name="coletado" />
                      <Bar dataKey="reciclado" fill="hsl(145 63% 42%)" radius={[0, 4, 4, 0]} name="reciclado" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Ranking */}
              <Card className="shadow-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-success" />
                    Top 5 Estados — Reciclagem
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {topEstados.map((e, i) => {
                    const pct = totalReciclado > 0 ? (e.reciclado / totalReciclado) * 100 : 0;
                    return (
                      <div key={e.estado} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px] w-5 h-5 flex items-center justify-center p-0 rounded-full">
                              {i + 1}
                            </Badge>
                            {e.nome}
                          </span>
                          <span className="text-xs text-muted-foreground">{e.reciclado.toLocaleString("pt-BR")} t</span>
                        </div>
                        <Progress value={pct} className="h-1.5" />
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            {/* Treemap */}
            <Card className="shadow-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Recycle className="h-4 w-4 text-primary" />
                  Mapa de Calor — Proporção de Reciclagem por Estado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <Treemap
                    data={treemapData}
                    dataKey="size"
                    stroke="hsl(0 0% 100%)"
                    content={({ x, y, width, height, name, index }: any) => {
                      if (width < 30 || height < 30) return null;
                      return (
                        <g>
                          <rect
                            x={x}
                            y={y}
                            width={width}
                            height={height}
                            fill={TREEMAP_COLORS[index % TREEMAP_COLORS.length]}
                            rx={4}
                          />
                          {width > 60 && height > 40 && (
                            <>
                              <text
                                x={x + width / 2}
                                y={y + height / 2 - 8}
                                textAnchor="middle"
                                fill="white"
                                fontSize={12}
                                fontWeight="bold"
                              >
                                {name}
                              </text>
                              <text
                                x={x + width / 2}
                                y={y + height / 2 + 10}
                                textAnchor="middle"
                                fill="rgba(255,255,255,0.8)"
                                fontSize={10}
                              >
                                {treemapData[index]?.size?.toLocaleString("pt-BR")} t
                              </text>
                            </>
                          )}
                        </g>
                      );
                    }}
                  >
                    {treemapData.map((_: any, i: number) => (
                      <Cell key={i} fill={TREEMAP_COLORS[i % TREEMAP_COLORS.length]} />
                    ))}
                  </Treemap>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Planares */}
            {latestPlanares.length > 0 && (
              <Card className="shadow-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    Metas Planares — {latestYear}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {latestPlanares.map((m: any) => {
                      const alvo = Number(m.valor_alvo);
                      const atingido = Number(m.valor_atingido);
                      const pct = alvo > 0 ? Math.min((atingido / alvo) * 100, 100) : 0;
                      return (
                        <div key={m.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-foreground">
                              {metaLabels[m.tipo_meta] || m.tipo_meta}
                            </span>
                            <span className={`text-xs font-bold ${pct >= 50 ? "text-success" : pct >= 25 ? "text-warning" : "text-destructive"}`}>
                              {pct.toFixed(1)}%
                            </span>
                          </div>
                          <Progress value={pct} className="h-2" />
                          <p className="text-[10px] text-muted-foreground">
                            {atingido.toLocaleString("pt-BR")} / {alvo.toLocaleString("pt-BR")}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border mt-8">
        <div className="container max-w-7xl mx-auto px-4 py-4">
          <p className="text-xs text-muted-foreground text-center">
            SINARV — Sistema Nacional de Rastreabilidade e Valorização de Resíduos Sólidos • Dados abertos conforme Lei nº 12.527/2011 (LAI)
          </p>
        </div>
      </footer>
    </div>
  );
};

export default TransparenciaMapaReciclagem;
