import { useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { capturarElemento, gerarRelatorioPDF } from "@/lib/lixoes-report";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLotesEntrada, useLotesSaida } from "@/hooks/use-schema-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";
import { ShieldCheck, ShieldAlert, Scale, Truck, FileDown } from "lucide-react";

const DIA = 86400000;

const useLicencas = () =>
  useQuery({
    queryKey: ["licencas_balanco"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("licencas_ambientais")
        .select("*, operadores_logisticos(razao_social, cnpj)")
        .order("validade", { ascending: true });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

const useMtr = () =>
  useQuery({
    queryKey: ["mtr_balanco"],
    queryFn: async () => {
      const { data, error } = await supabase.from("mtr_solicitacoes").select("*");
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

const statusLicenca = (validade: string) => {
  const dias = Math.floor((new Date(validade).getTime() - Date.now()) / DIA);
  if (dias < 0) return { label: "Vencida", variant: "destructive" as const, dias };
  if (dias <= 30) return { label: `Vence em ${dias}d`, variant: "secondary" as const, dias };
  return { label: "Vigente", variant: "default" as const, dias };
};

const kg = (n: number) => `${Math.round(n).toLocaleString("pt-BR")} kg`;

const DashboardLicencasBalanco = () => {
  const lic = useLicencas();
  const mtr = useMtr();
  const ent = useLotesEntrada();
  const sai = useLotesSaida();
  const graficoRef = useRef<HTMLDivElement>(null);

  const balanco = useMemo(() => {
    const m: Record<string, { material: string; entrada: number; saida: number; mtr: number }> = {};
    const get = (k: string) => (m[k] ??= { material: k, entrada: 0, saida: 0, mtr: 0 });
    ent.data?.forEach((e: any) => (get(e.tipo_material || "Outros").entrada += Number(e.peso_bruto_kg) || 0));
    sai.data?.forEach((s: any) => (get(s.tipo_material || "Outros").saida += Number(s.peso_kg ?? s.peso_despachado_kg ?? s.peso_liquido_kg) || 0));
    mtr.data?.forEach((r: any) => {
      if (r.fluxo_status === "aprovado") get(r.tipo_residuo || r.classe_residuo || "Outros").mtr += Number(r.quantidade_kg ?? r.peso_kg) || 0;
    });
    return Object.values(m).map((r) => ({ ...r, saldo: r.entrada - r.saida }));
  }, [ent.data, sai.data, mtr.data]);

  const loading = lic.isLoading || ent.isLoading || sai.isLoading || mtr.isLoading;
  if (loading) return <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>;

  const licencas = lic.data ?? [];
  const vencidas = licencas.filter((l) => statusLicenca(l.validade).dias < 0).length;
  const aVencer = licencas.filter((l) => { const d = statusLicenca(l.validade).dias; return d >= 0 && d <= 30; }).length;
  const totE = balanco.reduce((a, b) => a + b.entrada, 0);
  const totS = balanco.reduce((a, b) => a + b.saida, 0);
  const negativos = balanco.filter((b) => b.saldo < 0);

  const kpis = [
    { icon: ShieldCheck, label: "Licenças vigentes", value: licencas.length - vencidas },
    { icon: ShieldAlert, label: "Vencidas / a vencer (30d)", value: `${vencidas} / ${aVencer}` },
    { icon: Scale, label: "Entradas x Saídas", value: `${kg(totE)} / ${kg(totS)}` },
    { icon: Truck, label: "MTR aprovados", value: mtr.data?.filter((r) => r.fluxo_status === "aprovado").length ?? 0 },
  ];

  const exportarPDF = async () => {
    const img = await capturarElemento(graficoRef.current);
    gerarRelatorioPDF({
      titulo: "Licenças ambientais e balanço de massa",
      subtitulo: "Licenças e Balanço",
      filtros: { Período: "Todo o histórico", Escopo: "Todos os registros visíveis ao usuário" },
      numeros: kpis.map((k) => ({ rotulo: k.label, valor: String(k.value) })),
      mapaDataUrl: img,
      imagemTitulo: "Fluxo de massa por material",
      textoLivre: negativos.length ? { titulo: "Alerta de inconsistência", texto: `Saída maior que a entrada em: ${negativos.map((n) => n.material).join(", ")}.` } : undefined,
      tabelas: [
        { titulo: "Balanço por material", linhas: balanco.map((b) => ({ Material: b.material, Entrada: kg(b.entrada), Saída: kg(b.saida), Saldo: kg(b.saldo), "MTR aprovado": kg(b.mtr) })) },
        { titulo: "Licenças ambientais", linhas: licencas.map((l) => ({ Operador: l.operadores_logisticos?.razao_social ?? "—", Número: l.numero ?? "—", Tipo: l.tipo ?? "—", Validade: new Date(l.validade).toLocaleDateString("pt-BR"), Situação: statusLicenca(l.validade).label })) },
      ],
      usuario: localStorage.getItem("sinarv-export-user") ?? undefined,
      fonteDados: "Lotes, MTR e licenças registrados no SINARV",
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={exportarPDF}><FileDown className="h-4 w-4" /> Exportar PDF</Button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <Card key={k.label}><CardContent className="pt-4 pb-3 flex items-center gap-3">
            <k.icon className="h-5 w-5 text-primary" />
            <div><p className="text-xs text-muted-foreground">{k.label}</p><p className="text-lg font-bold text-foreground">{k.value}</p></div>
          </CardContent></Card>
        ))}
      </div>

      {negativos.length > 0 && (
        <Card className="border-destructive"><CardContent className="pt-4 text-sm text-destructive">
          Balanço inconsistente: saída maior que a entrada em {negativos.map((n) => n.material).join(", ")}.
        </CardContent></Card>
      )}

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Fluxo de massa por material</CardTitle></CardHeader>
        <CardContent className="h-72" ref={graficoRef}>
          {balanco.length === 0 ? <p className="text-sm text-muted-foreground">Sem lotes registrados.</p> : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={balanco}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="material" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip formatter={(v: number) => kg(v)} />
                <Legend />
                <Bar dataKey="entrada" name="Entrada" fill="hsl(var(--primary))" />
                <Bar dataKey="saida" name="Saída" fill="hsl(var(--accent))" />
                <Bar dataKey="mtr" name="MTR aprovado" fill="hsl(var(--muted-foreground))" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Balanço por material</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Material</TableHead><TableHead>Entrada</TableHead><TableHead>Saída</TableHead><TableHead>Saldo em estoque</TableHead><TableHead>MTR aprovado</TableHead></TableRow></TableHeader>
            <TableBody>
              {balanco.map((b) => (
                <TableRow key={b.material}>
                  <TableCell className="font-medium">{b.material}</TableCell>
                  <TableCell>{kg(b.entrada)}</TableCell>
                  <TableCell>{kg(b.saida)}</TableCell>
                  <TableCell className={b.saldo < 0 ? "text-destructive font-semibold" : ""}>{kg(b.saldo)}</TableCell>
                  <TableCell>{kg(b.mtr)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Licenças ambientais</CardTitle></CardHeader>
        <CardContent>
          {licencas.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma licença cadastrada. Importe em Administração › Importação de dados.</p> : (
            <Table>
              <TableHeader><TableRow><TableHead>Operador</TableHead><TableHead>Número</TableHead><TableHead>Tipo</TableHead><TableHead>Validade</TableHead><TableHead>Situação</TableHead></TableRow></TableHeader>
              <TableBody>
                {licencas.map((l) => {
                  const s = statusLicenca(l.validade);
                  return (
                    <TableRow key={l.id}>
                      <TableCell>{l.operadores_logisticos?.razao_social ?? "—"}</TableCell>
                      <TableCell>{l.numero ?? "—"}</TableCell>
                      <TableCell>{l.tipo ?? "—"}</TableCell>
                      <TableCell>{new Date(l.validade).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell><Badge variant={s.variant}>{s.label}</Badge></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardLicencasBalanco;
