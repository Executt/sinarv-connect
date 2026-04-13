# SINARV — Documentação Técnica Consolidada

**Sistema Nacional de Rastreabilidade e Valorização de Resíduos Sólidos**

Versão: 2.0 | Atualizado: 2026-04-13

---

## 1. Visão Geral da Arquitetura

### 1.1 Abordagem de Micro-frontends

O SINARV adota uma **arquitetura de micro-frontends visual** onde cada módulo de negócio é isolado logicamente no navegador por meio de um **App Switcher** no Global Header. Cada módulo renderiza seu próprio conjunto de rotas e menus, sem misturar contextos.

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

**Módulos Isolados:**

| Módulo | Prefixo de Rota | Perfil de Acesso |
|--------|-----------------|------------------|
| Governo (PNRS) | `/dashboard/*` | `gov` |
| Cooperativa | `/cooperativa/*` | `cooperativa` |
| Indústria | `/industria/*` | `industria` |
| Ponto de Coleta | `/ponto-coleta/*` | `ponto_coleta` |
| Cidadão | `/transparencia/*` | Público |
| **Super Admin** | Todos | `super_admin` |

### 1.2 Backend Conteinerizado

A camada de backend é composta por **Edge Functions** serverless (Deno) com potencial para migração para microsserviços conteinerizados em OpenShift/OKD ou EC2.

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ API Gateway  │────▶│ Auth Service │────▶│  PostgreSQL  │
│   (Edge Fn)  │     │ (SSO/SERPRO) │     │  (Schemas)   │
└──────┬───────┘     └──────────────┘     └──────────────┘
       │
       ├──▶ fn_b2b_importar_lotes (Indústria)
       ├──▶ fn_admin_users (Gestão)
       └──▶ fn_seed_admin (Bootstrap)
```

---

## 2. Banco de Dados — Schemas Segregados

O PostgreSQL utiliza **views com `security_invoker = true`** para segregação lógica dos dados por domínio, emulando schemas independentes.

### 2.1 `sch_cidadao` (Views: `v_usuario_app`, `v_coleta_registro`, `v_carteira_creditos`)

| Entidade | Campos-chave |
|----------|-------------|
| `v_usuario_app` | nome_exibicao, email, cpf_hash, tipo_perfil (Cidadão/Catador) |
| `v_coleta_registro` | usuario_id, tipo_material, peso_kg, geolocalizacao, app_origem |
| `v_carteira_creditos` | usuario_id, saldo_pontos_moeda_eco |

### 2.2 `sch_ponto_coleta` (Views: `v_entidade_credenciada`, `v_estacao_coleta`, `v_registro_entrada`, `v_despacho_lote`)

| Entidade | Campos-chave |
|----------|-------------|
| `v_entidade_credenciada` | razao_social, cnpj, natureza_juridica (Privada/Órgão Público), creditos_fiscais |
| `v_estacao_coleta` | endereco, cidade, estado, capacidade_toneladas, status_operacional, latitude/longitude |
| `v_registro_entrada` | entidade_id, estacao_id, tipo_material, peso_kg, cpf_cidadao, recibo_codigo |
| `v_despacho_lote` | entidade_id, cooperativa_destino, peso_total_kg, tipo_material, status |
| `v_metas_orgao_publico` | entidade_id, meta_peso_kg, atingimento_peso_kg, ano_vigencia |

### 2.3 `sch_cooperativa` (Views: `v_cooperativa`, `v_catador_associado`, `v_licenca_cooperativa`, `v_estoque_cooperativa`, `v_lote_entrada`, `v_lote_saida_faturado`, `v_despacho_industria`)

| Entidade | Campos-chave |
|----------|-------------|
| `v_cooperativa` | cnpj, capacidade_processamento, licenca_ambiental |
| `v_catador_associado` | cooperativa_id, nome, cpf_hash, data_associacao, status |
| `v_licenca_cooperativa` | cooperativa_id, tipo (Ambiental/Alvará), numero, data_validade, status |
| `v_estoque_cooperativa` | cooperativa_id, tipo_material, saldo_kg |
| `v_lote_entrada` | cooperativa_id, origem_tipo, peso_bruto_kg, tipo_material |
| `v_despacho_industria` | cooperativa_id, industria_destino, peso_despachado_kg, token_rastreabilidade, chave_nfe |
| `v_lote_saida_faturado` | cooperativa_id, numero_nota_fiscal, peso_liquido_kg, valor_venda |

**Regra Crítica — Balanço de Massa:** A função `fn_validar_balanco_massa` impede que o peso despachado exceda o estoque (`v_estoque_cooperativa.saldo_kg`).

### 2.4 `sch_industria` (Views: `v_industria`, `v_meta_pnrs`, `v_lote_recebido`, `v_materia_prima_reciclada`, `v_certificado_logistica_reversa`, `v_api_credential`, `v_api_log`)

| Entidade | Campos-chave |
|----------|-------------|
| `v_industria` | razao_social, cnpj, cnae_principal, licenca_operacao |
| `v_meta_pnrs` | industria_id, tipo_material, meta_peso_kg, atingido_peso_kg, ano_referencia |
| `v_lote_recebido` | industria_id, token_rastreabilidade, peso_kg, status, token_validado |
| `v_certificado_logistica_reversa` | industria_id, volume_total_certificado, hash_auditoria, status (Válido/Expirado/Revogado) |
| `v_api_credential` | industria_id, nome, api_key_prefix, scopes, data_expiracao, status |
| `v_api_log` | industria_id, endpoint, method, status_code, ip_address |

**Anti-Greenwashing:** A função `fn_validar_token_rastreabilidade` cruza a NF-e da indústria com a NF-e de venda da cooperativa para garantir autenticidade.

### 2.5 `sch_governo` (Views: `v_metrica_planares`, `v_telemetria_consolidada`, `v_auditoria_infracoes`)

| Entidade | Campos-chave |
|----------|-------------|
| `v_metrica_planares` | tipo_meta, valor_alvo, valor_atingido, ano_referencia |
| `v_telemetria_consolidada` | estado_ibge, municipio_ibge, volume_total_coletado_ton, volume_total_reciclado_ton |
| `v_auditoria_infracoes` | cnpj_infrator, razao_social_infrator, motivo, valor_multa, artigo_pnrs_violado |

### 2.6 `sch_admin` (Tabelas: `user_roles`, `role_audit_logs`, `admin_session_logs`, `profiles`)

| Entidade | Campos-chave |
|----------|-------------|
| `user_roles` | user_id, role (gov, cooperativa, industria, ponto_coleta, super_admin) |
| `role_audit_logs` | user_id, performed_by, action, role, ip_address |
| `admin_session_logs` | user_id, module_accessed, session_start, ip_address |
| `profiles` | user_id, email, display_name |

**Função de Autorização:** `has_role(_user_id, _role)` — `SECURITY DEFINER` que verifica permissões sem recursão RLS.

---

## 3. Contratos de API (Endpoints)

### 3.1 Autenticação

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

**SSO SERPRO (Futuro):** Integração via SAML 2.0 / OpenID Connect com o broker federalizado do SERPRO (`https://sso.serpro.gov.br`). O fluxo será: Redirect → SERPRO Login → Callback com assertion → JWT emitido pelo SINARV.

