import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Circle, Clock, MapPin, MinusCircle, Users } from "lucide-react";
import { useLixoesPnrs, FAIXA_LABEL } from "./ConformidadePNRS";
import { classificarPrazo, diasRestantes, JANELA_CLASS, JANELA_LABEL } from "@/lib/lixoes-alertas";

type Etapa = {
  id: string;
  ordem: number;
  etapa: string;
  descricao: string | null;
  situacao: string;
  responsavel: string | null;
  data_prevista: string | null;
  data_conclusao: string | null;
};

type Hist = {
  mes_referencia: string;
  volume_estocado_m3: number;
  volume_removido_m3: number;
  volume_recuperado_m3: number;
};

const SIT: Record<string, { label: string; className: string; Icon: typeof Circle }> = {
  concluida: { label: "Concluída", className: "text-emerald-600", Icon: CheckCircle2 },
  em_andamento: { label: "Em andamento", className: "text-amber-600", Icon: Clock },
  pendente: { label: "Pendente", className: "text-muted-foreground", Icon: Circle },
  nao_aplicavel: { label: "Não aplicável", className: "text-muted-foreground", Icon: MinusCircle },
};

const SITUACAO_PNRS: Record<string, { label: string; className: string }> = {
  conforme: { label: "Conforme", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  no_prazo: { label: "Dentro do prazo", className: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  prazo_vencido: { label: "Prazo vencido", className: "bg-red-500/10 text-red-600 border-red-500/20" },
  sem_dados: { label: "Sem dados", className: "bg-muted text-muted-foreground border-border" },
};

const fmt = (n: number) => new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(n);
const dataBR = (d?: string | null) => (d ? new Date(`${d.slice(0, 10)}T00:00:00`).toLocaleDateString("pt-BR") : "—");

type Props = { lixaoId: string | null; onClose: () => void };

const DetalheMunicipio = ({ lixaoId, onClose }: Props) => {
  const { data: pnrs = [] } = useLixoesPnrs();
  const info = useMemo(() => pnrs.find((p) => p.id === lixaoId) ?? null, [pnrs, lixaoId]);

  const { data: etapas = [] } = useQuery({
    queryKey: ["detalhe-municipio-etapas", lixaoId],
    enabled: !!lixaoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lixao_encerramento_etapas")
        .select("id,ordem,etapa,descricao,situacao,responsavel,data_prevista,data_conclusao")
        .eq("lixao_id", lixaoId!)
        .order("ordem");
      if (error) throw error;
      return (data ?? []) as unknown as Etapa[];
    },
  });

  const { data: historico = [] } = useQuery({
    queryKey: ["detalhe-municipio-historico", lixaoId],
    enabled: !!lixaoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lixao_volume_historico")
        .select("mes_referencia,volume_estocado_m3,volume_removido_m3,volume_recuperado_m3")
        .eq("lixao_id", lixaoId!)
        .order("mes_referencia");
      if (error) throw error;
      return (data ?? []) as unknown as Hist[];
    },
  });

  const numeros = useMemo(() => {
    if (historico.length === 0) return { estocado: 0, removido: 0, recuperado: 0, reducao: 0 };
    const primeiro = Number(historico[0].volume_estocado_m3) || 0;
    const atual = Number(historico[historico.length - 1].volume_estocado_m3) || 0;
    return {
      estocado: atual,
      removido: historico.reduce((s, h) => s + Number(h.volume_removido_m3 || 0), 0),
      recuperado: historico.reduce((s, h) => s + Number(h.volume_recuperado_m3 || 0), 0),
      reducao: primeiro > 0 ? ((primeiro - atual) / primeiro) * 100 : 0,
    };
  }, [historico]);

  const janelaPrazo = useMemo(() => {
    if (!info?.prazo_legal_pnrs) return null;
    const dias = diasRestantes(info.prazo_legal_pnrs);
    const janela = classificarPrazo(dias);
    return janela === "fora" || dias === null ? null : { janela, dias };
  }, [info]);

  return (
    <Sheet open={!!lixaoId && !!info} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        {info && (
          <>
            <SheetHeader>
              <div className="flex items-start gap-2">
                <MapPin className="h-5 w-5 mt-0.5 text-primary" />
                <div>
                  <SheetTitle>{info.municipio} — {info.uf}</SheetTitle>
                  <SheetDescription>{info.nome}</SheetDescription>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <Badge variant="outline" className={SITUACAO_PNRS[info.situacao_pnrs]?.className}>
                  {SITUACAO_PNRS[info.situacao_pnrs]?.label ?? info.situacao_pnrs}
                </Badge>
                {janelaPrazo && (
                  <Badge variant="outline" className={JANELA_CLASS[janelaPrazo.janela]}>
                    {JANELA_LABEL[janelaPrazo.janela]}
                  </Badge>
                )}
                {info.municipio_ibge && <Badge variant="secondary">IBGE {info.municipio_ibge}</Badge>}
              </div>
            </SheetHeader>

            {/* Indicadores */}
            <div className="grid grid-cols-2 gap-3 mt-6">
              <Card><CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Volume estocado atual</p>
                <p className="text-lg font-bold">{fmt(numeros.estocado)} m³</p>
              </CardContent></Card>
              <Card><CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Volume removido acumulado</p>
                <p className="text-lg font-bold">{fmt(numeros.removido)} m³</p>
              </CardContent></Card>
              <Card><CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Recuperado p/ reciclagem</p>
                <p className="text-lg font-bold text-emerald-600">{fmt(numeros.recuperado)} m³</p>
              </CardContent></Card>
              <Card><CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Taxa de redução</p>
                <p className="text-lg font-bold">{numeros.reducao.toFixed(1)}%</p>
              </CardContent></Card>
            </div>

            <Separator className="my-5" />

            {/* Conformidade PNRS */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Conformidade PNRS (Lei 14.026/2020)</h3>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Faixa populacional: <span className="text-foreground">{FAIXA_LABEL[info.faixa_populacional] ?? info.faixa_populacional}</span></p>
                <p>Prazo legal: <span className="text-foreground">{dataBR(info.prazo_legal_pnrs)}</span>
                  {janelaPrazo && (
                    <> · {janelaPrazo.dias < 0 ? `${Math.abs(janelaPrazo.dias)} dia(s) em atraso` : `${janelaPrazo.dias} dia(s) restantes`}</>
                  )}
                </p>
                <p className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  População: {info.populacao_municipio ? fmt(info.populacao_municipio) : "—"} hab. · Catadores estimados:{" "}
                  {info.catadores_estimados ? fmt(info.catadores_estimados) : "—"}
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Badge variant="outline">{info.possui_coleta_seletiva ? "Com" : "Sem"} coleta seletiva</Badge>
                  <Badge variant="outline">{info.possui_plano_municipal ? "Com" : "Sem"} plano municipal</Badge>
                  <Badge variant="outline">{info.consorcio_publico ? "Em consórcio público" : "Sem consórcio"}</Badge>
                </div>
                {info.fonte_verificacao && (
                  <p className="pt-1">Fonte: {info.fonte_verificacao} · verificado em {dataBR(info.data_ultima_verificacao)}</p>
                )}
              </div>
            </div>

            <Separator className="my-5" />

            {/* Roteiro de encerramento */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Roteiro de Encerramento (ProteGEER)</h3>
                <span className="text-xs text-muted-foreground">
                  {info.etapas_concluidas}/{info.etapas_total} etapas
                </span>
              </div>
              <Progress value={Number(info.progresso_encerramento_pct) || 0} className="h-2" />
              {etapas.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nenhuma etapa cadastrada para esta área.</p>
              ) : (
                <ol className="space-y-2">
                  {etapas.map((e) => {
                    const s = SIT[e.situacao] ?? SIT.pendente;
                    return (
                      <li key={e.id} className="flex items-start gap-2">
                        <s.Icon className={`h-4 w-4 mt-0.5 shrink-0 ${s.className}`} />
                        <div className="text-xs">
                          <p className="font-medium">{e.ordem}. {e.etapa}</p>
                          <p className="text-muted-foreground">
                            {s.label}
                            {e.data_prevista && <> · previsto {dataBR(e.data_prevista)}</>}
                            {e.data_conclusao && <> · concluído {dataBR(e.data_conclusao)}</>}
                            {e.responsavel && <> · {e.responsavel}</>}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default DetalheMunicipio;
