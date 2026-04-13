# SINARV — Infraestrutura Cloud

Versão: 3.0 | Atualizado: 2026-04-13

---

## 1. Ambiente Atual

| Componente | Tecnologia | Observação |
|-----------|-----------|-----------|
| Frontend Hosting | Lovable Cloud | Preview + Publish automáticos |
| Banco de Dados | PostgreSQL (Supabase-managed) | Com RLS ativo em todas as tabelas |
| Edge Functions | Deno (Supabase Edge) | Deploy automático |
| Autenticação | Supabase Auth (JWT) | Com email verification |
| Storage | Supabase Storage | Buckets configuráveis |
| DNS / CDN | Lovable Cloud | `sinarv-connect.lovable.app` |

---

## 2. Edge Functions Deployadas

| Função | Endpoint | Descrição |
|--------|----------|-----------|
| `admin-users` | `POST /functions/v1/admin-users` | CRUD de roles (list, assign, remove) |
| `b2b-importar-lotes` | `POST /functions/v1/b2b-importar-lotes` | Ingestão B2B de lotes da indústria |
| `comparar-municipios` | `GET /functions/v1/comparar-municipios` | API analítica de benchmarks municipais |
| `seed-admin` | `POST /functions/v1/seed-admin` | Bootstrap do super admin |

---

## 3. Secrets Configurados

| Secret | Uso |
|--------|-----|
| `SUPABASE_URL` | URL do projeto |
| `SUPABASE_ANON_KEY` | Chave pública (anon) |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave admin (service role) |
| `SUPABASE_PUBLISHABLE_KEY` | Chave publicável |
| `SUPABASE_DB_URL` | Connection string do banco |
| `LOVABLE_API_KEY` | Chave do gateway Lovable AI |

---

## 4. Roadmap de Infraestrutura

### 4.1 Migração para OpenShift/OKD

```
Fase 1: Edge Functions → Containers Deno em pods
Fase 2: PostgreSQL managed → PostgreSQL HA em StatefulSet
Fase 3: Frontend → Nginx container com build estático
Fase 4: API Gateway → Traefik/Envoy com rate limiting
```

### 4.2 SSO SERPRO

```
Fluxo:
1. Super Admin clica "Entrar com Gov.br"
2. Redirect para SERPRO Broker (SAML 2.0)
3. Autenticação via certificado digital (e-CPF/e-CNPJ)
4. Callback com assertion SAML
5. SINARV valida assertion e emite JWT com role
```

### 4.3 Observabilidade

| Ferramenta | Uso |
|-----------|-----|
| `admin_session_logs` | Auditoria de sessões |
| `role_audit_logs` | Auditoria de alterações de roles |
| `v_api_log` | Logs de chamadas B2B |
| Prometheus + Grafana (roadmap) | Métricas de infraestrutura |

---

## 5. Referência ARP-GAN — Impacto Cloud

A integração do modelo ARP-GAN no módulo Ponto de Coleta não exigiu novas tabelas ou Edge Functions, pois o catálogo de serviços e contenedores é implementado como conteúdo estático baseado em dados de referência extraídos de `https://www.pro.arp-gan.be/fr/nos-services`. Futuramente, a tabela `benchmark_municipios` pode ser expandida para incluir métricas inspiradas no modelo ARP-GAN (ex: número de contenedores por tipo por estação).
