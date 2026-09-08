# SINARV — Sistema Nacional de Rastreabilidade e Valorização de Resíduos Sólidos

> Plataforma governamental de rastreabilidade da cadeia de resíduos sólidos no Brasil, baseada na **PNRS (Lei 12.305/2010)** e no **PLANARES**, com referência internacional do modelo europeu **ARP-GAN (Bruxelles-Propreté)**.

---

## 🏛️ Visão Geral

O SINARV é um sistema multi-módulo que interliga todos os elos da economia circular brasileira:

| Módulo | Descrição | Perfil |
|--------|-----------|--------|
| **Governo (PNRS)** | Painel de telemetria nacional, auditoria, alertas, benchmarks | `gov` |
| **Cooperativa** | Recepção, triagem, estoque, despacho e faturamento | `cooperativa` |
| **Indústria** | Metas PNRS, recebimento B2B, certificados de logística reversa | `industria` |
| **Ponto de Coleta** | Dashboard, recebimento, metas, serviços ARP-GAN, credenciamento, configurações | `ponto_coleta` |
| **Administração** | Parametrização do sistema: contenedores, ecopontos (mapa Leaflet), integrações, parâmetros | `super_admin` |
| **Cidadão** | Transparência e mapa de reciclagem (público) | Público |
| **Super Admin** | Acesso total via App Switcher | `super_admin` |

---

## 🚀 Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + TypeScript + Tailwind CSS + shadcn/ui |
| Design System | SAP Fiori (cores e layout) |
| Gráficos | Recharts |
| Mapas | Leaflet + react-leaflet |
| Estado | TanStack React Query |
| Backend | Edge Functions (Deno) + PostgreSQL |
| Auth | JWT + RLS + SSO SERPRO (roadmap) |
| Deploy | Lovable Cloud (Supabase-backed) → OpenShift/OKD (roadmap) |

---

## 📁 Estrutura do Projeto

```
src/
├── pages/
│   ├── admin/            # 5 páginas (Painel, Contenedores, Localizações, Integrações, Parâmetros)
│   ├── cooperativa/      # 6 páginas (Painel, Recepção, Lotes, Despacho, Faturamento, Cadastro)
│   ├── industria/        # 5 páginas (Dashboard ESG, Metas, Integração, Certificados, Cadastro)
│   ├── ponto-coleta/     # 8 páginas (Dashboard, Recebimento, Histórico, Metas, Serviços, Credenciamento, Configurações)
│   ├── Dashboard*.tsx    # 7 páginas governamentais
│   └── Auth, Index...    # Páginas públicas e utilitárias
├── components/
│   ├── layout/           # GlobalHeader, ModuleShell, AppSwitcher
│   ├── modules/          # AdminLayout, CooperativaLayout, IndustriaLayout, PontoColetaLayout, ModuleLayout
│   ├── dashboard/        # KPICards, Charts, Tables, Planares
│   ├── landing/          # Hero, Header, Footer, Indicadores
│   └── ui/               # shadcn/ui (40+ componentes)
├── hooks/                # 8 hooks customizados (auth, data, schema)
└── integrations/         # Supabase client + types (auto-gerados)

supabase/
└── functions/            # 5 Edge Functions (admin-users, b2b-importar-lotes, comparar-municipios, ingest-telemetria, solicitar-importacao)

docs/                     # Documentação técnica consolidada
```

---

## 📊 Módulos e Funcionalidades

### Governo (PNRS)
- Visão Geral (KPIs nacionais, gráficos de volume)
- Rastreabilidade (cadeia de custódia de lotes)
- Auditoria (conformidade e infrações)
- Alertas (anomalias e eventos críticos)
- Gestão de Usuários (atribuição de roles)
- **Benchmarks Internacionais** (ranking estadual/municipal, radar chart, selos Planares, referência ARP-GAN)

### Cooperativa
- Painel (estoque, catadores, licenças)
- Recepção (recebimento de lotes de entrada)
- Lotes de Entrada (listagem e detalhes)
- Despacho para Indústria (NF-e, token rastreabilidade)
- Faturamento (notas fiscais de venda)
- Cadastro (dados da cooperativa)

### Indústria
- Dashboard ESG (indicadores ambientais)
- Metas PNRS (logística reversa obrigatória)
- Integração B2B (API credentials, logs, importação de lotes)
- Certificados de Logística Reversa
- Cadastro (dados da indústria)

### Ponto de Coleta
- Dashboard (volume, capacidade, créditos fiscais)
- Novo Recebimento (pesagem com recibo QR Code)
- Histórico e Despachos (recebimentos + envio para cooperativas)
- Metas de Cumprimento (progresso obrigatório)
- **Serviços e Contenedores** (catálogo ARP-GAN: contenedores por cor, coleta específica, serviços complementares, itens proibidos, **mapa interativo Leaflet** de ecopontos ativos)
- Credenciamento (cadastro de novo ponto)
- **Configurações** (parametrização local do módulo)

### Administração (Super Admin)
- **Painel Administrativo** (KPIs globais: contenedores, ecopontos, integrações, usuários)
- **Gestão de Contenedores** (CRUD completo: nome, cor, material, volumes, boas práticas)
- **Gestão de Localizações** (CRUD de ecopontos com **mapa interativo Leaflet**, filtros por UF/status, coordenadas GPS)
- **Integrações Externas** (CRUD de APIs: IBGE, SINIR, ViaCEP, etc. com teste de conectividade)
- **Parâmetros do Sistema** (regras de negócio, segurança, sincronização)

### Cidadão
- Mapa de Reciclagem (transparência pública)

---

## 📚 Documentação

| Documento | Descrição |
|-----------|-----------|
| [Documentação Técnica](docs/SINARV_DOCUMENTACAO_TECNICA.md) | Arquitetura, schemas, APIs |
| [Arquitetura](docs/ARCHITECTURE.md) | Micro-frontends, backend, segurança |
| [Schema do Banco](docs/DATABASE_SCHEMA.md) | Todos os schemas segregados |
| [Contagem de Funções](docs/FUNCTION_CONT.md) | Análise de pontos de função (técnica + negócio) |
| [Rotas de API](docs/API_ROUTE.md) | Contratos REST e Edge Functions |
| [Cloud](docs/CLOUD.md) | Infraestrutura e deploy |

---

## 🔐 Segurança

- **RLS (Row-Level Security)** em todas as tabelas
- **SECURITY DEFINER** para funções de autorização
- **Validação de entrada** com Zod em Edge Functions
- **Tokens de rastreabilidade** imutáveis (UUID v4)
- **Auditoria** de sessões admin e alterações de roles

---

## 🌍 Referências Internacionais

- **ARP-GAN (Bruxelles-Propreté)**: Modelo de coleta seletiva por contenedores, Recyparks, sacolas comerciais
- **Escala de Lansink**: Hierarquia de tratamento de resíduos (Prevenção → Eliminação)
- **Eurostat**: Taxas de reciclagem europeias como benchmark
- **PNRS / PLANARES**: Marco regulatório brasileiro
