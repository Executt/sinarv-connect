import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Search } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

const ROLES = ["gov", "cooperativa", "industria", "ponto_coleta", "super_admin"];

const AdminUsuarios = () => {
  const [busca, setBusca] = useState("");
  const [roleFiltro, setRoleFiltro] = useState("all");

  const { data: profiles = [] } = useQuery({
    queryKey: ["admin-usuarios-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: roles = [] } = useQuery({
    queryKey: ["admin-usuarios-roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("*");
      if (error) throw error;
      return data;
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

  const linhas = profiles.map((p: any) => {
    const userRoles = roles.filter((r: any) => r.user_id === p.user_id).map((r: any) => r.role);
    const extra = extras.find((e: any) => e.user_id === p.user_id);
    return { ...p, roles: userRoles, extra };
  });

  const visiveis = linhas.filter((l: any) => {
    if (busca && !`${l.email} ${l.display_name}`.toLowerCase().includes(busca.toLowerCase())) return false;
    if (roleFiltro !== "all" && !l.roles.includes(roleFiltro)) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Usuários"
        description="Gestão de usuários da aplicação, roles atribuídas e dados extras de perfil."
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
            <SelectItem value="all">Todas as roles</SelectItem>
            {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
        <Badge variant="outline" className="text-[10px] ml-auto">{visiveis.length} de {linhas.length}</Badge>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead className="text-xs">Nome</TableHead><TableHead className="text-xs">Email</TableHead>
              <TableHead className="text-xs">Roles</TableHead><TableHead className="text-xs">Origem</TableHead>
              <TableHead className="text-xs">Status</TableHead><TableHead className="text-xs">Criado em</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {visiveis.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-6">Nenhum usuário</TableCell></TableRow>}
              {visiveis.map((u: any) => (
                <TableRow key={u.id}>
                  <TableCell className="text-xs font-medium">{u.display_name || "—"}</TableCell>
                  <TableCell className="text-xs">{u.email}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {u.roles.length === 0
                        ? <Badge variant="outline" className="text-[10px] text-muted-foreground">sem perfil</Badge>
                        : u.roles.map((r: string) => <Badge key={r} className="text-[10px]" variant="outline">{r}</Badge>)}
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px]">{u.extra?.origem_cadastro || "manual"}</Badge></TableCell>
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
        ℹ Atribuição de roles e bloqueios devem ser feitos via API admin (próxima iteração) — esta view é somente leitura.
      </p>
    </div>
  );
};

export default AdminUsuarios;
