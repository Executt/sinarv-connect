import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Circle, Clock, MinusCircle } from "lucide-react";

type Etapa = {
  id: string;
  lixao_id: string;
  ordem: number;
  etapa: string;
  descricao: string | null;
  situacao: string;
  responsavel: string | null;
  data_prevista: string | null;
  data_conclusao: string | null;
};

const SIT: Record<string, { label: string; className: string; Icon: typeof Circle }> = {
  concluida: { label: "Concluída", className: "text-emerald-600", Icon: CheckCircle2 },
  em_andamento: { label: "Em andamento", className: "text-amber-600", Icon: Clock },
  pendente: { label: "Pendente", className: "text-muted-foreground", Icon: Circle },
  nao_aplicavel: { label: "Não aplicável", className: "text-muted-foreground", Icon: MinusCircle },
};

type Props = { lixoes: { id: string; nome: string; uf: string; municipio: string }[] };

const RoteiroEncerramento = ({ lixoes }: Props) => {
  const [lixaoId, setLixaoId] = useState<string>(lixoes[0]?.id ?? "");
  const atual = lixoes.find((l) => l.id === lixaoId) ?? lixoes[0];

  const { data: etapas = [], isLoading } = useQuery({
    queryKey: ["lixao-etapas", atual?.id],
    enabled: !!atual?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lixao_encerramento_etapas")
        .select("*")
        .eq("lixao_id", atual!.id)
        .order("ordem");
      if (error) throw error;
      return (data ?? []) as unknown as Etapa[];
    },
  });

  const progresso = useMemo(() => {
    if (etapas.length === 0) return 0;
    const ok = etapas.filter((e) => e.situacao === "concluida").length;
    return Math.round((100 * ok) / etapas.length);
  }, [etapas]);

  if (lixoes.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Nenhuma área disponível para acompanhar o roteiro de encerramento.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle>Roteiro de encerramento de lixões</CardTitle>
            <p className="text-xs text-muted-foreground">
              Etapas conforme o Roteiro de Encerramento de Lixões — Ministério das Cidades / ProteGEER.
            </p>
          </div>
          <div className="min-w-[260px]">
            <Select value={atual?.id} onValueChange={setLixaoId}>
              <SelectTrigger><SelectValue placeholder="Selecione a área" /></SelectTrigger>
              <SelectContent>
                {lixoes.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.nome} — {l.municipio}/{l.uf}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Progress value={progresso} className="h-2" />
          <p className="text-[11px] text-muted-foreground pt-1">{progresso}% do roteiro concluído</p>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground py-6">Carregando etapas…</p>
        ) : (
          <ol className="relative border-l border-border pl-6 space-y-5">
            {etapas.map((e) => {
              const s = SIT[e.situacao] ?? SIT.pendente;
              return (
                <li key={e.id} className="relative">
                  <span className="absolute -left-[31px] top-0 bg-background rounded-full">
                    <s.Icon className={`h-5 w-5 ${s.className}`} />
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-sm">
                      {e.ordem}. {e.etapa}
                    </p>
                    <Badge variant="outline" className="text-[10px]">{s.label}</Badge>
                  </div>
                  {e.descricao && <p className="text-xs text-muted-foreground pt-1">{e.descricao}</p>}
                  {(e.responsavel || e.data_prevista || e.data_conclusao) && (
                    <p className="text-[11px] text-muted-foreground pt-1">
                      {e.responsavel && <>Responsável: {e.responsavel} · </>}
                      {e.data_prevista && (
                        <>Previsto: {new Date(`${e.data_prevista}T00:00:00`).toLocaleDateString("pt-BR")} · </>
                      )}
                      {e.data_conclusao && (
                        <>Concluído: {new Date(`${e.data_conclusao}T00:00:00`).toLocaleDateString("pt-BR")}</>
                      )}
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
};

export default RoteiroEncerramento;
