# Roadmap — correções da auditoria técnica

## Bloco 1 — Segurança
- [x] Remover `seed-admin` (criava admin com senha fixa sem auth)
- [x] `ingest-telemetria` fail-closed + token gerado (`INGEST_TOKEN`)
- [x] `admin-users`: aceitar `super_admin`, só super_admin gerencia gov/super_admin, bloquear remoção do último admin
- [x] RLS `UPDATE USING (true)` em transacoes/auditorias/alertas — já corrigido em migration anterior (verificado)

## Bloco 2 — Legal
- [x] Prazos art. 54 Lei 14.026/2020 (capital/RM 2021; >100k ou fronteira 2022; 50–100k 2023; <50k 2024) na view e na UI
- [ ] Marcar `capital_ou_rm` / `fronteira_20km` nos registros existentes (depende de fonte oficial)

## Bloco 3 — Integridade
- [ ] Peso `NUMERIC` em lotes/transacoes (coluna nova + backfill)
- [ ] Unificar máquina de estado do MTR
- [ ] Validar licença pela data do transporte
- [ ] Ativar `fn_validar_balanco_massa` em UPDATE/DELETE
- [ ] Idempotência da meta PNRS

## Bloco 4 — Dados
- [ ] Backfill CO₂e com fonte; economia ponderada; custo/ton seletiva

## Bloco 5 — UX / qualidade
- [x] Aviso de dados demo na landing; SEO; carimbo nos PDFs
- [x] Carimbo (data/hora, usuário, filtros, fonte) nas exportações CSV
- [x] Modo escuro: remoção de cores fixas em ModuleShell, Benchmarks e AppSwitcher
- [x] Testes de exportação (carimbo e escape de CSV)

## Fiscalização formal + compliance automático
- [x] Processo, enquadramento legal, tipo de documento, fase e prazo de resposta nas ações de fiscalização (com auditoria)
- [x] Termo de notificação em PDF com hash SHA-256
- [x] Varredura diária de licenças (bloqueia MTR aberto sem licença na data do transporte; alertas 30/15/0 dias)
- [x] Bloqueio de despacho de cooperativa acima do estoque de entrada
- [ ] PENDENTE: testar na tela o diálogo de tramitação e a emissão do termo (o teste parou no diálogo)
- [ ] PENDENTE: apagar a ação de teste criada em Aracaju/SE durante o teste
- [ ] PENDENTE: testar o bloqueio de despacho com uma cooperativa real
