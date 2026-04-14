# SINARV — Contagem de Pontos de Função

Versão: 4.0 | Atualizado: 2026-04-14

---

# PARTE 1 — VISÃO TÉCNICA

## 1. Inventário de Artefatos

### 1.1 Páginas (Componentes de Tela)

| # | Módulo | Página | Arquivo | Complexidade |
|---|--------|--------|---------|-------------|
| 1 | Público | Landing Page | `Index.tsx` | Média |
| 2 | Público | Autenticação | `Auth.tsx` | Alta |
| 3 | Público | Reset de Senha | `ResetPassword.tsx` | Baixa |
| 4 | Público | Seleção de Perfil | `SelecionarPerfil.tsx` | Média |
| 5 | Público | Mapa de Reciclagem | `TransparenciaMapaReciclagem.tsx` | Média |
| 6 | Público | 404 | `NotFound.tsx` | Baixa |
| 7 | Governo | Visão Geral | `DashboardOverview.tsx` | Alta |
| 8 | Governo | Rastreabilidade | `DashboardRastreabilidade.tsx` | Alta |
| 9 | Governo | Auditoria | `DashboardAuditoria.tsx` | Alta |
| 10 | Governo | Alertas | `DashboardAlertas.tsx` | Média |
| 11 | Governo | Gestão de Usuários | `DashboardUsuarios.tsx` | Alta |
| 12 | Governo | Benchmarks Internacionais | `DashboardBenchmarks.tsx` | Muito Alta |
| 13 | Cooperativa | Painel | `CooperativaPainel.tsx` | Alta |
| 14 | Cooperativa | Recepção | `CooperativaRecepcao.tsx` | Alta |
| 15 | Cooperativa | Lotes de Entrada | `CooperativaLotesEntrada.tsx` | Média |
| 16 | Cooperativa | Despacho | `CooperativaDespacho.tsx` | Alta |
| 17 | Cooperativa | Faturamento | `CooperativaFaturamento.tsx` | Média |
| 18 | Cooperativa | Cadastro | `CooperativaCadastro.tsx` | Média |
| 19 | Indústria | Dashboard ESG | `IndustriaDashboardESG.tsx` | Alta |
| 20 | Indústria | Metas PNRS | `IndustriaMetasLogisticas.tsx` | Alta |
| 21 | Indústria | Integração B2B | `IndustriaIntegracao.tsx` | Muito Alta |
| 22 | Indústria | Certificados | `IndustriaCertificados.tsx` | Média |
| 23 | Indústria | Cadastro | `IndustriaCadastro.tsx` | Média |
| 24 | Ponto Coleta | Dashboard | `PontoColetaDashboard.tsx` | Alta |
| 25 | Ponto Coleta | Novo Recebimento | `PontoColetaNovoRecebimento.tsx` | Alta |
| 26 | Ponto Coleta | Histórico e Despachos | `PontoColetaHistorico.tsx` | Alta |
| 27 | Ponto Coleta | Metas | `PontoColetaMetas.tsx` | Média |
| 28 | Ponto Coleta | Serviços e Contenedores | `PontoColetaServicos.tsx` | Muito Alta |
| 29 | Ponto Coleta | Credenciamento | `PontoColetaCredenciamento.tsx` | Alta |
| 30 | Ponto Coleta | Configurações | `PontoColetaConfiguracoes.tsx` | Alta |
| 31 | Admin | Painel Administrativo | `AdminPainel.tsx` | Alta |
| 32 | Admin | Gestão de Contenedores | `AdminContenedores.tsx` | Alta |
| 33 | Admin | Gestão de Localizações | `AdminLocalizacoes.tsx` | Muito Alta |
| 34 | Admin | Integrações Externas | `AdminIntegracoes.tsx` | Alta |
| 35 | Admin | Parâmetros do Sistema | `AdminParametros.tsx` | Média |

**Total de Páginas: 35**

### 1.2 Componentes Estruturais (não-UI)

