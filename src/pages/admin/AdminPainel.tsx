import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Box, MapPin, Plug, Users, Factory, Handshake,
  Building2, Activity, CheckCircle, XCircle, AlertTriangle,
} from "lucide-react";

const AdminPainel = () => {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [cont, loc, integ, coop, ind, profiles] = await Promise.all([
        supabase.from("contenedores").select("id", { count: "exact", head: true }),
        supabase.from("contenedor_localizacoes").select("id, status_operacional"),
        supabase.from("configuracoes_integracoes").select("id, status"),
        supabase.from("cooperativas").select("id", { count: "exact", head: true }),
        supabase.from("industrias").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
      ]);

      const locData = loc.data || [];
      const integData = integ.data || [];
      return {
        contenedores: cont.count || 0,
        localizacoes: locData.length,
        locAtivos: locData.filter((l) => l.status_operacional === "Ativo").length,
        locManutencao: locData.filter((l) => l.status_operacional === "Manutenção").length,
        locInativos: locData.filter((l) => l.status_operacional === "Inativo").length,
        integracoes: integData.length,
        integAtivas: integData.filter((i) => i.status === "ativo").length,
        cooperativas: coop.count || 0,
        industrias: ind.count || 0,
        usuarios: profiles.count || 0,
      };
    },
  });

  const s = stats || { contenedores: 0, localizacoes: 0, locAtivos: 0, locManutencao: 0, locInativos: 0, integracoes: 0, integAtivas: 0, cooperativas: 0, industrias: 0, usuarios: 0 };

  const cards = [
    { icon: Box, label: "Contenedores", value: s.contenedores, color: "text-blue-500" },
    { icon: MapPin, label: "Localizações", value: s.localizacoes, color: "text-green-500", sub: `${s.locAtivos} ativos` },
    { icon: Plug, label: "Integrações", value: s.integracoes, color: "text-purple-500", sub: `${s.integAtivas} ativas` },
    { icon: Users, label: "Usuários", value: s.usuarios, color: "text-orange-500" },
    { icon: Handshake, label: "Cooperativas", value: s.cooperativas, color: "text-teal-500" },
    { icon: Factory, label: "Indústrias", value: s.industrias, color: "text-indigo-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {cards.map((c) => (
          <Card key={c.label} className="shadow-sm">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-2">
                <c.icon className={`h-4 w-4 ${c.color}`} />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{c.label}</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{c.value}</p>
              {c.sub && <p className="text-[10px] text-muted-foreground">{c.sub}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[hsl(var(--primary))]" /> Status dos Ecopontos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between p-2 rounded-lg bg-green-50 border border-green-200">
              <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-600" /><span className="text-xs font-medium">Ativos</span></div>
              <Badge className="bg-green-600 text-[10px]">{s.locAtivos}</Badge>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-yellow-50 border border-yellow-200">
              <div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-yellow-600" /><span className="text-xs font-medium">Manutenção</span></div>
              <Badge className="bg-yellow-600 text-[10px]">{s.locManutencao}</Badge>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-red-50 border border-red-200">
              <div className="flex items-center gap-2"><XCircle className="h-4 w-4 text-red-600" /><span className="text-xs font-medium">Inativos</span></div>
              <Badge className="bg-red-600 text-[10px]">{s.locInativos}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4 text-[hsl(var(--primary))]" /> Módulos do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { mod: "Governo (Dashboard)", status: "Operacional" },
              { mod: "Cooperativa", status: "Operacional" },
              { mod: "Indústria", status: "Operacional" },
              { mod: "Ponto de Coleta", status: "Operacional" },
              { mod: "Administração", status: "Operacional" },
            ].map((m) => (
              <div key={m.mod} className="flex items-center justify-between p-2 rounded-lg border border-border">
                <span className="text-xs font-medium">{m.mod}</span>
                <Badge variant="default" className="text-[10px] gap-1"><CheckCircle className="h-2.5 w-2.5" />{m.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminPainel;
