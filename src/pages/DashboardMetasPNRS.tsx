import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend,
} from "recharts";
import { Target, TrendingUp, CalendarClock, Search } from "lucide-react";

const ANO_META = 2030;

interface BenchMunicipio {
  id: string;
  municipio_ibge: string;
  nome_municipio: string;
  uf: string;
  populacao: number | null;
  volume_coletado_ton: number | null;
  volume_reciclado_ton: number | null;
  taxa_desvio_aterro: number | null;
  eficiencia_coleta_seletiva: number | null;
  ano_referencia: number;
}

const useBenchmarks = () =>
  useQuery({
    queryKey: ["benchmark_municipios", "metas-pnrs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("benchmark_municipios")
        .select("*")
        .order("ano_referencia", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as BenchMunicipio[];
    },
  });

/** Regressão linear simples: retorna { a, b } de y = a + b*x */
function regressao(pontos: { x: number; y: number }[]) {
  const n = pontos.length;
  if (n === 0) return null;
  if (n === 1) return { a: pontos[0].y, b: 0 };
  const mx = pontos.reduce((s, p) => s + p.x, 0) / n;
  const my = pontos.reduce((s, p) => s + p.y, 0) / n;
  const den = pontos.reduce((s, p) => s + (p.x - mx) ** 2, 0);
  if (den === 0) return { a: my, b: 0 };
  const b = pontos.reduce((s, p) => s + (p.x - mx) * (p.y - my), 0) / den;
  return { a: my - b * mx, b };
}

const DashboardMetasPNRS = () => {
  const { data, isLoading } = useBenchmarks();
  const [uf, setUf] = useState("todas");
  const [municipio, setMunicipio] = useState<string>("");
  const [busca, setBusca] = useState("");
  const [meta, setMeta] = useState(48);

  useEffect(() => {
    document.title = "Metas PNRS 2030 | SINARV";
    const desc = "Acompanhe a projeção anual e o histórico das metas PNRS por município até 2030.";
    let tag = document.querySelector('meta[name="description"]');
    if (!tag) {
      tag = document.createElement("meta");
      tag.setAttribute("name", "description");
      document.head.appendChild(tag);
    }
    tag.setAttribute("content", desc);
  }, []);

  const ufs = useMemo(
    () => Array.from(new Set((data ?? []).map((d) => d.uf).filter(Boolean))).sort(),
    [data],
  );

  const municipios = useMemo(() => {
    const mapa = new Map<string, BenchMunicipio>();
    (data ?? []).forEach((d) => {
      if (uf !== "todas" && d.uf !== uf) return;
      if (busca && !d.nome_municipio?.toLowerCase().includes(busca.toLowerCase())) return;
      if (!mapa.has(d.municipio_ibge)) mapa.set(d.municipio_ibge, d);
    });
    return Array.from(mapa.values()).sort((a, b) =>
      a.nome_municipio.localeCompare(b.nome_municipio),
    );
  }, [data, uf, busca]);

  const selecionado = municipio || municipios[0]?.municipio_ibge || "";

  const historico = useMemo(
    () =>
      (data ?? [])
        .filter((d) => d.municipio_ibge === selecionado)
        .sort((a, b) => a.ano_referencia - b.ano_referencia),
    [data, selecionado],
  );

  const serie = useMemo(() => {
    const pontos = historico
      .filter((h) => h.taxa_desvio_aterro != null)
      .map((h) => ({ x: h.ano_referencia, y: Number(h.taxa_desvio_aterro) }));
    const reg = regressao(pontos);
    const anoInicial = pontos[0]?.x ?? ANO_META - 5;
    const linhas: {
      ano: number;
      observado: number | null;
      projetado: number | null;
      meta: number;
    }[] = [];
    for (let ano = anoInicial; ano <= ANO_META; ano++) {
      const obs = pontos.find((p) => p.x === ano)?.y ?? null;
      const proj = reg ? Math.max(0, Math.min(100, reg.a + reg.b * ano)) : null;
      linhas.push({ ano, observado: obs, projetado: proj, meta });
    }
    return { linhas, reg };
  }, [historico, meta]);

  const municipioAtual = historico[historico.length - 1];
  const projecao2030 = serie.linhas[serie.linhas.length - 1]?.projetado ?? null;
  const atingeMeta = projecao2030 != null && projecao2030 >= meta;
  const anosRestantes = ANO_META - new Date().getFullYear();

  const gapPontos =
    projecao2030 != null ? Number((meta - projecao2030).toFixed(1)) : null;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Target className="h-6 w-6 text-primary" /> Metas PNRS até 2030
        </h1>
        <p className="text-sm text-muted-foreground">
          Histórico observado e projeção linear da taxa de desvio de aterro por município,
          comparada à meta pactuada. Fonte: base de benchmarks municipais do SINARV.
        </p>
      </header>

      <Card>
        <CardContent className="grid gap-4 p-4 md:grid-cols-4">
          <div className="space-y-1.5">
            <Label>UF</Label>
            <Select value={uf} onValueChange={(v) => { setUf(v); setMunicipio(""); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                {ufs.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Buscar município</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Nome do município"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Município</Label>
            <Select value={selecionado} onValueChange={setMunicipio}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {municipios.map((m) => (
                  <SelectItem key={m.municipio_ibge} value={m.municipio_ibge}>
                    {m.nome_municipio} — {m.uf}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Meta 2030 (% desvio de aterro)</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={meta}
              onChange={(e) => setMeta(Number(e.target.value) || 0)}
            />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <Skeleton className="h-80 w-full" />
      ) : historico.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            Nenhum histórico disponível para os filtros selecionados. Importe dados oficiais
            em Administração → Importação de dados.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground">Município</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">{municipioAtual?.nome_municipio}</p>
                <p className="text-xs text-muted-foreground">
                  {municipioAtual?.uf} · IBGE {municipioAtual?.municipio_ibge}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground">
                  Último valor observado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {municipioAtual?.taxa_desvio_aterro != null
                    ? `${Number(municipioAtual.taxa_desvio_aterro).toFixed(1)}%`
                    : "—"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Ano {municipioAtual?.ano_referencia}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground">Projeção 2030</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold flex items-center gap-2">
                  {projecao2030 != null ? `${projecao2030.toFixed(1)}%` : "—"}
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </p>
                <Badge variant={atingeMeta ? "default" : "destructive"} className="mt-1">
                  {atingeMeta ? "Meta atingível" : "Meta em risco"}
                </Badge>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground">
                  Lacuna para a meta
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {gapPontos != null ? `${gapPontos > 0 ? gapPontos : 0} p.p.` : "—"}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <CalendarClock className="h-3 w-3" /> {anosRestantes} anos restantes
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Trajetória até 2030</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={serie.linhas}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="ano" fontSize={12} />
                  <YAxis unit="%" fontSize={12} domain={[0, 100]} />
                  <Tooltip
                    formatter={(v: number | null) =>
                      v == null ? "—" : `${Number(v).toFixed(1)}%`
                    }
                  />
                  <Legend />
                  <ReferenceLine
                    y={meta}
                    stroke="hsl(var(--destructive))"
                    strokeDasharray="4 4"
                    label={{ value: `Meta ${meta}%`, position: "right", fontSize: 11 }}
                  />
                  <Area
                    name="Projeção"
                    type="monotone"
                    dataKey="projetado"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary) / 0.15)"
                  />
                  <Line
                    name="Observado"
                    type="monotone"
                    dataKey="observado"
                    stroke="hsl(var(--foreground))"
                    strokeWidth={2}
                    connectNulls
                    dot
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Histórico e projeção anual</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ano</TableHead>
                    <TableHead className="text-right">Coletado (t)</TableHead>
                    <TableHead className="text-right">Reciclado (t)</TableHead>
                    <TableHead className="text-right">Desvio observado</TableHead>
                    <TableHead className="text-right">Projeção</TableHead>
                    <TableHead className="text-right">Meta</TableHead>
                    <TableHead>Situação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {serie.linhas.map((l) => {
                    const h = historico.find((x) => x.ano_referencia === l.ano);
                    const valor = l.observado ?? l.projetado;
                    const ok = valor != null && valor >= meta;
                    return (
                      <TableRow key={l.ano}>
                        <TableCell className="font-medium">{l.ano}</TableCell>
                        <TableCell className="text-right">
                          {h?.volume_coletado_ton != null
                            ? Number(h.volume_coletado_ton).toLocaleString("pt-BR")
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {h?.volume_reciclado_ton != null
                            ? Number(h.volume_reciclado_ton).toLocaleString("pt-BR")
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {l.observado != null ? `${l.observado.toFixed(1)}%` : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {l.projetado != null ? `${l.projetado.toFixed(1)}%` : "—"}
                        </TableCell>
                        <TableCell className="text-right">{meta}%</TableCell>
                        <TableCell>
                          <Badge variant={ok ? "default" : "secondary"}>
                            {l.observado != null ? "Observado" : "Projetado"} ·{" "}
                            {ok ? "na meta" : "abaixo"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default DashboardMetasPNRS;
