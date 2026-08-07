import ModuleShell from "@/components/layout/ModuleShell";

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": { title: "Visão Geral", subtitle: "Painel de Telemetria Nacional — Dados em tempo real" },
  "/dashboard/rastreabilidade": { title: "Rastreabilidade", subtitle: "Cadeia de custódia e rastreio de materiais recicláveis" },
  "/dashboard/auditoria": { title: "Auditoria", subtitle: "Registos de conformidade e verificações do sistema" },
  "/dashboard/alertas": { title: "Alertas", subtitle: "Notificações, anomalias e eventos críticos" },
  "/dashboard/usuarios": { title: "Gestão de Usuários", subtitle: "Administração de perfis de acesso e permissões" },
  "/dashboard/benchmarks": { title: "Benchmarks Internacionais", subtitle: "Referências europeias de reciclagem — ARP-GAN / Bruxelas" },
  "/dashboard/lixoes": { title: "Mapa de Lixões", subtitle: "Acompanhamento de volume removido e correlação com reciclagem" },
  "/dashboard/sustentabilidade": { title: "Sustentabilidade Econômico-Financeira", subtitle: "Indicadores NR ANA nº 3/2022 e fatores de CO₂e por material" },
  "/dashboard/radar-rejeitos": { title: "Radar de Rejeitos", subtitle: "Telemetria em tempo real de cargas perigosas, hospitalares e químicas" },
  "/dashboard/residuos-criticos": { title: "Resíduos Críticos", subtitle: "Gestão de resíduos perigosos e hospitalares (RSS) — geradores, operadores e MTR" },
};

const DashboardLayout = () => (
  <ModuleShell pageTitles={pageTitles} defaultTitle="Visão Geral" defaultSubtitle="Painel Governamental" />
);

export default DashboardLayout;