### 3.2 Ingestão B2B — Importação de Lotes (Indústria)

```
POST /functions/v1/b2b-importar-lotes
Headers:
  Authorization: Bearer <API_KEY_DA_INDUSTRIA>
  Content-Type: application/json

Request Body:
{
  "lotes": [
    {
      "token_rastreabilidade": "uuid-token-from-cooperativa",
      "cooperativa_cnpj": "12.345.678/0001-90",
      "numero_nota_fiscal": "NF-00123456",
      "chave_nfe": "35...(44 dígitos)",
      "tipo_material": "PET",
      "peso_kg": 5000,
      "data_recebimento": "2026-04-10"
    }
  ]
}

Response 200:
{
  "importados": 1,
  "erros": [],
  "tokens_validados": ["uuid-token-from-cooperativa"]
}

Response 422 (Token inválido):
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

### 3.3 Gestão de Usuários (Admin)

```
POST /functions/v1/admin-users
Headers:
  Authorization: Bearer <JWT_SUPER_ADMIN>

Actions:
  - { "action": "list" }
  - { "action": "assign_role", "user_id": "...", "role": "cooperativa" }
  - { "action": "remove_role", "user_id": "...", "role": "industria" }
```

### 3.4 Rotas do Gateway por Módulo

| Módulo | Rotas Principais |
|--------|-----------------|
| Governo | `GET /dashboard`, `GET /dashboard/rastreabilidade`, `GET /dashboard/auditoria`, `GET /dashboard/alertas`, `GET /dashboard/usuarios`, `GET /dashboard/benchmarks` |
| Cooperativa | `GET /cooperativa/painel`, `POST /cooperativa/recepcao`, `POST /cooperativa/despacho`, `GET /cooperativa/faturamento` |
| Indústria | `GET /industria/dashboard`, `POST /industria/integracao`, `GET /industria/certificados`, `GET /industria/metas-logisticas` |
| Ponto de Coleta | `GET /ponto-coleta/dashboard`, `POST /ponto-coleta/novo-recebimento`, `GET /ponto-coleta/historico`, `POST /ponto-coleta/despacho`, `GET /ponto-coleta/metas`, `GET /ponto-coleta/servicos` |

### 3.5 API Analítica — Benchmarks Municipais

```
GET /functions/v1/comparar-municipios?ibge_codes=3304557,3550308,4106902

