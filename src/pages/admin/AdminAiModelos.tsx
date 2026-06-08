import { AiCrudShell } from "@/components/admin/AiCrudShell";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Cpu } from "lucide-react";

const empty = { nome: "", identificador: "", provedor: "", categoria: "free", contexto_max: 8192, custo_input_1k: 0, custo_output_1k: 0, suporta_imagem: false, suporta_tools: true, descricao: "", status: "ativo" };

const AdminAiModelos = () => (
  <AiCrudShell
    title="Modelos LLM"
    description="Cadastro de modelos free, pagos e treinados disponíveis para agentes."
    icon={<Cpu className="h-4 w-4" />}
    tableName="ai_modelos"
    queryKey="ai_modelos"
    orderBy="nome"
    emptyForm={empty}
    validate={(f) => (!f.nome || !f.identificador || !f.provedor ? "Nome, identificador e provedor são obrigatórios" : null)}
    columns={[
      { header: "Nome", cell: (r: any) => <span className="font-medium">{r.nome}</span> },
      { header: "Identificador", cell: (r: any) => <code className="text-[10px]">{r.identificador}</code> },
      { header: "Provedor", cell: (r: any) => r.provedor },
      { header: "Categoria", cell: (r: any) => <Badge variant={r.categoria === "free" ? "secondary" : r.categoria === "pago" ? "default" : "outline"}>{r.categoria}</Badge> },
      { header: "Contexto", cell: (r: any) => `${(r.contexto_max / 1000).toFixed(0)}k` },
      { header: "Custo I/O (1k)", cell: (r: any) => `$${r.custo_input_1k} / $${r.custo_output_1k}` },
      { header: "Status", cell: (r: any) => <Badge variant={r.status === "ativo" ? "default" : "secondary"}>{r.status}</Badge> },
    ]}
    renderForm={(f, setF) => (
      <>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Nome</Label><Input value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} /></div>
          <div><Label>Identificador</Label><Input value={f.identificador} onChange={(e) => setF({ ...f, identificador: e.target.value })} placeholder="provedor/modelo-id" /></div>
          <div><Label>Provedor</Label><Input value={f.provedor} onChange={(e) => setF({ ...f, provedor: e.target.value })} /></div>
          <div><Label>Categoria</Label>
            <Select value={f.categoria} onValueChange={(v) => setF({ ...f, categoria: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="free">Free</SelectItem><SelectItem value="pago">Pago</SelectItem><SelectItem value="treinado">Treinado</SelectItem></SelectContent>
            </Select>
          </div>
          <div><Label>Contexto máx (tokens)</Label><Input type="number" value={f.contexto_max} onChange={(e) => setF({ ...f, contexto_max: +e.target.value })} /></div>
          <div><Label>Status</Label>
            <Select value={f.status} onValueChange={(v) => setF({ ...f, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="ativo">Ativo</SelectItem><SelectItem value="inativo">Inativo</SelectItem><SelectItem value="manutencao">Manutenção</SelectItem></SelectContent>
            </Select>
          </div>
          <div><Label>Custo input / 1k ($)</Label><Input type="number" step="0.000001" value={f.custo_input_1k} onChange={(e) => setF({ ...f, custo_input_1k: +e.target.value })} /></div>
          <div><Label>Custo output / 1k ($)</Label><Input type="number" step="0.000001" value={f.custo_output_1k} onChange={(e) => setF({ ...f, custo_output_1k: +e.target.value })} /></div>
        </div>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm"><Switch checked={f.suporta_imagem} onCheckedChange={(v) => setF({ ...f, suporta_imagem: v })} />Imagem</label>
          <label className="flex items-center gap-2 text-sm"><Switch checked={f.suporta_tools} onCheckedChange={(v) => setF({ ...f, suporta_tools: v })} />Tools/Functions</label>
        </div>
        <div><Label>Descrição</Label><Textarea value={f.descricao ?? ""} onChange={(e) => setF({ ...f, descricao: e.target.value })} rows={2} /></div>
      </>
    )}
  />
);
export default AdminAiModelos;
