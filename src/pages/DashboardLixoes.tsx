import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, ScatterChart, Scatter,
} from "recharts";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Trash2, Recycle, TrendingDown, DollarSign } from "lucide-react";

const FIORI_BLUE = "#0A6ED1";
const FIORI_GREEN = "#107E3E";
const FIORI_ORANGE = "#E9730C";
const FIORI_RED = "#BB0000";
const FIORI_GRAY = "#6B7280";

const STATUS_COLOR: Record<string, string> = {
  ativo: FIORI_RED,
  em_encerramento: FIORI_ORANGE,
  encerrado: FIORI_BLUE,
  recuperado: FIORI_GREEN,
};

const STATUS_LABEL: Record<string, string> = {
  ativo: "Ativo",
  em_encerramento: "Em encerramento",
  encerrado: "Encerrado",
  recuperado: "Recuperado",
};

const TIPO_LABEL: Record<string, string> = {
  lixao: "Lixão",
  aterro_controlado: "Aterro Controlado",
  aterro_sanitario: "Aterro Sanitário",
  transbordo: "Transbordo",
};

const fmtNum = (n: number) =>
  new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(n);
const fmtBRL = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(n);

type Lixao = {
  id: string;
  nome: string;
  uf: string;
  municipio: string;
  latitude: number;
  longitude: number;
  tipo: string;
  status: string;
  area_ha: number | null;
  volume_estocado_m3_inicial: number | null;
  data_encerramento_real: string | null;
};

type Hist = {
  lixao_id: string;
  mes_referencia: string;
  volume_estocado_m3: number;
  volume_removido_m3: number;
  volume_recuperado_m3: number;
};

type Correlacao = {
  uf: string;
  lixoes_ativos: number;
  lixoes_em_encerramento: number;
  lixoes_encerrados: number;
  lixoes_recuperados: number;
  volume_inicial_m3_total: number;
  volume_estocado_m3_total: number;
  volume_removido_m3_total: number;
  volume_recuperado_m3_total: number;
  taxa_reducao_pct: number;
  volume_reciclado_ton_uf: number;
  taxa_desvio_aterro_uf: number;
  correlacao_reciclagem_pct: number;
  economia_estimada_rs: number;
};

