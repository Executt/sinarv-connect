import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Calculator, AlertTriangle } from "lucide-react";
import { simular, EXEMPLO, type EntradaSimulador } from "@/lib/simulador-financeiro";

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 });

const CAMPOS: { key: keyof EntradaSimulador; label: string; grupo: string }[] = [
  { key: "populacao", label: "População (hab.)", grupo: "Município" },
  { key: "domicilios", label: "Domicílios cobrados", grupo: "Município" },
  { key: "toneladasAno", label: "Toneladas coletadas/ano", grupo: "Município" },
  { key: "custoColetaPorTon", label: "Custo de coleta (R$/t)", grupo: "Custos de manejo" },
  { key: "custoDestinacaoPorTon", label: "Custo de destinação (R$/t)", grupo: "Custos de manejo" },
  { key: "custoFixoAnual", label: "Custos fixos/ano (R$)", grupo: "Custos de manejo" },
  { key: "taxaMensalPorDomicilio", label: "Taxa mensal por domicílio (R$)", grupo: "Arrecadação" },
  { key: "inadimplenciaPct", label: "Inadimplência (%)", grupo: "Arrecadação" },
  { key: "outrasReceitasAnual", label: "Outras receitas/ano (R$)", grupo: "Arrecadação" },
];

const SITUACAO = {
  sustentavel: { label: "Sustentável", variant: "default" as const },
  parcial: { label: "Parcialmente coberto", variant: "secondary" as const },
  deficitaria: { label: "Deficitário", variant: "destructive" as const },
};

