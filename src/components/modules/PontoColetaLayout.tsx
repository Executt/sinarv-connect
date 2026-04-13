import { MapPin, LayoutDashboard, PlusCircle, Target, ClipboardList, Building2 } from "lucide-react";
import ModuleLayout from "@/components/modules/ModuleLayout";

const menuItems = [
  { title: "Dashboard", icon: LayoutDashboard, url: "/ponto-coleta/dashboard" },
  { title: "Nova Entrada", icon: PlusCircle, url: "/ponto-coleta/novo-recebimento" },
  { title: "Histórico", icon: ClipboardList, url: "/ponto-coleta/historico" },
  { title: "Metas", icon: Target, url: "/ponto-coleta/metas" },
  { title: "Credenciamento", icon: Building2, url: "/ponto-coleta/credenciamento" },
];

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/ponto-coleta/dashboard": { title: "Dashboard do Ponto de Coleta", subtitle: "Volume arrecadado, capacidade e créditos fiscais" },
  "/ponto-coleta/novo-recebimento": { title: "Registrar Entrada", subtitle: "Pesagem e recebimento de material reciclável" },
  "/ponto-coleta/historico": { title: "Histórico e Despachos", subtitle: "Recebimentos recentes e envio para cooperativas" },
  "/ponto-coleta/metas": { title: "Metas de Cumprimento", subtitle: "Progresso das metas obrigatórias de reciclagem" },
  "/ponto-coleta/credenciamento": { title: "Credenciamento", subtitle: "Cadastro de novo ponto de coleta no SINARV" },
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
