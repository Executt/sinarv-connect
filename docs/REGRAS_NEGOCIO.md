# Regras de Negócio — SINARV

> Regras de domínio aplicadas à plataforma. Regras configuráveis ficam em `app_regras_negocio` (tipadas e versionadas); regras invariáveis ficam codificadas em RLS, triggers ou Edge Functions.

## 1. Identidade & Acesso

- **R-IA-01** Cada usuário pode possuir múltiplos papéis (`user_roles`); na ausência de papel, acesso restrito ao portal público.
- **R-IA-02** O papel `super_admin` concede acesso transversal a todos os módulos via `useAuth().hasRole()`.
- **R-IA-03** Atribuição/remoção de papel só pode ser executada por `super_admin` ou `gov`, sempre via Edge Function `admin-users`, e gera registro em `role_audit_logs`.
- **R-IA-04** Papéis são armazenados exclusivamente em `user_roles` — nunca em `profiles`.
- **R-IA-05** Quando LDAP está ativo e `cadastro_automatico = true`, usuários autenticados via LDAP são criados em `auth.users` + `profiles` + `usuarios_perfis_extra` na primeira autenticação. Mapeamento `grupo LDAP → app_role` vem de `ldap_config.mapeamento_grupos`.
- **R-IA-06** Senha de bind LDAP nunca é armazenada em texto puro — `bind_password_secret_ref` aponta para um segredo gerenciado.

## 2. Lotes e Transações

- **R-LT-01** Todo lote tem código único (`lotes.codigo`) gerado pelo emissor.
- **R-LT-02** Etapas válidas: `Coletado` → `Em Processamento` → `Em Trânsito` → `Entregue`. Saltos para trás exigem permissão de auditor.
- **R-LT-03** Peso mínimo aceitável é parametrizado em `app_regras_negocio` (chave `peso_minimo_lote_kg`, default 1).
- **R-LT-04** Ao avançar de `Em Trânsito` para `Entregue`, deve existir transação correspondente em `transacoes` com `status = 'Concluída'`.
- **R-LT-05** Discrepâncias de peso entre origem e destino acima de 5% disparam evento `transacao.divergencia_peso` para auditoria.

## 3. Auditoria

- **R-AU-01** Auditoria deve ter `entidade`, `tipo`, `auditor`, `data` obrigatórios.
- **R-AU-02** Pontuação varia de 0 a 100. Acima de 80 → `Conforme`; 50-80 → `Em Análise`; abaixo de 50 → `Não Conforme`.
- **R-AU-03** Auditoria `Não Conforme` gera alerta automático de severidade `high`.
- **R-AU-04** Auditorias não podem ser excluídas — apenas marcadas como `Pendente` para revisão.

## 4. Alertas

- **R-AL-01** Severidade segue escala `low` < `medium` < `high` < `critical`.
- **R-AL-02** Alertas `critical` aparecem no painel admin e disparam notificações nos canais configurados.
- **R-AL-03** Status flui `active` → `acknowledged` → `resolved` (sem retorno a `active`).
- **R-AL-04** Alertas resolvidos mantêm histórico — não há exclusão.

## 5. Indústria — Metas e Certificados

- **R-IN-01** Meta PNRS é calculada por `(material, ano_referencia)` em `v_meta_pnrs`. Atingimento = `atingido_peso_kg / meta_peso_kg`.
- **R-IN-02** Certificado de logística reversa só pode ser emitido se atingimento ≥ 100% no ano de referência.
- **R-IN-03** Certificado expira ao final do ano-calendário seguinte ao da emissão.
- **R-IN-04** Hash de auditoria do certificado (`hash_auditoria`) é SHA-256 do payload assinado pela autoridade emissora.

## 6. Cooperativa — Operação

- **R-CO-01** Recepção exige material identificado, peso bruto e origem (cidadão/ponto de coleta).
- **R-CO-02** Despacho requer NFe válida, indústria destino com CNPJ ativo e token de rastreabilidade gerado.
- **R-CO-03** Estoque é calculado em tempo real por `v_estoque_cooperativa` = ∑ entradas − ∑ saídas por material.
- **R-CO-04** Faturamento exige despacho confirmado e NFe registrada.

## 7. Ponto de Coleta

