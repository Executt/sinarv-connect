import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import {
  Settings, Plus, Pencil, MapPin, Box, Plug, RefreshCw,
  CheckCircle, XCircle, AlertTriangle, Globe, Key, Clock,
} from "lucide-react";

/* ── Contenedores ──────────────────────────────────── */

function ContenedoresTab() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ cor: "", nome: "", material: "", descricao: "", volumes: "", boas_praticas: "", icone: "Recycle" });
  const [editId, setEditId] = useState<string | null>(null);

  const { data: contenedores = [], isLoading } = useQuery({
    queryKey: ["contenedores-config"],
    queryFn: async () => {
      const { data, error } = await supabase.from("contenedores").select("*").order("created_at");
      if (error) throw error;
      return data;
    },
  });

  const upsert = useMutation({
    mutationFn: async () => {
      const payload = {
        cor: form.cor,
        nome: form.nome,
        material: form.material,
        descricao: form.descricao,
        volumes: form.volumes.split(",").map((v) => v.trim()).filter(Boolean),
        boas_praticas: form.boas_praticas.split("\n").map((v) => v.trim()).filter(Boolean),
        icone: form.icone,
      };
      if (editId) {
        const { error } = await supabase.from("contenedores").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("contenedores").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contenedores-config"] });
      toast({ title: editId ? "Contenedor atualizado" : "Contenedor criado" });
      setOpen(false);
      resetForm();
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const resetForm = () => {
    setForm({ cor: "", nome: "", material: "", descricao: "", volumes: "", boas_praticas: "", icone: "Recycle" });
    setEditId(null);
  };

  const openEdit = (c: any) => {
    setEditId(c.id);
    setForm({
      cor: c.cor, nome: c.nome, material: c.material, descricao: c.descricao,
      volumes: (c.volumes || []).join(", "),
      boas_praticas: (c.boas_praticas || []).join("\n"),
      icone: c.icone || "Recycle",
    });
    setOpen(true);
  };

  const COR_MAP: Record<string, string> = {
    blue: "bg-blue-500", yellow: "bg-yellow-400", green: "bg-green-600",
    orange: "bg-orange-500", gray: "bg-gray-600", red: "bg-red-500", purple: "bg-purple-500",
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">Gerencie os tipos de contenedores do catálogo SINARV.</p>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Novo Contenedor</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editId ? "Editar" : "Novo"} Contenedor</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Nome</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Contenedor Azul" /></div>
                <div><Label className="text-xs">Cor</Label>
                  <Select value={form.cor} onValueChange={(v) => setForm({ ...form, cor: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {Object.keys(COR_MAP).map((c) => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label className="text-xs">Material</Label><Input value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })} placeholder="PMC (Plástico / Metal / Cartonados)" /></div>
              <div><Label className="text-xs">Descrição</Label><Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} rows={2} /></div>
              <div><Label className="text-xs">Volumes (separados por vírgula)</Label><Input value={form.volumes} onChange={(e) => setForm({ ...form, volumes: e.target.value })} placeholder="240L, 660L, 1100L" /></div>
              <div><Label className="text-xs">Boas Práticas (uma por linha)</Label><Textarea value={form.boas_praticas} onChange={(e) => setForm({ ...form, boas_praticas: e.target.value })} rows={3} /></div>
            </div>
            <DialogFooter>
              <Button onClick={() => upsert.mutate()} disabled={!form.nome || !form.cor || !form.material || upsert.isPending}>
                {upsert.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs w-8">Cor</TableHead>
              <TableHead className="text-xs">Nome</TableHead>
              <TableHead className="text-xs">Material</TableHead>
              <TableHead className="text-xs hidden md:table-cell">Volumes</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contenedores.map((c: any) => (
              <TableRow key={c.id}>
                <TableCell><div className={`w-4 h-4 rounded-full ${COR_MAP[c.cor] || "bg-muted"}`} /></TableCell>
                <TableCell className="text-xs font-medium">{c.nome}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{c.material}</TableCell>
                <TableCell className="text-xs text-muted-foreground hidden md:table-cell">
                  {(c.volumes || []).map((v: string) => <Badge key={v} variant="outline" className="text-[10px] mr-1">{v}</Badge>)}
                </TableCell>
                <TableCell><Badge variant={c.ativo ? "default" : "secondary"} className="text-[10px]">{c.ativo ? "Ativo" : "Inativo"}</Badge></TableCell>
                <TableCell><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}><Pencil className="h-3.5 w-3.5" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

/* ── Localizações ──────────────────────────────────── */

function LocalizacoesTab() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ contenedor_id: "", nome_local: "", endereco: "", cidade: "", uf: "", latitude: "", longitude: "", capacidade_litros: "240", status_operacional: "Ativo" });
  const [editId, setEditId] = useState<string | null>(null);
  const [filtroUF, setFiltroUF] = useState("todas");

  const { data: contenedores = [] } = useQuery({
    queryKey: ["contenedores-select"],
    queryFn: async () => {
      const { data } = await supabase.from("contenedores").select("id, nome, cor");
      return data || [];
    },
  });

  const { data: localizacoes = [], isLoading } = useQuery({
    queryKey: ["localizacoes-config"],
    queryFn: async () => {
      const { data, error } = await supabase.from("contenedor_localizacoes").select("*, contenedores(nome, cor)").order("cidade");
      if (error) throw error;
      return data;
    },
  });

  const upsert = useMutation({
    mutationFn: async () => {
      const payload = {
        contenedor_id: form.contenedor_id,
        nome_local: form.nome_local,
        endereco: form.endereco,
        cidade: form.cidade,
        uf: form.uf.toUpperCase().slice(0, 2),
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
        capacidade_litros: parseInt(form.capacidade_litros) || 240,
        status_operacional: form.status_operacional,
      };
      if (editId) {
        const { error } = await supabase.from("contenedor_localizacoes").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("contenedor_localizacoes").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["localizacoes-config"] });
      toast({ title: editId ? "Localização atualizada" : "Localização criada" });
      setOpen(false);
      resetForm();
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const resetForm = () => {
    setForm({ contenedor_id: "", nome_local: "", endereco: "", cidade: "", uf: "", latitude: "", longitude: "", capacidade_litros: "240", status_operacional: "Ativo" });
    setEditId(null);
  };

  const openEdit = (l: any) => {
    setEditId(l.id);
    setForm({
      contenedor_id: l.contenedor_id, nome_local: l.nome_local, endereco: l.endereco || "",
      cidade: l.cidade, uf: l.uf, latitude: l.latitude?.toString() || "",
      longitude: l.longitude?.toString() || "", capacidade_litros: l.capacidade_litros?.toString() || "240",
      status_operacional: l.status_operacional || "Ativo",
    });
    setOpen(true);
  };

  const ufs = [...new Set(localizacoes.map((l: any) => l.uf))].sort();
  const filtered = filtroUF === "todas" ? localizacoes : localizacoes.filter((l: any) => l.uf === filtroUF);

  const COR_MAP: Record<string, string> = { blue: "bg-blue-500", yellow: "bg-yellow-400", green: "bg-green-600", orange: "bg-orange-500", gray: "bg-gray-600" };
  const STATUS_ICON: Record<string, any> = { Ativo: CheckCircle, Inativo: XCircle, Manutenção: AlertTriangle };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-2">
        <div className="flex items-center gap-2">
          <Select value={filtroUF} onValueChange={setFiltroUF}>
            <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas UFs</SelectItem>
              {ufs.map((u: string) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
            </SelectContent>
          </Select>
          <Badge variant="outline" className="text-[10px]">{filtered.length} pontos</Badge>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Nova Localização</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editId ? "Editar" : "Nova"} Localização</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div><Label className="text-xs">Contenedor</Label>
                <Select value={form.contenedor_id} onValueChange={(v) => setForm({ ...form, contenedor_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                  <SelectContent>
                    {contenedores.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Nome do Local</Label><Input value={form.nome_local} onChange={(e) => setForm({ ...form, nome_local: e.target.value })} placeholder="Ecoponto Centro" /></div>
                <div><Label className="text-xs">Status</Label>
                  <Select value={form.status_operacional} onValueChange={(v) => setForm({ ...form, status_operacional: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ativo">Ativo</SelectItem>
                      <SelectItem value="Inativo">Inativo</SelectItem>
                      <SelectItem value="Manutenção">Manutenção</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label className="text-xs">Endereço</Label><Input value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label className="text-xs">Cidade</Label><Input value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} /></div>
                <div><Label className="text-xs">UF</Label><Input value={form.uf} onChange={(e) => setForm({ ...form, uf: e.target.value })} maxLength={2} /></div>
                <div><Label className="text-xs">Capacidade (L)</Label><Input type="number" value={form.capacidade_litros} onChange={(e) => setForm({ ...form, capacidade_litros: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Latitude</Label><Input value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} placeholder="-23.5505" /></div>
                <div><Label className="text-xs">Longitude</Label><Input value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} placeholder="-46.6333" /></div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => upsert.mutate()} disabled={!form.contenedor_id || !form.nome_local || !form.cidade || !form.uf || upsert.isPending}>
                {upsert.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">Carregando...</p> : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs w-8">Tipo</TableHead>
              <TableHead className="text-xs">Local</TableHead>
              <TableHead className="text-xs hidden md:table-cell">Endereço</TableHead>
              <TableHead className="text-xs">Cidade/UF</TableHead>
              <TableHead className="text-xs hidden lg:table-cell">Capacidade</TableHead>
              <TableHead className="text-xs">Nível</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((l: any) => {
              const StatusIcon = STATUS_ICON[l.status_operacional] || CheckCircle;
              const cor = (l as any).contenedores?.cor;
              return (
                <TableRow key={l.id}>
                  <TableCell><div className={`w-4 h-4 rounded-full ${COR_MAP[cor] || "bg-muted"}`} /></TableCell>
                  <TableCell className="text-xs font-medium">{l.nome_local}</TableCell>
                  <TableCell className="text-xs text-muted-foreground hidden md:table-cell">{l.endereco}</TableCell>
                  <TableCell className="text-xs">{l.cidade}/{l.uf}</TableCell>
                  <TableCell className="text-xs hidden lg:table-cell">{l.capacidade_litros}L</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${l.nivel_preenchimento >= 80 ? "bg-red-500" : l.nivel_preenchimento >= 50 ? "bg-yellow-500" : "bg-green-500"}`} style={{ width: `${l.nivel_preenchimento}%` }} />
                      </div>
                      <span className="text-[10px] text-muted-foreground">{l.nivel_preenchimento}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={l.status_operacional === "Ativo" ? "default" : l.status_operacional === "Manutenção" ? "secondary" : "outline"} className="text-[10px] gap-1">
                      <StatusIcon className="h-2.5 w-2.5" />{l.status_operacional}
                    </Badge>
                  </TableCell>
                  <TableCell><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(l)}><Pencil className="h-3.5 w-3.5" /></Button></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

/* ── Integrações ───────────────────────────────────── */

function IntegracoesTab() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ nome: "", descricao: "", tipo: "api_rest", url_base: "", auth_type: "none", status: "inativo", intervalo_sync_min: "60", modulo: "ponto_coleta" });

  const { data: integracoes = [], isLoading } = useQuery({
    queryKey: ["integracoes-config"],
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
      queryClient.invalidateQueries({ queryKey: ["integracoes-config"] });
      toast({ title: editId ? "Integração atualizada" : "Integração criada" });
      setOpen(false);
      resetForm();
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
      const res = await fetch(integ.url_base, { method: "HEAD", mode: "no-cors" });
      toast({ title: "Conectividade OK", description: `${integ.nome} respondeu com sucesso.` });
    } catch {
      toast({ title: "Falha na conexão", description: `Não foi possível alcançar ${integ.url_base}`, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">APIs externas e fontes de dados conectadas ao SINARV.</p>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Nova Integração</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editId ? "Editar" : "Nova"} Integração</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div><Label className="text-xs">Nome</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="API IBGE" /></div>
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
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label className="text-xs">URL Base</Label><Input value={form.url_base} onChange={(e) => setForm({ ...form, url_base: e.target.value })} placeholder="https://api.example.com/v1" /></div>
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
                    {i.tipo === "api_rest" ? <Globe className="h-4 w-4 text-[hsl(var(--primary))]" /> : <Plug className="h-4 w-4 text-muted-foreground" />}
                    {i.nome}
                  </CardTitle>
                  <Badge variant={i.status === "ativo" ? "default" : i.status === "erro" ? "destructive" : "secondary"} className="text-[10px]">
                    {i.status}
                  </Badge>
                </div>
                <CardDescription className="text-xs">{i.descricao}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex flex-wrap gap-1.5 text-[10px]">
                  <Badge variant="outline" className="gap-1"><Globe className="h-2.5 w-2.5" />{i.tipo}</Badge>
                  <Badge variant="outline" className="gap-1"><Key className="h-2.5 w-2.5" />{i.auth_type}</Badge>
                  <Badge variant="outline" className="gap-1"><Clock className="h-2.5 w-2.5" />{i.intervalo_sync_min}min</Badge>
                </div>
                <p className="text-[10px] text-muted-foreground font-mono truncate">{i.url_base}</p>
                {i.ultimo_sync && <p className="text-[10px] text-muted-foreground">Último sync: {new Date(i.ultimo_sync).toLocaleString("pt-BR")}</p>}
                <div className="flex gap-1.5 pt-1">
                  <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={() => testConnection(i)}>
                    <RefreshCw className="h-3 w-3" /> Testar
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1" onClick={() => openEdit(i)}>
                    <Pencil className="h-3 w-3" /> Editar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Página Principal ──────────────────────────────── */

const PontoColetaConfiguracoes = () => {
  return (
    <div className="space-y-6">
      <Card className="shadow-sm border-l-4 border-l-[hsl(var(--primary))]">
        <CardContent className="pt-4 pb-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-[hsl(var(--primary)/0.1)]">
              <Settings className="h-5 w-5 text-[hsl(var(--primary))]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Configurações do Módulo — Ponto de Coleta</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Gerencie contenedores, localizações de ecopontos e integrações com APIs externas.
                Dados conectados dinamicamente ao catálogo de serviços ARP-GAN/SINARV.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="contenedores" className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="contenedores" className="text-xs gap-1.5"><Box className="h-3.5 w-3.5" /> Contenedores</TabsTrigger>
          <TabsTrigger value="localizacoes" className="text-xs gap-1.5"><MapPin className="h-3.5 w-3.5" /> Localizações</TabsTrigger>
          <TabsTrigger value="integracoes" className="text-xs gap-1.5"><Plug className="h-3.5 w-3.5" /> Integrações</TabsTrigger>
        </TabsList>

        <TabsContent value="contenedores" className="mt-4"><ContenedoresTab /></TabsContent>
        <TabsContent value="localizacoes" className="mt-4"><LocalizacoesTab /></TabsContent>
        <TabsContent value="integracoes" className="mt-4"><IntegracoesTab /></TabsContent>
      </Tabs>
    </div>
  );
};

export default PontoColetaConfiguracoes;
