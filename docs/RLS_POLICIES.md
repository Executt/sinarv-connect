# Políticas de Segurança (RLS) — SINARV

> Toda tabela do schema `public` tem RLS **habilitado**. As políticas usam a função SECURITY DEFINER `has_role(_user_id, _role)` para evitar recursão.

## 1. Função base

```sql
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;
```

`super_admin` é tratado como acesso transversal no contexto da aplicação (`useAuth().hasRole`), mas no banco cada política deve listar explicitamente os papéis permitidos.

## 2. Padrões de política

### A. Leitura pública + escrita autenticada
Aplicado a tabelas de domínio público (lotes, transações, alertas, auditorias, contenedores, benchmarks).

```sql
-- SELECT público
CREATE POLICY "Public read X" ON public.X FOR SELECT TO public USING (true);
-- INSERT/UPDATE autenticado
CREATE POLICY "Auth insert X" ON public.X FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update X" ON public.X FOR UPDATE TO authenticated USING (true);
-- DELETE bloqueado por padrão
```

### B. CRUD restrito a super_admin / gov
Aplicado a tabelas de parametrização e identidade.

```sql
CREATE POLICY admin_select_X ON public.X FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'gov'));
CREATE POLICY admin_insert_X ON public.X FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'gov'));
CREATE POLICY admin_update_X ON public.X FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'gov'));
CREATE POLICY admin_delete_X ON public.X FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'gov'));
```

### C. Próprio recurso (per-user)
Aplicado a `profiles` e variantes.

```sql
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "Gov can view all profiles" ON profiles FOR SELECT
  TO authenticated USING (has_role(auth.uid(), 'gov'));
```

### D. Append-only (logs)
Aplicado a `app_logs_sistema`, `role_audit_logs`, `integracao_webhook_logs`, `notif_envios`, `ldap_sync_log`.

- INSERT permitido (origem ampla)
- SELECT restrito a super_admin/gov
- UPDATE/DELETE não definidos (proibidos)

## 3. Mapeamento por tabela

| Tabela | Padrão | Observações |
|--------|--------|-------------|
| `profiles` | C + gov-read | sem DELETE |
| `user_roles` | gov CRUD + próprio SELECT | escrita via Edge Function |
| `usuarios_perfis_extra` | B + próprio SELECT | — |
| `entidades_perfis` | B | — |
| `ldap_config` | B | bind_password como secret_ref |
| `ldap_sync_log` | D | — |
| `app_regras_negocio` | B | — |
| `app_listas_suspensas` | B | — |
| `app_acoes_automaticas` | B | — |
| `app_logs_sistema` | D | INSERT amplo |
| `iot_dispositivos_modelos` | B | — |
| `iot_dispositivos_instancias` | B | — |
| `integracao_webhooks` | B | — |
| `integracao_webhook_logs` | D | — |
| `integracao_sei` | B | token como secret_ref |
| `notif_canais` | B | secrets como secret_ref |
| `notif_templates` | B | — |
| `notif_envios` | D | — |
| `configuracoes_integracoes` | A (sem DELETE) | — |
| `cooperativas`, `industrias`, `contenedores`, `contenedor_localizacoes`, `lotes`, `transacoes`, `alertas`, `auditorias`, `benchmark_*`, `indicadores_sustentabilidade` | A | — |
| `admin_session_logs` | super_admin INSERT/SELECT próprio | — |
| `role_audit_logs` | D + gov SELECT | escrita pela Edge Function admin-users |

## 4. Anti-padrões evitados

❌ **Role armazenada em `profiles`** — vetor clássico de privilege escalation.
✅ Tabela separada `user_roles` + função SECURITY DEFINER.

❌ **RLS recursiva** (`USING (EXISTS (SELECT 1 FROM user_roles WHERE …))` em política de `user_roles`).
✅ Política em `user_roles` usa apenas `auth.uid() = user_id` para o próprio; gov usa `has_role` definida em função separada.

❌ **`USING (true)` em UPDATE/DELETE de tabelas sensíveis**.
✅ Tabelas sensíveis sempre filtram por `has_role`.

❌ **Bypass via service_role exposto no front**.
✅ `service_role` só é usado em Edge Functions com Deno.env.

## 5. Auditoria de mudança de role

Toda chamada à Edge Function `admin-users` para `assign_role` ou `remove_role` insere registro em `role_audit_logs`:

```json
{
  "user_id": "<alvo>",
  "role": "industria",
  "action": "assigned",
  "performed_by": "<auth.uid()>",
  "ip_address": "x.x.x.x",
  "performed_at": "2026-04-18T..."
}
```

## 6. Validações server-side adicionais

RLS é a primeira camada. Edge Functions adicionam:

- Validação de payload com **Zod**
- Rate limiting (em rotas sensíveis)
- Logging de auditoria
- Verificação explícita de role além do RLS para operações que envolvem múltiplas tabelas

## 7. Recomendações de hardening

1. Habilitar **leaked password protection** no Auth
2. Reduzir **OTP expiry** para ≤ 600s
3. Configurar **MFA** para super_admin
4. Rotacionar **service_role key** semestralmente
5. Revisar avisos do `supabase linter` regularmente
