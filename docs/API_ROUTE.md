# SINARV — Rotas de API e Edge Functions

Versão: 5.0 | Atualizado: 2026-04-18

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
| **Administração — Hub** | `/admin/painel` |
| **Admin — Parametrização** | `/admin/contenedores`, `/admin/localizacoes`, `/admin/parametros`, `/admin/regras-negocio`, `/admin/listas-suspensas`, `/admin/acoes-automaticas` |
| **Admin — Sistema/Operacional** | `/admin/inventario-iot`, `/admin/logs`, `/admin/banco-dados` |
| **Admin — Identidade & Acesso** | `/admin/usuarios`, `/admin/perfis-usuario`, `/admin/perfis-entidade`, `/admin/ldap` |
| **Admin — Integrações** | `/admin/integracoes`, `/admin/webhooks`, `/admin/sei`, `/admin/notificacoes` |
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
| `app_regras_negocio` | Admin/Gov | Admin/Gov | Admin/Gov | Admin/Gov |
| `app_listas_suspensas` | Admin/Gov | Admin/Gov | Admin/Gov | Admin/Gov |
| `app_acoes_automaticas` | Admin/Gov | Admin/Gov | Admin/Gov | Admin/Gov |
| `app_logs_sistema` | Admin/Gov | Autenticado | — | — |
| `iot_dispositivos_modelos` | Admin/Gov | Admin/Gov | Admin/Gov | Admin/Gov |
| `iot_dispositivos_instancias` | Admin/Gov | Admin/Gov | Admin/Gov | Admin/Gov |
| `entidades_perfis` | Admin/Gov | Admin/Gov | Admin/Gov | Admin/Gov |
| `usuarios_perfis_extra` | Admin/Gov | Admin/Gov | Admin/Gov | Admin/Gov |
| `ldap_config` | Admin/Gov | Admin/Gov | Admin/Gov | Admin/Gov |
| `ldap_sync_log` | Admin/Gov | Admin/Gov | — | — |
| `integracao_webhooks` | Admin/Gov | Admin/Gov | Admin/Gov | Admin/Gov |
| `integracao_webhook_logs` | Admin/Gov | Autenticado | — | — |
| `integracao_sei` | Admin/Gov | Admin/Gov | Admin/Gov | Admin/Gov |
| `notif_canais` | Admin/Gov | Admin/Gov | Admin/Gov | Admin/Gov |
| `notif_templates` | Admin/Gov | Admin/Gov | Admin/Gov | Admin/Gov |
| `notif_envios` | Admin/Gov | Autenticado | — | — |

> **Admin/Gov** = `has_role(auth.uid(), 'super_admin')` OR `has_role(auth.uid(), 'gov')`

---

## 5. Tabelas de Parametrização — Endpoints REST (Supabase PostgREST)

As tabelas de parametrização são consumidas diretamente via PostgREST (client SDK):

| Tabela | Operações no Frontend | Página(s) |
|--------|----------------------|-----------|
| `contenedores` | SELECT, INSERT, UPDATE | AdminContenedores, PontoColetaServicos |
| `contenedor_localizacoes` | SELECT, INSERT, UPDATE (com JOIN contenedores) | AdminLocalizacoes, PontoColetaServicos |
| `configuracoes_integracoes` | SELECT, INSERT, UPDATE | AdminIntegracoes |
| `app_regras_negocio` | CRUD completo | AdminRegrasNegocio |
| `app_listas_suspensas` | CRUD completo | AdminListasSuspensas |
| `app_acoes_automaticas` | CRUD completo | AdminAcoesAutomaticas |
| `app_logs_sistema` | SELECT (filtros), INSERT (auditoria) | AdminLogs |
| `iot_dispositivos_modelos` | CRUD completo | AdminInventarioIoT |
| `iot_dispositivos_instancias` | CRUD completo (JOIN modelos + localizações) | AdminInventarioIoT |
| `entidades_perfis` | CRUD completo | AdminPerfisEntidade |
| `usuarios_perfis_extra` | CRUD (JOIN profiles) | AdminUsuarios |
| `ldap_config` | CRUD completo | AdminLDAP |
| `integracao_webhooks` | CRUD + invocação | AdminWebhooks |
| `integracao_sei` | CRUD + teste de conexão | AdminSEI |
| `notif_canais` / `notif_templates` | CRUD completo | AdminNotificacoes |

### Exemplos de Queries

```typescript
// Listar contenedores ativos
supabase.from("contenedores").select("*").eq("ativo", true)

// Listar ecopontos com tipo de contenedor (JOIN)
supabase.from("contenedor_localizacoes").select("*, contenedores(nome, cor, material)")

// Listar instâncias IoT com modelo + localização
supabase.from("iot_dispositivos_instancias")
  .select("*, iot_dispositivos_modelos(nome, fabricante), contenedor_localizacoes(nome_local, cidade)")

// Filtrar logs por nível e módulo
supabase.from("app_logs_sistema")
  .select("*")
  .eq("nivel", "error")
  .eq("modulo", "ldap")
  .order("created_at", { ascending: false })
  .limit(100)

// Inserir log de auditoria
supabase.from("app_logs_sistema").insert({
  nivel: "info", modulo: "admin", acao: "user.role.assigned",
  mensagem: "Role gov atribuída", contexto: { user_id, role: "gov" }
})
```

---

## 6. Edge Functions Roadmap (Fase 5+)

| Função | Status | Descrição |
|--------|--------|-----------|
| `webhook-dispatch` | 📋 Planejado | Dispara webhooks de `integracao_webhooks` com retry/backoff e gravação em `integracao_webhook_logs` |
| `notification-send` | 📋 Planejado | Roteia eventos para canais SMTP/Teams/SMS/WhatsApp/Telegram via templates |
| `ldap-sync` | 📋 Planejado | Conecta ao LDAP configurado e sincroniza usuários para `auth.users` + `usuarios_perfis_extra` |
| `sei-integration` | 📋 Planejado | Cliente SOAP/REST para o SEI (cria processo, anexa documento) |