Response 200:
{
  "data": [
    {
      "municipio_ibge": "3304557",
      "nome_municipio": "Rio de Janeiro",
      "uf": "RJ",
      "metricas": { "eficiencia_coleta_seletiva": 32.5, "engajamento_cidadao": 18.2, ... },
      "selos": []
    }
  ],
  "meta": { "total": 3, "codigos_nao_encontrados": [] }
}
```

---

## 7. Referência ARP-GAN no Módulo Ponto de Coleta

A página **Serviços e Contenedores** (`/ponto-coleta/servicos`) implementa o modelo da ARP-GAN (Bruxelles-Propreté Pro), extraído de `https://www.pro.arp-gan.be/fr/nos-services`, adaptado ao contexto brasileiro (PNRS/PLANARES):

| Funcionalidade ARP-GAN | Adaptação SINARV |
|------------------------|------------------|
| Collecte sélective (PMC, Verre, Papier, Alimentaire) | Contenedores por cor (Azul, Amarelo, Verde, Laranja, Cinza) |
| Collecte spécifique (WEEE, chimiques) | Coleta Específica (REEE, químicos, RCC, óleos, pneus) |
| Location de conteneurs (240L–36m³) | Escala de Capacidade (120L–36m³ com compactadores) |
| Vente de sacs commerciaux (30L, 50L, 80L) | Sacolas Comerciais Certificadas |
| Nettoyage événementiel | Coleta Eventual / Eventos |
| Suivi et conseil en gestion | Consultoria em Gestão de Resíduos (PGRS) |
| Recypark régionaux (Buda, Demets, Humanité, Sud) | Ecopontos regionais credenciados |
| Résidus refusés (amiante, explosifs, radioactifs) | Itens Proibidos com base legal brasileira (CONAMA, ANVISA) |

---

## 4. Perfil Super Admin

### 4.1 Capacidades

- **App Switcher:** Ícone de grid no Global Header permite navegar entre todos os módulos sem restrição de role.
- **Auditoria:** Todas as ações de alternância de módulo são registradas em `admin_session_logs`.
- **Gestão de Usuários:** Atribuição e remoção de roles via `/dashboard/usuarios`.

### 4.2 Isolamento Visual

Ao selecionar um módulo no App Switcher, o Global Header atualiza dinamicamente:
- O título do módulo ativo
- Os itens de navegação (menu superior) exclusivos daquele módulo
- O conteúdo principal renderiza apenas as páginas daquele domínio

### 4.3 Autenticação SSO SERPRO (Roadmap)

```
Fluxo previsto:
1. Super Admin clica "Entrar com Gov.br"
2. Redirect para SERPRO Broker (SAML 2.0)
3. Autenticação via certificado digital (e-CPF/e-CNPJ)
4. Callback com assertion SAML
5. SINARV valida assertion e emite JWT com role "super_admin"
```

---

## 5. Segurança e DevSecOps

- **RLS (Row-Level Security):** Todas as tabelas possuem políticas RLS ativas.
- **SECURITY DEFINER:** Funções de autorização (`has_role`) executam com privilégios do owner para evitar recursão.
- **Validação de Entrada:** Edge Functions utilizam Zod para validação de payloads.
- **API Keys:** Armazenadas com hash; apenas o prefixo é exposto na UI.
- **Tokens de Rastreabilidade:** UUID v4, imutáveis após emissão, cruzados entre cooperativa e indústria.
- **Auditoria:** Logs de alteração de roles (`role_audit_logs`) e sessões admin (`admin_session_logs`).

---

## 6. Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + TypeScript + Tailwind CSS + shadcn/ui |
| Design System | SAP Fiori (cores e layout) |
| Estado | TanStack React Query |
| Backend | Edge Functions (Deno) + PostgreSQL |
| Auth | JWT + RLS + SSO SERPRO (roadmap) |
| Deploy | Lovable Cloud (Supabase-backed) → OpenShift/OKD (roadmap) |
| Observabilidade | admin_session_logs + role_audit_logs |
