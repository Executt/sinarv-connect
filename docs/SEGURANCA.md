# Segurança — SINARV

> Modelo de ameaças, controles e práticas de proteção da plataforma.

## 1. Princípios

1. **Defesa em profundidade** — múltiplas camadas (RLS, validação server-side, autenticação JWT, segredos gerenciados).
2. **Princípio do menor privilégio** — papéis granulares, RLS restritiva por padrão.
3. **Trust no browser = zero** — toda regra de autorização é verificada no servidor.
4. **Auditabilidade** — eventos críticos são registrados append-only.
5. **Segredos fora do código** — nenhuma credencial em arquivos versionados.

## 2. Modelo de Ameaças (STRIDE)

| Ameaça | Vetor | Mitigação |
|--------|-------|-----------|
| **Spoofing** | Falsificação de identidade | JWT assinado, sessão Supabase Auth, MFA recomendado para super_admin |
| **Tampering** | Alteração de dados em trânsito | HTTPS obrigatório (TLS 1.2+), assinatura HMAC em webhooks |
| **Repudiation** | Negação de ações | `role_audit_logs`, `app_logs_sistema`, `admin_session_logs` append-only |
| **Information Disclosure** | Vazamento de dados | RLS em todas as tabelas, CPF como hash, segredos em vault |
| **Denial of Service** | Sobrecarga | Rate limiting em Edge Functions, retry exponencial em webhooks |
| **Elevation of Privilege** | Escalada de papel | Roles em tabela separada, função SECURITY DEFINER, escrita só via Edge Function |

## 3. Autenticação

- **Provider:** Supabase Auth
- **Métodos:** email+senha, Google OAuth (recomendado), LDAP (corporativo)
- **JWT:** vida curta (1 h padrão) + refresh token rotacionado
- **Sessão:** persistida em `localStorage` via cliente Supabase
- **Logout:** revoga tokens e limpa estado local
- **Reset de senha:** via link de email (token único expira em 1 h)

### Recomendações de hardening

- ✅ Habilitar **leaked password protection**
- ✅ Reduzir **OTP expiry** para ≤ 600s
- ✅ Forçar **MFA** para usuários com `super_admin`
- ✅ Habilitar **rate limit** de login (Supabase Auth)
- ✅ Configurar redirect URLs permitidas (apenas domínios oficiais)

## 4. Autorização

### Camadas

1. **Frontend** — `ProtectedRoute` + `useAuth().hasRole()` (UX, não segurança)
2. **RLS** — políticas por tabela, função `has_role()` SECURITY DEFINER
3. **Edge Functions** — validação Zod + verificação explícita de role

### Papéis

`gov` · `cooperativa` · `industria` · `ponto_coleta` · `super_admin`

`super_admin` é tratado como universal apenas no contexto da app — no banco cada política lista os papéis permitidos.

## 5. Segredos

| Segredo | Onde fica | Quem acessa |
|---------|-----------|-------------|
| `SUPABASE_SERVICE_ROLE_KEY` | Lovable Cloud env | Edge Functions apenas |
| `SUPABASE_ANON_KEY` | `.env` (publicável) | Frontend |
| `SUPABASE_DB_URL` | Lovable Cloud env | Edge Functions apenas |
| `LOVABLE_API_KEY` | Lovable Cloud env | Edge Functions (gateway) |
| Senha LDAP | Vault (referência via `bind_password_secret_ref`) | Edge Function de sync |
| Token SEI | Vault (referência via `token_secret_ref`) | Edge Function de submissão |
| Credenciais SMTP/SMS/Teams | Vault (referência via `secret_ref` em `notif_canais`) | Edge Function de envio |

❌ **Nunca** armazenar segredos em:
- Arquivos versionados
- Tabelas em texto puro
- Variáveis acessíveis ao frontend

## 6. Proteção de dados sensíveis (LGPD)

| Dado | Tratamento |
|------|------------|
| CPF de cidadão | Hash SHA-256 (`v_usuario_app.cpf_hash`) |
| Email | Armazenado em `auth.users` (sob RLS) |
| Telefone | Em `usuarios_perfis_extra`, restrito ao próprio + admin |
| Endereço | Em entidades pessoa-jurídica apenas (não pessoa-física) |
| IP de log | Mantido por 5 anos para auditoria, anonimizado depois |

### Direitos do titular

