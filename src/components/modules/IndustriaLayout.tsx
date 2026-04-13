import ModuleShell from "@/components/layout/ModuleShell";

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/industria/dashboard": { title: "Dashboard Executivo ESG", subtitle: "Visão consolidada de metas PNRS, volumes e emissões evitadas" },
  "/industria/metas-logisticas": { title: "Metas de Logística Reversa", subtitle: "Acompanhamento do passivo ambiental e metas de compensação" },
  "/industria/integracao": { title: "Integração e Ingestão de Dados", subtitle: "Gestão de API Keys, staging area de lotes e logs de sincronização" },
  "/industria/certificados": { title: "Certificados", subtitle: "Gestão de Certificados de Logística Reversa oficiais" },
  "/industria/cadastro": { title: "Cadastro e Conformidade", subtitle: "Indústrias credenciadas, CNAE e passivo ambiental" },
};

const IndustriaLayout = () => (
  <ModuleShell pageTitles={pageTitles} defaultTitle="Indústria" defaultSubtitle="Economia Circular" />
);

export default IndustriaLayout;
