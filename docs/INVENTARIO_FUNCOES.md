# Inventário de Funções — SINARV

> Catálogo de todas as funcionalidades por módulo e papel.

## 1. Portal Público (sem autenticação)

| Função | Rota | Componente |
|--------|------|------------|
| Página inicial institucional | `/` | `Index` + `HeroSection` + `QuickAccessCards` + `SustainabilityIndicators` |
| Login / Cadastro | `/auth` | `Auth` |
| Reset de senha | `/reset-password` | `ResetPassword` |
| Mapa de Reciclagem (transparência) | `/transparencia/mapa-reciclagem` | `TransparenciaMapaReciclagem` |
| Seleção de perfil pós-login | `/selecionar-perfil` | `SelecionarPerfil` |

## 2. Módulo Governo (`gov`)

Rota base `/dashboard`.

| Função | Rota | Descrição |
|--------|------|-----------|
| Visão Geral | `/` | KPIs nacionais, gráficos, métricas PLANARES |
| Rastreabilidade | `/rastreabilidade` | Ciclo de vida de lotes, fluxo origem→destino |
| Auditoria | `/auditoria` | Auditorias periódicas, conformidade, infrações |
| Alertas | `/alertas` | Alertas operacionais classificados por severidade |
| Usuários | `/usuarios` | Gestão de usuários da plataforma |
| Benchmarks | `/benchmarks` | Comparativos municipais e estaduais |

## 3. Módulo Cooperativa (`cooperativa`)

Rota base `/cooperativa`.

| Função | Rota | Descrição |
|--------|------|-----------|
| Painel | `/painel` | KPIs operacionais da cooperativa |
| Recepção | `/recepcao` | Registro de entrada de material |
| Lotes de Entrada | `/lotes-entrada` | Listagem e detalhamento de lotes recebidos |
| Despacho | `/despacho` | Despacho de lotes para indústrias |
| Faturamento | `/faturamento` | Notas fiscais, valores, comprovantes |
| Cadastro | `/cadastro` | Dados da cooperativa, licenças, capacidade |

## 4. Módulo Indústria (`industria`)

Rota base `/industria`.

| Função | Rota | Descrição |
|--------|------|-----------|
| Dashboard ESG | `/dashboard` | Indicadores ambientais, sociais e de governança |
| Metas Logísticas | `/metas-logisticas` | Metas PNRS por material e ano |
| Integração | `/integracao` | API B2B para importação automatizada |
| Certificados | `/certificados` | Certificados de logística reversa emitidos |
| Cadastro | `/cadastro` | Dados da indústria, CNAE, licenças |

## 5. Módulo Ponto de Coleta (`ponto_coleta`)

Rota base `/ponto-coleta`.

| Função | Rota | Descrição |
|--------|------|-----------|
| Dashboard | `/dashboard` | Resumo operacional |
| Novo Recebimento | `/novo-recebimento` | Registro de recebimento de material |
| Histórico | `/historico` | Histórico de recebimentos |
| Metas | `/metas` | Metas mensais e anuais |
| Credenciamento | `/credenciamento` | Status do credenciamento e documentação |
| Serviços | `/servicos` | Catálogo de serviços oferecidos |
| Configurações | `/configuracoes` | Preferências do ponto |

## 6. Módulo Administração (`super_admin`)

Rota base `/admin`. Organizado em 4 grupos via mega-menu.

### 6.1. Sistema

| Função | Rota | Descrição |
|--------|------|-----------|
| Painel Admin | `/painel` | KPIs administrativos consolidados |
| Regras de Negócio | `/regras-negocio` | Parâmetros tipados (string/number/boolean/json) por escopo |
| Banco de Dados | `/banco-dados` | Métricas read-only de saúde do banco |
| Logs | `/logs` | Visualizador unificado de eventos do sistema |
| Parâmetros (legado) | `/parametros` | Configurações legadas |

### 6.2. Identidade & Acesso

| Função | Rota | Descrição |
|--------|------|-----------|
| Usuários | `/usuarios` | CRUD de usuários + atribuição de roles |
| Perfis de Usuário | `/perfis-usuario` | Roles e permissões granulares |
| Perfis de Entidade | `/perfis-entidade` | Templates de permissão por tipo de entidade |
| LDAP / AD | `/ldap` | Configuração de diretório corporativo |

### 6.3. Integrações

| Função | Rota | Descrição |
|--------|------|-----------|
| APIs Externas | `/integracoes` | Conectores REST configuráveis |
| Webhooks | `/webhooks` | Eventos de saída com retry e log |
| SEI | `/sei` | Integração com Sistema Eletrônico de Informações |
| Notificações | `/notificacoes` | Canais (SMTP, Teams, SMS, WhatsApp, Telegram) + templates |

### 6.4. Operacional

| Função | Rota | Descrição |
|--------|------|-----------|
| Contenedores | `/contenedores` | Catálogo de tipos de contenedor |
| Localizações | `/localizacoes` | Ecopontos georreferenciados |
| Inventário IoT | `/iot` | Modelos e instâncias de dispositivos |
| Listas Suspensas | `/listas` | Catálogos de opções (selects) |
| Ações Automáticas | `/acoes-automaticas` | Triggers e automações por evento |

## 7. Funções transversais

| Função | Componente | Descrição |
|--------|------------|-----------|
| Autenticação global | `AuthProvider` / `useAuth` | Sessão, papéis, signOut |
| Proteção de rotas | `ProtectedRoute` | Guard por papel |
| Tema escuro | `useTheme` + toggle | Evening Horizon |
| Toasts | `sonner` + `toaster` | Feedback transversal |
| TopNavBar | `GlobalHeader` | Navegação global |
| Mega-menu Admin | `AdminMegaMenu` | Acesso rápido a todos submódulos admin |

## 8. Hooks de dados

| Hook | Tabelas envolvidas |
|------|--------------------|
| `use-cooperativa-data` | cooperativas, lotes, transacoes |
| `use-industria-data` | industrias, transacoes, v_certificado_logistica_reversa |
| `use-sinarv-data` | indicadores_sustentabilidade |
| `use-schema-data` | views genéricas |
| `use-auth` | profiles, user_roles |

## 9. Edge Functions

| Função | Consumidores |
|--------|--------------|
| `admin-users` | `/admin/usuarios` |
| `b2b-importar-lotes` | parceiros B2B externos |
| `comparar-municipios` | `/dashboard/benchmarks` |

## 10. Resumo quantitativo

| Categoria | Total |
|-----------|------:|
| Páginas | 49 |
| Componentes UI customizados | 24 |
| Componentes shadcn/ui | 50+ |
| Hooks customizados | 8 |
| Tabelas (RLS) | 30 |
| Views | 28 |
| Edge Functions | 4 |
| Rotas | 49 |
| Papéis (`app_role`) | 5 |