- **Acesso:** usuário visualiza seu `profiles` e `usuarios_perfis_extra`
- **Retificação:** UPDATE permitido sobre o próprio registro
- **Exclusão:** processo manual via gov (preserva logs auditáveis)
- **Portabilidade:** exportação JSON sob demanda (a implementar)

## 7. Validação de entrada

Toda Edge Function aplica:

```ts
const Schema = z.object({
  email: z.string().trim().email().max(255),
  display_name: z.string().trim().min(1).max(100),
});
const parsed = Schema.safeParse(await req.json());
if (!parsed.success) return new Response(JSON.stringify({ error: parsed.error.flatten() }), { status: 400 });
```

Frontend reforça com:
- `react-hook-form` + `zod` resolver
- Inputs com `maxLength`, `pattern`, tipos restritos
- Sanitização HTML proibida via `dangerouslySetInnerHTML` em conteúdo de usuário

## 8. Webhooks (assinatura HMAC)

Cada disparo inclui:

```
X-SINARV-Signature: sha256=<hex>
X-SINARV-Event: lote.criado
X-SINARV-Timestamp: 1729200000
```

Receptor valida:

```ts
const expected = crypto.createHmac('sha256', SECRET).update(`${ts}.${body}`).digest('hex');
if (!timingSafeEqual(received, expected) || (now - ts) > 300) reject();
```

## 9. CORS

- Edge Functions públicas: `Access-Control-Allow-Origin: *` + apenas métodos necessários
- Edge Functions privadas: origem fixa (domínio do app)
- Sempre incluir `Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type`

## 10. Logging e Auditoria

| Log | Tabela | Retenção |
|-----|--------|----------|
| Eventos do sistema | `app_logs_sistema` | 5 anos |
| Auditoria de papéis | `role_audit_logs` | 5 anos |
| Sessões admin | `admin_session_logs` | 1 ano |
| Disparos de webhook | `integracao_webhook_logs` | 6 meses |
| Envios de notificação | `notif_envios` | 6 meses |
| Sync LDAP | `ldap_sync_log` | 1 ano |

Todos append-only (sem UPDATE/DELETE).

## 11. Atualizações e dependências

- Dependências auditadas via `npm audit` e `code--dependency_scan`
- Atualizações de segurança aplicadas em até 7 dias
- Dependências críticas (Supabase, React, Vite) sempre na major estável mais recente

## 12. Rate limiting

Implementação recomendada por endpoint sensível:

- Login: 5 tentativas / minuto / IP
- Reset de senha: 3 / hora / email
- Edge Function `admin-users`: 30 / minuto / usuário
- Webhook receivers: 1000 / minuto / origem

## 13. Backup e Recuperação

- **Backup automático** Supabase: diário, retenção 7 dias (plano padrão)
- **PITR** (Point-in-Time Recovery): habilitar em produção
- **Migration history** versionada em `supabase/migrations/`
- **Plano de recuperação:** documentado e testado semestralmente

## 14. Conformidade

| Norma | Aplicação |
|-------|-----------|
| **LGPD** (Lei 13.709/2018) | Dados pessoais protegidos, hash de CPF, direitos do titular |
| **PNRS** (Lei 12.305/2010) | Rastreabilidade obrigatória, certificados de logística reversa |
| **PLANARES** | Indicadores nacionais consolidados, metas anuais |
| **e-PING** (interop. Gov.br) | Integração SEI, padrões REST/JSON |
| **OWASP Top 10** | Mitigado via RLS + validação + HTTPS + segredos gerenciados |

## 15. Checklist de release

Antes de promover ao produção:

- [ ] `supabase linter` sem warnings críticos
- [ ] `npm audit` sem vulnerabilidades high/critical
- [ ] RLS habilitado em todas as tabelas novas
- [ ] Edge Functions com Zod + CORS + try/catch
- [ ] Segredos referenciados, nunca em texto
- [ ] Logs de auditoria capturando ações sensíveis
- [ ] Backup recente verificado
- [ ] Testes de regressão de papéis (gov, super_admin, cooperativa, industria, ponto_coleta) executados

## 16. Resposta a incidentes

1. **Detecção** — alertas em `app_logs_sistema` com `nivel = 'critical'`
2. **Contenção** — desativar conta comprometida via `usuarios_perfis_extra.ativo = false`
3. **Erradicação** — revogar sessões via Supabase Auth
4. **Recuperação** — restaurar backup mais recente íntegro
5. **Lições** — registrar em log de incidentes interno
