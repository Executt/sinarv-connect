import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";
import { BellRing, CheckCircle2, Download, FileText, History, RotateCcw, Siren } from "lucide-react";
import { downloadCSV, printPDF } from "@/lib/residuos-criticos";
import { AlertaPrazo, JANELA_CLASS, JANELA_LABEL, classificarPrazo, diasRestantes } from "@/lib/lixoes-alertas";
import { useLixoesPnrs } from "./ConformidadePNRS";

type EtapaPrazo = {
  id: string;
  lixao_id: string;
  ordem: number;
  etapa: string;
  situacao: string;
  data_prevista: string | null;
  responsavel: string | null;
};

type Tratativa = {
  id: string;
  alerta_key: string;
  lixao_id: string | null;
  origem: string;
  titulo: string;
  situacao: string;
  observacoes: string | null;
  tratado_em: string | null;
  updated_at: string;
};

type PrazoHist = {
  id: string;
  lixao_id: string | null;
  etapa: string;
  prazo_anterior: string | null;
  prazo_novo: string | null;
  created_at: string;
};

const PRIORIDADE: Record<string, number> = { vencido: 0, "30": 1, "60": 2, "90": 3 };
const dataBR = (d?: string | null) => (d ? new Date(`${d.slice(0, 10)}T00:00:00`).toLocaleDateString("pt-BR") : "—");

type Props = { lixoes: { id: string; nome: string; uf: string; municipio: string }[]; onSelectLixao?: (id: string) => void };

