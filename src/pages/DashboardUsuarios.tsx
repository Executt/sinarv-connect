import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, ShieldCheck, UserPlus, X, ClipboardList, Plus, Minus } from "lucide-react";

const ALL_ROLES = [
  { value: "gov", label: "Governo", color: "bg-primary text-primary-foreground" },
  { value: "cooperativa", label: "Cooperativa", color: "bg-accent text-accent-foreground" },
  { value: "industria", label: "Indústria", color: "bg-info text-info-foreground" },
  { value: "ponto_coleta", label: "Ponto de Coleta", color: "bg-success text-success-foreground" },
];

const roleLabels: Record<string, string> = {
  gov: "Governo",
  cooperativa: "Cooperativa",
  industria: "Indústria",
  ponto_coleta: "Ponto de Coleta",
};

interface AdminUser {
  id: string;
  email: string;
  display_name: string;
  created_at: string;
  roles: string[];
}

interface AuditLog {
  id: string;
  user_id: string;
  user_email: string;
  role: string;
  action: string;
  performed_by: string;
  performed_by_email: string;
  ip_address: string | null;
  performed_at: string;
}

const DashboardUsuarios = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;

  const getHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;
    return {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    };
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const headers = await getHeaders();
    if (!headers) return;

    const res = await fetch(`https://${projectId}.supabase.co/functions/v1/admin-users?action=list`, { headers });
    const json = await res.json();
    if (json.users) setUsers(json.users);
    else toast({ title: "Erro", description: json.error, variant: "destructive" });
    setLoading(false);
  }, [projectId, toast]);

  const fetchLogs = useCallback(async () => {
    setLogsLoading(true);
    const headers = await getHeaders();
    if (!headers) return;

    const res = await fetch(`https://${projectId}.supabase.co/functions/v1/admin-users?action=audit-logs`, { headers });
    const json = await res.json();
    if (json.logs) setLogs(json.logs);
    setLogsLoading(false);
  }, [projectId]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const toggleRole = async (userId: string, role: string, hasRole: boolean) => {
    setActionLoading(`${userId}-${role}`);
    const headers = await getHeaders();
    if (!headers) return;

    const res = await fetch(`https://${projectId}.supabase.co/functions/v1/admin-users`, {
      method: "POST",
      headers,
      body: JSON.stringify({ user_id: userId, role, action: hasRole ? "remove" : "add" }),
    });
    const json = await res.json();
    setActionLoading(null);

    if (json.success) {
      toast({ title: hasRole ? "Role removida" : "Role atribuída" });
      fetchUsers();
    } else {
      toast({ title: "Erro", description: json.error, variant: "destructive" });
    }
  };

  const filtered = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.display_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Tabs defaultValue="users" onValueChange={(v) => { if (v === "logs") fetchLogs(); }}>
        <TabsList>
          <TabsTrigger value="users" className="gap-1.5">
            <ShieldCheck className="h-4 w-4" /> Usuários
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-1.5">
            <ClipboardList className="h-4 w-4" /> Logs de Auditoria
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Gestão de Usuários e Perfis</CardTitle>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou e-mail..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Usuário</TableHead>
                        <TableHead className="hidden md:table-cell">E-mail</TableHead>
                        <TableHead className="hidden lg:table-cell">Cadastro</TableHead>
                        <TableHead>Perfis de Acesso</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map(user => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm text-foreground">{user.display_name || "—"}</p>
                              <p className="text-xs text-muted-foreground md:hidden">{user.email}</p>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{user.email}</TableCell>
                          <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                            {new Date(user.created_at).toLocaleDateString("pt-BR")}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1.5">
                              {ALL_ROLES.map(role => {
                                const hasRole = user.roles.includes(role.value);
                                const isLoading = actionLoading === `${user.id}-${role.value}`;
                                return (
                                  <button
                                    key={role.value}
                                    onClick={() => toggleRole(user.id, role.value, hasRole)}
                                    disabled={isLoading}
                                    className="group relative"
                                    title={hasRole ? `Remover ${role.label}` : `Atribuir ${role.label}`}
                                  >
                                    <Badge
                                      variant={hasRole ? "default" : "outline"}
                                      className={`text-[10px] cursor-pointer transition-all ${
                                        hasRole
                                          ? `${role.color} hover:opacity-80`
                                          : "text-muted-foreground hover:border-primary hover:text-primary"
                                      }`}
                                    >
                                      {isLoading ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                      ) : hasRole ? (
                                        <span className="flex items-center gap-1">
                                          {role.label}
                                          <X className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </span>
                                      ) : (
                                        <span className="flex items-center gap-1">
                                          <UserPlus className="h-3 w-3" />
                                          {role.label}
                                        </span>
                                      )}
                                    </Badge>
                                  </button>
                                );
                              })}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filtered.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                            Nenhum usuário encontrado
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-4">
                Total: {filtered.length} usuário(s) · Clique nos badges para atribuir ou remover perfis de acesso
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Logs de Alteração de Perfis</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : logs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhum log de auditoria registrado ainda.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data/Hora</TableHead>
                        <TableHead>Ação</TableHead>
                        <TableHead>Usuário Afetado</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead className="hidden md:table-cell">Executado por</TableHead>
                        <TableHead className="hidden lg:table-cell">IP</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map(log => (
                        <TableRow key={log.id}>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(log.performed_at).toLocaleString("pt-BR")}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={log.action === "add"
                                ? "text-success border-success/30 gap-1"
                                : "text-destructive border-destructive/30 gap-1"
                              }
                            >
                              {log.action === "add" ? <Plus className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                              {log.action === "add" ? "Adicionou" : "Removeu"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{log.user_email}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-[10px]">
                              {roleLabels[log.role] || log.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                            {log.performed_by_email}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-xs text-muted-foreground font-mono">
                            {log.ip_address || "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-4">
                Exibindo os últimos {logs.length} registros
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardUsuarios;
