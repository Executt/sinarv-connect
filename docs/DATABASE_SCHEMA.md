# SINARV — Schema do Banco de Dados

Versão: 5.0 | Atualizado: 2026-04-18

---

## Visão Geral

O PostgreSQL utiliza **views com `security_invoker = true`** para segregação lógica dos dados por domínio, emulando schemas independentes. Tabelas core ficam no schema `public`.

---

## 1. `sch_cidadao` — Cidadãos e Coleta

| View | Campos-chave |
|------|-------------|
| `v_usuario_app` | nome_exibicao, email, cpf_hash, tipo_perfil (Cidadão/Catador) |
| `v_coleta_registro` | usuario_id, tipo_material, peso_kg, geolocalizacao, app_origem |
| `v_carteira_creditos` | usuario_id, saldo_pontos_moeda_eco |

---

## 2. `sch_ponto_coleta` — Pontos de Coleta

| View | Campos-chave |
|------|-------------|
| `v_entidade_credenciada` | razao_social, cnpj, natureza_juridica (Privada/Órgão Público), email_contato, telefone |
| `v_estacao_coleta` | endereco, cidade, estado, capacidade_toneladas, status_operacional (Ativo/Inativo/Manutenção), latitude/longitude |
| `v_registro_entrada` | entidade_id, estacao_id, tipo_material, peso_kg, cpf_cidadao, recibo_codigo, origem_anonima, observacoes |
| `v_despacho_lote` | entidade_id, cooperativa_destino_nome/cnpj, peso_total_kg, tipo_material, status |
| `v_metas_orgao_publico` | entidade_id, meta_peso_kg, atingimento_peso_kg, ano_vigencia |

---

## 3. `sch_cooperativa` — Cooperativas de Reciclagem

| View | Campos-chave |
|------|-------------|
| `v_cooperativa` | cnpj, capacidade_processamento, licenca_ambiental |
| `v_catador_associado` | cooperativa_id, nome, cpf_hash, data_associacao, status |
| `v_licenca_cooperativa` | cooperativa_id, tipo, numero, data_validade, status |
| `v_estoque_cooperativa` | cooperativa_id, tipo_material, saldo_kg |
| `v_lote_entrada` | cooperativa_id, origem_tipo, peso_bruto_kg, tipo_material |
| `v_lote_saida_faturado` | cooperativa_id, numero_nota_fiscal, peso_liquido_kg, valor_venda |
| `v_despacho_industria` | cooperativa_id, industria_destino, peso_despachado_kg, token_rastreabilidade, chave_nfe |

**Regra Crítica — Balanço de Massa:** `fn_validar_balanco_massa` impede que peso despachado exceda estoque.

---

## 4. `sch_industria` — Indústrias Recicladoras

| View | Campos-chave |
|------|-------------|
| `v_industria` | razao_social, cnpj, cnae_principal, licenca_operacao |
| `v_meta_pnrs` | industria_id, tipo_material, meta_peso_kg, atingido_peso_kg, ano_referencia |
| `v_lote_recebido` | industria_id, token_rastreabilidade, peso_kg, status, token_validado |
| `v_materia_prima_reciclada` | industria_id, tipo_insumo, peso_kg, comprovante_reaproveitamento |
| `v_certificado_logistica_reversa` | industria_id, volume_total_certificado, hash_auditoria, status (Válido/Expirado/Revogado) |
| `v_api_credential` | industria_id, nome, api_key_prefix, scopes, data_expiracao |
| `v_api_log` | industria_id, endpoint, method, status_code, ip_address |

**Anti-Greenwashing:** `fn_validar_token_rastreabilidade` cruza NF-e indústria ↔ cooperativa.

---

## 5. `sch_governo` — Painel Governamental

| View | Campos-chave |
|------|-------------|
| `v_metrica_planares` | tipo_meta, valor_alvo, valor_atingido, ano_referencia |
| `v_telemetria_consolidada` | estado_ibge, municipio_ibge, volume_total_coletado_ton, volume_total_reciclado_ton |
| `v_auditoria_infracoes` | cnpj_infrator, razao_social, motivo, valor_multa, artigo_pnrs_violado |

---

## 6. `sch_benchmark` — Benchmarks e Rankings

### Tabelas Materializadas

