import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database, Lock, Table as TableIcon } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

const TABELAS = [
  "alertas", "auditorias", "lotes", "transacoes", "cooperativas", "industrias",
  "contenedores", "contenedor_localizacoes", "configuracoes_integracoes",
  "indicadores_sustentabilidade", "benchmark_estados", "benchmark_municipios",
  "benchmark_selos", "profiles", "user_roles", "role_audit_logs", "admin_session_logs",
  "app_regras_negocio", "app_listas_suspensas", "app_acoes_automaticas",
  "app_logs_sistema", "iot_dispositivos_modelos", "iot_dispositivos_instancias",
  "entidades_perfis", "usuarios_perfis_extra", "ldap_config", "ldap_sync_log",
];

const AdminBancoDados = () => {
  const { data: contagens = [] } = useQuery({
    queryKey: ["admin-db-counts"],
    queryFn: async () => {
      const promises = TABELAS.map((t) =>
        supabase.from(t as any).select("id", { count: "exact", head: true })
          .then(({ count, error }) => ({ tabela: t, count: count ?? 0, error: error?.message })),
      );
      return await Promise.all(promises);
    },
  });

  const totalRegistros = contagens.reduce((s, c) => s + (c.count || 0), 0);

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Banco de Dados"
        description="Métricas read-only do PostgreSQL: tabelas, contagem de registros e visão de RLS."
        icon={<Database className="h-4 w-4" />}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="pt-3 pb-3">
          <p className="text-[10px] text-muted-foreground uppercase">Tabelas mapeadas</p>
          <p className="text-xl font-bold tabular-nums">{TABELAS.length}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-3 pb-3">
          <p className="text-[10px] text-muted-foreground uppercase">Total registros</p>
          <p className="text-xl font-bold tabular-nums">{totalRegistros.toLocaleString("pt-BR")}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-3 pb-3">
          <p className="text-[10px] text-muted-foreground uppercase">RLS</p>
          <p className="text-xl font-bold text-emerald-600">Ativo</p>
        </CardContent></Card>
        <Card><CardContent className="pt-3 pb-3">
          <p className="text-[10px] text-muted-foreground uppercase">Provider</p>
          <p className="text-xl font-bold">PostgreSQL</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs flex items-center gap-1.5">
            <TableIcon className="h-3.5 w-3.5 text-primary" /> Tabelas e contagens
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {contagens.map((c) => (
              <div key={c.tabela} className="flex items-center justify-between p-2 rounded-md border border-border hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-2 min-w-0">
                  <Lock className="h-3 w-3 text-emerald-600 shrink-0" />
                  <span className="text-xs font-mono truncate">{c.tabela}</span>
                </div>
                {c.error
                  ? <Badge variant="outline" className="text-[10px] text-destructive">erro</Badge>
                  : <Badge variant="outline" className="text-[10px] tabular-nums">{c.count.toLocaleString("pt-BR")}</Badge>}
              </div>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-3">
            Contagens obtidas via Supabase JS (count: exact). Modificações estruturais devem ser feitas via migrations.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminBancoDados;
