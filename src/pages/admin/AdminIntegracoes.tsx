import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Globe, Plug, Key, Clock, RefreshCw, Zap } from "lucide-react";

const AdminIntegracoes = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ nome: "", descricao: "", tipo: "api_rest", url_base: "", auth_type: "none", status: "inativo", intervalo_sync_min: "60", modulo: "ponto_coleta" });

  const { data: integracoes = [], isLoading } = useQuery({
    queryKey: ["admin-integracoes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("configuracoes_integracoes").select("*").order("created_at");
      if (error) throw error;
      return data;
    },
  });

  const upsert = useMutation({
    mutationFn: async () => {
      const payload = {
        nome: form.nome, descricao: form.descricao, tipo: form.tipo,
        url_base: form.url_base, auth_type: form.auth_type, status: form.status,
        intervalo_sync_min: parseInt(form.intervalo_sync_min) || 60, modulo: form.modulo,
      };
      if (editId) {
        const { error } = await supabase.from("configuracoes_integracoes").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("configuracoes_integracoes").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-integracoes"] });
      toast({ title: editId ? "Integração atualizada" : "Integração criada" });
      setOpen(false); resetForm();
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const resetForm = () => {
    setForm({ nome: "", descricao: "", tipo: "api_rest", url_base: "", auth_type: "none", status: "inativo", intervalo_sync_min: "60", modulo: "ponto_coleta" });
    setEditId(null);
  };

  const openEdit = (i: any) => {
    setEditId(i.id);
    setForm({
      nome: i.nome, descricao: i.descricao || "", tipo: i.tipo, url_base: i.url_base || "",
      auth_type: i.auth_type || "none", status: i.status || "inativo",
      intervalo_sync_min: i.intervalo_sync_min?.toString() || "60", modulo: i.modulo || "ponto_coleta",
    });
    setOpen(true);
  };

  const testConnection = async (integ: any) => {
    try {
      await fetch(integ.url_base, { method: "HEAD", mode: "no-cors" });
      toast({ title: "Conectividade OK", description: `${integ.nome} respondeu.` });
    } catch {
      toast({ title: "Falha", description: `Não foi possível alcançar ${integ.url_base}`, variant: "destructive" });
    }
  };

  const ativas = integracoes.filter((i: any) => i.status === "ativo").length;
  const modulos = [...new Set(integracoes.map((i: any) => i.modulo))];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Card className="shadow-sm"><CardContent className="pt-4 pb-3 text-center">
          <p className="text-2xl font-bold">{integracoes.length}</p><p className="text-[10px] text-muted-foreground">Total</p>
        </CardContent></Card>
        <Card className="shadow-sm"><CardContent className="pt-4 pb-3 text-center">
          <p className="text-2xl font-bold text-green-600">{ativas}</p><p className="text-[10px] text-muted-foreground">Ativas</p>
        </CardContent></Card>
        <Card className="shadow-sm"><CardContent className="pt-4 pb-3 text-center">
          <p className="text-2xl font-bold">{modulos.length}</p><p className="text-[10px] text-muted-foreground">Módulos</p>
        </CardContent></Card>
      </div>

      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">APIs externas e fontes de dados.</p>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Nova Integração</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editId ? "Editar" : "Nova"} Integração</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div><Label className="text-xs">Nome</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
              <div><Label className="text-xs">Descrição</Label><Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} rows={2} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Tipo</Label>
                  <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="api_rest">API REST</SelectItem>
                      <SelectItem value="webhook">Webhook</SelectItem>
                      <SelectItem value="referencia_web">Referência Web</SelectItem>
                      <SelectItem value="ftp">FTP/SFTP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs">Módulo</Label>
                  <Select value={form.modulo} onValueChange={(v) => setForm({ ...form, modulo: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ponto_coleta">Ponto de Coleta</SelectItem>
                      <SelectItem value="cooperativa">Cooperativa</SelectItem>
                      <SelectItem value="industria">Indústria</SelectItem>
                      <SelectItem value="gov">Governo</SelectItem>
                      <SelectItem value="admin">Administração</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label className="text-xs">URL Base</Label><Input value={form.url_base} onChange={(e) => setForm({ ...form, url_base: e.target.value })} /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label className="text-xs">Autenticação</Label>
                  <Select value={form.auth_type} onValueChange={(v) => setForm({ ...form, auth_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma</SelectItem>
                      <SelectItem value="api_key">API Key</SelectItem>
                      <SelectItem value="bearer">Bearer Token</SelectItem>
                      <SelectItem value="basic">Basic Auth</SelectItem>
                      <SelectItem value="oauth2">OAuth 2.0</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs">Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                      <SelectItem value="erro">Erro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs">Sync (min)</Label><Input type="number" value={form.intervalo_sync_min} onChange={(e) => setForm({ ...form, intervalo_sync_min: e.target.value })} /></div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => upsert.mutate()} disabled={!form.nome || !form.url_base || upsert.isPending}>
                {upsert.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">Carregando...</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {integracoes.map((i: any) => (
            <Card key={i.id} className="shadow-sm">
              <CardHeader className="pb-2 pt-4">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-sm flex items-center gap-2">
                    {i.tipo === "api_rest" ? <Globe className="h-4 w-4 text-[hsl(var(--primary))]" /> : i.tipo === "webhook" ? <Zap className="h-4 w-4 text-yellow-500" /> : <Plug className="h-4 w-4 text-muted-foreground" />}
                    {i.nome}
                  </CardTitle>
                  <Badge variant={i.status === "ativo" ? "default" : i.status === "erro" ? "destructive" : "secondary"} className="text-[10px]">{i.status}</Badge>
                </div>
                <CardDescription className="text-xs">{i.descricao}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex flex-wrap gap-1.5 text-[10px]">
                  <Badge variant="outline" className="gap-1"><Globe className="h-2.5 w-2.5" />{i.tipo}</Badge>
                  <Badge variant="outline" className="gap-1"><Key className="h-2.5 w-2.5" />{i.auth_type}</Badge>
                  <Badge variant="outline" className="gap-1"><Clock className="h-2.5 w-2.5" />{i.intervalo_sync_min}min</Badge>
                  <Badge variant="outline" className="gap-1">{i.modulo}</Badge>
                </div>
                <p className="text-[10px] text-muted-foreground font-mono truncate">{i.url_base}</p>
                <div className="flex gap-1.5 pt-1">
                  <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={() => testConnection(i)}><RefreshCw className="h-3 w-3" /> Testar</Button>
                  <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1" onClick={() => openEdit(i)}><Pencil className="h-3 w-3" /> Editar</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminIntegracoes;
