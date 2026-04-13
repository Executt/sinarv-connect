import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend,
} from "recharts";
import {
  Trophy, TrendingUp, MapPin, Award, Shield, Leaf, Search, Users,
} from "lucide-react";

/* ── Theme constants (SAP Fiori Blue) ────────────────────── */
const FIORI_BLUE = "#0A6ED1";
const FIORI_BLUE_DARK = "#074A8A";
const FIORI_BLUE_LIGHT = "#E8F4FD";
const FIORI_GREEN = "#107E3E";
const FIORI_ORANGE = "#E9730C";
const FIORI_RED = "#BB0000";
const FIORI_TEAL = "#0A8A8A";
const REGIOES: Record<string, string[]> = {
  Norte: ["AC", "AM", "AP", "PA", "RO", "RR", "TO"],
  Nordeste: ["AL", "BA", "CE", "MA", "PB", "PE", "PI", "RN", "SE"],
  "Centro-Oeste": ["DF", "GO", "MS", "MT"],
  Sudeste: ["ES", "MG", "RJ", "SP"],
  Sul: ["PR", "RS", "SC"],
};

const getRegiao = (uf: string) =>
  Object.entries(REGIOES).find(([, ufs]) => ufs.includes(uf))?.[0] || "—";

const SEAL_ICONS: Record<string, typeof Trophy> = {
  "Selo Lixão Zero": Shield,
  "Selo 100% Rastreabilidade": Search,
  "Selo Engajamento Cidadão": Users,
  "Selo Coleta Seletiva Avançada": Leaf,
  "Selo Inclusão de Catadores": Users,
  "Selo Inovação Verde": Leaf,
};

const SEAL_COLORS: Record<string, string> = {
  "Selo Lixão Zero": FIORI_GREEN,
  "Selo 100% Rastreabilidade": FIORI_BLUE,
  "Selo Engajamento Cidadão": FIORI_TEAL,
  "Selo Coleta Seletiva Avançada": FIORI_GREEN,
  "Selo Inclusão de Catadores": FIORI_ORANGE,
  "Selo Inovação Verde": FIORI_TEAL,
};

/* ── Queries ─────────────────────────────────────────────── */

