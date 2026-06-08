import ModuleShell from "@/components/layout/ModuleShell";

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  // Sistema
  "/admin/painel": { title: "Painel Administrativo", subtitle: "Visão geral do sistema e métricas operacionais" },
  "/admin/regras-negocio": { title: "Regras de Negócio", subtitle: "Parâmetros configuráveis e validações da aplicação" },
  "/admin/banco-dados": { title: "Banco de Dados", subtitle: "Métricas, conexões e manutenção" },
  "/admin/logs": { title: "Logs do Sistema", subtitle: "Auditoria, sessões e eventos críticos" },
  "/admin/parametros": { title: "Parâmetros do Sistema", subtitle: "Configurações gerais legadas" },

  // Identidade & Acesso
  "/admin/usuarios": { title: "Usuários", subtitle: "Cadastro, atribuições e bloqueios" },
  "/admin/perfis-usuario": { title: "Perfis de Usuário", subtitle: "Roles e permissões granulares" },
  "/admin/perfis-entidade": { title: "Perfis de Entidade", subtitle: "Templates por cooperativa, indústria e ponto de coleta" },
  "/admin/ldap": { title: "Integração LDAP / AD", subtitle: "Diretório corporativo e cadastro automático" },

  // Integrações
  "/admin/webhooks": { title: "Webhooks", subtitle: "Eventos enviados para sistemas externos" },
  "/admin/sei": { title: "SEI", subtitle: "Sistema Eletrônico de Informações" },
  "/admin/notificacoes": { title: "Notificações", subtitle: "SMTP, Teams, SMS, WhatsApp e Telegram" },
  "/admin/integracoes": { title: "Integrações Externas", subtitle: "APIs, conectores e credenciais" },

  // Operacional
  "/admin/contenedores": { title: "Contenedores", subtitle: "Catálogo de contenedores e materiais" },
  "/admin/localizacoes": { title: "Localizações", subtitle: "Ecopontos, mapa interativo e geolocalização" },
  "/admin/iot": { title: "Inventário IoT", subtitle: "Modelos de dispositivos e instâncias instaladas" },
  "/admin/listas": { title: "Listas Suspensas", subtitle: "Catálogos de opções reutilizáveis" },
  "/admin/acoes-automaticas": { title: "Ações Automáticas", subtitle: "Gatilhos, condições e ações" },

  // IA & Agentes
  "/admin/ia/modelos": { title: "Modelos LLM", subtitle: "Modelos free, pagos e treinados" },
  "/admin/ia/mcp": { title: "Servidores MCP", subtitle: "Model Context Protocol — conectores" },
  "/admin/ia/base-conhecimento": { title: "Base de Conhecimento", subtitle: "Documentos e fontes para RAG" },
  "/admin/ia/skills": { title: "Skills", subtitle: "Catálogo de ferramentas disponíveis aos agentes" },
  "/admin/ia/agentes": { title: "Agentes de IA", subtitle: "Configuração de agentes com modelo, prompt, base e skills" },
  "/admin/ia/tokens": { title: "Tokens de Provedores", subtitle: "Referências a API keys no cofre de segredos" },
  "/admin/ia/cotas": { title: "Cotas de Tokens", subtitle: "Limites mensais de consumo por usuário" },
  "/admin/ia/consumo": { title: "Consumo de IA", subtitle: "Log de chamadas, tokens e custo estimado" },
};

const AdminLayout = () => (
  <ModuleShell
    pageTitles={pageTitles}
    defaultTitle="Administração"
    defaultSubtitle="Parametrização e configurações do SINARV"
  />
);

export default AdminLayout;
