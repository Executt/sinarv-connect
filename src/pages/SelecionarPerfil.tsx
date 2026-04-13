import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Recycle, Building2, Factory, MapPin, Landmark } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

const roles = [
  { role: "gov" as const, label: "Governo / Gestor", icon: Landmark, desc: "Dashboard de telemetria, auditoria e metas Planares", path: "/dashboard", color: "text-primary" },
  { role: "cooperativa" as const, label: "Cooperativa", icon: Building2, desc: "Gestão de lotes, balanço de massa e faturamento", path: "/cooperativa/painel", color: "text-accent" },
  { role: "industria" as const, label: "Indústria", icon: Factory, desc: "Metas de logística reversa e certificados", path: "/industria/metas-logisticas", color: "text-accent" },
  { role: "ponto_coleta" as const, label: "Ponto de Coleta", icon: MapPin, desc: "Recebimento de materiais e metas de reciclagem", path: "/ponto-coleta/dashboard", color: "text-success" },
];

const SelecionarPerfil = () => {
  const { user, roles: userRoles, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [loading, user, navigate]);

  // If user already has roles, redirect to first role's path
  useEffect(() => {
    if (!loading && userRoles.length > 0) {
      const match = roles.find(r => userRoles.includes(r.role));
      if (match) navigate(match.path, { replace: true });
    }
  }, [loading, userRoles, navigate]);

  const selectRole = async (role: typeof roles[number]) => {
    if (!user) return;
    const { error } = await supabase.from("user_roles").insert({ user_id: user.id, role: role.role });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Perfil definido!", description: `Acesso como ${role.label} ativado.` });
    // Force reload to refresh roles
    window.location.href = role.path;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Recycle className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-primary">SINARV</h1>
          </div>
          <p className="text-muted-foreground">Selecione seu perfil de acesso</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {roles.map((r) => (
            <Card key={r.role} className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all" onClick={() => selectRole(r)}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <r.icon className={`h-6 w-6 ${r.color}`} />
                  <CardTitle className="text-lg">{r.label}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{r.desc}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SelecionarPerfil;
