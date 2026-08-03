import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CalendarClock, CheckCircle2, Download, HelpCircle, Users } from "lucide-react";
import { downloadCSV } from "@/lib/residuos-criticos";

export type LixaoPnrs = {
  id: string;
  nome: string;
  uf: string;
  municipio: string;
  municipio_ibge: string | null;
  tipo: string;
  status: string;
  populacao_municipio: number | null;
  catadores_estimados: number | null;
  possui_coleta_seletiva: boolean | null;
  possui_plano_municipal: boolean | null;
  consorcio_publico: boolean | null;
  fonte_verificacao: string | null;
  data_ultima_verificacao: string | null;
  faixa_populacional: string;
  prazo_legal_pnrs: string | null;
  situacao_pnrs: string;
  etapas_total: number;
  etapas_concluidas: number;
  progresso_encerramento_pct: number;
};

export const FAIXA_LABEL: Record<string, string> = {
  acima_100k: "Acima de 100 mil hab. — prazo 02/08/2021",
  "50k_100k": "50 a 100 mil hab. — prazo 02/08/2022",
  "10k_50k": "10 a 50 mil hab. — prazo 02/08/2023",
  ate_10k: "Até 10 mil hab. — prazo 02/08/2024",
  nao_informada: "População não informada",
};

const SITUACAO: Record<string, { label: string; className: string }> = {
  conforme: { label: "Conforme", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  no_prazo: { label: "Dentro do prazo", className: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  prazo_vencido: { label: "Prazo vencido", className: "bg-red-500/10 text-red-600 border-red-500/20" },
  sem_dados: { label: "Sem dados", className: "bg-muted text-muted-foreground border-border" },
};

const fmt = (n: number) => new Intl.NumberFormat("pt-BR").format(n);

export const useLixoesPnrs = () =>
  useQuery({
    queryKey: ["lixoes-pnrs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("vw_lixoes_pnrs").select("*").order("uf");
      if (error) throw error;
      return (data ?? []) as unknown as LixaoPnrs[];
    },
  });

type Props = { onSelectLixao?: (id: string) => void };

const ConformidadePNRS = ({ onSelectLixao }: Props) => {
  const { data = [], isLoading } = useLixoesPnrs();

  const kpis = useMemo(() => {
    const vencidos = data.filter((l) => l.situacao_pnrs === "prazo_vencido");
    const conformes = data.filter((l) => l.situacao_pnrs === "conforme");
    const catadores = data.reduce((s, l) => s + (l.catadores_estimados ?? 0), 0);
    const populacao = data.reduce((s, l) => s + (l.populacao_municipio ?? 0), 0);
    return { vencidos: vencidos.length, conformes: conformes.length, catadores, populacao, total: data.length };
  }, [data]);

  const exportar = () =>
    downloadCSV(
      `conformidade-pnrs-${new Date().toISOString().slice(0, 10)}.csv`,
      data.map((l) => ({
        Nome: l.nome,
        UF: l.uf,
        Municipio: l.municipio,
        IBGE: l.municipio_ibge ?? "",
        Populacao: l.populacao_municipio ?? "",
        Faixa: FAIXA_LABEL[l.faixa_populacional] ?? l.faixa_populacional,
        Prazo_legal: l.prazo_legal_pnrs ?? "",
        Situacao: SITUACAO[l.situacao_pnrs]?.label ?? l.situacao_pnrs,
        Catadores: l.catadores_estimados ?? "",
        Coleta_seletiva: l.possui_coleta_seletiva ? "Sim" : "Não",
        Plano_municipal: l.possui_plano_municipal ? "Sim" : "Não",
        Consorcio: l.consorcio_publico ? "Sim" : "Não",
        Progresso_encerramento_pct: l.progresso_encerramento_pct,
        Fonte: l.fonte_verificacao ?? "",
        Ultima_verificacao: l.data_ultima_verificacao ?? "",
      })),
    );

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5 text-red-600" /> Prazo legal vencido
            </p>
            <p className="text-2xl font-bold text-red-600">{kpis.vencidos}</p>
            <p className="text-[11px] text-muted-foreground">art. 54 da PNRS / Lei 14.026/2020</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Áreas conformes
            </p>
            <p className="text-2xl font-bold text-emerald-600">{kpis.conformes}</p>
            <p className="text-[11px] text-muted-foreground">de {kpis.total} áreas monitoradas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Users className="h-3.5 w-3.5" /> Catadores impactados
            </p>
            <p className="text-2xl font-bold">{fmt(kpis.catadores)}</p>
            <p className="text-[11px] text-muted-foreground">inclusão socioprodutiva obrigatória</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <CalendarClock className="h-3.5 w-3.5" /> População atendida
            </p>
            <p className="text-2xl font-bold">{fmt(kpis.populacao)}</p>
            <p className="text-[11px] text-muted-foreground">habitantes dos municípios monitorados</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Conformidade com os prazos da PNRS</CardTitle>
            <p className="text-xs text-muted-foreground">
              Prazos escalonados do art. 54 da Lei 12.305/2010 com redação da Lei 14.026/2020, por faixa populacional.
            </p>
          </div>
          <Button size="sm" variant="outline" className="gap-2" onClick={exportar} disabled={data.length === 0}>
            <Download className="h-4 w-4" /> CSV
          </Button>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-6">Carregando conformidade…</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Área</TableHead>
                  <TableHead>Município / UF</TableHead>
                  <TableHead className="text-right">População</TableHead>
                  <TableHead>Prazo legal</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead className="w-[160px]">Encerramento</TableHead>
                  <TableHead>Fonte</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((l) => {
                  const s = SITUACAO[l.situacao_pnrs] ?? SITUACAO.sem_dados;
                  return (
                    <TableRow
                      key={l.id}
                      className={onSelectLixao ? "cursor-pointer" : undefined}
                      onClick={() => onSelectLixao?.(l.id)}
                    >
                      <TableCell className="font-medium">{l.nome}</TableCell>
                      <TableCell className="text-sm">
                        {l.municipio} / {l.uf}
                        {l.municipio_ibge && (
                          <span className="block text-[11px] text-muted-foreground">IBGE {l.municipio_ibge}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {l.populacao_municipio ? fmt(l.populacao_municipio) : "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {l.prazo_legal_pnrs
                          ? new Date(`${l.prazo_legal_pnrs}T00:00:00`).toLocaleDateString("pt-BR")
                          : "—"}
                        <span className="block text-[11px] text-muted-foreground">
                          {FAIXA_LABEL[l.faixa_populacional]?.split("—")[0]}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={s.className}>{s.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <Progress value={Number(l.progresso_encerramento_pct)} className="h-2" />
                        <span className="text-[11px] text-muted-foreground">
                          {l.etapas_concluidas}/{l.etapas_total} etapas · {Number(l.progresso_encerramento_pct)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-[11px] text-muted-foreground">
                        {l.fonte_verificacao ?? "—"}
                        {l.data_ultima_verificacao && (
                          <span className="block">
                            verif. {new Date(`${l.data_ultima_verificacao}T00:00:00`).toLocaleDateString("pt-BR")}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
          <p className="text-[11px] text-muted-foreground pt-3 flex items-start gap-1">
            <HelpCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            Fontes: IBGE MUNIC 2023 (Suplemento de Saneamento), SNIS, Observatório dos Lixões (CNM), Mapa dos Lixões
            (ABRECON) e busca ativa por imagens de satélite.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConformidadePNRS;
