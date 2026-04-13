import { useMetasOrgao, useEntidadesCredenciadas } from "@/hooks/use-schema-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Target } from "lucide-react";

const PontoColetaMetas = () => {
  const { data: metas, isLoading: loadingMetas } = useMetasOrgao();
  const { data: entidades, isLoading: loadingEnt } = useEntidadesCredenciadas();

  if (loadingMetas || loadingEnt) {
    return <div className="space-y-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>;
  }

  const entidadeMap = new Map(entidades?.map((e: any) => [e.id, e]) ?? []);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {metas?.map((m: any) => {
          const ent = entidadeMap.get(m.entidade_id) as any;
          const meta = Number(m.meta_peso_kg);
          const atingido = Number(m.atingimento_peso_kg);
          const pct = meta > 0 ? Math.min((atingido / meta) * 100, 100) : 0;

          return (
            <Card key={m.id} className="shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  {ent?.nome_fantasia ?? "Entidade"} — {m.ano_vigencia}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progresso</span>
                  <span className="font-bold text-foreground">{pct.toFixed(1)}%</span>
                </div>
                <Progress value={pct} className="h-3" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Atingido: {atingido.toLocaleString("pt-BR")} kg</span>
                  <span>Meta: {meta.toLocaleString("pt-BR")} kg</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default PontoColetaMetas;
