import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, Shield, Database, Globe, Bell, Clock } from "lucide-react";

const PARAM_SECTIONS = [
  {
    titulo: "Regras de Negócio",
    icone: Settings,
    params: [
      { nome: "Peso mínimo por recebimento (kg)", valor: "0.5", tipo: "numérico" },
      { nome: "Peso máximo por recebimento (kg)", valor: "10000", tipo: "numérico" },
      { nome: "Tolerância de pesagem (%)", valor: "2", tipo: "numérico" },
      { nome: "Prazo validade recibo (dias)", valor: "90", tipo: "numérico" },
      { nome: "Materiais aceitos", valor: "PET, Vidro, Alumínio, Papelão, Metal, Plástico", tipo: "lista" },
    ],
  },
  {
    titulo: "Segurança e Autenticação",
    icone: Shield,
    params: [
      { nome: "Sessão máxima (horas)", valor: "8", tipo: "numérico" },
      { nome: "Tentativas máximas de login", valor: "5", tipo: "numérico" },
      { nome: "Bloqueio após falhas (min)", valor: "15", tipo: "numérico" },
      { nome: "Autenticação dois fatores", valor: "Desabilitado", tipo: "booleano" },
      { nome: "Política de senhas", valor: "Mínimo 8 caracteres, 1 maiúscula, 1 número", tipo: "texto" },
    ],
  },
  {
    titulo: "Base de Dados",
    icone: Database,
    params: [
      { nome: "Retenção de logs (dias)", valor: "365", tipo: "numérico" },
      { nome: "Backup automático", valor: "Diário — 03:00 UTC", tipo: "texto" },
      { nome: "Limite de registros por consulta", valor: "1000", tipo: "numérico" },
      { nome: "Schema principal", valor: "public", tipo: "texto" },
    ],
  },
  {
    titulo: "Notificações",
    icone: Bell,
    params: [
      { nome: "Alertas por e-mail", valor: "Ativado", tipo: "booleano" },
      { nome: "Nível mínimo de alerta", valor: "medium", tipo: "enum" },
      { nome: "Destinatários padrão", valor: "admin@sinarv.gov.br", tipo: "texto" },
      { nome: "Frequência de digest", valor: "Diário", tipo: "enum" },
    ],
  },
  {
    titulo: "Sincronização e APIs",
    icone: Globe,
    params: [
      { nome: "Intervalo padrão de sync (min)", valor: "60", tipo: "numérico" },
      { nome: "Timeout de requisição (seg)", valor: "30", tipo: "numérico" },
      { nome: "Retry máximo", valor: "3", tipo: "numérico" },
      { nome: "Rate limit (req/min)", valor: "100", tipo: "numérico" },
    ],
  },
  {
    titulo: "Agendamento",
    icone: Clock,
    params: [
      { nome: "Coleta seletiva — frequência padrão", valor: "3x/semana", tipo: "texto" },
      { nome: "Relatório PLANARES — envio", valor: "Mensal — dia 5", tipo: "texto" },
      { nome: "Auditoria automática — intervalo", valor: "Trimestral", tipo: "texto" },
    ],
  },
];

const AdminParametros = () => {
  return (
    <div className="space-y-4">
      <Card className="shadow-sm border-l-4 border-l-[hsl(var(--primary))]">
        <CardContent className="pt-4 pb-3">
          <p className="text-xs text-muted-foreground">
            Parâmetros globais do SINARV. Alterações aqui afetam o comportamento de todos os módulos.
            Para edição, acesse cada seção individualmente.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PARAM_SECTIONS.map((section) => (
          <Card key={section.titulo} className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <section.icone className="h-4 w-4 text-[hsl(var(--primary))]" />
                {section.titulo}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {section.params.map((p) => (
                  <div key={p.nome} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                    <span className="text-xs text-muted-foreground">{p.nome}</span>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="text-[9px]">{p.tipo}</Badge>
                      <span className="text-xs font-medium text-foreground">{p.valor}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminParametros;
