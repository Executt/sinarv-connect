import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { Coins, Leaf, Search, TrendingDown, Wallet, Factory } from "lucide-react";

/* ── Tipos ───────────────────────────────────────────────── */
interface IndicadorANA {
  id: string;
  municipio_ibge: string;
  nome_municipio: string;
  uf: string;
  ano_referencia: number;
  fonte: string;
  massa_coletada_ton: number;
  massa_recuperada_ton: number;
  despesa_total_rs: number;
  receita_taxa_rs: number;
  possui_cobranca_especifica: boolean;
  custo_por_tonelada_rs: number | null;
  custo_por_habitante_rs: number | null;
  cobertura_seletiva_pct: number | null;
  taxa_recuperacao_pct: number | null;
  taxa_desvio_aterro_pct: number | null;
  cobertura_receita_pct: number | null;
  situacao_sustentabilidade: string;
}

interface FatorMaterial {
  id: string;
  material: string;
  uf: string | null;
  co2e_evitado_ton_por_ton: number | null;
  energia_evitada_mwh_por_ton: number | null;
  agua_evitada_m3_por_ton: number | null;
  metodologia: string | null;
  fonte: string | null;
  fonte_url: string | null;
  ano_referencia_fator: number | null;
  ativo: boolean;
}

/* ── Queries ─────────────────────────────────────────────── */
const useIndicadoresANA = () =>
  useQuery({
    queryKey: ["vw_indicadores_ana"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("vw_indicadores_ana")
        .select("*")
        .order("custo_por_tonelada_rs", { ascending: false });
      if (error) throw error;
      return (data ?? []) as IndicadorANA[];
    },
  });

const useFatoresMaterial = () =>
  useQuery({
    queryKey: ["economia_fatores_material", "carbono"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("economia_fatores_material")
        .select("*")
        .eq("ativo", true)
        .order("co2e_evitado_ton_por_ton", { ascending: false });
      if (error) throw error;
      return (data ?? []) as FatorMaterial[];
    },
  });

/* ── Helpers ─────────────────────────────────────────────── */
const brl = (v: number | null | undefined) =>
  v == null ? "—" : v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const pct = (v: number | null | undefined) => (v == null ? "—" : `${Number(v).toFixed(1)}%`);
const num = (v: number | null | undefined, d = 2) => (v == null ? "—" : Number(v).toFixed(d));

const SITUACAO: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  sustentavel: { label: "Sustentável", variant: "default" },
  atencao: { label: "Atenção", variant: "secondary" },
  deficitario: { label: "Deficitário", variant: "destructive" },
  sem_dado: { label: "Sem dado", variant: "outline" },
};