- **R-PC-01** Recebimento gera recibo com código único.
- **R-PC-02** Pontuação ao cidadão (carteira de créditos) é parametrizada em `app_regras_negocio` (chave `pontos_por_kg_<material>`).
- **R-PC-03** CPF do cidadão é armazenado como hash (SHA-256) — nunca em texto puro (`v_usuario_app.cpf_hash`).
- **R-PC-04** Recebimento anônimo é permitido (flag `origem_anonima`), mas não credita pontos.

## 8. IoT

- **R-IO-01** Cada instância IoT tem `serial_number` único.
- **R-IO-02** Heartbeat com intervalo > 60 minutos marca instância como `offline`.
- **R-IO-03** Bateria abaixo de 15% gera alerta `medium`.
- **R-IO-04** Instâncias podem ser realocadas (mudar `contenedor_localizacao_id`) — histórico mantido em `app_logs_sistema`.

## 9. Webhooks

- **R-WH-01** Apenas webhooks `ativo = true` recebem disparos.
- **R-WH-02** Falha de entrega é reenfileirada até `retry_max` vezes com intervalo `retry_delay_seg`.
- **R-WH-03** Após esgotar tentativas, webhook é desativado automaticamente após 50 falhas consecutivas.
- **R-WH-04** Payload assinado com HMAC-SHA256 usando `secret_token`; assinatura no header `X-SINARV-Signature`.
- **R-WH-05** Eventos suportados: `lote.criado`, `lote.recebido`, `lote.despachado`, `transacao.criada`, `transacao.concluida`, `alerta.disparado`, `auditoria.aberta`, `usuario.criado`, `iot.heartbeat`.

## 10. Notificações

- **R-NT-01** Templates usam placeholders `{{variavel}}` substituídos no envio com dados do contexto do evento.
- **R-NT-02** Cada canal só dispara templates com `canal_tipo` correspondente.
- **R-NT-03** Falha de envio em canal SMTP/SMS é reenviada após 5 minutos (no máximo 3 tentativas).
- **R-NT-04** Credenciais sensíveis (senhas SMTP, tokens) são referenciadas por `secret_ref`, nunca armazenadas em texto.

## 11. SEI

- **R-SE-01** Operações com SEI exigem `ativo = true` e `ultimo_teste = sucesso`.
- **R-SE-02** Token de autenticação é referenciado por `token_secret_ref`.
- **R-SE-03** Toda submissão ao SEI é registrada em `app_logs_sistema` com `modulo = 'sei'`.

## 12. Benchmarks

- **R-BM-01** kg per capita = `volume_reciclado_ton × 1000 / populacao`.
- **R-BM-02** Ranking estadual ordenado por `taxa_desvio_aterro DESC`, desempate por `kg_per_capita DESC`.
- **R-BM-03** Selo verde concedido a municípios com `taxa_desvio_aterro ≥ 50%` no ano de referência.
- **R-BM-04** Comparativo entre municípios limitado a 5 itens por chamada da Edge Function.

## 13. Logs e Auditoria de Sistema

- **R-LG-01** Todo evento administrativo crítico (login admin, mudança de role, alteração de regra) gera registro em `app_logs_sistema`.
- **R-LG-02** Logs são append-only — não há UPDATE nem DELETE.
- **R-LG-03** Retenção mínima de 5 anos para `role_audit_logs` e `app_logs_sistema` (conformidade LGPD/PNRS).

## 14. Validações server-side (Zod)

Toda Edge Function valida payload com Zod:

- Strings: `min(1).max(255)` e `trim()`
- Emails: `email().toLowerCase()`
- Datas: ISO 8601
- IDs: `uuid()`
- Números: `positive()` quando aplicável
- JSON: `record(z.unknown())` para campos genéricos

## 15. Integridade referencial

- `transacoes.cooperativa_id` → `cooperativas.id` (ON DELETE SET NULL)
- `transacoes.industria_id` → `industrias.id` (ON DELETE SET NULL)
- `iot_dispositivos_instancias.modelo_id` → `iot_dispositivos_modelos.id`
- `iot_dispositivos_instancias.contenedor_localizacao_id` → `contenedor_localizacoes.id`
- `contenedor_localizacoes.contenedor_id` → `contenedores.id`
- `ldap_sync_log.ldap_config_id` → `ldap_config.id`
- `integracao_webhook_logs.webhook_id` → `integracao_webhooks.id` (ON DELETE CASCADE)
