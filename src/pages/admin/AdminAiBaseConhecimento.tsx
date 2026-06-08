import { AiCrudShell } from "@/components/admin/AiCrudShell";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen } from "lucide-react";

const empty = { nome: "", tipo: "documentos", descricao: "", total_documentos: 0, total_chunks: 0, modelo_embedding: "text-embedding-3-small", status: "ativo" };

const AdminAiBaseConhecimento = () => (
  <AiCrudShell
    title="Base de Conhecimento"
    description="Conjuntos de documentos e dados de referência (RAG) usados pelos agentes."
    icon={<BookOpen className="h-4 w-4" />}
    tableName="ai_base_conhecimento"
    queryKey="ai_base_conhecimento"
    orderBy="nome"
    emptyForm={empty}
    validate={(f) => (!f.nome ? "Nome obrigatório" : null)}
    columns={[
      { header: "Nome", cell: (r: any) => <span className="font-medium">{r.nome}</span> },
      { header: "Tipo", cell: (r: any) => <Badge variant="outline">{r.tipo}</Badge> },
      { header: "Docs", cell: (r: any) => r.total_documentos.toLocaleString("pt-BR") },
      { header: "Chunks", cell: (r: any) => r.total_chunks.toLocaleString("pt-BR") },
      { header: "Embedding", cell: (r: any) => <code className="text-[10px]">{r.modelo_embedding}</code> },
      { header: "Status", cell: (r: any) => <Badge variant={r.status === "ativo" ? "default" : "secondary"}>{r.status}</Badge> },
    ]}
    renderForm={(f, setF) => (
      <>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Nome</Label><Input value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} /></div>
          <div><Label>Tipo</Label>
            <Select value={f.tipo} onValueChange={(v) => setF({ ...f, tipo: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="documentos">Documentos</SelectItem><SelectItem value="faq">FAQ</SelectItem>
                <SelectItem value="api">API/Estruturado</SelectItem><SelectItem value="banco">Banco de Dados</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Total documentos</Label><Input type="number" value={f.total_documentos} onChange={(e) => setF({ ...f, total_documentos: +e.target.value })} /></div>
          <div><Label>Total chunks</Label><Input type="number" value={f.total_chunks} onChange={(e) => setF({ ...f, total_chunks: +e.target.value })} /></div>
          <div><Label>Modelo embedding</Label><Input value={f.modelo_embedding ?? ""} onChange={(e) => setF({ ...f, modelo_embedding: e.target.value })} /></div>
          <div><Label>Status</Label>
            <Select value={f.status} onValueChange={(v) => setF({ ...f, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="ativo">Ativo</SelectItem><SelectItem value="inativo">Inativo</SelectItem><SelectItem value="manutencao">Manutenção</SelectItem></SelectContent>
            </Select>
          </div>
        </div>
        <div><Label>Descrição</Label><Textarea value={f.descricao ?? ""} onChange={(e) => setF({ ...f, descricao: e.target.value })} rows={2} /></div>
      </>
    )}
  />
);
export default AdminAiBaseConhecimento;
