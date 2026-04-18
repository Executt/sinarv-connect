
-- =====================================================
-- WEBHOOKS DE SAÍDA
-- =====================================================
CREATE TABLE public.integracao_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT NOT NULL DEFAULT '',
  url TEXT NOT NULL,
  metodo TEXT NOT NULL DEFAULT 'POST',
  eventos JSONB NOT NULL DEFAULT '[]'::jsonb,
  headers JSONB NOT NULL DEFAULT '{}'::jsonb,
  secret_token TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  retry_max INTEGER NOT NULL DEFAULT 3,
  retry_delay_seg INTEGER NOT NULL DEFAULT 60,
  timeout_seg INTEGER NOT NULL DEFAULT 30,
  total_envios INTEGER NOT NULL DEFAULT 0,
  total_falhas INTEGER NOT NULL DEFAULT 0,
  ultimo_envio TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.integracao_webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_select_webhooks ON public.integracao_webhooks FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'gov'));
CREATE POLICY admin_insert_webhooks ON public.integracao_webhooks FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'gov'));
CREATE POLICY admin_update_webhooks ON public.integracao_webhooks FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'gov'));
CREATE POLICY admin_delete_webhooks ON public.integracao_webhooks FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'gov'));

CREATE TRIGGER trg_webhooks_updated_at BEFORE UPDATE ON public.integracao_webhooks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Logs de envio de webhooks
CREATE TABLE public.integracao_webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES public.integracao_webhooks(id) ON DELETE CASCADE,
  evento TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente',
  http_status INTEGER,
  tentativa INTEGER NOT NULL DEFAULT 1,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  resposta TEXT,
  erro TEXT,
  duracao_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_webhook_logs_webhook ON public.integracao_webhook_logs(webhook_id, created_at DESC);

ALTER TABLE public.integracao_webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_select_webhook_logs ON public.integracao_webhook_logs FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'gov'));
CREATE POLICY auth_insert_webhook_logs ON public.integracao_webhook_logs FOR INSERT TO authenticated
  WITH CHECK (true);

-- =====================================================
-- INTEGRAÇÃO SEI
-- =====================================================
CREATE TABLE public.integracao_sei (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL DEFAULT 'SEI Principal',
  url_servico TEXT NOT NULL,
  sigla_sistema TEXT NOT NULL,
  identificacao_servico TEXT NOT NULL,
  unidade_padrao TEXT NOT NULL,
  token_secret_ref TEXT,
  tipo_processo_padrao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT false,
  ultimo_teste TIMESTAMPTZ,
  status_teste TEXT,
  metadados JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.integracao_sei ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_select_sei ON public.integracao_sei FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'gov'));
CREATE POLICY admin_insert_sei ON public.integracao_sei FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'gov'));
CREATE POLICY admin_update_sei ON public.integracao_sei FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'gov'));
CREATE POLICY admin_delete_sei ON public.integracao_sei FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'gov'));

CREATE TRIGGER trg_sei_updated_at BEFORE UPDATE ON public.integracao_sei
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- CANAIS DE NOTIFICAÇÃO
-- =====================================================
CREATE TABLE public.notif_canais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL, -- smtp, teams, sms, whatsapp, telegram
  descricao TEXT NOT NULL DEFAULT '',
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  secret_ref TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  ultimo_envio TIMESTAMPTZ,
  total_envios INTEGER NOT NULL DEFAULT 0,
  total_falhas INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notif_canais ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_select_canais ON public.notif_canais FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'gov'));
CREATE POLICY admin_insert_canais ON public.notif_canais FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'gov'));
CREATE POLICY admin_update_canais ON public.notif_canais FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'gov'));
CREATE POLICY admin_delete_canais ON public.notif_canais FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'gov'));

CREATE TRIGGER trg_canais_updated_at BEFORE UPDATE ON public.notif_canais
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Templates por evento e canal
CREATE TABLE public.notif_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  evento TEXT NOT NULL,
  canal_tipo TEXT NOT NULL,
  assunto TEXT NOT NULL DEFAULT '',
  corpo TEXT NOT NULL DEFAULT '',
  variaveis JSONB NOT NULL DEFAULT '[]'::jsonb,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notif_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_select_templates ON public.notif_templates FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'gov'));
CREATE POLICY admin_insert_templates ON public.notif_templates FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'gov'));
CREATE POLICY admin_update_templates ON public.notif_templates FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'gov'));
CREATE POLICY admin_delete_templates ON public.notif_templates FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'gov'));

CREATE TRIGGER trg_templates_updated_at BEFORE UPDATE ON public.notif_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Histórico de envios de notificação
CREATE TABLE public.notif_envios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canal_id UUID REFERENCES public.notif_canais(id) ON DELETE SET NULL,
  template_id UUID REFERENCES public.notif_templates(id) ON DELETE SET NULL,
  destinatario TEXT NOT NULL,
  assunto TEXT,
  corpo TEXT,
  status TEXT NOT NULL DEFAULT 'pendente',
  erro TEXT,
  evento TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notif_envios_canal ON public.notif_envios(canal_id, created_at DESC);

ALTER TABLE public.notif_envios ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_select_envios ON public.notif_envios FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'gov'));
CREATE POLICY auth_insert_envios ON public.notif_envios FOR INSERT TO authenticated
  WITH CHECK (true);
