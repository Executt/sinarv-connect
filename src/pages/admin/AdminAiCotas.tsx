import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AiCrudShell } from "@/components/admin/AiCrudShell";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Gauge } from "lucide-react";

const empty = { user_id: "", limite_tokens_mes: 100000, tokens_consumidos_mes: 0, reset_em: new Date().toISOString().slice(0, 10), observacoes: "" };

const AdminAiCotas = () => {
  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles_options"],
    queryFn: async () => (await supabase.from("profiles").select("user_id,email,display_name").order("email")).data ?? [],
  });
  const labelFor = (uid: string) => {
    const p = profiles.find((x: any) => x.user_id === uid);
    return p ? `${p.display_name ?? "—"} (${p.email})` : uid;
  };

  return (
    <AiCrudShell
      title="Cotas de Tokens por Usuário"
      description="Limites mensais de tokens e consumo registrado por usuário."
      icon={<Gauge className="h-4 w-4" />}
      tableName="ai_cotas_usuario"
      queryKey="ai_cotas_usuario"
      orderBy="updated_at"
      emptyForm={empty}
      validate={(f) => (!f.user_id ? "Selecione um usuário" : null)}
      columns={[
        { header: "Usuário", cell: (r: any) => <span className="font-medium text-xs">{labelFor(r.user_id)}</span> },
        { header: "Limite", cell: (r: any) => r.limite_tokens_mes.toLocaleString("pt-BR") },
        { header: "Consumo", cell: (r: any) => (
          <div className="w-32">
            <Progress value={Math.min(100, (r.tokens_consumidos_mes / Math.max(1, r.limite_tokens_mes)) * 100)} className="h-1.5" />
            <span className="text-[10px] text-muted-foreground">{r.tokens_consumidos_mes.toLocaleString("pt-BR")}</span>
          </div>
        )},
        { header: "Reset em", cell: (r: any) => r.reset_em },
      ]}
      renderForm={(f, setF) => (
        <>
          <div><Label>Usuário</Label>
            <Select value={f.user_id} onValueChange={(v) => setF({ ...f, user_id: v })}>
              <SelectTrigger><SelectValue placeholder="Selecionar…" /></SelectTrigger>
              <SelectContent>
                {profiles.map((p: any) => <SelectItem key={p.user_id} value={p.user_id}>{p.email}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Limite mensal (tokens)</Label><Input type="number" value={f.limite_tokens_mes} onChange={(e) => setF({ ...f, limite_tokens_mes: +e.target.value })} /></div>
            <div><Label>Consumidos no mês</Label><Input type="number" value={f.tokens_consumidos_mes} onChange={(e) => setF({ ...f, tokens_consumidos_mes: +e.target.value })} /></div>
            <div className="col-span-2"><Label>Próximo reset</Label><Input type="date" value={f.reset_em} onChange={(e) => setF({ ...f, reset_em: e.target.value })} /></div>
          </div>
          <div><Label>Observações</Label><Textarea value={f.observacoes ?? ""} onChange={(e) => setF({ ...f, observacoes: e.target.value })} rows={2} /></div>
        </>
      )}
    />
  );
};
export default AdminAiCotas;
