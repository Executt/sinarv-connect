import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, BellRing, CalendarClock, Download, FileText } from "lucide-react";
import { downloadCSV, printPDF } from "@/lib/residuos-criticos";
import {
  AlertaPrazo,
  JANELA_CLASS,
  JANELA_LABEL,
  classificarPrazo,
  diasRestantes,
} from "@/lib/lixoes-alertas";
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

type Props = { lixoes: { id: string; nome: string; uf: string; municipio: string }[]; onSelectLixao?: (id: string) => void };

const AlertasPrazos = ({ lixoes, onSelectLixao }: Props) => {
  const { data: pnrs = [] } = useLixoesPnrs();

  const { data: etapas = [], isLoading } = useQuery({
    queryKey: ["lixao-etapas-prazos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lixao_encerramento_etapas")
        .select("id,lixao_id,ordem,etapa,situacao,data_prevista,responsavel")
        .not("data_prevista", "is", null);
      if (error) throw error;
      return (data ?? []) as unknown as EtapaPrazo[];
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

    return out.sort((a, b) => a.dias - b.dias);
  }, [pnrs, etapas, nomeLixao]);

  const contagem = useMemo(() => {
    const c = { vencido: 0, "30": 0, "60": 0, "90": 0 } as Record<string, number>;
    alertas.forEach((a) => (c[a.janela] += 1));
    return c;
  }, [alertas]);

  const linhas = () =>
    alertas.map((a) => ({
      Janela: JANELA_LABEL[a.janela],
      Origem: a.origem === "pnrs" ? "PNRS" : "Roteiro de Encerramento",
      Alerta: a.titulo,
      Area: a.contexto,
      Prazo: new Date(`${a.data}T00:00:00`).toLocaleDateString("pt-BR"),
      Dias_restantes: a.dias,
    }));

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(["vencido", "30", "60", "90"] as const).map((j) => (
          <Card key={j}>
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                {j === "vencido" ? (
                  <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                ) : (
                  <CalendarClock className="h-3.5 w-3.5" />
                )}
                {JANELA_LABEL[j]}
              </p>
              <p className="text-2xl font-bold">{contagem[j]}</p>
              <p className="text-[11px] text-muted-foreground">alertas automáticos</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BellRing className="h-4 w-4" /> Alertas automáticos de prazo
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Monitoramento contínuo dos prazos legais da PNRS e das etapas do Roteiro de Encerramento
              (ProteGEER/MCidades) com janelas de 30, 60 e 90 dias.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              disabled={alertas.length === 0}
              onClick={() => downloadCSV(`alertas-prazos-${new Date().toISOString().slice(0, 10)}.csv`, linhas())}
            >
              <Download className="h-4 w-4" /> CSV
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              disabled={alertas.length === 0}
              onClick={() => printPDF("Alertas de prazo — PNRS e Roteiro de Encerramento", linhas())}
            >
              <FileText className="h-4 w-4" /> PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-6">Carregando alertas…</p>
          ) : alertas.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6">
              Nenhum prazo vencido ou a vencer nos próximos 90 dias.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Janela</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Alerta</TableHead>
                  <TableHead>Área</TableHead>
                  <TableHead>Prazo</TableHead>
                  <TableHead className="text-right">Dias</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alertas.map((a) => (
                  <TableRow
                    key={a.id}
                    className={onSelectLixao ? "cursor-pointer" : undefined}
                    onClick={() => onSelectLixao?.(a.lixaoId)}
                  >
                    <TableCell>
                      <Badge variant="outline" className={JANELA_CLASS[a.janela]}>
                        {JANELA_LABEL[a.janela]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      {a.origem === "pnrs" ? "PNRS" : "Roteiro"}
                    </TableCell>
                    <TableCell className="text-sm font-medium">{a.titulo}</TableCell>
                    <TableCell className="text-sm">{a.contexto}</TableCell>
                    <TableCell className="text-sm">
                      {new Date(`${a.data}T00:00:00`).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {a.dias < 0 ? `${Math.abs(a.dias)} em atraso` : a.dias}
                    </TableCell>
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

export default AlertasPrazos;