const useRankingEstadual = () =>
  useQuery({
    queryKey: ["vw_ranking_estadual"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vw_ranking_estadual")
        .select("*")
        .order("posicao_ranking", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

const useMunicipios = () =>
  useQuery({
    queryKey: ["benchmark_municipios"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("benchmark_municipios")
        .select("*")
        .order("nome_municipio");
      if (error) throw error;
      return data;
    },
  });

const useMunicipiosRanked = () =>
  useQuery({
    queryKey: ["benchmark_municipios_ranked"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("benchmark_municipios")
        .select("*")
        .order("eficiencia_coleta_seletiva", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

const useSelos = () =>
  useQuery({
    queryKey: ["benchmark_selos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("benchmark_selos")
        .select("*")
        .eq("ativo", true)
        .order("data_concessao", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

/* ── Component ───────────────────────────────────────────── */

const DashboardBenchmarks = () => {
  const { data: ranking, isLoading: loadingRanking } = useRankingEstadual();
  const { data: municipios, isLoading: loadingMunicipios } = useMunicipios();
  const { data: selos, isLoading: loadingSelos } = useSelos();
  const { data: municipiosRanked, isLoading: loadingMunRanked } = useMunicipiosRanked();

  const [mun1, setMun1] = useState<string>("");
  const [mun2, setMun2] = useState<string>("");
  const [mun3, setMun3] = useState<string>("");
  const [filtroRegiao, setFiltroRegiao] = useState<string>("todas");
  const [filtroUF, setFiltroUF] = useState<string>("todas");

  // Chart data for top 10 estados
  const barData = useMemo(() => {
    if (!ranking) return [];
    return ranking.slice(0, 15).map((e: any) => ({
      uf: e.uf,
      "kg/hab/ano": Number(e.kg_per_capita),
      "Desvio Aterro (%)": Number(e.taxa_desvio_aterro),
    }));
  }, [ranking]);

  // Radar data for selected municipalities
  const radarData = useMemo(() => {
    if (!municipios) return [];
    const selected = [mun1, mun2, mun3].filter(Boolean);
    if (selected.length === 0) return [];

    const selectedMuns = municipios.filter((m: any) =>
      selected.includes(m.municipio_ibge)
    );

    const metrics = [
      { key: "eficiencia_coleta_seletiva", label: "Coleta Seletiva" },
      { key: "engajamento_cidadao", label: "Engajamento Cidadão" },
      { key: "pontos_coleta_por_km2", label: "Pontos/km² (×10)" },
      { key: "taxa_desvio_aterro", label: "Desvio Aterro %" },
    ];

    return metrics.map((m) => {
      const point: any = { indicador: m.label };
      selectedMuns.forEach((mun: any) => {
        const val = m.key === "pontos_coleta_por_km2"
          ? Number(mun[m.key]) * 10
          : Number(mun[m.key]);
        point[`${mun.nome_municipio}/${mun.uf}`] = val;
      });
      return point;
    });
  }, [municipios, mun1, mun2, mun3]);

  const selectedMunNames = useMemo(() => {
    if (!municipios) return [];
    return [mun1, mun2, mun3]
      .filter(Boolean)
      .map((code) => {
        const m = municipios.find((x: any) => x.municipio_ibge === code);
        return m ? `${m.nome_municipio}/${m.uf}` : "";
      })
      .filter(Boolean);
  }, [municipios, mun1, mun2, mun3]);

  const radarColors = [FIORI_BLUE, FIORI_GREEN, FIORI_ORANGE];

  // Filtered municipal ranking
  const filteredMunRanked = useMemo(() => {
    if (!municipiosRanked) return [];
    return municipiosRanked.filter((m: any) => {
      if (filtroRegiao !== "todas") {
        const regiaoUFs = REGIOES[filtroRegiao];
        if (!regiaoUFs?.includes(m.uf)) return false;
      }
      if (filtroUF !== "todas" && m.uf !== filtroUF) return false;
      return true;
    });
  }, [municipiosRanked, filtroRegiao, filtroUF]);

  // Available UFs based on region filter
  const availableUFs = useMemo(() => {
    if (!municipiosRanked) return [];
    const ufs = [...new Set(municipiosRanked.map((m: any) => m.uf as string))].sort();
    if (filtroRegiao !== "todas") {
      return ufs.filter((uf) => REGIOES[filtroRegiao]?.includes(uf));
    }
    return ufs;
  }, [municipiosRanked, filtroRegiao]);

  // KPI summary
  const totalEstados = ranking?.length || 0;
  const metaCumprida = ranking?.filter((e: any) => e.meta_pnrs_cumprida).length || 0;
  const totalSelos = selos?.length || 0;
  const topEstado = ranking?.[0];

  return (
    <div className="space-y-6 bg-white min-h-full">
      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            icon: Trophy, label: "Líder Nacional", value: topEstado?.uf || "—",
            sub: topEstado ? `${topEstado.kg_per_capita} kg/hab/ano` : "",
            color: FIORI_BLUE,
          },
          {
            icon: TrendingUp, label: "Estados Avaliados", value: totalEstados,
            sub: `${metaCumprida} cumpriram meta PNRS`,
            color: FIORI_GREEN,
          },
          {
            icon: MapPin, label: "Municípios Mapeados",
            value: municipios?.length || 0,
            sub: "Comparativo disponível",
            color: FIORI_TEAL,
          },
          {
            icon: Award, label: "Selos Concedidos", value: totalSelos,
            sub: "Distintivos ativos",
            color: FIORI_ORANGE,
          },
        ].map((kpi) => (
          <Card key={kpi.label} className="border-t-4 shadow-sm" style={{ borderTopColor: kpi.color }}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg" style={{ backgroundColor: `${kpi.color}10` }}>
                  <kpi.icon className="h-5 w-5" style={{ color: kpi.color }} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{kpi.label}</p>
                  <p className="text-xl font-bold" style={{ color: FIORI_BLUE_DARK }}>{kpi.value}</p>
                  <p className="text-[11px] text-gray-400">{kpi.sub}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="ranking" className="w-full">
        <TabsList className="bg-gray-50 border border-gray-200 rounded-lg p-1">
          <TabsTrigger value="ranking" className="data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm">
            🏆 Ranking Nacional
          </TabsTrigger>
          <TabsTrigger value="comparativo" className="data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm">
            📊 Comparativo Municipal
          </TabsTrigger>
          <TabsTrigger value="ranking-municipal" className="data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm">
            🏙️ Ranking Municipal
          </TabsTrigger>
          <TabsTrigger value="selos" className="data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm">
            🏅 Distintivos e Metas
          </TabsTrigger>
        </TabsList>

        {/* ── Tab: Ranking Nacional ───────────────────────── */}
        <TabsContent value="ranking" className="space-y-5 mt-4">
          {/* Bar chart */}
          <Card className="shadow-sm border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold" style={{ color: FIORI_BLUE_DARK }}>
                Volume Reciclado per Capita — Top 15 Estados (kg/habitante/ano)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingRanking ? (
                <div className="h-[380px] flex items-center justify-center text-sm text-gray-400">
                  Carregando dados...
                </div>
              ) : (
                <div className="h-[380px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} margin={{ left: 10, right: 20, top: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="uf" tick={{ fontSize: 11, fill: "#6B7280" }} />
                      <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} />
                      <Tooltip
                        contentStyle={{
                          background: "white",
                          border: "1px solid #E5E7EB",
                          borderRadius: 8,
                          fontSize: 12,
                          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                        }}
                      />
                      <Bar dataKey="kg/hab/ano" fill={FIORI_BLUE} radius={[4, 4, 0, 0]} name="kg/hab/ano" />
                      <Bar dataKey="Desvio Aterro (%)" fill={FIORI_GREEN} radius={[4, 4, 0, 0]} name="Desvio Aterro (%)" />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Table */}
          <Card className="shadow-sm border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold" style={{ color: FIORI_BLUE_DARK }}>
                Ranking Completo — 27 Unidades Federativas
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="text-xs font-semibold w-12" style={{ color: FIORI_BLUE_DARK }}>#</TableHead>
                      <TableHead className="text-xs font-semibold" style={{ color: FIORI_BLUE_DARK }}>UF</TableHead>
                      <TableHead className="text-xs font-semibold" style={{ color: FIORI_BLUE_DARK }}>Estado</TableHead>
                      <TableHead className="text-xs font-semibold text-right" style={{ color: FIORI_BLUE_DARK }}>População</TableHead>
                      <TableHead className="text-xs font-semibold text-right" style={{ color: FIORI_BLUE_DARK }}>kg/hab/ano</TableHead>
                      <TableHead className="text-xs font-semibold text-right" style={{ color: FIORI_BLUE_DARK }}>Desvio Aterro</TableHead>
                      <TableHead className="text-xs font-semibold text-center" style={{ color: FIORI_BLUE_DARK }}>Meta PNRS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ranking?.map((e: any) => (
                      <TableRow key={e.uf} className="hover:bg-blue-50/30">
                        <TableCell className="text-xs font-bold" style={{ color: FIORI_BLUE }}>
                          {e.posicao_ranking}º
                        </TableCell>
                        <TableCell className="text-xs font-semibold">{e.uf}</TableCell>
                        <TableCell className="text-xs">{e.nome_estado}</TableCell>
                        <TableCell className="text-xs text-right text-gray-600">
                          {Number(e.populacao).toLocaleString("pt-BR")}
                        </TableCell>
                        <TableCell className="text-xs text-right font-semibold" style={{ color: FIORI_BLUE_DARK }}>
                          {Number(e.kg_per_capita).toFixed(1)}
                        </TableCell>
                        <TableCell className="text-xs text-right">
                          {Number(e.taxa_desvio_aterro).toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-center">
                          {e.meta_pnrs_cumprida ? (
                            <Badge className="text-[10px] px-2 py-0.5" style={{ backgroundColor: FIORI_GREEN, color: "white" }}>
                              ✓ Cumprida
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] px-2 py-0.5 border-gray-300 text-gray-500">
                              Pendente
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: Comparativo Municipal ──────────────────── */}
        <TabsContent value="comparativo" className="space-y-5 mt-4">
          {/* Selectors */}
          <Card className="shadow-sm border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold" style={{ color: FIORI_BLUE_DARK }}>
                Selecione até 3 municípios para comparação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { val: mun1, set: setMun1, label: "Município 1", color: FIORI_BLUE },
                  { val: mun2, set: setMun2, label: "Município 2", color: FIORI_GREEN },
                  { val: mun3, set: setMun3, label: "Município 3", color: FIORI_ORANGE },
                ].map((sel) => (
                  <div key={sel.label}>
                    <label className="text-xs font-medium mb-1 block" style={{ color: sel.color }}>
                      {sel.label}
                    </label>
                    <Select value={sel.val} onValueChange={sel.set}>
                      <SelectTrigger className="h-9 text-xs border-gray-300">
                        <SelectValue placeholder="Selecionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        {municipios?.map((m: any) => (
                          <SelectItem key={m.municipio_ibge} value={m.municipio_ibge} className="text-xs">
                            {m.nome_municipio}/{m.uf}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Radar Chart + Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card className="shadow-sm border-gray-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold" style={{ color: FIORI_BLUE_DARK }}>
                  Gráfico Radar — Comparativo Multidimensional
                </CardTitle>
              </CardHeader>
              <CardContent>
                {radarData.length === 0 ? (
                  <div className="h-[360px] flex flex-col items-center justify-center text-gray-400">
                    <Search className="h-10 w-10 mb-3 text-gray-300" />
                    <p className="text-sm">Selecione ao menos um município acima</p>
                  </div>
                ) : (
                  <div className="h-[360px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData} outerRadius="70%">
                        <PolarGrid stroke="#E5E7EB" />
                        <PolarAngleAxis dataKey="indicador" tick={{ fontSize: 10, fill: "#6B7280" }} />
                        <PolarRadiusAxis angle={30} domain={[0, 80]} tick={{ fontSize: 9 }} />
                        {selectedMunNames.map((name, i) => (
                          <Radar
                            key={name}
                            name={name}
                            dataKey={name}
                            stroke={radarColors[i]}
                            fill={radarColors[i]}
                            fillOpacity={0.15}
                            strokeWidth={2}
                          />
                        ))}
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Tooltip contentStyle={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 12 }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Side-by-side detail table */}
            <Card className="shadow-sm border-gray-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold" style={{ color: FIORI_BLUE_DARK }}>
                  Detalhamento dos Municípios Selecionados
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {selectedMunNames.length === 0 ? (
                  <div className="h-[360px] flex items-center justify-center text-sm text-gray-400 px-4">
                    Nenhum município selecionado
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="text-xs font-semibold" style={{ color: FIORI_BLUE_DARK }}>Métrica</TableHead>
                        {selectedMunNames.map((name, i) => (
                          <TableHead key={name} className="text-xs font-semibold text-right" style={{ color: radarColors[i] }}>
                            {name}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[
                        { label: "Coleta Seletiva (%)", key: "eficiencia_coleta_seletiva" },
                        { label: "Engajamento (%)", key: "engajamento_cidadao" },
                        { label: "Pontos/km²", key: "pontos_coleta_por_km2" },
                        { label: "Desvio Aterro (%)", key: "taxa_desvio_aterro" },
                        { label: "Reciclado (ton)", key: "volume_reciclado_ton" },
                        { label: "Coletado (ton)", key: "volume_coletado_ton" },
                        { label: "População", key: "populacao" },
                      ].map((metric) => (
                        <TableRow key={metric.key}>
                          <TableCell className="text-xs font-medium">{metric.label}</TableCell>
                          {[mun1, mun2, mun3].filter(Boolean).map((code) => {
                            const m = municipios?.find((x: any) => x.municipio_ibge === code);
                            if (!m) return null;
                            const val = Number(m[metric.key as keyof typeof m]);
                            return (
                              <TableCell key={code} className="text-xs text-right font-semibold" style={{ color: FIORI_BLUE_DARK }}>
                                {metric.key === "populacao" || metric.key === "volume_reciclado_ton" || metric.key === "volume_coletado_ton"
                                  ? val.toLocaleString("pt-BR")
                                  : val.toFixed(1)}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Tab: Distintivos e Metas ────────────────────── */}
        <TabsContent value="selos" className="space-y-5 mt-4">
          <Card className="shadow-sm border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold" style={{ color: FIORI_BLUE_DARK }}>
                Selos e Distintivos Concedidos — Gamificação Governamental (Planares)
              </CardTitle>
              <p className="text-xs text-gray-500 mt-1">
                Municípios que atingiram marcos do Plano Nacional de Resíduos Sólidos recebem selos digitais automaticamente.
              </p>
            </CardHeader>
            <CardContent>
              {loadingSelos ? (
                <p className="text-sm text-gray-400 py-8 text-center">Carregando selos...</p>
              ) : !selos || selos.length === 0 ? (
                <p className="text-sm text-gray-400 py-8 text-center">Nenhum selo concedido ainda.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selos.map((selo: any) => {
                    const IconComp = SEAL_ICONS[selo.tipo_selo] || Award;
                    const sealColor = SEAL_COLORS[selo.tipo_selo] || FIORI_BLUE;
                    return (
                      <div
                        key={selo.id}
                        className="relative p-4 rounded-xl border-2 transition-all hover:shadow-md"
                        style={{ borderColor: `${sealColor}30`, backgroundColor: `${sealColor}05` }}
                      >
                        {/* Badge icon */}
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center mb-3 mx-auto"
                          style={{ backgroundColor: `${sealColor}15` }}
                        >
                          <IconComp className="h-6 w-6" style={{ color: sealColor }} />
                        </div>
                        {/* Title */}
                        <h3 className="text-xs font-bold text-center mb-1" style={{ color: sealColor }}>
                          {selo.tipo_selo}
                        </h3>
                        <p className="text-[11px] text-gray-500 text-center mb-2">
                          {selo.descricao}
                        </p>
                        {/* Municipality */}
                        <div className="text-center">
                          <Badge variant="outline" className="text-[10px] px-2 border-gray-300">
                            {selo.nome_municipio}/{selo.uf}
                          </Badge>
                        </div>
                        <p className="text-[10px] text-gray-400 text-center mt-2">
                          Concedido em {new Date(selo.data_concessao).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reference: European benchmarks */}
          <Card className="shadow-sm border-gray-200" style={{ borderLeft: `4px solid ${FIORI_BLUE}` }}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: FIORI_BLUE_LIGHT }}>
                  <Trophy className="h-5 w-5" style={{ color: FIORI_BLUE }} />
                </div>
                <div>
                  <h4 className="text-xs font-bold" style={{ color: FIORI_BLUE_DARK }}>
                    Referência Europeia — ARP-GAN / Bruxelas
                  </h4>
                  <p className="text-[11px] text-gray-500 mt-1">
                    A meta europeia para 2030 é atingir 65% de taxa de reciclagem. O Brasil, através do PLANARES,
                    busca nacionalizar modelos de excelência como o da ARP-GAN (54,3% em Bruxelas), adaptando
                    a Escala de Lansink e incentivando a transparência com dados abertos estilo "Pacto-Gov".
                  </p>
                  <div className="flex gap-3 mt-2">
                    {[
                      { label: "Alemanha", val: "66,1%" },
                      { label: "Bélgica", val: "54,3%" },
                      { label: "Brasil (est.)", val: "4,0%" },
                      { label: "Meta UE 2030", val: "65%" },
                    ].map((ref) => (
                      <div key={ref.label} className="text-center">
                        <p className="text-xs font-bold" style={{ color: FIORI_BLUE_DARK }}>{ref.val}</p>
                        <p className="text-[9px] text-gray-400">{ref.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: Ranking Municipal ─────────────────────── */}
        <TabsContent value="ranking-municipal" className="space-y-5 mt-4">
          <Card className="shadow-sm border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold" style={{ color: FIORI_BLUE_DARK }}>
                Ranking Municipal — Eficiência da Coleta Seletiva (%)
              </CardTitle>
              <p className="text-xs text-gray-500 mt-1">
                Todos os municípios mapeados, ordenados por eficiência da coleta seletiva. Dados do ano de referência 2025.
              </p>
            </CardHeader>
            <CardContent className="p-0">
              {loadingMunRanked ? (
                <div className="py-12 text-center text-sm text-gray-400">Carregando ranking...</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="text-xs font-semibold w-12" style={{ color: FIORI_BLUE_DARK }}>#</TableHead>
                        <TableHead className="text-xs font-semibold" style={{ color: FIORI_BLUE_DARK }}>Município</TableHead>
                        <TableHead className="text-xs font-semibold" style={{ color: FIORI_BLUE_DARK }}>UF</TableHead>
                        <TableHead className="text-xs font-semibold text-right" style={{ color: FIORI_BLUE_DARK }}>População</TableHead>
                        <TableHead className="text-xs font-semibold text-right" style={{ color: FIORI_BLUE_DARK }}>Coleta Seletiva</TableHead>
                        <TableHead className="text-xs font-semibold text-right" style={{ color: FIORI_BLUE_DARK }}>Engajamento</TableHead>
                        <TableHead className="text-xs font-semibold text-right" style={{ color: FIORI_BLUE_DARK }}>Pts/km²</TableHead>
                        <TableHead className="text-xs font-semibold text-right" style={{ color: FIORI_BLUE_DARK }}>Desvio Aterro</TableHead>
                        <TableHead className="text-xs font-semibold text-right" style={{ color: FIORI_BLUE_DARK }}>Reciclado (ton)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {municipiosRanked?.map((m: any, idx: number) => {
                        const eff = Number(m.eficiencia_coleta_seletiva);
                        const barColor = eff >= 60 ? FIORI_GREEN : eff >= 40 ? FIORI_BLUE : eff >= 25 ? FIORI_ORANGE : FIORI_RED;
                        return (
                          <TableRow key={m.id} className="hover:bg-blue-50/30">
                            <TableCell className="text-xs font-bold" style={{ color: FIORI_BLUE }}>
                              {idx + 1}º
                            </TableCell>
                            <TableCell className="text-xs font-medium">{m.nome_municipio}</TableCell>
                            <TableCell className="text-xs">{m.uf}</TableCell>
                            <TableCell className="text-xs text-right text-gray-600">
                              {Number(m.populacao).toLocaleString("pt-BR")}
                            </TableCell>
                            <TableCell className="text-xs text-right">
                              <div className="flex items-center justify-end gap-2">
                                <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full transition-all"
                                    style={{ width: `${Math.min(eff, 100)}%`, backgroundColor: barColor }}
                                  />
                                </div>
                                <span className="font-semibold w-12 text-right" style={{ color: barColor }}>
                                  {eff.toFixed(1)}%
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-right text-gray-600">
                              {Number(m.engajamento_cidadao).toFixed(1)}%
                            </TableCell>
                            <TableCell className="text-xs text-right text-gray-600">
                              {Number(m.pontos_coleta_por_km2).toFixed(1)}
                            </TableCell>
                            <TableCell className="text-xs text-right text-gray-600">
                              {Number(m.taxa_desvio_aterro).toFixed(1)}%
                            </TableCell>
                            <TableCell className="text-xs text-right font-semibold" style={{ color: FIORI_BLUE_DARK }}>
                              {Number(m.volume_reciclado_ton).toLocaleString("pt-BR")}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardBenchmarks;