const DashboardSustentabilidade = () => {
  const { data: indicadores = [], isLoading } = useIndicadoresANA();
  const { data: fatores = [] } = useFatoresMaterial();
  const [busca, setBusca] = useState("");
  const [uf, setUf] = useState("todas");

  const ufs = useMemo(
    () => Array.from(new Set(indicadores.map((i) => i.uf))).sort(),
    [indicadores],
  );

  const filtrados = useMemo(
    () =>
      indicadores.filter(
        (i) =>
          (uf === "todas" || i.uf === uf) &&
          i.nome_municipio.toLowerCase().includes(busca.toLowerCase()),
      ),
    [indicadores, uf, busca],
  );

  const resumo = useMemo(() => {
    if (!filtrados.length) return null;
    const despesa = filtrados.reduce((s, i) => s + Number(i.despesa_total_rs || 0), 0);
    const receita = filtrados.reduce((s, i) => s + Number(i.receita_taxa_rs || 0), 0);
    const massa = filtrados.reduce((s, i) => s + Number(i.massa_coletada_ton || 0), 0);
    const recuperada = filtrados.reduce((s, i) => s + Number(i.massa_recuperada_ton || 0), 0);
    const co2 = fatores.length
      ? recuperada *
        (fatores.reduce((s, f) => s + Number(f.co2e_evitado_ton_por_ton || 0), 0) /
          fatores.filter((f) => f.co2e_evitado_ton_por_ton != null).length || 0)
      : 0;
    return {
      custoTon: massa > 0 ? despesa / massa : null,
      cobertura: despesa > 0 ? (receita / despesa) * 100 : null,
      deficit: despesa - receita,
      co2,
    };
  }, [filtrados, fatores]);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Custo por tonelada</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{brl(resumo?.custoTon)}</p>
            <p className="text-xs text-muted-foreground">NR ANA nº 3/2022 — despesa / massa coletada</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cobertura da receita</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{pct(resumo?.cobertura)}</p>
            <p className="text-xs text-muted-foreground">Receita de taxa / despesa total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Déficit agregado</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{brl(resumo?.deficit)}</p>
            <p className="text-xs text-muted-foreground">Lacuna de sustentabilidade econômico-financeira</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">CO₂e evitado (estimado)</CardTitle>
            <Leaf className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {resumo ? `${Math.round(resumo.co2).toLocaleString("pt-BR")} t` : "—"}
            </p>
            <p className="text-xs text-muted-foreground">Fatores por material, nunca fator único global</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="financeiro">
        <TabsList>
          <TabsTrigger value="financeiro">Indicadores ANA</TabsTrigger>
          <TabsTrigger value="carbono">Fatores de carbono</TabsTrigger>
        </TabsList>

        {/* ── Financeiro ── */}
        <TabsContent value="financeiro" className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Buscar município"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
            <Select value={uf} onValueChange={setUf}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as UFs</SelectItem>
                {ufs.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Custo por tonelada (R$/t)</CardTitle></CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filtrados.map((i) => ({
                  nome: i.nome_municipio,
                  custo: Number(i.custo_por_tonelada_rs || 0),
                  situacao: i.situacao_sustentabilidade,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="nome" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => brl(v)} />
                  <Bar dataKey="custo" radius={[4, 4, 0, 0]}>
                    {filtrados.map((i) => (
                      <Cell
                        key={i.id}
                        fill={
                          i.situacao_sustentabilidade === "deficitario"
                            ? "hsl(var(--destructive))"
                            : i.situacao_sustentabilidade === "atencao"
                            ? "hsl(var(--muted-foreground))"
                            : "hsl(var(--primary))"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Sustentabilidade econômico-financeira por município</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Município</TableHead>
                    <TableHead>UF</TableHead>
                    <TableHead className="text-right">R$/t</TableHead>
                    <TableHead className="text-right">R$/hab</TableHead>
                    <TableHead className="text-right">Cobertura seletiva</TableHead>
                    <TableHead className="text-right">Recuperação</TableHead>
                    <TableHead className="text-right">Desvio de aterro</TableHead>
                    <TableHead className="text-right">Receita/Despesa</TableHead>
                    <TableHead>Situação</TableHead>
                    <TableHead>Fonte</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && (
                    <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground">Carregando…</TableCell></TableRow>
                  )}
                  {!isLoading && !filtrados.length && (
                    <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground">Nenhum município encontrado.</TableCell></TableRow>
                  )}
                  {filtrados.map((i) => {
                    const s = SITUACAO[i.situacao_sustentabilidade] ?? SITUACAO.sem_dado;
                    return (
                      <TableRow key={i.id}>
                        <TableCell className="font-medium">{i.nome_municipio}</TableCell>
                        <TableCell>{i.uf}</TableCell>
                        <TableCell className="text-right">{brl(i.custo_por_tonelada_rs)}</TableCell>
                        <TableCell className="text-right">{brl(i.custo_por_habitante_rs)}</TableCell>
                        <TableCell className="text-right">{pct(i.cobertura_seletiva_pct)}</TableCell>
                        <TableCell className="text-right">{pct(i.taxa_recuperacao_pct)}</TableCell>
                        <TableCell className="text-right">{pct(i.taxa_desvio_aterro_pct)}</TableCell>
                        <TableCell className="text-right">{pct(i.cobertura_receita_pct)}</TableCell>
                        <TableCell><Badge variant={s.variant}>{s.label}</Badge></TableCell>
                        <TableCell className="text-xs text-muted-foreground">{i.fonte} · {i.ano_referencia}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Carbono ── */}
        <TabsContent value="carbono" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Factory className="h-4 w-4" /> Fatores ambientais por material
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead className="text-right">t CO₂e / t</TableHead>
                    <TableHead className="text-right">MWh / t</TableHead>
                    <TableHead className="text-right">m³ água / t</TableHead>
                    <TableHead>Metodologia</TableHead>
                    <TableHead>Fonte</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fatores.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell className="font-medium">{f.material}</TableCell>
                      <TableCell className="text-right">{num(f.co2e_evitado_ton_por_ton)}</TableCell>
                      <TableCell className="text-right">{num(f.energia_evitada_mwh_por_ton)}</TableCell>
                      <TableCell className="text-right">{num(f.agua_evitada_m3_por_ton, 1)}</TableCell>
                      <TableCell className="max-w-[280px] text-xs text-muted-foreground">{f.metodologia ?? "—"}</TableCell>
                      <TableCell className="text-xs">
                        {f.fonte_url ? (
                          <a href={f.fonte_url} target="_blank" rel="noopener noreferrer" className="underline">
                            {f.fonte ?? f.fonte_url}
                          </a>
                        ) : (
                          f.fonte ?? "—"
                        )}
                        {f.ano_referencia_fator ? ` · ${f.ano_referencia_fator}` : ""}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!fatores.length && (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Nenhum fator cadastrado.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
              <p className="mt-4 text-xs text-muted-foreground">
                Cálculos de CO₂e usam sempre o fator do material correspondente. Nenhum fator único global é aplicado,
                e todo fator carrega metodologia e fonte para fins de auditoria.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardSustentabilidade;