| # | Componente | Arquivo | Tipo |
|---|-----------|---------|------|
| 1 | GlobalHeader | `layout/GlobalHeader.tsx` | Layout |
| 2 | ModuleShell | `layout/ModuleShell.tsx` | Layout |
| 3 | AppSwitcher | `layout/AppSwitcher.tsx` | Layout |
| 4 | ProtectedRoute | `auth/ProtectedRoute.tsx` | Guard |
| 5 | NavLink | `NavLink.tsx` | Navegação |
| 6 | DashboardLayout | `dashboard/DashboardLayout.tsx` | Layout |
| 7 | CooperativaLayout | `modules/CooperativaLayout.tsx` | Layout |
| 8 | IndustriaLayout | `modules/IndustriaLayout.tsx` | Layout |
| 9 | PontoColetaLayout | `modules/PontoColetaLayout.tsx` | Layout |
| 10 | **AdminLayout** | `modules/AdminLayout.tsx` | Layout |
| 11 | ModuleLayout | `modules/ModuleLayout.tsx` | Layout |
| 12 | DashboardCharts | `dashboard/DashboardCharts.tsx` | Gráficos |
| 13 | KPICards | `dashboard/KPICards.tsx` | KPI |
| 14 | PlanaresMetrics | `dashboard/PlanaresMetrics.tsx` | Métricas |
| 15 | TransactionsTable | `dashboard/TransactionsTable.tsx` | Tabela |
| 16 | DashboardSidebar | `dashboard/DashboardSidebar.tsx` | Layout |
| 17 | GovHeader | `landing/GovHeader.tsx` | Landing |
| 18 | GovFooter | `landing/GovFooter.tsx` | Landing |
| 19 | HeroSection | `landing/HeroSection.tsx` | Landing |
| 20 | QuickAccessCards | `landing/QuickAccessCards.tsx` | Landing |
| 21 | SustainabilityIndicators | `landing/SustainabilityIndicators.tsx` | Landing |

**Total de Componentes Estruturais: 21**

### 1.3 Hooks Customizados

| # | Hook | Arquivo | Tipo |
|---|------|---------|------|
| 1 | useAuth | `use-auth.tsx` | Autenticação/Sessão |
| 2 | useSchemaData (13 exports) | `use-schema-data.ts` | Queries tipadas |
| 3 | useSinarvData (5 exports) | `use-sinarv-data.ts` | Queries core |
| 4 | useCooperativaData | `use-cooperativa-data.ts` | Queries cooperativa |
| 5 | useIndustriaData | `use-industria-data.ts` | Queries indústria |
| 6 | useInView | `use-in-view.ts` | Intersection Observer |
| 7 | useMobile | `use-mobile.tsx` | Responsive |
| 8 | useToast | `use-toast.ts` | Notificações |

**Total de Hooks: 8 (com ~25 funções exportadas)**

### 1.4 Edge Functions (Backend)

| # | Função | Endpoint | Complexidade |
|---|--------|----------|-------------|
| 1 | admin-users | `POST /functions/v1/admin-users` | Alta |
| 2 | b2b-importar-lotes | `POST /functions/v1/b2b-importar-lotes` | Muito Alta |
| 3 | comparar-municipios | `GET /functions/v1/comparar-municipios` | Média |
| 4 | seed-admin | `POST /functions/v1/seed-admin` | Baixa |

**Total de Edge Functions: 4**

### 1.5 Banco de Dados

| Tipo | Quantidade |
|------|-----------|
| Tabelas core (public) | 10 |
| Tabelas de parametrização (admin) | 3 |
| Tabelas benchmark | 3 |
| Views segregadas | 23 |
| Views analíticas | 2 |
| Funções PL/pgSQL | 3 |
| Enums | 6 |
| Políticas RLS | ~46 |

**Total de objetos de banco: ~96**

### 1.6 Componentes UI (shadcn/ui)

