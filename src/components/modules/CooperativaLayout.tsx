import { Boxes, FileText, LayoutDashboard, TrendingUp, Scale, Truck, Users } from "lucide-react";
import ModuleLayout from "@/components/modules/ModuleLayout";

const menuItems = [
  { title: "Painel", icon: LayoutDashboard, url: "/cooperativa/painel" },
  { title: "Recepção / Triagem", icon: Scale, url: "/cooperativa/recepcao" },
  { title: "Lotes de Entrada", icon: Boxes, url: "/cooperativa/lotes-entrada" },
  { title: "Despacho / Faturamento", icon: Truck, url: "/cooperativa/despacho" },
  { title: "Cadastro e Conformidade", icon: Users, url: "/cooperativa/cadastro" },
];

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/cooperativa/painel": { title: "Painel Operacional", subtitle: "Gestão de balanço de massa — Entrada x Saída" },
  "/cooperativa/recepcao": { title: "Recepção e Triagem", subtitle: "Registro de entrada de materiais na balança" },
  "/cooperativa/lotes-entrada": { title: "Lotes de Entrada", subtitle: "Materiais recebidos de cidadãos e pontos de coleta" },
  "/cooperativa/despacho": { title: "Despacho e Faturamento", subtitle: "Venda e envio de materiais para indústrias com rastreabilidade" },
  "/cooperativa/cadastro": { title: "Cadastro e Conformidade", subtitle: "Catadores associados, licenças e documentação legal" },
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
