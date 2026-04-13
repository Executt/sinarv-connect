import ModuleShell from "@/components/layout/ModuleShell";

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/ponto-coleta/dashboard": { title: "Dashboard do Ponto de Coleta", subtitle: "Volume arrecadado, capacidade e créditos fiscais" },
  "/ponto-coleta/novo-recebimento": { title: "Registrar Entrada", subtitle: "Pesagem e recebimento de material reciclável" },
  "/ponto-coleta/historico": { title: "Histórico e Despachos", subtitle: "Recebimentos recentes e envio para cooperativas" },
  "/ponto-coleta/metas": { title: "Metas de Cumprimento", subtitle: "Progresso das metas obrigatórias de reciclagem" },
  "/ponto-coleta/credenciamento": { title: "Credenciamento", subtitle: "Cadastro de novo ponto de coleta no SINARV" },
};

const PontoColetaLayout = () => (
  <ModuleShell pageTitles={pageTitles} defaultTitle="Ponto de Coleta" defaultSubtitle="Infraestrutura de Recebimento" />
);

export default PontoColetaLayout;
