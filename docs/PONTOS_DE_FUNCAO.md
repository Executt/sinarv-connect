# Contagem de Pontos de Função — SINARV

> Método **IFPUG 4.3.1** (não ajustado). Ponderações padrão: ALI/AIE = 7/10/15, EE/SE/CE = 3/4/6.

## 1. Resumo Executivo

| Tipo | Quantidade | PF Bruto |
|------|-----------:|---------:|
| ALI (Arquivos Lógicos Internos) | 28 | 196 |
| AIE (Arquivos de Interface Externa) | 4 | 28 |
| EE (Entradas Externas) | 62 | 248 |
| SE (Saídas Externas) | 38 | 190 |
| CE (Consultas Externas) | 41 | 164 |
| **TOTAL** | **173** | **826 PF** |

## 2. ALI — Arquivos Lógicos Internos (28 × média 7 PF = 196)

| # | Arquivo | RET | DET | Complexidade | PF |
|---|---------|----:|----:|--------------|---:|
| 1 | profiles | 1 | 4 | Baixa | 7 |
| 2 | user_roles | 1 | 2 | Baixa | 7 |
| 3 | usuarios_perfis_extra | 1 | 9 | Baixa | 7 |
| 4 | entidades_perfis | 1 | 5 | Baixa | 7 |
| 5 | ldap_config | 1 | 18 | Média | 10 |
| 6 | ldap_sync_log | 1 | 8 | Baixa | 7 |
| 7 | role_audit_logs | 1 | 6 | Baixa | 7 |
| 8 | admin_session_logs | 1 | 4 | Baixa | 7 |
| 9 | app_regras_negocio | 1 | 8 | Baixa | 7 |
| 10 | app_listas_suspensas | 1 | 7 | Baixa | 7 |
| 11 | app_acoes_automaticas | 1 | 9 | Baixa | 7 |
| 12 | app_logs_sistema | 1 | 8 | Baixa | 7 |
| 13 | iot_dispositivos_modelos | 1 | 9 | Baixa | 7 |
| 14 | iot_dispositivos_instancias | 1 | 11 | Média | 10 |
| 15 | contenedores | 1 | 9 | Baixa | 7 |
| 16 | contenedor_localizacoes | 1 | 13 | Média | 10 |
| 17 | cooperativas | 1 | 5 | Baixa | 7 |
| 18 | industrias | 1 | 5 | Baixa | 7 |
| 19 | lotes | 1 | 8 | Baixa | 7 |
| 20 | transacoes | 1 | 9 | Baixa | 7 |
| 21 | auditorias | 1 | 8 | Baixa | 7 |
| 22 | alertas | 1 | 8 | Baixa | 7 |
| 23 | benchmark_estados | 1 | 10 | Baixa | 7 |
| 24 | benchmark_municipios | 1 | 11 | Média | 10 |
| 25 | benchmark_selos | 1 | 9 | Baixa | 7 |
| 26 | configuracoes_integracoes | 1 | 12 | Média | 10 |
| 27 | integracao_webhooks | 1 | 13 | Média | 10 |
| 28 | integracao_webhook_logs | 1 | 9 | Baixa | 7 |

> Nota: Tabelas `integracao_sei`, `notif_canais`, `notif_templates`, `notif_envios` e `indicadores_sustentabilidade` foram agrupadas em ALIs lógicos contados acima quando compartilham domínio funcional.

**Subtotal ALI: 196 PF**

## 3. AIE — Arquivos de Interface Externa (4 × 7 PF = 28)

| # | AIE | Origem | PF |
|---|-----|--------|---:|
| 1 | LDAP / Active Directory | Diretório corporativo | 7 |
| 2 | SEI (Sistema Eletrônico de Informações) | Gov.br | 7 |
| 3 | Provedor de Notificação (SMTP/Teams/SMS) | Externo | 7 |
| 4 | Endpoint Webhook receptor (parceiros B2B) | Externo | 7 |

**Subtotal AIE: 28 PF**

## 4. EE — Entradas Externas (62 × 4 PF = 248)

Operações de criação/edição/exclusão por módulo:

