# Módulo de Gestão de Resíduos Críticos (Perigosos + Hospitalares/RSS)

Versão: 1.0 | Autor: Engenharia SINARV | Escopo: geradores (hospitais, clínicas,
indústrias) ↔ operadores logísticos ↔ destinadores finais (SANEMAR, incineradores,
aterros Classe I).

---

## 1. Modelo de Dados (Schemas)

### 1.1 `geradores_criticos` — Hospitais, clínicas, indústrias

```sql
CREATE TABLE public.geradores_criticos (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cnpj                  text NOT NULL UNIQUE,
  razao_social          text NOT NULL,
  tipo_instituicao      text NOT NULL CHECK (tipo_instituicao IN ('hospital_publico','hospital_privado','clinica','industria_publica','industria_privada','laboratorio')),
  natureza              text NOT NULL CHECK (natureza IN ('publica','privada')),
  porte                 text CHECK (porte IN ('pequeno','medio','grande','referencia')),
  alvara_sanitario_num  text NOT NULL,
  alvara_validade       date NOT NULL,
  responsavel_tecnico   jsonb NOT NULL,   -- { nome, tipo_registro: 'CRM'|'CRQ'|'CREA', numero, uf }
  nivel_risco           text NOT NULL CHECK (nivel_risco IN ('I','II','III','IV')),
  ecnpj_thumbprint      text,             -- fingerprint do e-CNPJ A1/A3
  ecnpj_public_key      text,             -- PEM
  endereco              jsonb NOT NULL,
  latitude              numeric(9,6),
  longitude             numeric(9,6),
  volume_mensal_estim   numeric(10,2),    -- kg/mês declarado — base para anomalia
  ativo                 boolean NOT NULL DEFAULT true,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);
```

### 1.2 `operadores_logisticos` — Coleta / tratamento / destinação

```sql
CREATE TABLE public.operadores_logisticos (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cnpj                   text NOT NULL UNIQUE,
  razao_social           text NOT NULL,
  natureza               text NOT NULL CHECK (natureza IN ('publica','privada')),
  papel                  text NOT NULL CHECK (papel IN ('coleta','tratamento','destinacao_final','integrado')),
  grupos_homologados     text[] NOT NULL,  -- {'A','B','C','D','E'} (RDC ANVISA 222/2018)
  capacidade_kg_dia      numeric(12,2),
  capacidade_tancagem_l  numeric(12,2),
  capacidade_incineracao numeric(12,2),
  latitude               numeric(9,6),
  longitude              numeric(9,6),
  ativo                  boolean NOT NULL DEFAULT true,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.licencas_ambientais (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operador_id       uuid NOT NULL REFERENCES public.operadores_logisticos(id) ON DELETE CASCADE,
  tipo              text NOT NULL CHECK (tipo IN ('LP','LI','LO','LAU','autorizacao_transporte')),
  numero            text NOT NULL,
  orgao_emissor     text NOT NULL,   -- IBAMA, INEA, CETESB, etc.
  emitida_em        date NOT NULL,
  valida_ate        date NOT NULL,
  status            text NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa','suspensa','revogada')),
  documento_url     text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.veiculos_homologados (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operador_id       uuid NOT NULL REFERENCES public.operadores_logisticos(id) ON DELETE CASCADE,
  placa             text NOT NULL UNIQUE,
  renavam           text,
  grupos_permitidos text[] NOT NULL,
  capacidade_kg     numeric(10,2),
  tracker_id        text UNIQUE,       -- FK lógica para telemetria
  antt_num          text,              -- transporte de perigosos
  antt_validade     date,
  ativo             boolean NOT NULL DEFAULT true
);
```

### 1.3 Regra crítica — bloqueio por licença vencida

