# Lacunas e evoluções — leitura de engenharia

Estado atual do SINARV (módulos já implementados) e o que cada proposta do relatório de negócio exige de fato.

## 1. Integração SINIR/MTR (proposta "integração nativa SINARV")
- **Já existe**: `mtr_solicitacoes` com fluxo `rascunho → enviado → em análise → aprovado → bloqueado`, numeração serializada, auditoria por trigger.
- **Falta**: conector real. O SINIR não expõe API pública documentada e estável; estados usam sistemas distintos. Implementar como **adapter por UF** atrás de uma interface única (`emitirMtr(payload) → { numero, protocolo }`), com modo `mock` default e credenciais em secrets.
- **Risco**: acoplar a UI a um formato de MTR específico de um estado. Manter DTO interno canônico e mapear na borda.

## 2. Painel ANA NR 3/2022
- **Já existe**: benchmarks por estado/município, `vw_economia_estado`, indicadores PNRS de lixões.
- **Falta**: dimensão **financeira** (despesa do serviço, receita de taxa/tarifa, custo por tonelada). Requer nova tabela `financeiro_servico_municipal` (municipio_ibge, ano, despesa_total, receita_taxa, massa_coletada_ton) alimentada por importação SNIS/SINISA.
- **Simulador tarifário** é cálculo puro — deve ser função pura testável em `src/lib/`, não lógica em componente.

## 3. Checagem contratual/licitatória
- Alto custo, baixo retorno imediato. Depende de NLP sobre contratos. **Recomendação: adiar.** Substituir por um *checklist* estruturado de cláusulas (tabela `contrato_checklist_itens`) — 5% do esforço, 80% do valor.

## 4. Créditos e ESG
- **Já existe**: certificados de logística reversa, `economia_fatores_material`.
- **Falta**: fator CO₂e por material e o campo de metodologia/fonte. Adicionar colunas `co2e_evitado_por_ton` e `fonte_fator` em `economia_fatores_material`; sem citar fonte, o número é indefensável em auditoria ESG.

## 5. Inteligência regulatória ("news")
- Casa com o módulo de IA já existente (`ai_agentes`, `ai_base_conhecimento`). Implementar como agente com RAG sobre uma base curada de normas — **nunca** deixar o LLM afirmar prazos legais sem citar o documento-fonte indexado.

## Ordem recomendada
1. Fatores CO₂e com fonte (baixo esforço, desbloqueia ESG).
2. Camada financeira ANA + custo por tonelada.
3. Adapter de MTR com mock e um estado real.
4. Agente regulatório RAG.
5. Checklist contratual.
