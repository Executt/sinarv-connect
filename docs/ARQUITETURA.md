# Arquitetura — SINARV

## 1. Visão de alto nível

```
┌──────────────────────────────────────────────────────────┐
│  Browser (React 18 + Vite + TS + Tailwind + shadcn/ui)   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ Public Portal│  │  Module SPAs │  │  Admin Hub   │    │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘    │
│         │ TanStack Query (cache + sync)     │            │
└─────────┼──────────────────┼─────────────────┼───────────┘
          ▼                  ▼                 ▼
┌──────────────────────────────────────────────────────────┐
│           Lovable Cloud (Supabase)                       │
│  ┌─────────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ PostgreSQL  │ │   Auth   │ │ Storage  │ │   Edge   │  │
│  │  + RLS      │ │ (JWT)    │ │ (S3-like)│ │ Functions│  │
│  └─────────────┘ └──────────┘ └──────────┘ └──────────┘  │
└──────────────────────────────────────────────────────────┘
                           ▲
                           │
            ┌──────────────┴──────────────┐
            ▼                             ▼
   ┌──────────────────┐          ┌──────────────────┐
   │ Sistemas externos│          │ Dispositivos IoT │
   │ (SEI, Webhooks,  │          │ (MQTT/HTTP)      │
   │ SMTP, Teams…)    │          │                  │
   └──────────────────┘          └──────────────────┘
```

## 2. Stack

| Camada | Tecnologia | Versão |
|--------|------------|--------|
| Build | Vite | 5.x |
| Linguagem | TypeScript | 5.x |
| UI | React | 18.x |
| Estilo | Tailwind CSS | 3.x |
| Componentes | shadcn/ui (Radix) | — |
| Estado servidor | TanStack Query | 5.x |
| Roteamento | React Router | 6.x |
| Validação | Zod | 3.x |
| Gráficos | Recharts | — |
| Ícones | Lucide | — |
| Backend | Supabase (Lovable Cloud) | — |
| Banco | PostgreSQL | 15 |
| Funções | Deno Edge Runtime | — |

## 3. Estrutura de diretórios

```
sinarv/
├── docs/                          ← documentação técnica
├── public/                        ← assets estáticos
├── src/
│   ├── App.tsx                    ← roteamento global
│   ├── main.tsx                   ← bootstrap React
│   ├── index.css                  ← tokens de design + Tailwind layers
│   ├── components/
│   │   ├── admin/                 ← componentes da área admin
│   │   ├── auth/                  ← ProtectedRoute
│   │   ├── dashboard/             ← layout governamental
│   │   ├── landing/               ← portal público
│   │   ├── layout/                ← GlobalHeader, AdminMegaMenu, ModuleShell
│   │   ├── modules/               ← layouts por módulo (Cooperativa, Indústria…)
│   │   └── ui/                    ← shadcn (não editar)
│   ├── hooks/                     ← use-auth, use-theme, use-*-data
│   ├── integrations/
│   │   └── supabase/              ← client.ts, types.ts (auto-gerado)
│   ├── lib/                       ← utils
│   └── pages/
│       ├── admin/                 ← submódulos administrativos
│       ├── cooperativa/
│       ├── industria/
│       ├── ponto-coleta/
│       └── *.tsx                  ← páginas top-level
├── supabase/
│   ├── config.toml
│   ├── functions/                 ← edge functions
│   └── migrations/                ← histórico SQL
└── tailwind.config.ts
```

## 4. Padrões de organização

### 4.1. Páginas
Cada página é um componente funcional default-exportado em `src/pages/<modulo>/`. Reutiliza `AdminPageHeader` (admin) ou cabeçalhos próprios do módulo.

### 4.2. Hooks de dados
Hooks `use-*-data.ts` encapsulam consultas TanStack Query, retornando `{ data, isLoading, error }`. Convenção: `useQueryKey = [recurso, filtros]`.

### 4.3. Layouts
`<ModuleLayout>` define shell consistente: header global + área de conteúdo. Cada módulo (Cooperativa, Indústria, Ponto de Coleta, Admin) tem seu próprio layout que injeta sub-navegação contextual.

### 4.4. Proteção de rotas
`<ProtectedRoute requiredRole="...">` envolve rotas privadas. Usa `useAuth()` para verificar sessão e `hasRole()` para autorizar. `super_admin` tem acesso transversal.

## 5. Mapa de Rotas

### Público
- `/` — portal institucional
- `/auth` — login/cadastro
- `/reset-password` — redefinição de senha
- `/selecionar-perfil` — seleção pós-login quando usuário tem múltiplos papéis
- `/transparencia/mapa-reciclagem` — mapa público

### Governo (`/dashboard`)
- `/` overview · `/rastreabilidade` · `/auditoria` · `/alertas` · `/usuarios` · `/benchmarks`

### Cooperativa (`/cooperativa`)
- `/painel` · `/recepcao` · `/lotes-entrada` · `/despacho` · `/faturamento` · `/cadastro`

### Indústria (`/industria`)
- `/dashboard` (ESG) · `/metas-logisticas` · `/integracao` · `/certificados` · `/cadastro`

### Ponto de Coleta (`/ponto-coleta`)
- `/dashboard` · `/novo-recebimento` · `/historico` · `/metas` · `/credenciamento` · `/servicos` · `/configuracoes`

### Administração (`/admin`)
**Sistema:** painel · regras-negocio · banco-dados · logs · parametros
**Identidade & Acesso:** usuarios · perfis-usuario · perfis-entidade · ldap
**Integrações:** integracoes · webhooks · sei · notificacoes
**Operacional:** contenedores · localizacoes · iot · listas · acoes-automaticas

## 6. Fluxo de autenticação

1. Usuário entra em `/auth` → Supabase Auth (email/senha ou Google)
2. `onAuthStateChange` em `use-auth.tsx` captura sessão
3. `fetchRoles()` consulta `user_roles` via SECURITY DEFINER
4. Sessão e papéis são expostos via `AuthContext`
5. `ProtectedRoute` valida acesso por rota
6. Logout limpa estado local e revoga sessão

## 7. Camada de dados

- **Cliente:** `@supabase/supabase-js` v2 com `localStorage` para persistência de sessão
- **Cache:** TanStack Query (staleTime padrão = 0; refetch onWindowFocus = true)
- **Realtime:** ativado conforme necessidade via `supabase.channel(...).on('postgres_changes', ...)`
- **Tipagem:** `src/integrations/supabase/types.ts` é autogerado e nunca editado manualmente

## 8. Edge Functions

| Função | Propósito |
|--------|-----------|
| `admin-users` | CRUD seguro de usuários e atribuição de roles (service_role) |
| `b2b-importar-lotes` | Importação de lotes em massa via API B2B |
| `comparar-municipios` | Comparativo benchmark entre municípios |
| `seed-admin` | Bootstrap inicial de super-admin |

Configuração em `supabase/config.toml`. Deploy automático ao alterar arquivos sob `supabase/functions/`.

## 9. Build & deploy

- `npm run dev` — servidor de desenvolvimento Vite
- `npm run build` — bundle de produção
- Deploy automático Lovable a cada commit aprovado
- Preview publicado em domínio `*.lovable.app`
