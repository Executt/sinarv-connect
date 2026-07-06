# Radar de Rejeitos — Telemetria de Cargas Perigosas

Versão: 1.0 | Módulo: `/dashboard/radar-rejeitos` | Acesso: `gov`, `super_admin`

---

## 1. Objetivo

Transformar o mapa estático do SINARV em um **Centro de Comando e Controle** para
monitoramento em tempo real de cargas de **resíduos perigosos, hospitalares (RSS)
e químicos**, cruzando manifestos de destinação com telemetria de frota.

## 2. Camadas do Mapa

| # | Camada | Cor | Fonte |
|---|--------|-----|-------|
| 1 | Destinações finais (incineradores, aterros Classe I) | 🟢 Verde | `rotas_planejadas.destino_*` |
| 2 | Demanda comunitária (heatmap de solicitações) | 🟠 Laranja | mock (roadmap: agregação de descartes) |
| 3 | Descarte irregular / crimes ambientais | 🔴 Vermelho | mock (roadmap: `denuncias_ambientais`) |
| 4 | Frota em tempo real (caminhões) | 🟣 Roxo pulsante | `telemetria_frota` via Realtime |

Ícone da frota pisca em **vermelho** quando há alerta ativo de severidade `high`/`critical`
associado ao veículo.

## 3. Modelo de Dados

| Tabela | Papel |
|--------|------|
| `veiculos_frota` | Cadastro de caminhões (placa, tracker_id, transportadora) |
| `cargas_perigosas` | Manifestos: categoria, origem, destino, pesos declarado/origem/destino |
| `rotas_planejadas` | Waypoints + `raio_tolerancia_m` (default 2000 m) |
| `telemetria_frota` | Pings GPS append-only (Realtime habilitado) |
| `alertas_geofencing` | Alertas gerados pela edge function (Realtime habilitado) |

RLS restringe visualização a `gov` e `super_admin`. Ingestão usa `service_role`.

## 4. Regras de Alerta (Geofencing)

Aplicadas pela edge function `ingest-telemetria` a cada ping:

- **desvio_rota** (`critical`) — ping a mais de `raio_tolerancia_m` da linha origem→waypoints→destino
- **porta_aberta** (`high`) — `status_porta = 'aberta'` durante trânsito
- **peso_divergente** (`critical`) — `peso_carga_kg < peso_origem_kg × 0.95` (perda >5%)
- **parada_nao_autorizada** (`medium`) — roadmap (velocidade 0 por >N min fora de destino)

## 5. Ingestão de Telemetria

### Endpoint

```
POST https://<project>.functions.supabase.co/ingest-telemetria
Content-Type: application/json
x-ingest-token: <INGEST_TOKEN>  # opcional em dev, obrigatório em produção
```

### Payload

```json
{
  "tracker_id": "TRK-001",
  "lat": -22.9068,
  "lng": -43.1729,
  "peso_carga_kg": 1200,
  "status_porta": "fechada",
  "velocidade_kmh": 62.5,
  "carga_id": "uuid opcional; senão usa a última carga em_transito do veículo"
}
```

Cadastre o segredo `INGEST_TOKEN` (gerado aleatoriamente) e configure-o nos
rastreadores IoT / gateway.

## 6. Arquitetura de Referência (Kafka)

A implementação atual **simula** o pipeline Kafka usando **HTTP + Supabase Realtime**.
Em produção OpenShift/Cloud a topologia alvo é:

```
Trackers IoT (JSON, 3s)
        ↓
API Gateway (autenticação por certificado / token)
        ↓
Kafka topic: telemetria.frota.perigosos
        ├──► Kafka Streams / Flink  → regras geofencing
        │            ↓
        │      topic: alertas.seguranca ──► SINARV (WebSocket) + SMS/e-mail
        └──► Sink S3/OCI → Data Lake (auditoria histórica, ML)
```

O **contrato de eventos** JSON é o mesmo do endpoint HTTP acima — plugar um
Kafka Connect HTTP Sink para `telemetria.frota.perigosos → POST /ingest-telemetria`
migra o pipeline sem alterar a UI.

## 7. Prompt de IA — Auditor de Conformidade Logística

O prompt canônico usado pelos agentes analíticos vive em `mem://features/radar-rejeitos-prompt`
(a ser criado). Estrutura: ORIGEM, CLASSIFICAÇÃO, VOLUME/COMPLIANCE, RASTREAMENTO,
com "Red Flag" para desvio >2 km ou perda de peso >5%.

## 8. Roadmap

- [ ] Substituir mocks das camadas 2 e 3 por tabelas reais (`demanda_descarte`, `denuncias_ambientais`)
- [ ] WebSocket dedicado + broker Kafka (fase OpenShift)
- [ ] Sink no Data Lake para telemetria de mais de 30 dias
- [ ] Integração com Defesa Civil / SEFAZ para autuação automática
