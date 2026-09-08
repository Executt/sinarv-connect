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
- [ ] Aviso de dados demo na landing; carimbo em exportações; SEO; dark mode; testes
