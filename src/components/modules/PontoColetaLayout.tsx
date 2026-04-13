import { MapPin, LayoutDashboard, PlusCircle, Target } from "lucide-react";
import ModuleLayout from "@/components/modules/ModuleLayout";

const menuItems = [
  { title: "Dashboard", icon: LayoutDashboard, url: "/ponto-coleta/dashboard" },
  { title: "Novo Recebimento", icon: PlusCircle, url: "/ponto-coleta/novo-recebimento" },
  { title: "Metas", icon: Target, url: "/ponto-coleta/metas" },
];

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/ponto-coleta/dashboard": { title: "Dashboard do Ponto de Coleta", subtitle: "Resumo do volume arrecadado e créditos fiscais" },
  "/ponto-coleta/novo-recebimento": { title: "Novo Recebimento", subtitle: "Registar entrada manual de materiais recicláveis" },
  "/ponto-coleta/metas": { title: "Metas de Cumprimento", subtitle: "Progresso das metas obrigatórias de reciclagem" },
};

const PontoColetaLayout = () => (
  <ModuleLayout
    title="Ponto de Coleta"
    subtitle="Infraestrutura de Recebimento"
    icon={MapPin}
    accentColor="bg-success"
    menuItems={menuItems}
    pageTitles={pageTitles}
  />
);

export default PontoColetaLayout;
