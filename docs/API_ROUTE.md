# SINARV — Rotas de API e Edge Functions

Versão: 4.0 | Atualizado: 2026-04-14

---

## 1. Autenticação

```
POST /auth/v1/token?grant_type=password
Content-Type: application/json

{
  "email": "user@gov.br",
  "password": "..."
}

Response 200:
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "..."
}
```

**SSO SERPRO (Roadmap):** SAML 2.0 / OpenID Connect via `https://sso.serpro.gov.br`.

---

## 2. Edge Functions

### 2.1 `POST /functions/v1/admin-users` — Gestão de Usuários

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `action` | string | `list`, `assign_role`, `remove_role` |
| `user_id` | uuid | (para assign/remove) |
| `role` | app_role | (para assign/remove) |

**Headers:** `Authorization: Bearer <JWT_SUPER_ADMIN>`

### 2.2 `POST /functions/v1/b2b-importar-lotes` — Ingestão B2B (Indústria)

**Headers:** `Authorization: Bearer <API_KEY_DA_INDUSTRIA>`

```json
// Request
{
  "lotes": [
    {
      "token_rastreabilidade": "uuid-from-cooperativa",
      "cooperativa_cnpj": "12.345.678/0001-90",
      "numero_nota_fiscal": "NF-00123456",
      "chave_nfe": "35...(44 dígitos)",
      "tipo_material": "PET",
      "peso_kg": 5000,
      "data_recebimento": "2026-04-10"
    }
  ]
}

// Response 200
{
  "importados": 1,
  "erros": [],
  "tokens_validados": ["uuid-from-cooperativa"]
}

// Response 422 (Token inválido)
{
  "importados": 0,
  "erros": [
    {
      "index": 0,
      "codigo": "TOKEN_INVALIDO",
      "mensagem": "Token de rastreabilidade não encontrado na base de despachos das cooperativas"
    }
  ]
}
```

### 2.3 `GET /functions/v1/comparar-municipios` — Benchmarks Municipais

**Parâmetros Query:**

| Param | Tipo | Descrição |
|-------|------|-----------|
| `ibge_codes` | string | Códigos IBGE separados por vírgula (máx. 10) |

```
GET /functions/v1/comparar-municipios?ibge_codes=3304557,3550308,4106902
```

```json
// Response 200
{
  "data": [
    {
      "municipio_ibge": "3304557",
      "nome_municipio": "Rio de Janeiro",
      "uf": "RJ",
      "populacao": 6748000,
      "metricas": {
        "eficiencia_coleta_seletiva": 32.5,
        "engajamento_cidadao": 18.2,
        "pontos_coleta_por_km2": 1.8,
        "taxa_desvio_aterro": 15.6,
        "kg_per_capita": 41.49,
        "volume_reciclado_ton": 280000,
        "volume_coletado_ton": 1800000
      },
      "selos": [],
      "ano_referencia": 2025
    }
  ],
  "meta": {
    "total": 3,
    "codigos_nao_encontrados": [],
    "timestamp": "2026-04-13T..."
  }
}
```

### 2.4 `POST /functions/v1/seed-admin` — Bootstrap

Cria o primeiro usuário super_admin no sistema. Uso único.

---

## 3. Rotas do Frontend por Módulo

| Módulo | Rotas |
|--------|-------|
| **Governo** | `/dashboard`, `/dashboard/rastreabilidade`, `/dashboard/auditoria`, `/dashboard/alertas`, `/dashboard/usuarios`, `/dashboard/benchmarks` |
| **Cooperativa** | `/cooperativa/painel`, `/cooperativa/recepcao`, `/cooperativa/lotes-entrada`, `/cooperativa/despacho`, `/cooperativa/faturamento`, `/cooperativa/cadastro` |
| **Indústria** | `/industria/dashboard`, `/industria/metas-logisticas`, `/industria/integracao`, `/industria/certificados`, `/industria/cadastro` |
| **Ponto de Coleta** | `/ponto-coleta/dashboard`, `/ponto-coleta/novo-recebimento`, `/ponto-coleta/historico`, `/ponto-coleta/metas`, `/ponto-coleta/servicos`, `/ponto-coleta/credenciamento`, `/ponto-coleta/configuracoes` |
| **Administração** | `/admin/painel`, `/admin/contenedores`, `/admin/localizacoes`, `/admin/integracoes`, `/admin/parametros` |
| **Público** | `/`, `/auth`, `/reset-password`, `/selecionar-perfil`, `/transparencia/mapa-reciclagem` |

---

## 4. Políticas RLS por Tabela

| Tabela | SELECT | INSERT | UPDATE | DELETE |
|--------|--------|--------|--------|--------|
| `benchmark_estados` | Público | Autenticado | Autenticado | — |
| `benchmark_municipios` | Público | Autenticado | Autenticado | — |
| `benchmark_selos` | Público | Autenticado | Autenticado | — |
| `transacoes` | Público | Autenticado | Autenticado | — |
| `lotes` | Público | Autenticado | Autenticado | — |
| `alertas` | Público | Autenticado | Autenticado | — |
| `auditorias` | Público | Autenticado | Autenticado | — |
| `contenedores` | Público | Autenticado | Autenticado | — |
| `contenedor_localizacoes` | Público | Autenticado | Autenticado | — |
| `configuracoes_integracoes` | Autenticado | Autenticado | Autenticado | — |
| `user_roles` | Próprio + Gov | Gov | — | Gov |
| `profiles` | Próprio + Gov | Próprio | Próprio | — |
| `admin_session_logs` | Super Admin | Super Admin | — | — |
| `role_audit_logs` | Gov | Autenticado | — | — |

---

## 5. Tabelas de Parametrização — Endpoints REST (Supabase PostgREST)

As tabelas de parametrização são consumidas diretamente via PostgREST (client SDK):

| Tabela | Operações no Frontend | Página(s) |
|--------|----------------------|-----------|
| `contenedores` | SELECT, INSERT, UPDATE | AdminContenedores, PontoColetaServicos |
| `contenedor_localizacoes` | SELECT, INSERT, UPDATE (com JOIN contenedores) | AdminLocalizacoes, PontoColetaServicos |
| `configuracoes_integracoes` | SELECT, INSERT, UPDATE | AdminIntegracoes |

### Exemplos de Queries

```typescript
// Listar contenedores ativos
supabase.from("contenedores").select("*").eq("ativo", true)

// Listar ecopontos com tipo de contenedor (JOIN)
supabase.from("contenedor_localizacoes").select("*, contenedores(nome, cor, material)")

// Listar integrações por módulo
supabase.from("configuracoes_integracoes").select("*").eq("modulo", "ponto_coleta")
```