| Tabela | Campos-chave |
|--------|-------------|
| `benchmark_estados` | estado_ibge, uf, nome_estado, populacao, volume_reciclado_ton, volume_coletado_ton, taxa_desvio_aterro, meta_pnrs_cumprida, ano_referencia |
| `benchmark_municipios` | municipio_ibge, nome_municipio, uf, populacao, eficiencia_coleta_seletiva, engajamento_cidadao, pontos_coleta_por_km2, volume_reciclado_ton, taxa_desvio_aterro, ano_referencia |
| `benchmark_selos` | municipio_ibge, nome_municipio, uf, tipo_selo, descricao, data_concessao, ativo |

### Views Analíticas

| View | Finalidade |
|------|-----------|
| `vw_ranking_estadual` | Ranking dos 27 estados por kg/hab/ano com posição automática via `RANK()` |
| `vw_comparativo_municipal` | Dados consolidados para radar chart de comparação entre municípios |

---

## 7. `sch_admin` — Administração

| Tabela | Campos-chave |
|--------|-------------|
| `user_roles` | user_id, role (gov, cooperativa, industria, ponto_coleta, super_admin) |
| `role_audit_logs` | user_id, performed_by, action, role, ip_address |
| `admin_session_logs` | user_id, module_accessed, session_start, ip_address |
| `profiles` | user_id, email, display_name |

**Função de Autorização:** `has_role(_user_id, _role)` — SECURITY DEFINER.

---

## 8. Tabelas Core (public)

| Tabela | Descrição |
|--------|-----------|
| `transacoes` | Transações de movimentação de materiais |
| `lotes` | Lotes de materiais em trânsito |
| `auditorias` | Registros de auditoria de conformidade |
| `alertas` | Alertas e anomalias do sistema |
| `indicadores_sustentabilidade` | KPIs da landing page |
| `cooperativas` | Cadastro simplificado de cooperativas |
| `industrias` | Cadastro simplificado de indústrias |

---

## 9. Tabelas de Parametrização (Módulo Admin)

| Tabela | Descrição | Campos-chave |
|--------|-----------|-------------|
| `contenedores` | Catálogo técnico de tipos de contenedores por material | nome, cor, material, descricao, icone, volumes[], boas_praticas[], ativo |
| `contenedor_localizacoes` | Ecopontos com geolocalização e telemetria | contenedor_id (FK→contenedores), nome_local, endereco, cidade, uf, cep, latitude, longitude, capacidade_litros, status_operacional, nivel_preenchimento, ultima_coleta |
| `configuracoes_integracoes` | Registro de APIs e fontes de dados externas | nome, tipo, url_base, auth_type, auth_header, status, modulo, intervalo_sync_min, ultimo_sync, metadados (JSONB) |

### Relacionamentos

```
contenedores (1) ──────▶ (N) contenedor_localizacoes
     │                         │
     └── id ◀── contenedor_id ─┘
```

### RLS das Tabelas de Parametrização

| Tabela | SELECT | INSERT | UPDATE | DELETE |
|--------|--------|--------|--------|--------|
| `contenedores` | Público | Autenticado | Autenticado | — |
| `contenedor_localizacoes` | Público | Autenticado | Autenticado | — |
| `configuracoes_integracoes` | Autenticado | Autenticado | Autenticado | — |

### Dados Pré-Populados

- **5 tipos de contenedores**: Azul (PMC), Amarelo (Papel/Papelão), Verde (Vidro), Laranja (Orgânicos), Cinza (Rejeitos)
- **30 ecopontos** em 9 capitais brasileiras: SP, RJ, BH, Curitiba, POA, Recife, Salvador, Brasília, Florianópolis
- **5 integrações**: IBGE Localidades, SINIR, ViaCEP, OpenWeatherMap, SEFAZ NF-e

---

## 10. Enums

| Enum | Valores |
|------|---------|
| `app_role` | gov, cooperativa, industria, ponto_coleta, super_admin |
| `alert_severity` | critical, high, medium, low |
| `alert_status` | active, acknowledged, resolved |
| `audit_status` | Conforme, Não Conforme, Pendente, Em Análise |
| `lote_status` | Coletado, Em Processamento, Em Trânsito, Entregue |
| `transaction_status` | Concluída, Em Trânsito, Pendente, Auditoria |

---

## 11. Funções de Banco

| Função | Tipo | Descrição |
|--------|------|-----------|
| `has_role(_user_id, _role)` | SECURITY DEFINER | Verifica role sem recursão RLS |
| `handle_new_user()` | TRIGGER | Cria profile ao registrar usuário |
| `update_updated_at_column()` | TRIGGER | Atualiza timestamp em updates |
