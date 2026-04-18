import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Webhook, Plus, Pencil, Trash2, Send, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

const EVENTOS_DISPONIVEIS = [
  "lote.criado", "lote.recebido", "lote.despachado",
  "transacao.criada", "transacao.concluida",
  "alerta.disparado", "auditoria.aberta",
  "usuario.criado", "iot.heartbeat",
];

interface WebhookForm {
  nome: string;
  descricao: string;
  url: string;
  metodo: string;
  eventos: string[];
  secret_token: string;
  ativo: boolean;
  retry_max: number;
  retry_delay_seg: number;
  timeout_seg: number;
}

const empty: WebhookForm = {
  nome: "", descricao: "", url: "", metodo: "POST",
  eventos: [], secret_token: "", ativo: true,
  retry_max: 3, retry_delay_seg: 60, timeout_seg: 30,
};

const AdminWebhooks = () => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<WebhookForm>(empty);

  const { data: webhooks = [], isLoading } = useQuery({
    queryKey: ["webhooks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("integracao_webhooks" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const handleSave = async () => {
    if (!form.nome || !form.url) {
      toast.error("Nome e URL são obrigatórios");
      return;
    }
    const payload = { ...form, eventos: form.eventos };
    const { error } = editing
      ? await supabase.from("integracao_webhooks" as any).update(payload).eq("id", editing)
      : await supabase.from("integracao_webhooks" as any).insert(payload);
    if (error) return toast.error(error.message);
    toast.success(editing ? "Webhook atualizado" : "Webhook criado");
    setOpen(false);
    setForm(empty);
    setEditing(null);
    qc.invalidateQueries({ queryKey: ["webhooks"] });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este webhook?")) return;
    const { error } = await supabase.from("integracao_webhooks" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Webhook removido");
    qc.invalidateQueries({ queryKey: ["webhooks"] });
  };

  const handleTest = (wh: any) => {
    toast.info(`Disparo de teste enviado para ${wh.url} (stub)`);
  };

  const openEdit = (wh: any) => {
    setEditing(wh.id);
    setForm({
      nome: wh.nome, descricao: wh.descricao, url: wh.url, metodo: wh.metodo,
      eventos: wh.eventos || [], secret_token: wh.secret_token || "", ativo: wh.ativo,
      retry_max: wh.retry_max, retry_delay_seg: wh.retry_delay_seg, timeout_seg: wh.timeout_seg,
    });
    setOpen(true);
  };

  const toggleEvento = (ev: string) => {
    setForm((f) => ({
      ...f,
      eventos: f.eventos.includes(ev) ? f.eventos.filter((e) => e !== ev) : [...f.eventos, ev],
    }));
  };

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Webhooks"
        description="Eventos de saída para sistemas externos com retry e log de envios"
        icon={<Webhook className="h-4 w-4" />}
        actions={
          <Button size="sm" onClick={() => { setEditing(null); setForm(empty); setOpen(true); }}>
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Novo webhook
          </Button>
        }
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : webhooks.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-lg">
          <Webhook className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">Nenhum webhook configurado</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {webhooks.map((wh) => (
            <div key={wh.id} className="border border-border rounded-lg p-3 bg-card">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-foreground">{wh.nome}</h3>
                    <Badge variant={wh.ativo ? "default" : "secondary"} className="text-[9px] h-4">
                      {wh.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                    <Badge variant="outline" className="text-[9px] h-4">{wh.metodo}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono truncate">{wh.url}</p>
                  {wh.descricao && <p className="text-xs text-muted-foreground mt-1">{wh.descricao}</p>}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(wh.eventos || []).map((ev: string) => (
                      <span key={ev} className="text-[10px] bg-secondary px-1.5 py-0.5 rounded">
                        {ev}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-3 mt-2 text-[10px] text-muted-foreground">
                    <span><Activity className="h-3 w-3 inline mr-0.5" /> {wh.total_envios} envios</span>
                    <span>{wh.total_falhas} falhas</span>
                    <span>retry: {wh.retry_max}x / {wh.retry_delay_seg}s</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleTest(wh)} title="Testar">
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(wh)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(wh.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar webhook" : "Novo webhook"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Nome</Label>
                <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Método</Label>
                <Select value={form.metodo} onValueChange={(v) => setForm({ ...form, metodo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="PATCH">PATCH</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">URL de destino</Label>
              <Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://exemplo.com/hook" />
            </div>
            <div>
              <Label className="text-xs">Descrição</Label>
              <Textarea rows={2} value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Eventos suscritos</Label>
              <div className="grid grid-cols-3 gap-1.5 mt-1">
                {EVENTOS_DISPONIVEIS.map((ev) => (
                  <label key={ev} className="flex items-center gap-1.5 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.eventos.includes(ev)}
                      onChange={() => toggleEvento(ev)}
                    />
                    <span className="font-mono text-[10px]">{ev}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs">Secret token (opcional)</Label>
              <Input type="password" value={form.secret_token} onChange={(e) => setForm({ ...form, secret_token: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Retry máx</Label>
                <Input type="number" value={form.retry_max} onChange={(e) => setForm({ ...form, retry_max: +e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Delay (s)</Label>
                <Input type="number" value={form.retry_delay_seg} onChange={(e) => setForm({ ...form, retry_delay_seg: +e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Timeout (s)</Label>
                <Input type="number" value={form.timeout_seg} onChange={(e) => setForm({ ...form, timeout_seg: +e.target.value })} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.ativo} onCheckedChange={(v) => setForm({ ...form, ativo: v })} />
              <Label className="text-xs">Ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminWebhooks;
