import ModuleShell from "@/components/layout/ModuleShell";

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/cooperativa/painel": { title: "Painel Operacional", subtitle: "Gestão de balanço de massa — Entrada x Saída" },
  "/cooperativa/recepcao": { title: "Recepção e Triagem", subtitle: "Registro de entrada de materiais na balança" },
  "/cooperativa/lotes-entrada": { title: "Lotes de Entrada", subtitle: "Materiais recebidos de cidadãos e pontos de coleta" },
  "/cooperativa/despacho": { title: "Despacho e Faturamento", subtitle: "Venda e envio de materiais para indústrias com rastreabilidade" },
  "/cooperativa/faturamento": { title: "Faturamento", subtitle: "Notas fiscais e receitas geradas" },
  "/cooperativa/cadastro": { title: "Cadastro e Conformidade", subtitle: "Catadores associados, licenças e documentação legal" },
};

const CooperativaLayout = () => (
  <ModuleShell pageTitles={pageTitles} defaultTitle="Cooperativa" defaultSubtitle="Módulo de Intermediação" />
);

export default CooperativaLayout;
