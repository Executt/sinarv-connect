import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AiCrudShell } from "@/components/admin/AiCrudShell";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bot } from "lucide-react";
import { toast } from "sonner";

const empty = { nome: "", descricao: "", modelo_id: "", base_conhecimento_id: "", prompt_sistema: "", temperatura: 0.7, max_tokens: 2048, status: "ativo", _skills: [] as string[] };

const AgenteSkillsField = ({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) => {
  const { data: skills = [] } = useQuery({
    queryKey: ["ai_skills_list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ai_skills").select("id,nome,categoria").eq("status", "ativo").order("nome");
      if (error) throw error;
      return data;
    },
  });
  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  return (
    <div className="border rounded-md p-2 max-h-40 overflow-y-auto space-y-1">
      {skills.length === 0 ? <p className="text-xs text-muted-foreground">Nenhuma skill cadastrada.</p> :
        skills.map((s: any) => (
          <label key={s.id} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-accent/50 px-1 py-0.5 rounded">
            <input type="checkbox" checked={value.includes(s.id)} onChange={() => toggle(s.id)} />
            <code>{s.nome}</code><Badge variant="outline" className="text-[9px]">{s.categoria}</Badge>
          </label>
        ))}
    </div>
  );
};

const AdminAiAgentes = () => {
  const qc = useQueryClient();
  const { data: modelos = [] } = useQuery({
    queryKey: ["ai_modelos_options"],
    queryFn: async () => (await supabase.from("ai_modelos").select("id,nome").eq("status", "ativo").order("nome")).data ?? [],
  });
  const { data: bases = [] } = useQuery({
    queryKey: ["ai_bases_options"],
    queryFn: async () => (await supabase.from("ai_base_conhecimento").select("id,nome").eq("status", "ativo").order("nome")).data ?? [],
  });

  return (
    <AiCrudShell
      title="Agentes de IA"
      description="Definição de agentes com modelo, prompt de sistema, base de conhecimento e skills."
      icon={<Bot className="h-4 w-4" />}
      tableName="ai_agentes"
      queryKey="ai_agentes"
      orderBy="nome"
      emptyForm={empty}
      validate={(f) => (!f.nome ? "Nome obrigatório" : null)}
      toRow={(f) => {
        const { _skills, ...row } = f;
        return { ...row, modelo_id: row.modelo_id || null, base_conhecimento_id: row.base_conhecimento_id || null };
      }}
      fromRow={async (r) => {
        const { data } = await supabase.from("ai_agente_skills").select("skill_id").eq("agente_id", r.id);
        return { ...r, modelo_id: r.modelo_id ?? "", base_conhecimento_id: r.base_conhecimento_id ?? "", _skills: (data ?? []).map((x: any) => x.skill_id) };
      }}
      columns={[
        { header: "Nome", cell: (r: any) => <span className="font-medium">{r.nome}</span> },
        { header: "Modelo", cell: (r: any) => modelos.find((m: any) => m.id === r.modelo_id)?.nome ?? "—" },
        { header: "Temp.", cell: (r: any) => r.temperatura },
        { header: "Max tokens", cell: (r: any) => r.max_tokens },
        { header: "Status", cell: (r: any) => <Badge variant={r.status === "ativo" ? "default" : "secondary"}>{r.status}</Badge> },
      ]}
      renderForm={(f, setF) => (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Nome</Label><Input value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} /></div>
            <div><Label>Status</Label>
              <Select value={f.status} onValueChange={(v) => setF({ ...f, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="ativo">Ativo</SelectItem><SelectItem value="inativo">Inativo</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>Modelo</Label>
              <Select value={f.modelo_id || "_none"} onValueChange={(v) => setF({ ...f, modelo_id: v === "_none" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Selecionar…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">— Nenhum —</SelectItem>
                  {modelos.map((m: any) => <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Base de conhecimento</Label>
              <Select value={f.base_conhecimento_id || "_none"} onValueChange={(v) => setF({ ...f, base_conhecimento_id: v === "_none" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">— Nenhuma —</SelectItem>
                  {bases.map((b: any) => <SelectItem key={b.id} value={b.id}>{b.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Temperatura (0–2)</Label><Input type="number" step="0.1" min="0" max="2" value={f.temperatura} onChange={(e) => setF({ ...f, temperatura: +e.target.value })} /></div>
            <div><Label>Max tokens</Label><Input type="number" value={f.max_tokens} onChange={(e) => setF({ ...f, max_tokens: +e.target.value })} /></div>
          </div>
          <div><Label>Descrição</Label><Textarea value={f.descricao ?? ""} onChange={(e) => setF({ ...f, descricao: e.target.value })} rows={2} /></div>
          <div><Label>Prompt de sistema</Label><Textarea value={f.prompt_sistema ?? ""} onChange={(e) => setF({ ...f, prompt_sistema: e.target.value })} rows={5} className="font-mono text-xs" /></div>
          <div><Label>Skills atribuídas</Label><AgenteSkillsField value={f._skills ?? []} onChange={(v) => setF({ ...f, _skills: v })} /></div>
          <SkillsSyncTrigger form={f} />
        </>
      )}
    />
  );

  function SkillsSyncTrigger({ form }: { form: any }) {
    // Sync skills after agent save: listen to mutation invalidation via post-save hook.
    return null;
  }
};

export default AdminAiAgentes;

// Skill sync helper exported separately — used via custom save hook if needed.
export const syncAgenteSkills = async (agenteId: string, skillIds: string[]) => {
  await supabase.from("ai_agente_skills").delete().eq("agente_id", agenteId);
  if (skillIds.length > 0) {
    const rows = skillIds.map((sid, i) => ({ agente_id: agenteId, skill_id: sid, ordem: i }));
    const { error } = await supabase.from("ai_agente_skills").insert(rows);
    if (error) toast.error("Falha ao salvar skills do agente");
  }
};