Mais de **40 primitivos** reutilizáveis: Accordion, Alert, Avatar, Badge, Button, Calendar, Card, Carousel, Chart, Checkbox, Collapsible, Command, ContextMenu, Dialog, Drawer, DropdownMenu, Form, HoverCard, Input, Label, Menubar, NavigationMenu, Pagination, Popover, Progress, RadioGroup, Resizable, ScrollArea, Select, Separator, Sheet, Sidebar, Skeleton, Slider, Sonner, Switch, Table, Tabs, Textarea, Toast, Toggle, Tooltip.

### 1.7 Bibliotecas Externas Integradas

| Biblioteca | Uso |
|-----------|-----|
| `leaflet` + `react-leaflet` | Mapas interativos em AdminLocalizacoes e PontoColetaServicos |
| `recharts` | Gráficos (BarChart, RadarChart, PieChart) |
| `@tanstack/react-query` | Gerenciamento de estado assíncrono |

---

## 2. Resumo Quantitativo Técnico

| Categoria | Quantidade |
|-----------|-----------|
| Páginas | 35 |
| Componentes Estruturais | 21 |
| Componentes UI (shadcn) | 40+ |
| Hooks (arquivos) | 8 |
| Funções exportadas (hooks) | ~25 |
| Edge Functions | 4 |
| Tabelas no banco | 16 |
| Views | 25 |
| Funções de banco | 3 |
| Enums | 6 |
| Políticas RLS | ~46 |
| **Total de Artefatos** | **~229+** |

---

## 3. Análise de Pontos de Função (IFPUG simplificada)

| Tipo de Função | Baixa | Média | Alta | Pontos |
|---------------|-------|-------|------|--------|
| EI (Entrada externa) | 5 | 10 | 7 | 112 |
| EO (Saída externa) | 3 | 7 | 5 | 78 |
| EQ (Consulta externa) | 4 | 6 | 4 | 56 |
| ILF (Arquivo lógico interno) | — | 6 | 10 | 108 |
| EIF (Arquivo interface externa) | 3 | 4 | — | 26 |
| **Total não ajustado** | | | | **380 PF** |

**Fator de ajuste (VAF):** 1.15 (complexidade técnica média-alta)

**Total ajustado: ~437 Pontos de Função**

### Variação vs. Versão Anterior

| Métrica | v3.0 | v4.0 | Delta |
|---------|------|------|-------|
| Páginas | 29 | 35 | +6 |
| Componentes Estruturais | 20 | 21 | +1 |
| Tabelas | 13 | 16 | +3 |
| Políticas RLS | ~40 | ~46 | +6 |
| Pontos de Função | ~344 | ~437 | +93 (+27%) |

---

---

# PARTE 2 — VISÃO DE NEGÓCIO

## O que o SINARV faz na prática?

O SINARV é como um "mapa vivo" de tudo que acontece com os resíduos sólidos no Brasil — desde o momento em que um cidadão entrega uma garrafa PET num ponto de coleta até o instante em que uma indústria transforma esse material em matéria-prima nova.

### Para o Governo

O governo tem acesso a um **painel de controle nacional** que mostra:
- Quanto cada estado e município está reciclando
- Quais empresas estão cumprindo as metas ambientais da PNRS
- Um **ranking transparente** que compara estados entre si (como um "campeonato da reciclagem")
- Um **comparador de cidades** onde é possível analisar até 3 municípios lado a lado
- **Selos digitais** concedidos automaticamente a cidades que atingem marcos importantes (como "Selo Lixão Zero")
- Alertas automáticos quando algo suspeito acontece (ex: uma indústria declarando mais reciclagem do que comprou)

### Para as Cooperativas

As cooperativas de catadores têm um **sistema completo de gestão** que permite:
- Registrar todo material que chega (pesagem, tipo, origem)
- Controlar o estoque de materiais separados
- Despachar lotes para indústrias com **nota fiscal e token de rastreabilidade** — como um "selo digital" que garante que o material é real
- Emitir notas de venda e controlar o faturamento

### Para as Indústrias

