import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollText, Search } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

const niveisCor: Record<string, string> = {
  error: "bg-red-600", warning: "bg-amber-600", info: "bg-blue-600", debug: "bg-muted text-muted-foreground",
};

const AdminLogs = () => {
  const [busca, setBusca] = useState("");
  const [nivel, setNivel] = useState("all");

  const { data: logsSistema = [] } = useQuery({
    queryKey: ["logs-sistema"],
    queryFn: async () => {
      const { data, error } = await supabase.from("app_logs_sistema").select("*").order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      return data;
    },
  });

  const { data: logsSessao = [] } = useQuery({
    queryKey: ["logs-sessao"],
    queryFn: async () => {
      const { data, error } = await supabase.from("admin_session_logs").select("*").order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      return data;
    },
  });

  const { data: logsRoles = [] } = useQuery({
    queryKey: ["logs-roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("role_audit_logs").select("*").order("performed_at", { ascending: false }).limit(200);
      if (error) throw error;
      return data;
    },
  });

  const filtrarSistema = logsSistema.filter((l: any) => {
    if (nivel !== "all" && l.nivel !== nivel) return false;
    if (busca && !`${l.modulo} ${l.acao} ${l.mensagem}`.toLowerCase().includes(busca.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Logs do Sistema"
        description="Visualizador unificado: eventos do sistema, sessões admin e auditoria de papéis."
        icon={<ScrollText className="h-4 w-4" />}
      />

      <Tabs defaultValue="sistema">
        <TabsList>
          <TabsTrigger value="sistema" className="text-xs">Sistema ({logsSistema.length})</TabsTrigger>
          <TabsTrigger value="sessao" className="text-xs">Sessões Admin ({logsSessao.length})</TabsTrigger>
          <TabsTrigger value="roles" className="text-xs">Auditoria Roles ({logsRoles.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="sistema" className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
              <Input className="h-8 pl-7 text-xs" placeholder="Buscar módulo, ação ou mensagem…" value={busca} onChange={(e) => setBusca(e.target.value)} />
            </div>
            <Select value={nivel} onValueChange={setNivel}>
              <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos níveis</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="debug">Debug</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead className="text-xs w-32">Quando</TableHead><TableHead className="text-xs w-20">Nível</TableHead>
                <TableHead className="text-xs">Módulo</TableHead><TableHead className="text-xs">Ação</TableHead>
                <TableHead className="text-xs">Mensagem</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {filtrarSistema.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-6">Nenhum log encontrado</TableCell></TableRow>}
                {filtrarSistema.map((l: any) => (
                  <TableRow key={l.id}>
                    <TableCell className="text-[11px] text-muted-foreground tabular-nums">{new Date(l.created_at).toLocaleString("pt-BR")}</TableCell>
                    <TableCell><Badge className={`text-[10px] ${niveisCor[l.nivel] || "bg-muted"}`}>{l.nivel}</Badge></TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{l.modulo}</Badge></TableCell>
                    <TableCell className="text-xs font-mono">{l.acao}</TableCell>
                    <TableCell className="text-xs">{l.mensagem}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="sessao">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead className="text-xs">Quando</TableHead><TableHead className="text-xs">Usuário</TableHead>
                <TableHead className="text-xs">Módulo</TableHead><TableHead className="text-xs">IP</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {logsSessao.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-xs text-muted-foreground py-6">Sem sessões registradas</TableCell></TableRow>}
                {logsSessao.map((l: any) => (
                  <TableRow key={l.id}>
                    <TableCell className="text-[11px] text-muted-foreground tabular-nums">{new Date(l.created_at).toLocaleString("pt-BR")}</TableCell>
                    <TableCell className="text-xs font-mono">{l.user_id?.slice(0, 8)}…</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{l.module_accessed}</Badge></TableCell>
                    <TableCell className="text-xs">{l.ip_address || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="roles">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead className="text-xs">Quando</TableHead><TableHead className="text-xs">Ação</TableHead>
                <TableHead className="text-xs">Role</TableHead><TableHead className="text-xs">Usuário</TableHead>
                <TableHead className="text-xs">Realizado por</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {logsRoles.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-6">Sem auditorias</TableCell></TableRow>}
                {logsRoles.map((l: any) => (
                  <TableRow key={l.id}>
                    <TableCell className="text-[11px] text-muted-foreground tabular-nums">{new Date(l.performed_at).toLocaleString("pt-BR")}</TableCell>
                    <TableCell><Badge className="text-[10px]">{l.action}</Badge></TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{l.role}</Badge></TableCell>
                    <TableCell className="text-xs font-mono">{l.user_id?.slice(0, 8)}…</TableCell>
                    <TableCell className="text-xs font-mono">{l.performed_by?.slice(0, 8)}…</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminLogs;
