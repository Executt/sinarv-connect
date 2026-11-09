import { AiCrudShell } from "@/components/admin/AiCrudShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { Network, PlugZap, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const PROVEDORES: Record<string, string> = {
  litellm: "LiteLLM", openrouter: "OpenRouter", portkey: "Portkey",
  azure_apim: "Azure API Management", openai_compatible: "Compatível com OpenAI", outro: "Outro",
};

const empty = {
  nome: "", provedor: "litellm", base_url: "", secret_name: "", modelo_padrao: "",
  gerencia_tokens: true, gerencia_mcp: true, painel_url: "", ativo: false, descricao: "",
};

const TestarBtn = ({ id }: { id: string }) => {
  const qc = useQueryClient();
  return (
    <Button size="sm" variant="outline" onClick={async () => {
      const { data, error } = await supabase.functions.invoke("testar-proxy-ia", { body: { id } });
      if (error) {
        const d = error instanceof FunctionsHttpError ? await error.context.text() : error.message;
        toast.error(`Teste falhou: ${d}`);
      } else data?.ok ? toast.success(data.msg) : toast.error(data?.msg ?? "Falha");
      qc.invalidateQueries({ queryKey: ["ai_proxy_config"] });
    }}>
      <PlugZap className="h-3 w-3 mr-1" /> Testar
    </Button>
  );
};

const AdminAiProxy = () => (
  <AiCrudShell
    title="Proxy de IA (LiteLLM)"
    description="Gateway externo que centraliza modelos, chaves, cotas de tokens e servidores MCP. Apenas um proxy pode ficar ativo."
    icon={<Network className="h-4 w-4" />}
    tableName="ai_proxy_config"
    queryKey="ai_proxy_config"
    orderBy="nome"
    emptyForm={empty}
    validate={(f) => {
      if (!f.nome || !f.base_url) return "Nome e URL são obrigatórios";
      if (!/^https:\/\//i.test(f.base_url)) return "A URL precisa começar com https://";
      if (f.secret_name && !/^AI_PROXY_[A-Z0-9_]+$/.test(f.secret_name)) return "O nome da chave deve começar com AI_PROXY_ (letras maiúsculas, números e _)";
      if (f.painel_url && !/^https:\/\//i.test(f.painel_url)) return "O link do painel precisa começar com https://";
      return null;
    }}
    toRow={(f) => ({ ...f, secret_name: f.secret_name || null, painel_url: f.painel_url || null, modelo_padrao: f.modelo_padrao || null })}
    columns={[
      { header: "Nome", cell: (r: any) => <span className="font-medium">{r.nome}</span> },
      { header: "Provedor", cell: (r: any) => <Badge variant="outline">{PROVEDORES[r.provedor] ?? r.provedor}</Badge> },
      { header: "URL", cell: (r: any) => <code className="text-[10px] break-all">{r.base_url}</code> },
      { header: "Gerencia", cell: (r: any) => [r.gerencia_tokens && "Tokens", r.gerencia_mcp && "MCP"].filter(Boolean).join(" · ") || "—" },
      { header: "Status", cell: (r: any) => <Badge variant={r.ativo ? "default" : "secondary"}>{r.ativo ? "Ativo" : "Inativo"}</Badge> },
      { header: "Último teste", cell: (r: any) => r.ultimo_teste_em
        ? <span className={`text-xs ${r.ultimo_teste_ok ? "text-primary" : "text-destructive"}`}>{r.ultimo_teste_msg}</span>
        : <span className="text-xs text-muted-foreground">nunca</span> },
      { header: "", cell: (r: any) => (
        <div className="flex gap-1">
          <TestarBtn id={r.id} />
          {r.painel_url && <Button size="sm" variant="ghost" asChild><a href={r.painel_url} target="_blank" rel="noreferrer"><ExternalLink className="h-3 w-3" /></a></Button>}
        </div>) },
    ]}
    renderForm={(f, setF) => (
      <>
        <div><Label htmlFor="px-nome">Nome</Label><Input id="px-nome" value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} placeholder="LiteLLM produção" /></div>
        <div><Label>Provedor</Label>
          <Select value={f.provedor} onValueChange={(v) => setF({ ...f, provedor: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{Object.entries(PROVEDORES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label htmlFor="px-url">URL do proxy</Label><Input id="px-url" value={f.base_url} onChange={(e) => setF({ ...f, base_url: e.target.value })} placeholder="https://litellm.seuorgao.gov.br" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label htmlFor="px-secret">Nome da chave guardada</Label><Input id="px-secret" value={f.secret_name ?? ""} onChange={(e) => setF({ ...f, secret_name: e.target.value.toUpperCase() })} placeholder="AI_PROXY_LITELLM_KEY" /></div>
          <div><Label htmlFor="px-modelo">Modelo padrão</Label><Input id="px-modelo" value={f.modelo_padrao ?? ""} onChange={(e) => setF({ ...f, modelo_padrao: e.target.value })} placeholder="gpt-4o-mini" /></div>
        </div>
        <p className="text-xs text-muted-foreground">A chave em si não fica nesta tela: ela é guardada com segurança no servidor com o nome acima.</p>
        <div><Label htmlFor="px-painel">Link do painel do proxy (opcional)</Label><Input id="px-painel" value={f.painel_url ?? ""} onChange={(e) => setF({ ...f, painel_url: e.target.value })} placeholder="https://litellm.seuorgao.gov.br/ui" /></div>
        <div className="flex flex-wrap gap-6 pt-1">
          <label className="flex items-center gap-2 text-sm"><Switch checked={f.gerencia_tokens} onCheckedChange={(v) => setF({ ...f, gerencia_tokens: v })} /> Gerencia tokens/cotas</label>
          <label className="flex items-center gap-2 text-sm"><Switch checked={f.gerencia_mcp} onCheckedChange={(v) => setF({ ...f, gerencia_mcp: v })} /> Gerencia MCPs</label>
          <label className="flex items-center gap-2 text-sm"><Switch checked={f.ativo} onCheckedChange={(v) => setF({ ...f, ativo: v })} /> Ativo</label>
        </div>
        <div><Label htmlFor="px-desc">Observações</Label><Textarea id="px-desc" value={f.descricao ?? ""} onChange={(e) => setF({ ...f, descricao: e.target.value })} rows={2} /></div>
      </>
    )}
  />
);
export default AdminAiProxy;