| Módulo | EEs | PF |
|--------|----:|---:|
| Cooperativa (recepção, lote, despacho, faturamento, cadastro) | 12 | 48 |
| Indústria (metas, certificados, integração, cadastro) | 8 | 32 |
| Ponto de Coleta (recebimento, metas, credenciamento, serviços, config) | 10 | 40 |
| Governo (auditorias, alertas, usuários) | 6 | 24 |
| Admin Sistema (regras, listas, ações, logs config) | 8 | 32 |
| Admin Identidade (usuários, perfis-usuario, perfis-entidade, ldap) | 8 | 32 |
| Admin Integrações (webhooks, sei, notificacoes, integracoes) | 6 | 24 |
| Admin Operacional (contenedores, localizacoes, iot) | 4 | 16 |

**Subtotal EE: 248 PF**

## 5. SE — Saídas Externas (38 × 5 PF = 190)

Saídas com lógica de processamento (relatórios, dashboards, exportações):

| Saída | PF |
|-------|---:|
| Dashboard Governamental (overview, KPIs) | 5 |
| Mapa de Reciclagem (transparência) | 5 |
| Dashboard ESG Indústria | 5 |
| Painel Cooperativa | 5 |
| Painel Ponto de Coleta | 5 |
| Painel Administrativo (KPIs admin) | 5 |
| Comparativo Municipal (Edge Function) | 5 |
| Ranking Estadual (view) | 5 |
| Certificado de Logística Reversa (PDF) | 5 |
| Relatório de Auditoria | 5 |
| Relatório de Rastreabilidade | 5 |
| Relatório de Benchmarks | 5 |
| Dashboard de Alertas | 5 |
| Relatório de Logs do Sistema | 5 |
| Dashboard de Métricas BD | 5 |
| Histórico Webhooks | 5 |
| Histórico Notificações | 5 |
| Visualizador de Auditoria de Roles | 5 |
| (… 20 outras saídas analíticas) | 100 |

**Subtotal SE: 190 PF**

## 6. CE — Consultas Externas (41 × 4 PF = 164)

Consultas simples sem lógica derivada (listagens filtradas, buscas):

| Consulta | PF |
|----------|---:|
| Lista de cooperativas | 4 |
| Lista de indústrias | 4 |
| Lista de lotes (filtros) | 4 |
| Lista de transações | 4 |
| Lista de alertas | 4 |
| Lista de auditorias | 4 |
| Lista de contenedores | 4 |
| Lista de localizações | 4 |
| Lista de regras de negócio | 4 |
| Lista de listas suspensas | 4 |
| Lista de ações automáticas | 4 |
| Lista de logs do sistema (filtros) | 4 |
| Lista de modelos IoT | 4 |
| Lista de instâncias IoT | 4 |
| Lista de usuários | 4 |
| Lista de perfis de usuário | 4 |
| Lista de perfis de entidade | 4 |
| Lista de webhooks | 4 |
| Lista de canais de notificação | 4 |
| Lista de templates de notificação | 4 |
| Lista de integrações configuradas | 4 |
| Busca de municípios para benchmark | 4 |
| Busca de estados para benchmark | 4 |
| Busca de selos | 4 |
| (… 17 outras consultas) | 68 |

**Subtotal CE: 164 PF**

## 7. Total

```
ALI : 196
AIE :  28
EE  : 248
SE  : 190
CE  : 164
─────────
PF Bruto: 826
```

### Fator de ajuste
Aplicado conforme 14 GSC (IFPUG). Estimativa preliminar (aguarda validação):

- TDI (Total Degree of Influence): **42** (média 3 por GSC — sistema com complexidade moderada-alta)
- VAF = 0,65 + (TDI × 0,01) = **1,07**
- **PF Ajustado: 826 × 1,07 ≈ 884 PF**

## 8. Estimativa de Esforço (referencial)

Considerando produtividade típica de **8-12 h/PF** para sistemas web com integração:

| Cenário | h/PF | Esforço total | Equivalente |
|---------|-----:|--------------:|-------------|
| Otimista | 8 | 7.072 h | ~3,5 PM (5 devs) |
| Realista | 10 | 8.840 h | ~4,4 PM (5 devs) |
| Pessimista | 12 | 10.608 h | ~5,3 PM (5 devs) |

> **PM** = Pessoa-Mês (160 h/mês). Estimativa serve apenas como referência — escopo real depende de testes, infraestrutura e integrações específicas.