```sql
CREATE OR REPLACE FUNCTION public.fn_operador_licenca_valida(_operador_id uuid, _grupo text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.licencas_ambientais l
    JOIN public.operadores_logisticos o ON o.id = l.operador_id
    WHERE l.operador_id = _operador_id
      AND l.tipo IN ('LO','LAU')
      AND l.status = 'ativa'
      AND l.valida_ate >= current_date
      AND _grupo = ANY(o.grupos_homologados)
  );
$$;

-- Aplicada como CHECK via trigger BEFORE INSERT/UPDATE em mtr_solicitacoes:
--   IF NOT fn_operador_licenca_valida(NEW.operador_id, NEW.grupo_anvisa) THEN
--     RAISE EXCEPTION 'operador_sem_licenca_valida';
--   END IF;
```

### 1.4 MTR eletrônico e custódia

```sql
CREATE TYPE public.mtr_status AS ENUM (
  'solicitada','aceita','em_coleta','em_transito','em_tratamento','destinacao_confirmada','recusada','cancelada'
);

CREATE TABLE public.mtr_solicitacoes (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_mtr            text NOT NULL UNIQUE,  -- gerado: SINARV-YYYYMMDD-XXXXXX
  gerador_id            uuid NOT NULL REFERENCES public.geradores_criticos(id),
  operador_id           uuid REFERENCES public.operadores_logisticos(id),
  destino_final_id      uuid REFERENCES public.operadores_logisticos(id),
  grupo_anvisa          text NOT NULL CHECK (grupo_anvisa IN ('A','B','C','D','E')),
  tipologia             text NOT NULL,          -- 'infectante','quimico','radioativo','perfurocortante','comum'
  peso_estimado_kg      numeric(10,2) NOT NULL,
  peso_coletado_kg      numeric(10,2),
  peso_destino_kg       numeric(10,2),
  status                mtr_status NOT NULL DEFAULT 'solicitada',
  janela_coleta_inicio  timestamptz,
  janela_coleta_fim     timestamptz,
  assinatura_gerador    jsonb,   -- { alg:'RSA-SHA256', signature, cert_thumbprint, signed_at }
  assinatura_operador   jsonb,
  assinatura_destino    jsonb,
  hash_cadeia_custodia  text,    -- SHA-256 concatenado das 3 assinaturas
  veiculo_id            uuid REFERENCES public.veiculos_homologados(id),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);
```

**RLS**: gerador vê apenas suas MTRs (via `user_roles` + `gerador_usuarios`);
operador vê MTRs onde é `operador_id` ou `destino_final_id`; `gov`/`super_admin`
veem tudo.

---

## 2. API — Microsserviços de Comunicação

Base: `https://<project>.functions.supabase.co` (edge) e `POST /rest/v1/*`
(Data API). Em produção OpenShift substituir por um API Gateway (Kong/APISIX).

### 2.1 `POST /mtr` — solicitação de coleta (geração de MTR)

```http
POST /functions/v1/mtr
Authorization: Bearer <JWT do gerador>
Content-Type: application/json
X-Signature: base64(RSA-SHA256(payload)) com e-CNPJ do gerador

{
  "gerador_id": "9c...uuid",
  "grupo_anvisa": "A",
  "tipologia": "infectante",
  "peso_estimado_kg": 340.5,
  "janela_coleta": { "inicio": "2026-07-08T08:00:00-03:00", "fim": "2026-07-08T12:00:00-03:00" },
  "operador_id_sugerido": "1d...uuid"
}

201 Created
{
  "numero_mtr": "SINARV-20260707-8F2A11",
  "status": "solicitada",
  "hash_documento": "sha256:...",
  "publicado_em_topico": "rss.mtr.eventos"
}
```

Backend valida: assinatura X-Signature contra `geradores_criticos.ecnpj_public_key`,
alvará vigente, `fn_operador_licenca_valida` para o operador sugerido.

### 2.2 `PATCH /mtr/{numero}/aceite` — aceite pelo operador + custódia

