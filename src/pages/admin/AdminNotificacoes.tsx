import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Send, Plus, Pencil, Trash2, Mail, MessageSquare, Phone, Smartphone, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

const TIPOS = [
  { value: "smtp", label: "E-mail (SMTP)", icon: Mail },
  { value: "teams", label: "Microsoft Teams", icon: MessageSquare },
  { value: "sms", label: "SMS", icon: Phone },
  { value: "whatsapp", label: "WhatsApp Business", icon: Smartphone },
  { value: "telegram", label: "Telegram", icon: Send },
];

const tipoIcon = (t: string) => TIPOS.find((x) => x.value === t)?.icon || Send;
const tipoLabel = (t: string) => TIPOS.find((x) => x.value === t)?.label || t;

interface CanalForm {
  nome: string;
  tipo: string;
  descricao: string;
  config: string;
  ativo: boolean;
}

interface TemplateForm {
  nome: string;
  evento: string;
  canal_tipo: string;
  assunto: string;
  corpo: string;
  ativo: boolean;
}

const emptyCanal: CanalForm = { nome: "", tipo: "smtp", descricao: "", config: "{}", ativo: true };
const emptyTpl: TemplateForm = { nome: "", evento: "", canal_tipo: "smtp", assunto: "", corpo: "", ativo: true };