const CentroAlertas = ({ lixoes, onSelectLixao }: Props) => {
  const qc = useQueryClient();
  const [busca, setBusca] = useState("");
  const [filtroJanela, setFiltroJanela] = useState<string>("todas");
  const [filtroSituacao, setFiltroSituacao] = useState<string>("pendentes");

  const { data: pnrs = [] } = useLixoesPnrs();

  const { data: etapas = [], isLoading } = useQuery({
    queryKey: ["centro-alertas-etapas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lixao_encerramento_etapas")
        .select("id,lixao_id,ordem,etapa,situacao,data_prevista,responsavel")
        .not("data_prevista", "is", null);
      if (error) throw error;
      return (data ?? []) as unknown as EtapaPrazo[];
    },
  });

  const { data: tratativas = [] } = useQuery({
    queryKey: ["lixao-alertas-tratativas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lixao_alertas_tratativas" as never)
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Tratativa[];
    },
  });

  const { data: historicoPrazos = [] } = useQuery({
    queryKey: ["lixao-prazo-historico"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lixao_prazo_historico" as never)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as unknown as PrazoHist[];
    },
  });

  const nomeLixao = useMemo(() => {
    const m = new Map<string, string>();
    lixoes.forEach((l) => m.set(l.id, `${l.nome} — ${l.municipio}/${l.uf}`));
    pnrs.forEach((p) => m.set(p.id, `${p.nome} — ${p.municipio}/${p.uf}`));
    return m;
  }, [lixoes, pnrs]);

  const alertas = useMemo<AlertaPrazo[]>(() => {
    const out: AlertaPrazo[] = [];

    pnrs.forEach((p) => {
      if (p.situacao_pnrs === "conforme" || !p.prazo_legal_pnrs) return;
      const dias = diasRestantes(p.prazo_legal_pnrs);
      const janela = classificarPrazo(dias);
      if (janela === "fora" || dias === null) return;
      out.push({
        id: `pnrs-${p.id}`,
        origem: "pnrs",
        lixaoId: p.id,
        titulo: "Prazo legal PNRS (art. 54)",
        contexto: nomeLixao.get(p.id) ?? p.nome,
        data: p.prazo_legal_pnrs,
        dias,
        janela,
      });
    });

    etapas.forEach((e) => {
      if (e.situacao === "concluida" || e.situacao === "nao_aplicavel") return;
      const dias = diasRestantes(e.data_prevista);
      const janela = classificarPrazo(dias);
      if (janela === "fora" || dias === null || !e.data_prevista) return;
      out.push({
        id: `etapa-${e.id}`,
        origem: "roteiro",
        lixaoId: e.lixao_id,
        titulo: `Etapa ${e.ordem} — ${e.etapa}`,
        contexto: nomeLixao.get(e.lixao_id) ?? "Área não identificada",
        data: e.data_prevista,
        dias,
        janela,
      });
    });

    return out.sort((a, b) => PRIORIDADE[a.janela] - PRIORIDADE[b.janela] || a.dias - b.dias);
  }, [pnrs, etapas, nomeLixao]);

  const porKey = useMemo(() => {
    const m = new Map<string, Tratativa>();
    tratativas.forEach((t) => m.set(t.alerta_key, t));
    return m;
  }, [tratativas]);

  const marcar = useMutation({
    mutationFn: async ({ alerta, situacao }: { alerta: AlertaPrazo; situacao: "tratado" | "pendente" }) => {
      const { data: sessao } = await supabase.auth.getUser();
      const payload = {
        alerta_key: alerta.id,
        lixao_id: alerta.lixaoId,
        origem: alerta.origem,
        titulo: `${alerta.titulo} · ${alerta.contexto}`,
        situacao,
        tratado_por: situacao === "tratado" ? sessao.user?.id ?? null : null,
        tratado_em: situacao === "tratado" ? new Date().toISOString() : null,
      };
      const { error } = await supabase
        .from("lixao_alertas_tratativas" as never)
        .upsert(payload as never, { onConflict: "alerta_key" });
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["lixao-alertas-tratativas"] });
      toast({
        title: v.situacao === "tratado" ? "Alerta marcado como tratado" : "Alerta reaberto",
        description: v.alerta.titulo,
      });
    },
    onError: (e: Error) => toast({ title: "Não foi possível atualizar o alerta", description: e.message, variant: "destructive" }),
  });

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return alertas.filter((a) => {
      const t = porKey.get(a.id);
      const tratado = t?.situacao === "tratado";
      if (filtroSituacao === "pendentes" && tratado) return false;
      if (filtroSituacao === "tratados" && !tratado) return false;
      if (filtroJanela !== "todas" && a.janela !== filtroJanela) return false;
      if (termo && !`${a.titulo} ${a.contexto}`.toLowerCase().includes(termo)) return false;
      return true;
    });
  }, [alertas, porKey, filtroSituacao, filtroJanela, busca]);

  const contagem = useMemo(() => {
    const c = { vencido: 0, "30": 0, "60": 0, "90": 0, tratados: 0 } as Record<string, number>;
    alertas.forEach((a) => {
      if (porKey.get(a.id)?.situacao === "tratado") c.tratados += 1;
      else c[a.janela] += 1;
    });
    return c;
  }, [alertas, porKey]);

  const linhas = () =>
    filtrados.map((a) => ({
      Prioridade: JANELA_LABEL[a.janela],
      Origem: a.origem === "pnrs" ? "PNRS" : "Roteiro de Encerramento",
      Alerta: a.titulo,
      Area: a.contexto,
      Prazo: dataBR(a.data),
      Dias_restantes: a.dias,
      Situacao: porKey.get(a.id)?.situacao === "tratado" ? "Tratado" : "Pendente",
    }));

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {(["vencido", "30", "60", "90"] as const).map((j) => (
          <Card key={j}>
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Siren className={`h-3.5 w-3.5 ${j === "vencido" ? "text-red-600" : ""}`} />
                {JANELA_LABEL[j]}
              </p>
              <p className="text-2xl font-bold">{contagem[j]}</p>
              <p className="text-[11px] text-muted-foreground">pendentes</p>
            </CardContent>
          </Card>
        ))}
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Tratados
            </p>
            <p className="text-2xl font-bold">{contagem.tratados}</p>
            <p className="text-[11px] text-muted-foreground">com registro de tratativa</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BellRing className="h-4 w-4" /> Centro de alertas
              </CardTitle>
              <p className="text-xs text-muted-foreground max-w-2xl">
                Lista priorizada dos prazos legais da PNRS e das etapas do Roteiro de Encerramento
                (ProteGEER/MCidades). Marque como tratado para retirar da fila operacional.
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="gap-2" disabled={filtrados.length === 0}
                onClick={() => downloadCSV(`centro-alertas-${new Date().toISOString().slice(0, 10)}.csv`, linhas())}>
                <Download className="h-4 w-4" /> CSV
              </Button>
              <Button size="sm" variant="outline" className="gap-2" disabled={filtrados.length === 0}
                onClick={() => printPDF("Centro de alertas — Módulo Lixões", linhas())}>
                <FileText className="h-4 w-4" /> PDF
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder="Buscar por área, município ou etapa…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="max-w-xs"
            />
            <Select value={filtroJanela} onValueChange={setFiltroJanela}>
              <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as prioridades</SelectItem>
                {(["vencido", "30", "60", "90"] as const).map((j) => (
                  <SelectItem key={j} value={j}>{JANELA_LABEL[j]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filtroSituacao} onValueChange={setFiltroSituacao}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pendentes">Pendentes</SelectItem>
                <SelectItem value="tratados">Tratados</SelectItem>
                <SelectItem value="todos">Todos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-6">Carregando alertas…</p>
          ) : filtrados.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6">Nenhum alerta para os filtros aplicados.</p>
          ) : (
            <TooltipProvider>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Alerta</TableHead>
                    <TableHead>Área</TableHead>
                    <TableHead>Prazo</TableHead>
                    <TableHead className="text-right">Dias</TableHead>
                    <TableHead className="text-right">Tratativa</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtrados.map((a) => {
                    const t = porKey.get(a.id);
                    const tratado = t?.situacao === "tratado";
                    return (
                      <TableRow key={a.id} className={tratado ? "opacity-70" : undefined}>
                        <TableCell>
                          <Badge variant="outline" className={JANELA_CLASS[a.janela]}>{JANELA_LABEL[a.janela]}</Badge>
                        </TableCell>
                        <TableCell className="text-xs">{a.origem === "pnrs" ? "PNRS" : "Roteiro"}</TableCell>
                        <TableCell className="text-sm font-medium">{a.titulo}</TableCell>
                        <TableCell className="text-sm">
                          <button className="hover:underline text-left" onClick={() => onSelectLixao?.(a.lixaoId)}>
                            {a.contexto}
                          </button>
                        </TableCell>
                        <TableCell className="text-sm">{dataBR(a.data)}</TableCell>
                        <TableCell className="text-right text-sm">
                          {a.dias < 0 ? `${Math.abs(a.dias)} em atraso` : a.dias}
                        </TableCell>
                        <TableCell className="text-right">
                          {tratado ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button size="sm" variant="ghost" className="gap-1 text-xs"
                                  onClick={() => marcar.mutate({ alerta: a, situacao: "pendente" })}>
                                  <RotateCcw className="h-3.5 w-3.5" /> Reabrir
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                Tratado em {t?.tratado_em ? new Date(t.tratado_em).toLocaleString("pt-BR") : "—"}
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <Button size="sm" variant="outline" className="gap-1 text-xs"
                              onClick={() => marcar.mutate({ alerta: a, situacao: "tratado" })}>
                              <CheckCircle2 className="h-3.5 w-3.5" /> Marcar tratado
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TooltipProvider>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4" /> Histórico de mudança de prazos
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Registro automático de repactuações de prazo das etapas do Roteiro de Encerramento.
          </p>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {historicoPrazos.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">Nenhuma alteração de prazo registrada.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Área</TableHead>
                  <TableHead>Etapa</TableHead>
                  <TableHead>Prazo anterior</TableHead>
                  <TableHead>Novo prazo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historicoPrazos.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell className="text-xs">{new Date(h.created_at).toLocaleString("pt-BR")}</TableCell>
                    <TableCell className="text-sm">{(h.lixao_id && nomeLixao.get(h.lixao_id)) ?? "—"}</TableCell>
                    <TableCell className="text-sm">{h.etapa}</TableCell>
                    <TableCell className="text-sm">{dataBR(h.prazo_anterior)}</TableCell>
                    <TableCell className="text-sm font-medium">{dataBR(h.prazo_novo)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CentroAlertas;