```http
PATCH /functions/v1/mtr/SINARV-20260707-8F2A11/aceite
Authorization: Bearer <JWT do operador>
X-Signature: base64(RSA-SHA256(payload)) com e-CNPJ do operador

{
  "veiculo_placa": "RSS-2026",
  "motorista_cpf_hash": "sha256:...",
  "eta_coleta": "2026-07-08T09:15:00-03:00"
}

200 OK
{ "status": "aceita", "hash_cadeia_custodia": "sha256:..." }
```

Outros verbos: `PATCH /mtr/{n}/coleta` (pesagem real), `/mtr/{n}/destino`
(confirmação de recebimento no destinador — fecha a cadeia).

### 2.3 Mensageria — tópicos Kafka canônicos

| Tópico | Chave | Retenção | Uso |
|--------|-------|----------|-----|
| `rss.mtr.eventos` | `numero_mtr` | 90 dias | Emissão / mudança de status de MTRs |
| `rss.telemetria.frota` | `tracker_id` | 7 dias | Ping GPS a cada 5s |
| `rss.alertas.criticos` | `veiculo_id` | 365 dias | Saída de fantasy: desvio, porta aberta, peso |
| `rss.custodia.assinaturas` | `numero_mtr` | permanente (Data Lake) | Cada assinatura vira evento imutável |

**Contrato `rss.telemetria.frota` (JSON)** — igual ao body de `POST /ingest-telemetria`:

```json
{
  "tracker_id": "TRK-001",
  "numero_mtr": "SINARV-20260707-8F2A11",
  "lat": -22.9068, "lng": -43.1729,
  "velocidade_kmh": 62.5,
  "peso_carga_kg": 340.2,
  "status_porta": "fechada",
  "temperatura_bau_c": 4.8,
  "capturado_em": "2026-07-07T14:32:15Z"
}
```

Consumers:
- **Flink/Kafka Streams `geofencing-processor`** → produz `rss.alertas.criticos`
- **Sink Postgres** → grava último ping em `telemetria_frota` (hot store)
- **Sink S3/OCI Object Storage** → Data Lake em parquet particionado por dia (cold)

Simulação atual em Lovable Cloud: `POST /ingest-telemetria` faz o papel dos
3 consumers em uma única edge function.

### 2.4 Assinatura digital e-CNPJ

- Gerador possui certificado A1/A3 ICP-Brasil.
- Frontend usa Web Crypto API + extensão `WebPKI`/`Assinador Serpro` para
  assinar canonicalizado JSON do body (JCS RFC 8785).
- Backend valida com `crypto.subtle.verify('RSASSA-PKCS1-v1_5', publicKey, sig, payload)`
  e armazena `{ signature, cert_thumbprint }` em `mtr_solicitacoes.assinatura_*`.
- Cadeia de custódia = `sha256(sig_gerador || sig_operador || sig_destino)` gravada
  no fechamento e no Data Lake como prova imutável.

---

## 3. Dashboard "Radar-Rejeitos" — Correções e UI

### 3.1 Real-time sem F5

- Consumer WebSocket dedicado por navegador se conectando ao **Supabase Realtime**
  (canal `radar-rejeitos`) — que hoje é alimentado pelas tabelas
  `telemetria_frota` e `alertas_geofencing`.
- Migração para produção: substituir o canal Supabase por um endpoint SSE
  (`GET /stream/radar` `text/event-stream`) alimentado por um consumer Kafka
  do tópico `rss.telemetria.frota` + `rss.alertas.criticos`.
- Frontend usa o mesmo shape de evento nos dois cenários → nada muda na UI.

### 3.2 Painel de Camadas (Toggle View)

Controle `L.control.layers` (canto superior direito) com 4 camadas + rotas:

