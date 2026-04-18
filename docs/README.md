# SINARV — Sistema Nacional de Rastreabilidade de Resíduos

> Plataforma governamental para rastreabilidade, certificação e auditoria do ciclo de vida de resíduos sólidos no Brasil, alinhada à PNRS (Lei 12.305/2010) e ao PLANARES.

## 📚 Índice da Documentação

| Documento | Conteúdo |
|-----------|----------|
| [PADRONIZACAO_VISUAL.md](./PADRONIZACAO_VISUAL.md) | Design system, tokens, tipografia, espaçamento, ícones |
| [ARQUITETURA.md](./ARQUITETURA.md) | Stack tecnológico, diretórios, rotas, fluxo de dados |
| [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) | Modelo de dados completo, tabelas, enums, índices |
| [API_ROUTE.md](./API_ROUTE.md) | Edge Functions, contratos REST, exemplos |
| [RLS_POLICIES.md](./RLS_POLICIES.md) | Políticas de segurança a nível de linha (Row-Level Security) |
| [PONTOS_DE_FUNCAO.md](./PONTOS_DE_FUNCAO.md) | Contagem APF (IFPUG) por módulo |
| [INVENTARIO_FUNCOES.md](./INVENTARIO_FUNCOES.md) | Catálogo de funcionalidades por papel |
| [REGRAS_NEGOCIO.md](./REGRAS_NEGOCIO.md) | Regras de domínio, validações, fórmulas |
| [SEGURANCA.md](./SEGURANCA.md) | Modelo de ameaças, controles, conformidade |

## 🎯 Visão Geral

O SINARV unifica em um único portal os atores da cadeia de resíduos:

- **Governo (gov)** — fiscalização, indicadores PNRS/PLANARES, auditorias, benchmarks municipais e estaduais
- **Cooperativas** — recepção, triagem, despacho, faturamento e estoque
- **Indústrias** — metas de logística reversa, certificados, dashboard ESG, integração via API
- **Pontos de Coleta** — credenciamento, recebimentos, metas, histórico, serviços
- **Super Administração** — parametrização sistêmica, identidade & acesso, integrações, operacional

## 🚀 Stack

- **Frontend:** React 18 + Vite 5 + TypeScript 5 + Tailwind v3 + shadcn/ui
- **Backend:** Lovable Cloud (Supabase) — PostgreSQL 15, Edge Functions Deno, Auth, Storage
- **Estado:** TanStack Query v5
- **Roteamento:** React Router v6
- **Visualização:** Recharts
- **Ícones:** Lucide
- **Validação:** Zod

## 🏛️ Módulos

| Módulo | Rota base | Papel necessário |
|--------|-----------|------------------|
| Portal público | `/` | — |
| Painel Governamental | `/dashboard` | `gov` |
| Cooperativa | `/cooperativa` | `cooperativa` |
| Indústria | `/industria` | `industria` |
| Ponto de Coleta | `/ponto-coleta` | `ponto_coleta` |
| Administração | `/admin` | `super_admin` |

## 🔐 Papéis de Usuário (`app_role`)

`gov` · `cooperativa` · `industria` · `ponto_coleta` · `super_admin`

`super_admin` tem acesso transversal a todos os módulos via função SECURITY DEFINER `has_role()`.

## 📅 Fases de Construção

| Fase | Escopo | Status |
|------|--------|--------|
| 1 | Redesign visual CRM Desktop + TopNavBar + Mega-menu Admin | ✅ |
| 2 | Hub `/admin/painel` com KPIs reais | ✅ |
| 3 | Sistema + Operacional (regras, listas, ações, IoT, logs, BD) | ✅ |
| 4 | Identidade & Acesso (usuários, perfis, LDAP) | ✅ |
| 5 | Integrações (webhooks, SEI, notificações) | ✅ |
| 6 | Documentação técnica completa | ✅ |

## 🌐 URLs

- **Preview:** https://id-preview--5d12c8af-736c-4d6a-bbcc-084b3b727976.lovable.app
- **Produção:** https://sinarv-connect.lovable.app