export default function DashboardSimuladorFinanceiro() {
  const [entrada, setEntrada] = useState<EntradaSimulador>(EXEMPLO);
  const [origem, setOrigem] = useState<string>("exemplo");
  const [editados, setEditados] = useState<Set<string>>(new Set());

  const { data: indicadores = [] } = useQuery({
    queryKey: ["vw_indicadores_ana_sim"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("vw_indicadores_ana").select("*");
      if (error) throw error;
      return data as any[];
    },
  });

  const r = useMemo(() => simular(entrada), [entrada]);
  const origemRow = indicadores.find((i) => i.id === origem);
  const ehExemplo = origem === "exemplo";

  const carregar = (id: string) => {
    setOrigem(id);
    setEditados(new Set());
    if (id === "exemplo") return setEntrada(EXEMPLO);
    const i = indicadores.find((x) => x.id === id);
    if (!i) return;
    const ton = Number(i.massa_coletada_ton) || EXEMPLO.toneladasAno;
    const pop = i.custo_por_habitante_rs ? Math.round(Number(i.despesa_total_rs) / Number(i.custo_por_habitante_rs)) : EXEMPLO.populacao;
    const dom = Math.round(pop / 3);
    const custoTon = Number(i.despesa_total_rs) / ton;
    setEntrada({
      populacao: pop,
      domicilios: dom,
      toneladasAno: ton,
      custoColetaPorTon: Math.round(custoTon * 0.65),
      custoDestinacaoPorTon: Math.round(custoTon * 0.35),
      custoFixoAnual: 0,
      taxaMensalPorDomicilio: dom ? Math.round((Number(i.receita_taxa_rs) / dom / 12) * 100) / 100 : 0,
      inadimplenciaPct: 0,
      outrasReceitasAnual: 0,
    });
  };

  const set = (k: keyof EntradaSimulador, v: string) => {
    setEntrada((e) => ({ ...e, [k]: Math.max(Number(v) || 0, 0) }));
    setEditados((s) => new Set(s).add(k));
  };

  const grafico = [
    { nome: "Custo anual", valor: r.custoTotalAnual },
    { nome: "Arrecadação anual", valor: r.arrecadacaoAnual },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold"><Calculator className="h-6 w-6 text-primary" /> Simulador de sustentabilidade financeira</h1>
          <p className="text-sm text-muted-foreground">Custos de manejo, toneladas coletadas e arrecadação (NR ANA nº 3/2022).</p>
        </div>
        <div className="w-72">
          <Label>Base de partida</Label>
          <Select value={origem} onValueChange={carregar}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="exemplo">Dados de exemplo (ilustrativos)</SelectItem>
              {indicadores.map((i) => (
                <SelectItem key={i.id} value={i.id}>{i.nome_municipio}/{i.uf} · {i.ano_referencia}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {ehExemplo ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Dados de exemplo</AlertTitle>
          <AlertDescription>Todos os valores abaixo são ilustrativos e não representam nenhum município. Selecione um município cadastrado ou digite os números reais.</AlertDescription>
        </Alert>
      ) : (
        <Alert>
          <AlertTitle>Base: {origemRow?.nome_municipio}/{origemRow?.uf} — fonte: {origemRow?.fonte} ({origemRow?.ano_referencia})</AlertTitle>
          <AlertDescription>Despesa, toneladas e receita vêm do cadastro. População é derivada do custo por habitante; domicílios (pop ÷ 3) e a divisão coleta 65% / destinação 35% são <strong>estimativas</strong> — ajuste com os valores reais. Verifique se a fonte cadastrada é oficial.</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="text-base">Parâmetros</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {["Município", "Custos de manejo", "Arrecadação"].map((g) => (
              <div key={g} className="space-y-2">
                <p className="text-xs font-semibold uppercase text-muted-foreground">{g}</p>
                {CAMPOS.filter((c) => c.grupo === g).map((c) => (
                  <div key={c.key} className="space-y-1">
                    <Label htmlFor={c.key} className="flex items-center gap-2 text-xs">
                      {c.label}
                      {ehExemplo && !editados.has(c.key) && <Badge variant="outline" className="text-[10px]">exemplo</Badge>}
                      {editados.has(c.key) && <Badge variant="secondary" className="text-[10px]">informado</Badge>}
                    </Label>
                    <Input id={c.key} type="number" min={0} value={entrada[c.key]} onChange={(e) => set(c.key, e.target.value)} />
                  </div>
                ))}
              </div>
            ))}
            <Button variant="outline" className="w-full" onClick={() => carregar("exemplo")}>Restaurar exemplo</Button>
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi titulo="Custo anual" valor={brl(r.custoTotalAnual)} />
            <Kpi titulo="Arrecadação anual" valor={brl(r.arrecadacaoAnual)} />
            <Kpi titulo="Saldo anual" valor={brl(r.saldoAnual)} destaque={r.saldoAnual < 0} />
            <Card><CardContent className="pt-6">
              <p className="text-xs text-muted-foreground">Cobertura do custo</p>
              <p className="text-2xl font-bold">{r.coberturaPct.toFixed(1)}%</p>
              <Badge variant={SITUACAO[r.situacao].variant}>{SITUACAO[r.situacao].label}</Badge>
            </CardContent></Card>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Kpi titulo="Custo por tonelada" valor={brl(r.custoPorTonelada)} />
            <Kpi titulo="Custo por habitante/ano" valor={brl(r.custoPorHabitante)} />
            <Kpi titulo="Taxa mensal de equilíbrio" valor={brl(r.taxaEquilibrioMensal)} sub="por domicílio, para cobrir 100%" />
          </div>
          <Card>
            <CardHeader><CardTitle className="text-base">Custo x arrecadação</CardTitle></CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={grafico}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="nome" />
                  <YAxis tickFormatter={(v) => `${(v / 1e6).toFixed(1)} mi`} />
                  <Tooltip formatter={(v: number) => brl(v)} />
                  <Bar dataKey="valor">
                    <Cell fill="hsl(var(--destructive))" />
                    <Cell fill="hsl(var(--primary))" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <p className="text-xs text-muted-foreground">Sustentável: cobertura ≥ 100%. Parcial: 70–99%. Deficitário: abaixo de 70%. Simulação não substitui estudo tarifário.</p>
        </div>
      </div>
    </div>
  );
}

function Kpi({ titulo, valor, sub, destaque }: { titulo: string; valor: string; sub?: string; destaque?: boolean }) {
  return (
    <Card><CardContent className="pt-6">
      <p className="text-xs text-muted-foreground">{titulo}</p>
      <p className={`text-lg xl:text-xl font-bold whitespace-nowrap ${destaque ? "text-destructive" : ""}`}>{valor}</p>
      {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
    </CardContent></Card>
  );
}
