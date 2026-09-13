import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Search, Plus, X, Loader2 } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/use-auth";

const ROLES = ["gov", "cooperativa", "industria", "ponto_coleta", "super_admin"] as const;
type Role = (typeof ROLES)[number];

interface AdminUser {
  id: string;
  email: string;
  display_name: string;
  created_at: string;
  roles: Role[];
}

const AdminUsuarios = () => {
  const [busca, setBusca] = useState("");
  const [roleFiltro, setRoleFiltro] = useState("all");
  const [novaRole, setNovaRole] = useState<Record<string, Role>>({});
  const { toast } = useToast();
  const qc = useQueryClient();
  const { isSuperAdmin } = useAuth();

  const { data: usuarios = [], isLoading, error } = useQuery({
    queryKey: ["admin-users-list"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("admin-users", { method: "GET" });
      if (error) throw error;
      return (data?.users ?? []) as AdminUser[];
    },
  });

  const { data: extras = [] } = useQuery({
    queryKey: ["admin-usuarios-extras"],
    queryFn: async () => {
      const { data, error } = await supabase.from("usuarios_perfis_extra").select("*");
      if (error) throw error;
      return data;
    },
  });

  const alterarRole = useMutation({
    mutationFn: async (vars: { user_id: string; role: Role; action: "add" | "remove" }) => {
      const { data, error } = await supabase.functions.invoke("admin-users", { body: vars });
      if (error) throw new Error(data?.error || error.message);
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (_d, vars) => {
      toast({ title: vars.action === "add" ? "Perfil atribuído" : "Perfil removido" });
      qc.invalidateQueries({ queryKey: ["admin-users-list"] });
    },
    onError: (e: any) => toast({ title: "Não foi possível alterar o perfil", description: e?.message, variant: "destructive" }),
  });

  const linhas = usuarios.map((u) => ({ ...u, extra: (extras as any[]).find((e) => e.user_id === u.id) }));

  const visiveis = linhas.filter((l) => {
    if (busca && !`${l.email} ${l.display_name}`.toLowerCase().includes(busca.toLowerCase())) return false;
    if (roleFiltro !== "all" && !l.roles.includes(roleFiltro as Role)) return false;
    return true;
  });

  const podeGerenciar = (r: Role) => isSuperAdmin || (r !== "gov" && r !== "super_admin");

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Usuários"
        description="Gestão de usuários da aplicação, atribuição de perfis de acesso e dados extras de cadastro."
        icon={<Users className="h-4 w-4" />}
      />

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
          <Input className="h-8 pl-7 text-xs" placeholder="Buscar por nome ou email…" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        <Select value={roleFiltro} onValueChange={setRoleFiltro}>
          <SelectTrigger className="h-8 w-44 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os perfis</SelectItem>
            {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
        <Badge variant="outline" className="text-[10px] ml-auto">{visiveis.length} de {linhas.length}</Badge>
      </div>

      {error && (
        <p className="text-xs text-destructive">Não foi possível carregar os usuários: {(error as any)?.message}</p>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead className="text-xs">Nome</TableHead><TableHead className="text-xs">Email</TableHead>
              <TableHead className="text-xs">Perfis</TableHead><TableHead className="text-xs">Atribuir</TableHead>
              <TableHead className="text-xs">Status</TableHead><TableHead className="text-xs">Criado em</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-6">Carregando…</TableCell></TableRow>}
              {!isLoading && visiveis.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-6">Nenhum usuário</TableCell></TableRow>}
              {visiveis.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="text-xs font-medium">{u.display_name || "—"}</TableCell>
                  <TableCell className="text-xs">{u.email}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {u.roles.length === 0
                        ? <Badge variant="outline" className="text-[10px] text-muted-foreground">sem perfil</Badge>
                        : u.roles.map((r) => (
                          <Badge key={r} variant="outline" className="text-[10px] gap-1 pr-1">
                            {r}
                            {podeGerenciar(r) && (
                              <button
                                type="button"
                                aria-label={`Remover perfil ${r}`}
                                className="rounded-sm hover:text-destructive"
                                disabled={alterarRole.isPending}
                                onClick={() => alterarRole.mutate({ user_id: u.id, role: r, action: "remove" })}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            )}
                          </Badge>
                        ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Select value={novaRole[u.id] ?? ""} onValueChange={(v) => setNovaRole((s) => ({ ...s, [u.id]: v as Role }))}>
                        <SelectTrigger className="h-7 w-32 text-[11px]"><SelectValue placeholder="perfil…" /></SelectTrigger>
                        <SelectContent>
                          {ROLES.filter((r) => !u.roles.includes(r) && podeGerenciar(r)).map((r) => (
                            <SelectItem key={r} value={r}>{r}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm" variant="outline" className="h-7 px-2"
                        disabled={!novaRole[u.id] || alterarRole.isPending}
                        onClick={() => {
                          const r = novaRole[u.id];
                          if (!r) return;
                          alterarRole.mutate({ user_id: u.id, role: r, action: "add" });
                          setNovaRole((s) => ({ ...s, [u.id]: undefined as any }));
                        }}
                      >
                        {alterarRole.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-[10px] ${u.extra?.ativo === false ? "bg-muted text-muted-foreground" : "bg-emerald-600"}`}>
                      {u.extra?.ativo === false ? "inativo" : "ativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[11px] text-muted-foreground tabular-nums">{new Date(u.created_at).toLocaleDateString("pt-BR")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <p className="text-[10px] text-muted-foreground">
        ℹ Perfis de governo e administração geral só podem ser atribuídos ou removidos por um administrador geral. Toda alteração fica registrada na trilha de auditoria.
      </p>
    </div>
  );
};

export default AdminUsuarios;
