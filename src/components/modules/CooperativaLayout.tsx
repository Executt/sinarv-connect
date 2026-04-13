import { Boxes, FileText, LayoutDashboard, TrendingUp } from "lucide-react";
import ModuleLayout from "@/components/modules/ModuleLayout";

const menuItems = [
  { title: "Painel", icon: LayoutDashboard, url: "/cooperativa/painel" },
  { title: "Lotes de Entrada", icon: Boxes, url: "/cooperativa/lotes-entrada" },
  { title: "Faturamento", icon: FileText, url: "/cooperativa/faturamento" },
];

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/cooperativa/painel": { title: "Painel da Cooperativa", subtitle: "Gestão de balanço de massa — Entrada x Saída" },
  "/cooperativa/lotes-entrada": { title: "Lotes de Entrada", subtitle: "Materiais recebidos de cidadãos e pontos de coleta" },
  "/cooperativa/faturamento": { title: "Faturamento", subtitle: "Notas fiscais de venda para indústrias" },
};

const CooperativaLayout = () => (
  <ModuleLayout
    title="Cooperativa"
    subtitle="Módulo de Intermediação"
    icon={TrendingUp}
    accentColor="bg-primary"
    menuItems={menuItems}
    pageTitles={pageTitles}
  />
);

export default CooperativaLayout;