const DashboardLixoes = () => {
  const [filtroUF, setFiltroUF] = useState<string>("todas");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");

  const { data: lixoes = [] } = useQuery({
    queryKey: ["lixoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lixoes" as any)
        .select("*")
        .order("nome");
      if (error) throw error;
      return (data ?? []) as unknown as Lixao[];
    },
  });

  const { data: historico = [] } = useQuery({
    queryKey: ["lixao_volume_historico"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lixao_volume_historico" as any)
        .select("*")
        .order("mes_referencia", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as Hist[];
    },
  });

  const { data: correlacao = [] } = useQuery({
    queryKey: ["vw_lixoes_correlacao"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vw_lixoes_correlacao" as any)
        .select("*")
        .order("volume_estocado_m3_total", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Correlacao[];
    },
  });

  const ufs = useMemo(
    () => Array.from(new Set(lixoes.map((l) => l.uf))).sort(),
    [lixoes]
  );

  const lixoesFiltrados = useMemo(
    () =>
      lixoes.filter(
        (l) =>
          (filtroUF === "todas" || l.uf === filtroUF) &&
          (filtroStatus === "todos" || l.status === filtroStatus)
      ),
    [lixoes, filtroUF, filtroStatus]
  );

  // KPIs nacionais
  const kpis = useMemo(() => {
    const totalLixoes = lixoes.length;
    const ativos = lixoes.filter((l) => l.status === "ativo" || l.status === "em_encerramento").length;
    const totalRemovido = correlacao.reduce((s, c) => s + Number(c.volume_removido_m3_total || 0), 0);
    const totalEconomia = correlacao.reduce((s, c) => s + Number(c.economia_estimada_rs || 0), 0);
    const reducaoMedia =
      correlacao.length > 0
        ? correlacao.reduce((s, c) => s + Number(c.taxa_reducao_pct || 0), 0) / correlacao.length
        : 0;
    return { totalLixoes, ativos, totalRemovido, totalEconomia, reducaoMedia };
  }, [lixoes, correlacao]);

  // Série temporal nacional
  const serieTemporal = useMemo(() => {
    const map = new Map<string, { mes: string; estocado: number; removido: number; recuperado: number }>();
    historico.forEach((h) => {
      const key = h.mes_referencia.substring(0, 7);
      const cur = map.get(key) ?? { mes: key, estocado: 0, removido: 0, recuperado: 0 };
      cur.estocado += Number(h.volume_estocado_m3);
      cur.removido += Number(h.volume_removido_m3);
      cur.recuperado += Number(h.volume_recuperado_m3);
      map.set(key, cur);
    });
    return Array.from(map.values()).sort((a, b) => a.mes.localeCompare(b.mes));
  }, [historico]);

  // Dispersão: remoção vs reciclagem por UF
  const scatterData = useMemo(
    () =>
      correlacao.map((c) => ({
        uf: c.uf,
        x: Number(c.volume_removido_m3_total) / 1000, // mil m³
        y: Number(c.volume_reciclado_ton_uf) / 1000, // mil ton
      })),
    [correlacao]
  );

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Lixões cadastrados</p>
                <p className="text-2xl font-bold">{kpis.totalLixoes}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {kpis.ativos} ativos / em encerramento
                </p>
              </div>
              <Trash2 className="h-8 w-8" style={{ color: FIORI_RED }} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Volume removido (m³/mês)</p>
                <p className="text-2xl font-bold">{fmtNum(kpis.totalRemovido)}</p>
              </div>
              <Recycle className="h-8 w-8" style={{ color: FIORI_BLUE }} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Redução média</p>
                <p className="text-2xl font-bold">{kpis.reducaoMedia.toFixed(1)}%</p>
              </div>
              <TrendingDown className="h-8 w-8" style={{ color: FIORI_GREEN }} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Economia estimada</p>
                <p className="text-2xl font-bold">{fmtBRL(kpis.totalEconomia)}</p>
                <p className="text-xs text-muted-foreground mt-1">Custo de aterro evitado</p>
              </div>
              <DollarSign className="h-8 w-8" style={{ color: FIORI_ORANGE }} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6 flex flex-wrap gap-4">
          <div className="min-w-[180px]">
            <label className="text-sm text-muted-foreground">UF</label>
            <Select value={filtroUF} onValueChange={setFiltroUF}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                {ufs.map((uf) => (
                  <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-[200px]">
            <label className="text-sm text-muted-foreground">Status</label>
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {Object.entries(STATUS_LABEL).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="mapa" className="space-y-4">
        <TabsList>
          <TabsTrigger value="mapa">Mapa</TabsTrigger>
          <TabsTrigger value="temporal">Série temporal</TabsTrigger>
          <TabsTrigger value="correlacao">Correlação UF</TabsTrigger>
          <TabsTrigger value="tabela">Tabela</TabsTrigger>
        </TabsList>

        {/* MAPA */}
        <TabsContent value="mapa">
          <Card>
            <CardHeader>
              <CardTitle>Mapa nacional de lixões e aterros</CardTitle>
              <div className="flex flex-wrap gap-3 pt-2 text-xs">
                {Object.entries(STATUS_LABEL).map(([k, v]) => (
                  <div key={k} className="flex items-center gap-1">
                    <span
                      className="inline-block w-3 h-3 rounded-full"
                      style={{ background: STATUS_COLOR[k] }}
                    />
                    {v}
                  </div>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              <div style={{ height: 560, width: "100%" }} className="rounded-md overflow-hidden border">
                <MapContainer
                  center={[-14.235, -51.9253]}
                  zoom={4}
                  style={{ height: "100%", width: "100%" }}
                  scrollWheelZoom
                >
                  <TileLayer
                    attribution='&copy; OpenStreetMap'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {lixoesFiltrados.map((l) => (
                    <CircleMarker
                      key={l.id}
                      center={[Number(l.latitude), Number(l.longitude)]}
                      radius={Math.max(6, Math.min(20, Math.sqrt((l.area_ha ?? 30)) * 1.2))}
                      pathOptions={{
                        color: STATUS_COLOR[l.status] ?? FIORI_GRAY,
                        fillColor: STATUS_COLOR[l.status] ?? FIORI_GRAY,
                        fillOpacity: 0.55,
                        weight: 2,
                      }}
                    >
                      <Popup>
                        <div className="space-y-1">
                          <div className="font-semibold">{l.nome}</div>
                          <div className="text-xs">{l.municipio} — {l.uf}</div>
                          <div className="text-xs">
                            <Badge variant="outline">{TIPO_LABEL[l.tipo]}</Badge>{" "}
                            <Badge style={{ background: STATUS_COLOR[l.status], color: "#fff" }}>
                              {STATUS_LABEL[l.status]}
                            </Badge>
                          </div>
                          {l.area_ha && <div className="text-xs">Área: {l.area_ha} ha</div>}
                          {l.volume_estocado_m3_inicial && (
                            <div className="text-xs">
                              Volume inicial: {fmtNum(Number(l.volume_estocado_m3_inicial))} m³
                            </div>
                          )}
                          {l.data_encerramento_real && (
                            <div className="text-xs text-muted-foreground">
                              Encerrado em {new Date(l.data_encerramento_real).toLocaleDateString("pt-BR")}
                            </div>
                          )}
                        </div>
                      </Popup>
                    </CircleMarker>
                  ))}
                </MapContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SÉRIE TEMPORAL */}
        <TabsContent value="temporal">
          <Card>
            <CardHeader>
              <CardTitle>Volume estocado × removido × recuperado (m³/mês)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={serieTemporal}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`} />
                  <Tooltip formatter={(v: number) => `${fmtNum(v)} m³`} />
                  <Legend />
                  <Line type="monotone" dataKey="estocado" stroke={FIORI_RED} name="Estocado" strokeWidth={2} />
                  <Line type="monotone" dataKey="removido" stroke={FIORI_BLUE} name="Removido" strokeWidth={2} />
                  <Line type="monotone" dataKey="recuperado" stroke={FIORI_GREEN} name="Recuperado para reciclagem" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CORRELAÇÃO */}
        <TabsContent value="correlacao" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Remoção de lixões × Reciclagem por UF</CardTitle>
              <p className="text-xs text-muted-foreground">
                Cada ponto representa um estado. Quanto mais à direita, maior o volume removido dos lixões; quanto mais alto, maior o volume reciclado.
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={360}>
                <ScatterChart>
                  <CartesianGrid />
                  <XAxis
                    type="number"
                    dataKey="x"
                    name="Removido"
                    unit=" mil m³"
                    label={{ value: "Volume removido (mil m³)", position: "insideBottom", offset: -5 }}
                  />
                  <YAxis
                    type="number"
                    dataKey="y"
                    name="Reciclado"
                    unit=" mil ton"
                    label={{ value: "Reciclado (mil ton)", angle: -90, position: "insideLeft" }}
                  />
                  <Tooltip
                    cursor={{ strokeDasharray: "3 3" }}
                    formatter={(v: number, n: string) =>
                      n === "Reciclado" ? `${v.toFixed(1)} mil ton` : `${v.toFixed(1)} mil m³`
                    }
                    labelFormatter={(_, p) => p?.[0]?.payload?.uf ?? ""}
                  />
                  <Scatter data={scatterData} fill={FIORI_BLUE} />
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Taxa de redução do estoque por UF (%)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={correlacao}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="uf" />
                  <YAxis unit="%" />
                  <Tooltip formatter={(v: number) => `${Number(v).toFixed(2)}%`} />
                  <Bar dataKey="taxa_reducao_pct" fill={FIORI_GREEN} name="Redução de volume" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TABELA */}
        <TabsContent value="tabela">
          <Card>
            <CardHeader>
              <CardTitle>Correlação detalhada por UF</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>UF</TableHead>
                    <TableHead className="text-right">Ativos</TableHead>
                    <TableHead className="text-right">Em encerr.</TableHead>
                    <TableHead className="text-right">Encerrados</TableHead>
                    <TableHead className="text-right">Estocado (m³)</TableHead>
                    <TableHead className="text-right">Removido (m³)</TableHead>
                    <TableHead className="text-right">Redução</TableHead>
                    <TableHead className="text-right">Reciclado (ton)</TableHead>
                    <TableHead className="text-right">Correl. reciclagem</TableHead>
                    <TableHead className="text-right">Economia (R$)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {correlacao.map((c) => (
                    <TableRow key={c.uf}>
                      <TableCell className="font-medium">{c.uf}</TableCell>
                      <TableCell className="text-right">{c.lixoes_ativos}</TableCell>
                      <TableCell className="text-right">{c.lixoes_em_encerramento}</TableCell>
                      <TableCell className="text-right">{c.lixoes_encerrados}</TableCell>
                      <TableCell className="text-right">{fmtNum(Number(c.volume_estocado_m3_total))}</TableCell>
                      <TableCell className="text-right">{fmtNum(Number(c.volume_removido_m3_total))}</TableCell>
                      <TableCell className="text-right" style={{ color: FIORI_GREEN }}>
                        {Number(c.taxa_reducao_pct).toFixed(2)}%
                      </TableCell>
                      <TableCell className="text-right">{fmtNum(Number(c.volume_reciclado_ton_uf))}</TableCell>
                      <TableCell className="text-right">{Number(c.correlacao_reciclagem_pct).toFixed(1)}%</TableCell>
                      <TableCell className="text-right" style={{ color: FIORI_ORANGE }}>
                        {fmtBRL(Number(c.economia_estimada_rs))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardLixoes;
