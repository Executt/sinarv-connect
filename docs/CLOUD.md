# SINARV — Infraestrutura Cloud

Versão: 4.0 | Atualizado: 2026-04-14

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
| Mapas | Leaflet (OSM tiles) | Renderização client-side |

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

## 4. Tabelas de Parametrização (Módulo Admin)

Tabelas adicionadas para suportar o módulo de administração:

| Tabela | Registros Iniciais | Descrição |
|--------|--------------------|-----------|
| `contenedores` | 5 tipos (Azul, Amarelo, Verde, Laranja, Cinza) | Catálogo técnico de contenedores |
| `contenedor_localizacoes` | 30 ecopontos em 9 capitais | Geolocalização e telemetria de ecopontos |
| `configuracoes_integracoes` | 5 APIs (IBGE, SINIR, ViaCEP, OpenWeather, SEFAZ) | Registro de integrações externas |

### Dependências de Infraestrutura

| Recurso | Provedor | Uso |
|---------|----------|-----|
| Tiles de Mapa | OpenStreetMap (gratuito) | Leaflet MapContainer em AdminLocalizacoes e PontoColetaServicos |
| PostgREST | Supabase (automático) | CRUD das tabelas via SDK |

---

## 5. Roadmap de Infraestrutura

### 5.1 Migração para OpenShift/OKD

```
Fase 1: Edge Functions → Containers Deno em pods
Fase 2: PostgreSQL managed → PostgreSQL HA em StatefulSet
Fase 3: Frontend → Nginx container com build estático
Fase 4: API Gateway → Traefik/Envoy com rate limiting
```

### 5.2 SSO SERPRO

```
Fluxo:
1. Super Admin clica "Entrar com Gov.br"
2. Redirect para SERPRO Broker (SAML 2.0)
3. Autenticação via certificado digital (e-CPF/e-CNPJ)
4. Callback com assertion SAML
5. SINARV valida assertion e emite JWT com role
```

### 5.3 Observabilidade

| Ferramenta | Uso |
|-----------|-----|
| `admin_session_logs` | Auditoria de sessões |
| `role_audit_logs` | Auditoria de alterações de roles |
| `v_api_log` | Logs de chamadas B2B |
| `configuracoes_integracoes.ultimo_sync` | Monitoramento de sincronização de APIs |
| Prometheus + Grafana (roadmap) | Métricas de infraestrutura |

---

## 6. Referência ARP-GAN — Impacto Cloud

A integração do modelo ARP-GAN no módulo Ponto de Coleta utiliza as tabelas `contenedores` e `contenedor_localizacoes` para armazenar o catálogo de serviços e a geolocalização dos ecopontos. Os dados são gerenciados via módulo Admin (`/admin/contenedores` e `/admin/localizacoes`) e consumidos dinamicamente pelo frontend em `/ponto-coleta/servicos`. O mapa interativo Leaflet renderiza os ecopontos com marcadores coloridos por tipo de resíduo, utilizando tiles gratuitos do OpenStreetMap.
