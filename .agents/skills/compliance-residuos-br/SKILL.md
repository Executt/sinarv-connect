---
name: compliance-residuos-br
description: Regras regulatórias brasileiras de resíduos sólidos (PNRS/Lei 12.305, Decreto 10.936/2022, MTR nacional do SINIR, Norma de Referência ANA nº 3/2022, SNIS/SINISA, Planares, Lei 14.026/2020) aplicadas ao SINARV. Usar ao criar ou alterar rastreabilidade, MTR, certificados de logística reversa, metas, indicadores de conformidade ou exportações regulatórias.
---

# Conformidade regulatória de resíduos (Brasil) no SINARV

## Nomenclatura correta (erros comuns a evitar)

| Errado | Correto |
|---|---|
| "SINARV é o sistema federal de rastreabilidade" | SINARV é **esta plataforma** (produto). O sistema federal é o **SINIR** (Sistema Nacional de Informações sobre a Gestão dos Resíduos Sólidos), operado pelo MMA. |
| "API do SINARV emite MTR" | O **MTR nacional** é emitido no módulo MTR do SINIR (Portaria MMA nº 280/2020). Estados podem ter sistemas próprios (ex.: SIGOR-SP, MTR-MG/FEAM, INEA-RJ). Integração é **externa**. |
| "P NRS" | **PNRS** — Política Nacional de Resíduos Sólidos, Lei 12.305/2010, regulamentada hoje pelo **Decreto 10.936/2022** (revogou o Decreto 7.404/2010). |
| "SNIS coleta os dados" | O SNIS está sendo substituído pelo **SINISA** (Sistema Nacional de Informações em Saneamento Básico), Lei 14.026/2020. Séries históricas: SNIS; coleta corrente: SINISA. |
| "Norma ANA nº 3/2022 define metas de reciclagem" | A **NR ANA nº 3/2022** (Resolução ANA nº 79/2022) trata de **cobrança/sustentabilidade econômico-financeira** dos serviços de limpeza urbana e manejo de RSU. Metas de reciclagem vêm do **Planares** (Decreto 11.043/2022) e dos planos municipais. |
| "adesão às normas ANA obrigatória desde 2025" | A adesão é **condicionante de acesso a recursos federais** (art. 4º-B da Lei 9.984/2000, incluído pela Lei 14.026/2020). Não afirmar data-limite sem fonte. |

## Hierarquia normativa a respeitar no código

1. **Lei 12.305/2010 (PNRS)** — responsabilidade compartilhada, logística reversa, destinação ambientalmente adequada, rastreabilidade.
2. **Lei 14.026/2020 (Novo Marco do Saneamento)** — ANA edita normas de referência; prazos de fim de lixões escalonados por porte populacional (art. 54 da Lei 12.305 alterado): 2021 capitais/RM, 2022 >100k hab, 2023 50k–100k, 2024 <50k hab.
3. **Decreto 10.936/2022** — regulamenta a PNRS, define sistemas de logística reversa e certificados.
4. **Planares (Decreto 11.043/2022)** — metas nacionais de recuperação de recicláveis e desvio de aterro.
5. **NR ANA nº 3/2022** — cobrança, custo por tonelada, sustentabilidade financeira.
6. **Portaria MMA nº 280/2020** — MTR nacional; obrigatório para resíduos perigosos e RSS (RDC ANVISA 222/2018 + CONAMA 358/2005).

## Invariantes de domínio (validar sempre)

- **Rastreabilidade é encadeada**: gerador → transportador → destinador. Nenhum registro de destinação pode existir sem MTR de origem correspondente. Divergência de peso origem/destino > 5% → evento de auditoria (ver `docs/REGRAS_NEGOCIO.md` R-LT-05).
- **MTR só é aprovado** se o operador/transportador tiver licença ambiental **vigente na data do transporte** (não na data da consulta). Licença vencida ⇒ bloqueio automático da emissão.
- **Certificado de logística reversa** exige atingimento ≥ 100% da meta do ano de referência e hash de auditoria imutável.
- **Massa não pode ser criada**: despacho ≤ estoque (`fn_validar_balanco_massa`). Vale para lote, cooperativa e indústria.
- **CPF/CNPJ de cidadão** sempre em hash; CNPJ de pessoa jurídica pode ser claro (dado público).
- **Logs regulatórios são append-only** e retidos ≥ 5 anos (LGPD art. 16 II + prestação de contas PNRS).

## Indicadores canônicos (fórmulas)

- Taxa de recuperação de recicláveis = `massa_recuperada / massa_total_coletada`
- Taxa de desvio de aterro = `(coletado − disposto_aterro) / coletado`
- kg per capita/ano = `volume_reciclado_ton × 1000 / populacao`
- Custo por tonelada (NR ANA 3/2022) = `despesa_total_servico / massa_total_coletada`
- Cobertura de coleta seletiva = `populacao_atendida_seletiva / populacao_urbana`
- CO₂e evitado: usar fator por material (t CO₂e/t reciclada); **nunca** um fator único global.

## Como aplicar no SINARV

- Integrações externas (SINIR/MTR, SINISA, IBGE, SEFAZ NF-e) vivem em `configuracoes_integracoes` + Edge Function dedicada. Nunca chamar API externa direto do browser.
- Toda emissão/alteração de MTR grava em `residuos_criticos_auditoria`; toda ação administrativa em `app_logs_sistema`.
- Parâmetros regulatórios variáveis (metas, limites, fatores CO₂e, prazos) vão em `app_regras_negocio` / `economia_fatores_material` — **não hardcode em componente React**.
- Exportações regulatórias (CSV/PDF) devem carimbar: data/hora, usuário, filtros aplicados e fonte dos dados.

Detalhamento de roadmap e lacunas: `references/roadmap-sinarv.md`.