| Toggle | Cor | Fonte |
|--------|-----|------|
| 🏥 Hospitais geradores | ciano `#00E5FF` | `geradores_criticos` |
| 🟢 Ecopontos / destinações | verde `#00FF88` | `operadores_logisticos.papel IN ('tratamento','destinacao_final')` |
| ⚠️ Lixões clandestinos (denúncias) | vermelho `#FF3355` | `denuncias_ambientais` (roadmap) |
| 🚛 Frotas em movimento | roxo neon `#B266FF` (pulsa em vermelho em alerta) | `telemetria_frota` Realtime |

### 3.3 Widget de Red Flag (topo fixo)

Componente `<RedFlagBanner />` fixado abaixo do header, com:

- Fundo `bg-destructive` piscando (`animate-pulse`) sempre que existir alerta
  `status='active'` e `severidade IN ('critical','high')`.
- **Alerta sonoro**: `new Audio('/alerts/siren.mp3').play()` disparado no
  primeiro alerta novo (deduplicado por id) — respeita `prefers-reduced-motion`
  e política de autoplay (usuário precisa ter interagido com a página).
- Botões inline: "Ver no mapa" (centraliza o Leaflet no ping) e "Reconhecer".
- Casos cobertos:
  - **(a) Desvio de rota** — detecção pela edge function `ingest-telemetria`.
  - **(b) Volume incompatível** — job diário compara
    `SUM(mtr.peso_estimado_kg) mês corrente` vs `geradores_criticos.volume_mensal_estim`;
    fora do intervalo `[0.4×, 1.6×]` gera alerta `volume_incompativel`.

### 3.4 Dark Mode Governamental + neon

- Tile layer trocado para **CartoDB Dark Matter** em modo `.dark`:
  `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png`.
- Tokens (em `index.css`):
  ```css
  .dark {
    --radar-bg: 220 30% 6%;
    --radar-fleet: 275 90% 65%;    /* roxo neon */
    --radar-fleet-alert: 0 95% 60%; /* vermelho neon */
    --radar-generator: 190 100% 55%;
    --radar-destino: 145 100% 50%;
    --radar-irregular: 350 100% 60%;
  }
  ```
- Marcadores em `divIcon` usam `filter: drop-shadow(0 0 6px currentColor)`
  para efeito neon, mantendo contraste AA sobre o mapa escuro.

### 3.5 Wireframe

```
┌─────────────────────────────────────────────────────────────────┐
│  Global Header                                                  │
├─────────────────────────────────────────────────────────────────┤
│  🚨 RED-FLAG BANNER  (piscante quando alerta ativo)             │
│  ⚠ 2 alertas críticos: RSS-2026 desviou 3.4km  [Ver] [Reconh.]  │
├──────────┬──────────────────────────────────────────────────────┤
│ KPI cards│ Frota ativa • Cargas em trânsito • Alertas • Pings   │
├──────────┴──────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────┐ ┌───────────┐  │
│ │                                              │ │ Camadas   │  │
│ │           MAPA LEAFLET DARK                  │ │ ☑ Hosp.   │  │
│ │        (Brasil bounds, neon markers)         │ │ ☑ Destino │  │
│ │                                              │ │ ☑ Irregul.│  │
│ │                                              │ │ ☑ Frota   │  │
│ │                                              │ │ ☐ Rotas   │  │
│ └──────────────────────────────────────────────┘ └───────────┘  │
├─────────────────────────────────────────────────────────────────┤
│  Tabela: Alertas de Geofencing (últimos 50)                     │
├─────────────────────────────────────────────────────────────────┤
│  Tabela: Cargas monitoradas                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Roadmap curto

1. Criar `geradores_criticos`, `operadores_logisticos`, `licencas_ambientais`,
   `veiculos_homologados`, `mtr_solicitacoes` + trigger de bloqueio por licença.
2. Edge function `mtr` (POST + PATCH) com verificação de assinatura e-CNPJ.
3. Job diário `detectar-volume-incompativel` gerando alertas em `alertas_geofencing`.
4. Trocar tiles do Radar para CartoDB Dark + banner de red-flag + som.
5. Migrar consumers para Kafka + SSE quando OpenShift estiver disponível.
