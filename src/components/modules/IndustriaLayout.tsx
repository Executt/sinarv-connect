import { Factory, Award, LayoutDashboard, BarChart3 } from "lucide-react";
import ModuleLayout from "@/components/modules/ModuleLayout";

const menuItems = [
  { title: "Metas Logísticas", icon: BarChart3, url: "/industria/metas-logisticas" },
  { title: "Certificados", icon: Award, url: "/industria/certificados" },
];

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/industria/metas-logisticas": { title: "Metas de Logística Reversa", subtitle: "Acompanhamento do passivo ambiental e metas de compensação" },
  "/industria/certificados": { title: "Certificados", subtitle: "Gestão de Certificados de Logística Reversa oficiais" },
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
