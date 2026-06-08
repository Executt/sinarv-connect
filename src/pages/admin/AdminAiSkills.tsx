import { AiCrudShell } from "@/components/admin/AiCrudShell";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wand2 } from "lucide-react";

const empty = { nome: "", categoria: "geral", descricao: "", schema_entrada: "{}", status: "ativo" };

const AdminAiSkills = () => (
  <AiCrudShell
    title="Skills (Ferramentas)"
    description="Catálogo global de skills/ferramentas que podem ser anexadas aos agentes."
    icon={<Wand2 className="h-4 w-4" />}
    tableName="ai_skills"
    queryKey="ai_skills"
    orderBy="nome"
    emptyForm={empty}
    validate={(f) => {
      if (!f.nome) return "Nome obrigatório";
      try { JSON.parse(f.schema_entrada || "{}"); } catch { return "Schema JSON inválido"; }
      return null;
    }}
    toRow={(f) => ({ ...f, schema_entrada: JSON.parse(f.schema_entrada || "{}") })}
    fromRow={(r) => ({ ...r, schema_entrada: JSON.stringify(r.schema_entrada ?? {}, null, 2) })}
    columns={[
      { header: "Nome", cell: (r: any) => <code className="text-xs">{r.nome}</code> },
      { header: "Categoria", cell: (r: any) => <Badge variant="outline">{r.categoria}</Badge> },
      { header: "Descrição", cell: (r: any) => <span className="text-muted-foreground">{r.descricao}</span> },
      { header: "Status", cell: (r: any) => <Badge variant={r.status === "ativo" ? "default" : "secondary"}>{r.status}</Badge> },
    ]}
    renderForm={(f, setF) => (
      <>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Nome (snake_case)</Label><Input value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} /></div>
          <div><Label>Categoria</Label><Input value={f.categoria} onChange={(e) => setF({ ...f, categoria: e.target.value })} /></div>
        </div>
        <div><Label>Descrição</Label><Textarea value={f.descricao ?? ""} onChange={(e) => setF({ ...f, descricao: e.target.value })} rows={2} /></div>
        <div><Label>Schema de entrada (JSON)</Label>
          <Textarea value={f.schema_entrada} onChange={(e) => setF({ ...f, schema_entrada: e.target.value })} rows={8} className="font-mono text-xs" />
        </div>
        <div><Label>Status</Label>
          <Select value={f.status} onValueChange={(v) => setF({ ...f, status: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="ativo">Ativo</SelectItem><SelectItem value="inativo">Inativo</SelectItem></SelectContent>
          </Select>
        </div>
      </>
    )}
  />
);
export default AdminAiSkills;
