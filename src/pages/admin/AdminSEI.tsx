import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FileCode2, Save, TestTube2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

interface SEIForm {
  id?: string;
  nome: string;
  url_servico: string;
  sigla_sistema: string;
  identificacao_servico: string;
  unidade_padrao: string;
  tipo_processo_padrao: string;
  ativo: boolean;
  status_teste?: string;
  ultimo_teste?: string;
}

const empty: SEIForm = {
  nome: "SEI Principal",
  url_servico: "",
  sigla_sistema: "",
  identificacao_servico: "",
  unidade_padrao: "",
  tipo_processo_padrao: "",
  ativo: false,
};

const AdminSEI = () => {
  const qc = useQueryClient();
  const [form, setForm] = useState<SEIForm>(empty);

  const { data, isLoading } = useQuery({
    queryKey: ["sei-config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("integracao_sei" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const handleSave = async () => {
    if (!form.url_servico || !form.sigla_sistema) {
      toast.error("URL do serviço e sigla do sistema são obrigatórios");
      return;
    }
    const { id, status_teste, ultimo_teste, ...payload } = form;
    const { error } = id
      ? await supabase.from("integracao_sei" as any).update(payload).eq("id", id)
      : await supabase.from("integracao_sei" as any).insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Configuração SEI salva");
    qc.invalidateQueries({ queryKey: ["sei-config"] });
  };

  const handleTest = async () => {
    toast.info("Teste de conexão SEI em execução…");
    setTimeout(async () => {
      const ok = !!form.url_servico;
      if (form.id) {
        await supabase.from("integracao_sei" as any).update({
          status_teste: ok ? "sucesso" : "falha",
          ultimo_teste: new Date().toISOString(),
        }).eq("id", form.id);
        qc.invalidateQueries({ queryKey: ["sei-config"] });
      }
      ok ? toast.success("Conexão SEI OK (simulado)") : toast.error("Falha na conexão SEI");
    }, 1200);
  };

  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando…</p>;

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Integração SEI"
        description="Conexão com Sistema Eletrônico de Informações (governo)"
        icon={<FileCode2 className="h-4 w-4" />}
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleTest}>
              <TestTube2 className="h-3.5 w-3.5 mr-1.5" /> Testar conexão
            </Button>
            <Button size="sm" onClick={handleSave}>
              <Save className="h-3.5 w-3.5 mr-1.5" /> Salvar
            </Button>
          </div>
        }
      />

      {form.status_teste && (
        <div className={`flex items-center gap-2 p-2 rounded-md text-xs border ${
          form.status_teste === "sucesso"
            ? "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400"
            : "bg-destructive/10 border-destructive/30 text-destructive"
        }`}>
          {form.status_teste === "sucesso" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
          <span>Último teste: {form.status_teste}</span>
          {form.ultimo_teste && <span className="text-muted-foreground">— {new Date(form.ultimo_teste).toLocaleString("pt-BR")}</span>}
        </div>
      )}

      <div className="border border-border rounded-lg p-4 bg-card space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <h3 className="text-sm font-semibold">Parâmetros do serviço</h3>
          <div className="flex items-center gap-2">
            <Badge variant={form.ativo ? "default" : "secondary"} className="text-[10px] h-5">
              {form.ativo ? "Habilitado" : "Desabilitado"}
            </Badge>
            <Switch checked={form.ativo} onCheckedChange={(v) => setForm({ ...form, ativo: v })} />
          </div>
        </div>

        <div>
          <Label className="text-xs">Nome de identificação</Label>
          <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
        </div>

        <div>
          <Label className="text-xs">URL do serviço SEI (WSDL/REST)</Label>
          <Input
            value={form.url_servico}
            onChange={(e) => setForm({ ...form, url_servico: e.target.value })}
            placeholder="https://sei.orgao.gov.br/sei/controlador_ws.php?servico=sei"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Sigla do sistema</Label>
            <Input
              value={form.sigla_sistema}
              onChange={(e) => setForm({ ...form, sigla_sistema: e.target.value })}
              placeholder="SINARV"
            />
          </div>
          <div>
            <Label className="text-xs">Identificação do serviço</Label>
            <Input
              value={form.identificacao_servico}
              onChange={(e) => setForm({ ...form, identificacao_servico: e.target.value })}
              placeholder="ID fornecido pelo SEI"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Unidade padrão</Label>
            <Input
              value={form.unidade_padrao}
              onChange={(e) => setForm({ ...form, unidade_padrao: e.target.value })}
              placeholder="Código numérico da unidade"
            />
          </div>
          <div>
            <Label className="text-xs">Tipo de processo padrão</Label>
            <Input
              value={form.tipo_processo_padrao}
              onChange={(e) => setForm({ ...form, tipo_processo_padrao: e.target.value })}
              placeholder="Ex.: 100000123"
            />
          </div>
        </div>

        <div className="text-[10px] text-muted-foreground border-t border-border pt-2 mt-2">
          O token de autenticação SEI deve ser cadastrado como segredo gerenciado pela plataforma — não armazenamos o valor em texto puro neste registro.
        </div>
      </div>
    </div>
  );
};

export default AdminSEI;
