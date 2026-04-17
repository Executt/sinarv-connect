import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Zap, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

const EVENTOS = ["lote.criado", "lote.atualizado", "alerta.disparado", "ecoponto.cheio", "auditoria.concluida", "usuario.criado"];
const ACOES = ["webhook", "notificacao", "email", "criar_alerta"];

const schema = z.object({
  nome: z.string().trim().min(1).max(120),
  descricao: z.string().max(500).optional().default(""),
  evento: z.string().min(1),
  acao_tipo: z.string().min(1),
  condicao_raw: z.string().optional().default("{}"),
  acao_config_raw: z.string().optional().default("{}"),
  ativo: z.boolean(),
});

const AdminAcoesAutomaticas = () => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    nome: "", descricao: "", evento: EVENTOS[0], acao_tipo: ACOES[0],
    condicao_raw: "{}", acao_config_raw: "{}", ativo: true,
  });

  const { data: acoes = [] } = useQuery({
    queryKey: ["admin-acoes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("app_acoes_automaticas").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const upsert = useMutation({
    mutationFn: async (payload: any) => {
      const parsed = schema.safeParse(payload);
      if (!parsed.success) throw new Error(parsed.error.issues[0].message);
      let condicao: any, acao_config: any;
      try { condicao = JSON.parse(parsed.data.condicao_raw || "{}"); }
      catch { throw new Error("Condição: JSON inválido"); }
      try { acao_config = JSON.parse(parsed.data.acao_config_raw || "{}"); }
      catch { throw new Error("Config da ação: JSON inválido"); }

      const row = {
        nome: parsed.data.nome, descricao: parsed.data.descricao, evento: parsed.data.evento,
        acao_tipo: parsed.data.acao_tipo, condicao, acao_config, ativo: parsed.data.ativo,
      };
      if (editing) {
        const { error } = await supabase.from("app_acoes_automaticas").update(row).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("app_acoes_automaticas").insert(row);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-acoes"] }); toast.success("Salvo"); setOpen(false); setEditing(null); },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("app_acoes_automaticas").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-acoes"] }); toast.success("Removida"); },
  });

  const openEdit = (r?: any) => {
    if (r) {
      setEditing(r);
      setForm({
        nome: r.nome, descricao: r.descricao, evento: r.evento, acao_tipo: r.acao_tipo,
        condicao_raw: JSON.stringify(r.condicao, null, 2),
        acao_config_raw: JSON.stringify(r.acao_config, null, 2),
        ativo: r.ativo,
      });
    } else {
      setEditing(null);
      setForm({ nome: "", descricao: "", evento: EVENTOS[0], acao_tipo: ACOES[0], condicao_raw: "{}", acao_config_raw: "{}", ativo: true });
    }
    setOpen(true);
  };

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Ações Automáticas"
        description="Builder de gatilhos: quando um evento ocorre, executar uma ação se a condição for satisfeita."
        icon={<Zap className="h-4 w-4" />}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm" onClick={() => openEdit()}><Plus className="h-3.5 w-3.5 mr-1" />Nova ação</Button></DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader><DialogTitle>{editing ? "Editar ação" : "Nova ação"}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label className="text-xs">Nome</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
                <div><Label className="text-xs">Descrição</Label><Textarea rows={2} value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Evento</Label>
                    <Select value={form.evento} onValueChange={(v) => setForm({ ...form, evento: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{EVENTOS.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Tipo de ação</Label>
                    <Select value={form.acao_tipo} onValueChange={(v) => setForm({ ...form, acao_tipo: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{ACOES.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div><Label className="text-xs">Condição (JSON)</Label><Textarea rows={3} className="font-mono text-xs" value={form.condicao_raw} onChange={(e) => setForm({ ...form, condicao_raw: e.target.value })} /></div>
                <div><Label className="text-xs">Configuração da ação (JSON)</Label><Textarea rows={3} className="font-mono text-xs" value={form.acao_config_raw} onChange={(e) => setForm({ ...form, acao_config_raw: e.target.value })} /></div>
                <div className="flex items-center gap-2"><Switch checked={form.ativo} onCheckedChange={(v) => setForm({ ...form, ativo: v })} /><Label className="text-xs">Ativa</Label></div>
              </div>
              <DialogFooter><Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancelar</Button><Button size="sm" onClick={() => upsert.mutate(form)} disabled={upsert.isPending}>Salvar</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead className="text-xs">Nome</TableHead><TableHead className="text-xs">Evento</TableHead>
              <TableHead className="text-xs">Ação</TableHead><TableHead className="text-xs">Execuções</TableHead>
              <TableHead className="text-xs">Status</TableHead><TableHead className="text-xs w-20"></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {acoes.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-6">Nenhuma ação configurada</TableCell></TableRow>}
              {acoes.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs font-medium">{r.nome}</TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px] font-mono">{r.evento}</Badge></TableCell>
                  <TableCell><Badge className="text-[10px] bg-primary/10 text-primary">{r.acao_tipo}</Badge></TableCell>
                  <TableCell className="text-xs tabular-nums">{r.total_execucoes}</TableCell>
                  <TableCell><Badge className={`text-[10px] ${r.ativo ? "bg-emerald-600" : "bg-muted text-muted-foreground"}`}>{r.ativo ? "ativa" : "inativa"}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => openEdit(r)}><Pencil className="h-3 w-3" /></Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => { if (confirm("Remover?")) remove.mutate(r.id); }}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAcoesAutomaticas;
