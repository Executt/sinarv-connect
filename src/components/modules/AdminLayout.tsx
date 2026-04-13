import ModuleShell from "@/components/layout/ModuleShell";

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/admin/painel": { title: "Painel Administrativo", subtitle: "Visão geral do sistema e métricas operacionais" },
  "/admin/contenedores": { title: "Gestão de Contenedores", subtitle: "Catálogo de contenedores e tipos de materiais" },
  "/admin/localizacoes": { title: "Gestão de Localizações", subtitle: "Ecopontos, mapa interativo e geolocalização" },
  "/admin/integracoes": { title: "Integrações Externas", subtitle: "APIs, webhooks e fontes de dados conectadas" },
  "/admin/parametros": { title: "Parâmetros do Sistema", subtitle: "Configurações gerais e regras de negócio" },
};

const AdminLayout = () => (
  <ModuleShell pageTitles={pageTitles} defaultTitle="Administração" defaultSubtitle="Parametrização e configurações do SINARV" />
);

export default AdminLayout;
