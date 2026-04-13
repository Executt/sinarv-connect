# SINARV — Arquitetura do Sistema

Versão: 3.0 | Atualizado: 2026-04-13

---

## 1. Visão de Alto Nível

### 1.1 Arquitetura de Micro-frontends

O SINARV adota uma **arquitetura de micro-frontends visual** onde cada módulo de negócio é isolado logicamente no navegador por meio de um **App Switcher** no Global Header.

```
┌─────────────────────────────────────────────────────┐
│               Global Header (Top Bar)               │
│  [SINARV] | [Módulo Ativo]   [Nav Items...]  [⊞]  │
├─────────────────────────────────────────────────────┤
│                                                     │
│              Conteúdo do Módulo Ativo               │
│         (Rotas e páginas isoladas)                  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 1.2 Módulos Isolados

| Módulo | Prefixo de Rota | Perfil de Acesso | Páginas |
|--------|-----------------|-------------------|---------|
| Governo (PNRS) | `/dashboard/*` | `gov` | 7 |
| Cooperativa | `/cooperativa/*` | `cooperativa` | 6 |
| Indústria | `/industria/*` | `industria` | 5 |
| Ponto de Coleta | `/ponto-coleta/*` | `ponto_coleta` | 6 |
| Cidadão | `/transparencia/*` | Público | 1 |
| **Super Admin** | Todos | `super_admin` | — |

### 1.3 Backend

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ API Gateway  │────▶│ Auth Service │────▶│  PostgreSQL  │
│   (Edge Fn)  │     │ (SSO/SERPRO) │     │  (Schemas)   │
└──────┬───────┘     └──────────────┘     └──────────────┘
       │
       ├──▶ fn_b2b_importar_lotes (Indústria B2B)
       ├──▶ fn_admin_users (Gestão de Usuários)
       ├──▶ fn_comparar_municipios (Benchmarks API)
       └──▶ fn_seed_admin (Bootstrap)
```

---

## 2. Componentes Estruturais

### 2.1 Layout System

| Componente | Responsabilidade |
|------------|-----------------|
| `GlobalHeader` | Barra superior com navegação contextual por módulo + App Switcher |
| `ModuleShell` | Shell genérico com título dinâmico e `<Outlet>` para rotas filhas |
| `AppSwitcher` | Menu dropdown para Super Admin alternar entre módulos |
| `ProtectedRoute` | Guard de rota com verificação de role via `useAuth` |

### 2.2 Data Layer

| Hook | Schema | Finalidade |
|------|--------|-----------|
| `use-auth` | `sch_admin` | Autenticação, roles, sessão |
| `use-schema-data` | Todos | Queries tipadas para views segregadas |
| `use-sinarv-data` | `public` | Transações, lotes, auditorias, alertas |
| `use-cooperativa-data` | `sch_cooperativa` | Dados de cooperativas |
| `use-industria-data` | `sch_industria` | Dados de indústrias |

### 2.3 Design System

- **Base:** SAP Fiori (azul corporativo profundo)
- **Componentes:** shadcn/ui (40+ primitivos)
- **Gráficos:** Recharts (BarChart, RadarChart, PieChart)
- **Tokens CSS:** HSL via `index.css` + `tailwind.config.ts`

---

## 3. Segurança

### 3.1 Camadas

| Camada | Mecanismo |
|--------|-----------|
| Frontend | ProtectedRoute + useAuth (role check) |
| API | JWT validation em Edge Functions |
| Banco de Dados | RLS policies por tabela |
| Autorização | `has_role()` SECURITY DEFINER |
| Auditoria | `role_audit_logs` + `admin_session_logs` |

### 3.2 Tokens de Rastreabilidade

UUID v4 imutáveis emitidos no despacho da cooperativa, validados cruzando NF-e entre cooperativa e indústria via `fn_validar_token_rastreabilidade`.

---

## 4. Integrações Externas (Roadmap)

| Integração | Protocolo | Status |
|-----------|-----------|--------|
| SSO SERPRO | SAML 2.0 / OpenID Connect | Roadmap |
| NF-e SEFAZ | Web Service SOAP | Roadmap |
| IBGE | REST API (códigos municipais) | Parcial |
| Eurostat | REST API (benchmarks) | Roadmap |

---

## 5. Referência ARP-GAN no Módulo Ponto de Coleta

A página **Serviços e Contenedores** (`/ponto-coleta/servicos`) implementa o modelo da ARP-GAN (Bruxelles-Propreté Pro) adaptado ao contexto brasileiro:

| Funcionalidade ARP-GAN | Adaptação SINARV |
|------------------------|------------------|
| Collecte sélective (PMC, Verre, Papier, Alimentaire) | Contenedores por cor (Azul, Amarelo, Verde, Laranja, Cinza) |
| Collecte spécifique (WEEE, chimiques) | Coleta Específica (REEE, químicos, RCC, óleos, pneus) |
| Location de conteneurs (240L–36m³) | Escala de Capacidade (120L–36m³ com compactadores) |
| Vente de sacs commerciaux (30L, 50L, 80L) | Sacolas Comerciais Certificadas |
| Nettoyage événementiel | Coleta Eventual / Eventos |
| Suivi et conseil | Consultoria em Gestão de Resíduos (PGRS) |
| Recypark régionaux | Ecopontos regionais (modelo de referência) |

### Itens Proibidos (ARP-GAN → SINARV)

Resíduos não aceitos em pontos de coleta regulares, com referência à legislação brasileira (PNRS, CONAMA, ANVISA).