As indústrias que precisam comprovar que estão fazendo logística reversa podem:
- Importar automaticamente os dados de compra de material reciclado (via API para ERPs como SAP e TOTVS)
- Ver em tempo real se estão cumprindo as **metas obrigatórias da PNRS**
- Receber **certificados digitais de logística reversa** — o "comprovante" que demonstra conformidade ambiental
- Tudo é verificado automaticamente: o sistema cruza as informações da cooperativa com as da indústria para evitar fraudes (anti-greenwashing)

### Para os Pontos de Coleta

Os pontos de coleta (como ecopontos, supermercados e prefeituras) podem:
- **Registrar cada entrega** de material com pesagem e emissão de recibo
- Acompanhar o **volume arrecadado** e a **capacidade das estações**
- Consultar o **catálogo de serviços** baseado no modelo europeu (ARP-GAN de Bruxelas), que inclui:
  - **5 tipos de contenedores** separados por cor (Azul para plástico/metal, Amarelo para papel, Verde para vidro, Laranja para orgânicos, Cinza para rejeitos)
  - **Coleta específica** para eletrônicos, produtos químicos, entulho de construção, óleos de cozinha e pneus
  - **Serviços extras** como coleta para eventos, consultoria em gestão de resíduos e sacolas comerciais certificadas
  - **Lista de itens proibidos** que não podem ser recebidos (resíduos hospitalares, radioativos, explosivos, amianto)
  - **Informações sobre multas** para descarte irregular
  - **Mapa interativo** mostrando todos os ecopontos ativos com marcadores coloridos por tipo de material
- Despachar material consolidado para cooperativas credenciadas
- Para órgãos públicos: acompanhar o **progresso das metas obrigatórias**
- Para empresas privadas: acumular **créditos fiscais ecológicos** por kg recebido
- **Configurar** parâmetros locais do módulo

### Para o Administrador do Sistema

O Super Admin tem acesso a um **módulo de administração completo** que permite:
- Visualizar **KPIs globais** do sistema (total de contenedores, ecopontos ativos, integrações configuradas, usuários)
- **Cadastrar e editar tipos de contenedores** — definindo cor, material aceito, volumes disponíveis e boas práticas de uso
- **Gerenciar ecopontos** em um **mapa interativo** — adicionando novos pontos com coordenadas GPS, endereço e capacidade, além de filtrar por UF e status operacional
- **Configurar integrações com APIs externas** — como IBGE, SINIR, ViaCEP e SEFAZ — incluindo testes de conectividade para garantir que os serviços estão funcionando
- **Ajustar parâmetros do sistema** — regras de negócio, políticas de segurança e intervalos de sincronização

### Para o Cidadão

Qualquer pessoa pode acessar o **mapa de reciclagem** na página pública, sem precisar de login, e ver onde estão os pontos de coleta próximos.

---

## Números do Sistema

Em linguagem simples, o SINARV possui:

- **35 telas** diferentes, cada uma com funcionalidades específicas
- **5 módulos de negócio** isolados (Governo, Cooperativa, Indústria, Ponto de Coleta, Administração) + área pública
- **4 serviços de backend** que processam dados automaticamente
- **16 tabelas** e **25 visualizações** no banco de dados
- **~46 regras de segurança** que controlam quem pode ver e alterar cada dado
- **~437 pontos de função** — uma medida padrão de mercado que indica o tamanho do sistema (equivalente a um sistema de **grande porte**)
- **2 mapas interativos** (gestão administrativa + consulta pública de ecopontos)

### Referências Internacionais Integradas

O sistema incorpora práticas da **ARP-GAN (Bruxelles-Propreté)**, a agência de limpeza pública de Bruxelas, na Bélgica. Isso inclui:
- O modelo de **contenedores coloridos** para separação de resíduos
- Os **Recyparks** (centros de triagem) como referência para ecopontos brasileiros
- As **taxas de reciclagem europeias** como benchmark para estados e municípios do Brasil
- A **Escala de Lansink** (hierarquia de tratamento) como framework de priorização

Tudo isso é transparente, rastreável e auditável — feito para que o Brasil avance na economia circular com a mesma seriedade que os melhores modelos do mundo.
