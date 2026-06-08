import { AiCrudShell } from "@/components/admin/AiCrudShell";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plug } from "lucide-react";

const empty = { nome: "", url: "", transporte: "http", auth_tipo: "none", auth_secret_name: "", descricao: "", status: "ativo" };

const AdminAiMcp = () => (
  <AiCrudShell
    title="Servidores MCP"
    description="Configuração de servidores Model Context Protocol acessíveis pelos agentes."
    icon={<Plug className="h-4 w-4" />}
    tableName="ai_mcp_servers"
    queryKey="ai_mcp_servers"
    orderBy="nome"
    emptyForm={empty}
    validate={(f) => (!f.nome || !f.url ? "Nome e URL são obrigatórios" : null)}
    columns={[
      { header: "Nome", cell: (r: any) => <span className="font-medium">{r.nome}</span> },
      { header: "URL", cell: (r: any) => <code className="text-[10px] break-all">{r.url}</code> },
      { header: "Transporte", cell: (r: any) => <Badge variant="outline">{r.transporte}</Badge> },
      { header: "Auth", cell: (r: any) => r.auth_tipo },
      { header: "Status", cell: (r: any) => <Badge variant={r.status === "ativo" ? "default" : "secondary"}>{r.status}</Badge> },
    ]}
    renderForm={(f, setF) => (
      <>
        <div><Label>Nome</Label><Input value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} /></div>
        <div><Label>URL</Label><Input value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} placeholder="https://..." /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Transporte</Label>
            <Select value={f.transporte} onValueChange={(v) => setF({ ...f, transporte: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="http">HTTP</SelectItem><SelectItem value="sse">SSE</SelectItem><SelectItem value="stdio">stdio</SelectItem></SelectContent>
            </Select>
          </div>
          <div><Label>Status</Label>
            <Select value={f.status} onValueChange={(v) => setF({ ...f, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="ativo">Ativo</SelectItem><SelectItem value="inativo">Inativo</SelectItem><SelectItem value="manutencao">Manutenção</SelectItem></SelectContent>
            </Select>
          </div>
          <div><Label>Tipo de autenticação</Label>
            <Select value={f.auth_tipo} onValueChange={(v) => setF({ ...f, auth_tipo: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma</SelectItem><SelectItem value="bearer">Bearer Token</SelectItem>
                <SelectItem value="api_key">API Key</SelectItem><SelectItem value="oauth">OAuth</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Nome do secret</Label><Input value={f.auth_secret_name ?? ""} onChange={(e) => setF({ ...f, auth_secret_name: e.target.value })} placeholder="MCP_XXX_TOKEN" /></div>
        </div>
        <div><Label>Descrição</Label><Textarea value={f.descricao ?? ""} onChange={(e) => setF({ ...f, descricao: e.target.value })} rows={2} /></div>
      </>
    )}
  />
);
export default AdminAiMcp;
