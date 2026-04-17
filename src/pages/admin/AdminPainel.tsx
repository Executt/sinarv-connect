import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import {
  Box, MapPin, Plug, Users, Factory, Handshake, Activity,
  CheckCircle, XCircle, AlertTriangle, Bell, ShieldAlert,
  Radio, Database, Webhook, Server, FileWarning, ArrowRight,
} from "lucide-react";

const AdminPainel = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-painel-stats"],
    queryFn: async () => {
      const [
        cont, loc, integ, coop, ind, profiles, alertas, auditorias, lotes, transacoes,
      ] = await Promise.all([
        supabase.from("contenedores").select("id", { count: "exact", head: true }),
        supabase.from("contenedor_localizacoes").select("id, status_operacional, nivel_preenchimento"),
        supabase.from("configuracoes_integracoes").select("id, status, tipo, ultimo_sync"),
        supabase.from("cooperativas").select("id", { count: "exact", head: true }),
        supabase.from("industrias").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("alertas").select("id, severity, status"),
        supabase.from("auditorias").select("id, status"),
        supabase.from("lotes").select("id", { count: "exact", head: true }),
        supabase.from("transacoes").select("id", { count: "exact", head: true }),
      ]);

      const locData = loc.data || [];
      const integData = integ.data || [];
      const alertData = alertas.data || [];
      const audData = auditorias.data || [];

      const ecopontosTotal = locData.length;
      const ecopontosCheios = locData.filter((l) => (l.nivel_preenchimento ?? 0) >= 80).length;
      const nivelMedio = ecopontosTotal
        ? Math.round(locData.reduce((s, l) => s + (l.nivel_preenchimento ?? 0), 0) / ecopontosTotal)
        : 0;

      return {
        contenedores: cont.count || 0,
        ecopontosTotal,
        ecopontosAtivos: locData.filter((l) => l.status_operacional === "Ativo").length,
        ecopontosManutencao: locData.filter((l) => l.status_operacional === "Manutenção").length,
        ecopontosInativos: locData.filter((l) => l.status_operacional === "Inativo").length,
        ecopontosCheios,
        nivelMedio,
        integracoes: integData.length,
        integAtivas: integData.filter((i) => i.status === "ativo").length,
        integErro: integData.filter((i) => i.status === "erro").length,
        cooperativas: coop.count || 0,
        industrias: ind.count || 0,
        usuarios: profiles.count || 0,
        alertasAtivos: alertData.filter((a) => a.status === "active").length,
        alertasCriticos: alertData.filter((a) => a.severity === "critical" && a.status === "active").length,
        auditoriasPendentes: audData.filter((a) => a.status === "Pendente" || a.status === "Em Análise").length,
        lotes: lotes.count || 0,
        transacoes: transacoes.count || 0,
      };
    },
  });

  const s = stats || {
    contenedores: 0, ecopontosTotal: 0, ecopontosAtivos: 0, ecopontosManutencao: 0,
    ecopontosInativos: 0, ecopontosCheios: 0, nivelMedio: 0, integracoes: 0, integAtivas: 0,
    integErro: 0, cooperativas: 0, industrias: 0, usuarios: 0, alertasAtivos: 0,
    alertasCriticos: 0, auditoriasPendentes: 0, lotes: 0, transacoes: 0,
  };

  const kpis = [
    {
      icon: Users, label: "Usuários", value: s.usuarios,
      sub: `${s.cooperativas + s.industrias} entidades`, tone: "text-blue-600", bg: "bg-blue-50",
      to: "/admin/usuarios",
    },
    {
      icon: Plug, label: "Integrações Ativas", value: s.integAtivas,
      sub: `${s.integracoes} total · ${s.integErro} erro`, tone: "text-emerald-600", bg: "bg-emerald-50",
      to: "/admin/integracoes",
    },
    {
      icon: ShieldAlert, label: "Alertas Críticos", value: s.alertasCriticos,
      sub: `${s.alertasAtivos} alertas ativos`, tone: "text-red-600", bg: "bg-red-50",
      to: "/admin/logs",
    },
    {
      icon: Radio, label: "IoT Online", value: s.ecopontosAtivos,
      sub: `${s.ecopontosTotal} dispositivos`, tone: "text-purple-600", bg: "bg-purple-50",
      to: "/admin/iot-dispositivos",
    },
    {
      icon: FileWarning, label: "Auditorias Pendentes", value: s.auditoriasPendentes,
      sub: "Aguardando ação", tone: "text-amber-600", bg: "bg-amber-50",
      to: "/admin/logs",
    },
    {
      icon: Database, label: "Volume de Dados", value: s.lotes + s.transacoes,
      sub: `${s.lotes} lotes · ${s.transacoes} transações`, tone: "text-indigo-600", bg: "bg-indigo-50",
      to: "/admin/banco-dados",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Painel Administrativo</h2>
          <p className="text-xs text-muted-foreground">Visão consolidada do sistema SINARV</p>
        </div>
        <Badge variant="outline" className="text-[10px] gap-1">
          <Activity className="h-3 w-3 text-emerald-600" /> Sistema operacional
        </Badge>
      </div>

      {/* KPIs principais */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map((k) => (
          <Link key={k.label} to={k.to} className="group">
            <Card className="shadow-sm hover:shadow-md transition-all hover:border-primary/40 h-full">
              <CardContent className="pt-3 pb-3">
                <div className="flex items-start justify-between mb-2">
                  <div className={`p-1.5 rounded-md ${k.bg}`}>
                    <k.icon className={`h-3.5 w-3.5 ${k.tone}`} />
                  </div>
                  <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{k.label}</p>
                <p className="text-xl font-bold text-foreground mt-0.5 tabular-nums">
                  {isLoading ? "—" : k.value.toLocaleString("pt-BR")}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{k.sub}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Secundários */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Status Ecopontos */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs flex items-center gap-1.5 font-medium">
              <MapPin className="h-3.5 w-3.5 text-primary" /> Status dos Ecopontos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            <div className="flex items-center justify-between p-1.5 rounded-md bg-emerald-50 border border-emerald-100">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="h-3 w-3 text-emerald-600" />
                <span className="text-[11px] font-medium">Ativos</span>
              </div>
              <Badge className="bg-emerald-600 text-[10px] h-4 px-1.5">{s.ecopontosAtivos}</Badge>
            </div>
            <div className="flex items-center justify-between p-1.5 rounded-md bg-amber-50 border border-amber-100">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="h-3 w-3 text-amber-600" />
                <span className="text-[11px] font-medium">Manutenção</span>
              </div>
              <Badge className="bg-amber-600 text-[10px] h-4 px-1.5">{s.ecopontosManutencao}</Badge>
            </div>
            <div className="flex items-center justify-between p-1.5 rounded-md bg-red-50 border border-red-100">
              <div className="flex items-center gap-1.5">
                <XCircle className="h-3 w-3 text-red-600" />
                <span className="text-[11px] font-medium">Inativos</span>
              </div>
              <Badge className="bg-red-600 text-[10px] h-4 px-1.5">{s.ecopontosInativos}</Badge>
            </div>
            <div className="pt-1.5 border-t border-border space-y-1">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>Nível médio de preenchimento</span>
                <span className="font-semibold tabular-nums">{s.nivelMedio}%</span>
              </div>
              <Progress value={s.nivelMedio} className="h-1" />
              {s.ecopontosCheios > 0 && (
                <p className="text-[10px] text-amber-700">⚠ {s.ecopontosCheios} ecopontos acima de 80%</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Módulos do sistema */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs flex items-center gap-1.5 font-medium">
              <Server className="h-3.5 w-3.5 text-primary" /> Módulos do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {[
              { mod: "Governo", path: "/dashboard" },
              { mod: "Cooperativa", path: "/cooperativa" },
              { mod: "Indústria", path: "/industria" },
              { mod: "Ponto de Coleta", path: "/ponto-coleta" },
              { mod: "Administração", path: "/admin" },
            ].map((m) => (
              <Link key={m.mod} to={m.path}
                className="flex items-center justify-between p-1.5 rounded-md border border-border hover:bg-muted/50 transition-colors">
                <span className="text-[11px] font-medium">{m.mod}</span>
                <Badge variant="outline" className="text-[10px] h-4 px-1.5 gap-1 border-emerald-200 text-emerald-700">
                  <CheckCircle className="h-2 w-2" /> Online
                </Badge>
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Atalhos rápidos */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs flex items-center gap-1.5 font-medium">
              <Webhook className="h-3.5 w-3.5 text-primary" /> Acesso Rápido
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {[
              { icon: Webhook, label: "Webhooks", to: "/admin/webhooks" },
              { icon: Users, label: "Gestão de Usuários", to: "/admin/usuarios" },
              { icon: Plug, label: "Integração SEI", to: "/admin/sei" },
              { icon: Bell, label: "Notificações", to: "/admin/notificacoes" },
              { icon: Box, label: "Inventário IoT", to: "/admin/iot-dispositivos" },
            ].map((a) => (
              <Link key={a.label} to={a.to}
                className="flex items-center gap-2 p-1.5 rounded-md hover:bg-primary/5 transition-colors group">
                <a.icon className="h-3 w-3 text-muted-foreground group-hover:text-primary" />
                <span className="text-[11px] font-medium flex-1">{a.label}</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Entidades */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Handshake, label: "Cooperativas", value: s.cooperativas, tone: "text-teal-600" },
          { icon: Factory, label: "Indústrias", value: s.industrias, tone: "text-indigo-600" },
          { icon: Box, label: "Modelos Contenedores", value: s.contenedores, tone: "text-blue-600" },
          { icon: MapPin, label: "Localizações", value: s.ecopontosTotal, tone: "text-green-600" },
        ].map((e) => (
          <Card key={e.label} className="shadow-sm">
            <CardContent className="pt-3 pb-3 flex items-center gap-3">
              <e.icon className={`h-5 w-5 ${e.tone}`} />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{e.label}</p>
                <p className="text-lg font-bold tabular-nums">{e.value.toLocaleString("pt-BR")}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminPainel;
