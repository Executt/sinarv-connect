import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserCog, Shield, ShieldCheck } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

const ROLES = [
  { name: "super_admin", label: "Super Administrador", desc: "Controle total do sistema, configurações e usuários", color: "bg-red-600", perms: ["admin.*", "system.*", "users.*"] },
  { name: "gov", label: "Governo", desc: "Visão consolidada, auditoria, benchmarks e supervisão", color: "bg-blue-600", perms: ["dashboard.*", "auditoria.read", "rastreabilidade.read", "benchmarks.read", "users.read"] },
  { name: "cooperativa", label: "Cooperativa", desc: "Operação de recepção, lotes, despacho e faturamento", color: "bg-teal-600", perms: ["cooperativa.*", "lotes.write", "despacho.write", "faturamento.write"] },
  { name: "industria", label: "Indústria", desc: "Metas, certificados, dashboard ESG e integração de dados", color: "bg-indigo-600", perms: ["industria.*", "metas.read", "certificados.read", "esg.read"] },
  { name: "ponto_coleta", label: "Ponto de Coleta", desc: "Recebimento, histórico, metas e configuração local", color: "bg-emerald-600", perms: ["ponto_coleta.*", "recebimento.write", "metas.read"] },
];

const AdminPerfisUsuario = () => (
  <div className="space-y-4">
    <AdminPageHeader
      title="Perfis de Usuário"
      description="Roles do sistema (mantidas em user_roles) e suas permissões granulares por módulo."
      icon={<UserCog className="h-4 w-4" />}
    />

    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {ROLES.map((r) => (
        <Card key={r.name} className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <div className={`p-1.5 rounded-md ${r.color}`}><Shield className="h-3.5 w-3.5 text-white" /></div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span>{r.label}</span>
                  <Badge variant="outline" className="text-[10px] font-mono">{r.name}</Badge>
                </div>
                <p className="text-[11px] text-muted-foreground font-normal mt-0.5">{r.desc}</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-1.5">Permissões</p>
            <div className="flex flex-wrap gap-1">
              {r.perms.map((p) => (
                <Badge key={p} variant="outline" className="text-[10px] font-mono gap-1">
                  <ShieldCheck className="h-2.5 w-2.5 text-emerald-600" />{p}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>

    <Card className="border-dashed">
      <CardContent className="pt-3 pb-3">
        <p className="text-xs text-muted-foreground">
          ℹ Roles definidas como enum <code className="font-mono">app_role</code> em PostgreSQL.
          Permissões granulares por módulo serão evoluídas em iteração futura conforme demanda.
        </p>
      </CardContent>
    </Card>
  </div>
);

export default AdminPerfisUsuario;
