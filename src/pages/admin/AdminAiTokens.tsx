import { AiCrudShell } from "@/components/admin/AiCrudShell";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { KeyRound, AlertCircle } from "lucide-react";

const empty = { provedor: "OpenAI", rotulo: "", secret_name: "", descricao: "", status: "ativo" };

const AdminAiTokens = () => (
  <div className="space-y-3">
    <Card className="border-l-4 border-l-amber-500">
      <CardContent className="pt-3 pb-3 flex gap-2">
        <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">
          Os valores das chaves <strong>nunca são armazenados</strong> nesta tabela. Cadastre apenas o <code>nome do secret</code> que estará disponível
          como variável de ambiente no backend (criado via cofre de segredos). Para gerenciar valores, use o cofre de segredos do projeto.
        </p>
      </CardContent>
    </Card>
    <AiCrudShell
      title="Tokens de Provedores"
      description="Referências a API keys de provedores externos (OpenAI, Anthropic, etc.) armazenadas no cofre."
      icon={<KeyRound className="h-4 w-4" />}
      tableName="ai_tokens_provedores"
      queryKey="ai_tokens_provedores"
      orderBy="provedor"
      emptyForm={empty}
      validate={(f) => (!f.rotulo || !f.secret_name ? "Rótulo e nome do secret obrigatórios" : null)}
      columns={[
        { header: "Provedor", cell: (r: any) => <span className="font-medium">{r.provedor}</span> },
        { header: "Rótulo", cell: (r: any) => r.rotulo },
        { header: "Secret", cell: (r: any) => <code className="text-[10px]">{r.secret_name}</code> },
        { header: "Status", cell: (r: any) => <Badge variant={r.status === "ativo" ? "default" : "secondary"}>{r.status}</Badge> },
      ]}
      renderForm={(f, setF) => (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Provedor</Label>
              <Select value={f.provedor} onValueChange={(v) => setF({ ...f, provedor: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="OpenAI">OpenAI</SelectItem><SelectItem value="Anthropic">Anthropic</SelectItem>
                  <SelectItem value="Google">Google</SelectItem><SelectItem value="Mistral">Mistral</SelectItem>
                  <SelectItem value="Cohere">Cohere</SelectItem><SelectItem value="Outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Rótulo</Label><Input value={f.rotulo} onChange={(e) => setF({ ...f, rotulo: e.target.value })} placeholder="Produção / Sandbox" /></div>
            <div className="col-span-2"><Label>Nome do secret (cofre)</Label><Input value={f.secret_name} onChange={(e) => setF({ ...f, secret_name: e.target.value })} placeholder="OPENAI_API_KEY" className="font-mono" /></div>
            <div><Label>Status</Label>
              <Select value={f.status} onValueChange={(v) => setF({ ...f, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="ativo">Ativo</SelectItem><SelectItem value="inativo">Inativo</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Descrição</Label><Textarea value={f.descricao ?? ""} onChange={(e) => setF({ ...f, descricao: e.target.value })} rows={2} /></div>
        </>
      )}
    />
  </div>
);
export default AdminAiTokens;
