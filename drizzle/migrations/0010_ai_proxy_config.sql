CREATE TABLE public.ai_proxy_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  provedor text NOT NULL DEFAULT 'litellm' CHECK (provedor IN ('litellm','openrouter','portkey','azure_apim','openai_compatible','outro')),
  base_url text NOT NULL CHECK (base_url ~* '^https://'),
  secret_name text CHECK (secret_name IS NULL OR secret_name ~ '^AI_PROXY_[A-Z0-9_]+$'),
  modelo_padrao text,
  gerencia_tokens boolean NOT NULL DEFAULT true,
  gerencia_mcp boolean NOT NULL DEFAULT true,
  painel_url text,
  ativo boolean NOT NULL DEFAULT false,
  descricao text,
  ultimo_teste_em timestamptz,
  ultimo_teste_ok boolean,
  ultimo_teste_msg text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_proxy_config TO authenticated;
GRANT ALL ON public.ai_proxy_config TO service_role;
ALTER TABLE public.ai_proxy_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin read ai_proxy" ON public.ai_proxy_config FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'gov'));
CREATE POLICY "Superadmin manage ai_proxy" ON public.ai_proxy_config FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin'));
CREATE UNIQUE INDEX ai_proxy_um_ativo ON public.ai_proxy_config ((true)) WHERE ativo;
CREATE TRIGGER trg_ai_proxy_updated BEFORE UPDATE ON public.ai_proxy_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();