const AdminNotificacoes = () => {
  const qc = useQueryClient();
  const [tab, setTab] = useState("canais");

  // ── Canais ─────────────────────────────────────────────
  const [openCanal, setOpenCanal] = useState(false);
  const [editCanal, setEditCanal] = useState<string | null>(null);
  const [formCanal, setFormCanal] = useState<CanalForm>(emptyCanal);

  const { data: canais = [] } = useQuery({
    queryKey: ["notif-canais"],
    queryFn: async () => {
      const { data, error } = await supabase.from("notif_canais" as any).select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const saveCanal = async () => {
    if (!formCanal.nome || !formCanal.tipo) return toast.error("Nome e tipo são obrigatórios");
    let configJson;
    try { configJson = JSON.parse(formCanal.config || "{}"); } catch { return toast.error("Config deve ser JSON válido"); }
    const payload = { ...formCanal, config: configJson };
    const { error } = editCanal
      ? await supabase.from("notif_canais" as any).update(payload).eq("id", editCanal)
      : await supabase.from("notif_canais" as any).insert(payload);
    if (error) return toast.error(error.message);
    toast.success(editCanal ? "Canal atualizado" : "Canal criado");
    setOpenCanal(false); setFormCanal(emptyCanal); setEditCanal(null);
    qc.invalidateQueries({ queryKey: ["notif-canais"] });
  };

  const delCanal = async (id: string) => {
    if (!confirm("Excluir este canal?")) return;
    const { error } = await supabase.from("notif_canais" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Canal removido");
    qc.invalidateQueries({ queryKey: ["notif-canais"] });
  };

  const editCanalOpen = (c: any) => {
    setEditCanal(c.id);
    setFormCanal({ nome: c.nome, tipo: c.tipo, descricao: c.descricao, config: JSON.stringify(c.config || {}, null, 2), ativo: c.ativo });
    setOpenCanal(true);
  };

  // ── Templates ──────────────────────────────────────────
  const [openTpl, setOpenTpl] = useState(false);
  const [editTpl, setEditTpl] = useState<string | null>(null);
  const [formTpl, setFormTpl] = useState<TemplateForm>(emptyTpl);

  const { data: templates = [] } = useQuery({
    queryKey: ["notif-templates"],
    queryFn: async () => {
      const { data, error } = await supabase.from("notif_templates" as any).select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const saveTpl = async () => {
    if (!formTpl.nome || !formTpl.evento) return toast.error("Nome e evento são obrigatórios");
    const { error } = editTpl
      ? await supabase.from("notif_templates" as any).update(formTpl).eq("id", editTpl)
      : await supabase.from("notif_templates" as any).insert(formTpl);
    if (error) return toast.error(error.message);
    toast.success(editTpl ? "Template atualizado" : "Template criado");
    setOpenTpl(false); setFormTpl(emptyTpl); setEditTpl(null);
    qc.invalidateQueries({ queryKey: ["notif-templates"] });
  };

  const delTpl = async (id: string) => {
    if (!confirm("Excluir este template?")) return;
    const { error } = await supabase.from("notif_templates" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Template removido");
    qc.invalidateQueries({ queryKey: ["notif-templates"] });
  };

  const editTplOpen = (t: any) => {
    setEditTpl(t.id);
    setFormTpl({ nome: t.nome, evento: t.evento, canal_tipo: t.canal_tipo, assunto: t.assunto, corpo: t.corpo, ativo: t.ativo });
    setOpenTpl(true);
  };

  const placeholderConfig = (tipo: string) => {
    switch (tipo) {
      case "smtp": return '{\n  "host": "smtp.gmail.com",\n  "port": 587,\n  "user": "noreply@org.gov.br",\n  "from": "SINARV <noreply@org.gov.br>"\n}';
      case "teams": return '{\n  "webhook_url": "https://outlook.office.com/webhook/..."\n}';
      case "sms": return '{\n  "provider": "twilio",\n  "from_number": "+5511..."\n}';
      case "whatsapp": return '{\n  "phone_number_id": "...",\n  "business_account_id": "..."\n}';
      case "telegram": return '{\n  "bot_username": "@sinarv_bot",\n  "default_chat_id": "..."\n}';
      default: return "{}";
    }
  };

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Notificações"
        description="Canais multi-protocolo (SMTP, Teams, SMS, WhatsApp, Telegram) e templates por evento"
        icon={<Send className="h-4 w-4" />}
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="canais">Canais</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        {/* CANAIS */}
        <TabsContent value="canais" className="space-y-3 mt-3">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => { setEditCanal(null); setFormCanal(emptyCanal); setOpenCanal(true); }}>
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Novo canal
            </Button>
          </div>
          {canais.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border rounded-lg">
              <Send className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">Nenhum canal configurado</p>
            </div>
          ) : (
            <div className="grid gap-2">
              {canais.map((c) => {
                const Icon = tipoIcon(c.tipo);
                return (
                  <div key={c.id} className="border border-border rounded-lg p-3 bg-card flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      <div className="p-1.5 rounded-md bg-primary/10 text-primary mt-0.5">
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold">{c.nome}</h3>
                          <Badge variant="outline" className="text-[9px] h-4">{tipoLabel(c.tipo)}</Badge>
                          <Badge variant={c.ativo ? "default" : "secondary"} className="text-[9px] h-4">
                            {c.ativo ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                        {c.descricao && <p className="text-xs text-muted-foreground mt-0.5">{c.descricao}</p>}
                        <div className="flex gap-3 mt-1 text-[10px] text-muted-foreground">
                          <span>{c.total_envios} envios</span>
                          <span>{c.total_falhas} falhas</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => editCanalOpen(c)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => delCanal(c.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* TEMPLATES */}
        <TabsContent value="templates" className="space-y-3 mt-3">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => { setEditTpl(null); setFormTpl(emptyTpl); setOpenTpl(true); }}>
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Novo template
            </Button>
          </div>
          {templates.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border rounded-lg">
              <FileText className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">Nenhum template configurado</p>
            </div>
          ) : (
            <div className="grid gap-2">
              {templates.map((t) => (
                <div key={t.id} className="border border-border rounded-lg p-3 bg-card flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold">{t.nome}</h3>
                      <Badge variant="outline" className="text-[9px] h-4 font-mono">{t.evento}</Badge>
                      <Badge className="text-[9px] h-4">{tipoLabel(t.canal_tipo)}</Badge>
                    </div>
                    {t.assunto && <p className="text-xs text-foreground mt-1 font-medium">{t.assunto}</p>}
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{t.corpo}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => editTplOpen(t)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => delTpl(t.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* DIALOG CANAL */}
      <Dialog open={openCanal} onOpenChange={setOpenCanal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editCanal ? "Editar canal" : "Novo canal"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Nome</Label>
                <Input value={formCanal.nome} onChange={(e) => setFormCanal({ ...formCanal, nome: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Tipo</Label>
                <Select value={formCanal.tipo} onValueChange={(v) => setFormCanal({ ...formCanal, tipo: v, config: placeholderConfig(v) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIPOS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">Descrição</Label>
              <Input value={formCanal.descricao} onChange={(e) => setFormCanal({ ...formCanal, descricao: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Configuração (JSON)</Label>
              <Textarea
                rows={8}
                className="font-mono text-xs"
                value={formCanal.config}
                onChange={(e) => setFormCanal({ ...formCanal, config: e.target.value })}
                placeholder={placeholderConfig(formCanal.tipo)}
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Credenciais sensíveis (senhas, tokens) devem ser cadastradas como segredos gerenciados — referencie aqui apenas o nome.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={formCanal.ativo} onCheckedChange={(v) => setFormCanal({ ...formCanal, ativo: v })} />
              <Label className="text-xs">Ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setOpenCanal(false)}>Cancelar</Button>
            <Button size="sm" onClick={saveCanal}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG TEMPLATE */}
      <Dialog open={openTpl} onOpenChange={setOpenTpl}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editTpl ? "Editar template" : "Novo template"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Nome</Label>
                <Input value={formTpl.nome} onChange={(e) => setFormTpl({ ...formTpl, nome: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Canal</Label>
                <Select value={formTpl.canal_tipo} onValueChange={(v) => setFormTpl({ ...formTpl, canal_tipo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIPOS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">Evento (chave)</Label>
              <Input value={formTpl.evento} onChange={(e) => setFormTpl({ ...formTpl, evento: e.target.value })} placeholder="alerta.disparado" />
            </div>
            <div>
              <Label className="text-xs">Assunto</Label>
              <Input value={formTpl.assunto} onChange={(e) => setFormTpl({ ...formTpl, assunto: e.target.value })} placeholder="[SINARV] Novo alerta {{codigo}}" />
            </div>
            <div>
              <Label className="text-xs">Corpo</Label>
              <Textarea
                rows={6}
                value={formTpl.corpo}
                onChange={(e) => setFormTpl({ ...formTpl, corpo: e.target.value })}
                placeholder="Olá {{nome}}, foi disparado o alerta {{codigo}} no módulo {{modulo}}."
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Use placeholders no formato {`{{variavel}}`} — serão substituídos no momento do envio.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={formTpl.ativo} onCheckedChange={(v) => setFormTpl({ ...formTpl, ativo: v })} />
              <Label className="text-xs">Ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setOpenTpl(false)}>Cancelar</Button>
            <Button size="sm" onClick={saveTpl}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminNotificacoes;
