import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Activity } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

const AdminAiConsumo = () => {
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["ai_consumo_log"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_consumo_log")
        .select("*, ai_modelos(nome), ai_agentes(nome)")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });

  const total = rows.reduce((acc: number, r: any) => acc + (r.tokens_input ?? 0) + (r.tokens_output ?? 0), 0);
  const custo = rows.reduce((acc: number, r: any) => acc + Number(r.custo_estimado ?? 0), 0);

  return (
    <div className="space-y-4">
      <AdminPageHeader title="Log de Consumo de IA" description="Últimas 200 chamadas registradas — tokens e custo estimado." icon={<Activity className="h-4 w-4" />} />
      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="pt-3 pb-3"><p className="text-[10px] text-muted-foreground uppercase">Chamadas</p><p className="text-xl font-semibold">{rows.length}</p></CardContent></Card>
        <Card><CardContent className="pt-3 pb-3"><p className="text-[10px] text-muted-foreground uppercase">Tokens totais</p><p className="text-xl font-semibold">{total.toLocaleString("pt-BR")}</p></CardContent></Card>
        <Card><CardContent className="pt-3 pb-3"><p className="text-[10px] text-muted-foreground uppercase">Custo estimado</p><p className="text-xl font-semibold">${custo.toFixed(4)}</p></CardContent></Card>
      </div>
      <Card>
        <CardContent className="pt-4">
          {isLoading ? <p className="text-xs text-muted-foreground py-6 text-center">Carregando…</p> :
           rows.length === 0 ? <p className="text-xs text-muted-foreground py-6 text-center">Sem chamadas registradas ainda.</p> : (
            <Table>
              <TableHeader><TableRow>
                <TableHead className="text-xs">Quando</TableHead><TableHead className="text-xs">Agente</TableHead>
                <TableHead className="text-xs">Modelo</TableHead><TableHead className="text-xs text-right">Input</TableHead>
                <TableHead className="text-xs text-right">Output</TableHead><TableHead className="text-xs text-right">Custo</TableHead>
                <TableHead className="text-xs">Status</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {rows.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs py-2">{new Date(r.created_at).toLocaleString("pt-BR")}</TableCell>
                    <TableCell className="text-xs py-2">{r.ai_agentes?.nome ?? "—"}</TableCell>
                    <TableCell className="text-xs py-2"><code className="text-[10px]">{r.ai_modelos?.nome ?? "—"}</code></TableCell>
                    <TableCell className="text-xs py-2 text-right">{r.tokens_input.toLocaleString("pt-BR")}</TableCell>
                    <TableCell className="text-xs py-2 text-right">{r.tokens_output.toLocaleString("pt-BR")}</TableCell>
                    <TableCell className="text-xs py-2 text-right">${Number(r.custo_estimado).toFixed(4)}</TableCell>
                    <TableCell className="py-2"><Badge variant={r.sucesso ? "default" : "destructive"}>{r.sucesso ? "ok" : "erro"}</Badge></TableCell>
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
export default AdminAiConsumo;
