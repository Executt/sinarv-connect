import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { KeyRound, Save, PlugZap, RefreshCw, History } from "lucide-react";
import { toast } from "sonner";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

const defaults = {
  nome: "Servidor LDAP Principal",
  ativo: false,
  host: "",
  porta: 389,
  use_ssl: false,
  use_tls: true,
  bind_dn: "",
  base_dn: "",
  user_filter: "(objectClass=person)",
  group_filter: "(objectClass=group)",
  atributo_email: "mail",
  atributo_nome: "cn",
  atributo_login: "uid",
  atributo_grupo: "memberOf",
  mapeamento_grupos_raw: "{}",
  cadastro_automatico: false,
  intervalo_sync_min: 60,
};

const AdminLDAP = () => {
  const qc = useQueryClient();
  const [form, setForm] = useState<any>(defaults);
  const [configId, setConfigId] = useState<string | null>(null);

  const { data: config } = useQuery({
    queryKey: ["ldap-config"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ldap_config").select("*").order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: syncLogs = [] } = useQuery({
    queryKey: ["ldap-sync-log", configId],
    queryFn: async () => {
      const q = supabase.from("ldap_sync_log").select("*").order("iniciado_em", { ascending: false }).limit(20);
      const { data, error } = configId ? await q.eq("ldap_config_id", configId) : await q;
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (config) {
      setConfigId(config.id);
      setForm({
        ...defaults, ...config,
        mapeamento_grupos_raw: JSON.stringify(config.mapeamento_grupos || {}, null, 2),
      });
    }
  }, [config]);

  const save = useMutation({
    mutationFn: async () => {
      if (!form.host || !form.bind_dn || !form.base_dn) throw new Error("Host, Bind DN e Base DN são obrigatórios");
      let mapeamento_grupos: any;
      try { mapeamento_grupos = JSON.parse(form.mapeamento_grupos_raw || "{}"); }
      catch { throw new Error("Mapeamento de grupos: JSON inválido"); }

      const row = {
        nome: form.nome, ativo: form.ativo, host: form.host, porta: form.porta,
        use_ssl: form.use_ssl, use_tls: form.use_tls, bind_dn: form.bind_dn, base_dn: form.base_dn,
        user_filter: form.user_filter, group_filter: form.group_filter,
        atributo_email: form.atributo_email, atributo_nome: form.atributo_nome,
        atributo_login: form.atributo_login, atributo_grupo: form.atributo_grupo,
        mapeamento_grupos, cadastro_automatico: form.cadastro_automatico,
        intervalo_sync_min: form.intervalo_sync_min,
      };

      if (configId) {
        const { error } = await supabase.from("ldap_config").update(row).eq("id", configId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("ldap_config").insert(row).select().single();
        if (error) throw error;
        setConfigId(data.id);
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ldap-config"] }); toast.success("Configuração salva"); },
    onError: (e: any) => toast.error(e.message),
  });

  // Stub: testar e sincronizar
  const testar = () => {
    if (!form.host) { toast.error("Preencha o host primeiro"); return; }
    toast.info("Teste de conexão (stub)", { description: `Tentaria ${form.use_ssl ? "ldaps" : "ldap"}://${form.host}:${form.porta}` });
  };

  const sincronizar = useMutation({
    mutationFn: async () => {
      if (!configId) throw new Error("Salve a configuração primeiro");
      const { error } = await supabase.from("ldap_sync_log").insert({
        ldap_config_id: configId, status: "concluido",
        usuarios_criados: 0, usuarios_atualizados: 0, erros: 0,
        finalizado_em: new Date().toISOString(),
        mensagem: "Sincronização stub — execução real requer Edge Function dedicada com cliente LDAP",
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ldap-sync-log"] }); toast.success("Sincronização registrada (stub)"); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="LDAP / Active Directory"
        description="Configuração do servidor de diretório corporativo para autenticação e cadastro automático de usuários."
        icon={<KeyRound className="h-4 w-4" />}
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={testar}><PlugZap className="h-3.5 w-3.5 mr-1" />Testar</Button>
            <Button size="sm" variant="outline" onClick={() => sincronizar.mutate()} disabled={sincronizar.isPending}><RefreshCw className="h-3.5 w-3.5 mr-1" />Sincronizar</Button>
            <Button size="sm" onClick={() => save.mutate()} disabled={save.isPending}><Save className="h-3.5 w-3.5 mr-1" />Salvar</Button>
          </div>
        }
      />

      <Tabs defaultValue="config">
        <TabsList>
          <TabsTrigger value="config" className="text-xs">Configuração</TabsTrigger>
          <TabsTrigger value="atributos" className="text-xs">Atributos & Grupos</TabsTrigger>
          <TabsTrigger value="logs" className="text-xs gap-1"><History className="h-3 w-3" />Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="config">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs">Servidor & Autenticação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Nome da configuração</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
                <div className="flex items-end gap-2">
                  <div className="flex items-center gap-2 h-8"><Switch checked={form.ativo} onCheckedChange={(v) => setForm({ ...form, ativo: v })} /><Label className="text-xs">Ativo</Label></div>
                  <div className="flex items-center gap-2 h-8"><Switch checked={form.cadastro_automatico} onCheckedChange={(v) => setForm({ ...form, cadastro_automatico: v })} /><Label className="text-xs">Cadastro automático de usuários</Label></div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2"><Label className="text-xs">Host</Label><Input value={form.host} onChange={(e) => setForm({ ...form, host: e.target.value })} placeholder="ldap.empresa.gov.br" /></div>
                <div><Label className="text-xs">Porta</Label><Input type="number" value={form.porta} onChange={(e) => setForm({ ...form, porta: Number(e.target.value) })} /></div>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2"><Switch checked={form.use_ssl} onCheckedChange={(v) => setForm({ ...form, use_ssl: v })} /><Label className="text-xs">SSL (LDAPS)</Label></div>
                <div className="flex items-center gap-2"><Switch checked={form.use_tls} onCheckedChange={(v) => setForm({ ...form, use_tls: v })} /><Label className="text-xs">StartTLS</Label></div>
              </div>
              <div><Label className="text-xs">Bind DN</Label><Input value={form.bind_dn} onChange={(e) => setForm({ ...form, bind_dn: e.target.value })} placeholder="cn=svc-sinarv,ou=Services,dc=empresa,dc=gov,dc=br" /></div>
              <div><Label className="text-xs">Base DN</Label><Input value={form.base_dn} onChange={(e) => setForm({ ...form, base_dn: e.target.value })} placeholder="ou=Usuarios,dc=empresa,dc=gov,dc=br" /></div>
              <div><Label className="text-xs">Intervalo de sincronização (min)</Label><Input type="number" value={form.intervalo_sync_min} onChange={(e) => setForm({ ...form, intervalo_sync_min: Number(e.target.value) })} /></div>
              <p className="text-[10px] text-muted-foreground">⚠ A senha do bind DN deve ser armazenada como secret (próxima iteração com Edge Function).</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="atributos">
          <Card>
            <CardContent className="space-y-3 pt-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Filtro de usuários</Label><Input className="font-mono text-xs" value={form.user_filter} onChange={(e) => setForm({ ...form, user_filter: e.target.value })} /></div>
                <div><Label className="text-xs">Filtro de grupos</Label><Input className="font-mono text-xs" value={form.group_filter} onChange={(e) => setForm({ ...form, group_filter: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div><Label className="text-xs">Atributo email</Label><Input className="font-mono text-xs" value={form.atributo_email} onChange={(e) => setForm({ ...form, atributo_email: e.target.value })} /></div>
                <div><Label className="text-xs">Atributo nome</Label><Input className="font-mono text-xs" value={form.atributo_nome} onChange={(e) => setForm({ ...form, atributo_nome: e.target.value })} /></div>
                <div><Label className="text-xs">Atributo login</Label><Input className="font-mono text-xs" value={form.atributo_login} onChange={(e) => setForm({ ...form, atributo_login: e.target.value })} /></div>
                <div><Label className="text-xs">Atributo grupo</Label><Input className="font-mono text-xs" value={form.atributo_grupo} onChange={(e) => setForm({ ...form, atributo_grupo: e.target.value })} /></div>
              </div>
              <div>
                <Label className="text-xs">Mapeamento grupo LDAP → role do sistema (JSON)</Label>
                <Textarea rows={5} className="font-mono text-xs"
                  value={form.mapeamento_grupos_raw}
                  onChange={(e) => setForm({ ...form, mapeamento_grupos_raw: e.target.value })}
                  placeholder='{"CN=SINARV-Admins,OU=Groups,DC=...": "super_admin", "CN=SINARV-Gov,OU=Groups,DC=...": "gov"}' />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead className="text-xs">Iniciado</TableHead><TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Criados</TableHead><TableHead className="text-xs">Atualizados</TableHead>
                  <TableHead className="text-xs">Erros</TableHead><TableHead className="text-xs">Mensagem</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {syncLogs.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-6">Sem sincronizações registradas</TableCell></TableRow>}
                  {syncLogs.map((l: any) => (
                    <TableRow key={l.id}>
                      <TableCell className="text-[11px] tabular-nums">{new Date(l.iniciado_em).toLocaleString("pt-BR")}</TableCell>
                      <TableCell><Badge className={`text-[10px] ${l.status === "concluido" ? "bg-emerald-600" : l.status === "erro" ? "bg-red-600" : "bg-blue-600"}`}>{l.status}</Badge></TableCell>
                      <TableCell className="text-xs tabular-nums">{l.usuarios_criados}</TableCell>
                      <TableCell className="text-xs tabular-nums">{l.usuarios_atualizados}</TableCell>
                      <TableCell className="text-xs tabular-nums">{l.erros}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{l.mensagem || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminLDAP;
