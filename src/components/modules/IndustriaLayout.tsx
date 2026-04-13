import { Factory, Award, LayoutDashboard, BarChart3, Link2, Building2 } from "lucide-react";
import ModuleLayout from "@/components/modules/ModuleLayout";

const menuItems = [
  { title: "Dashboard ESG", icon: LayoutDashboard, url: "/industria/dashboard" },
  { title: "Metas Logísticas", icon: BarChart3, url: "/industria/metas-logisticas" },
  { title: "Integração / API", icon: Link2, url: "/industria/integracao" },
  { title: "Certificados", icon: Award, url: "/industria/certificados" },
  { title: "Cadastro", icon: Building2, url: "/industria/cadastro" },
];

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/industria/dashboard": { title: "Dashboard Executivo ESG", subtitle: "Visão consolidada de metas PNRS, volumes e emissões evitadas" },
  "/industria/metas-logisticas": { title: "Metas de Logística Reversa", subtitle: "Acompanhamento do passivo ambiental e metas de compensação" },
  "/industria/integracao": { title: "Integração e Ingestão de Dados", subtitle: "Gestão de API Keys, staging area de lotes e logs de sincronização" },
  "/industria/certificados": { title: "Certificados", subtitle: "Gestão de Certificados de Logística Reversa oficiais" },
  "/industria/cadastro": { title: "Cadastro e Conformidade", subtitle: "Indústrias credenciadas, CNAE e passivo ambiental" },
};

const IndustriaLayout = () => (
  <ModuleLayout
    title="Indústria"
    subtitle="Economia Circular"
    icon={Factory}
    accentColor="bg-accent"
    menuItems={menuItems}
    pageTitles={pageTitles}
  />
);

export default IndustriaLayout;
