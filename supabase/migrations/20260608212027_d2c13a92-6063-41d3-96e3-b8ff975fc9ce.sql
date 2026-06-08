
-- ============ ENUMS ============
DO $$ BEGIN
  CREATE TYPE public.ai_modelo_categoria AS ENUM ('free', 'pago', 'treinado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.ai_status AS ENUM ('ativo', 'inativo', 'manutencao');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.ai_mcp_transporte AS ENUM ('http', 'sse', 'stdio');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ TABLES ============

-- 1. Modelos LLM
CREATE TABLE public.ai_modelos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  identificador text NOT NULL UNIQUE,
  provedor text NOT NULL,
  categoria public.ai_modelo_categoria NOT NULL DEFAULT 'free',
  contexto_max int NOT NULL DEFAULT 8192,
  custo_input_1k numeric(10,6) NOT NULL DEFAULT 0,
  custo_output_1k numeric(10,6) NOT NULL DEFAULT 0,
  suporta_imagem boolean NOT NULL DEFAULT false,
  suporta_tools boolean NOT NULL DEFAULT true,
  descricao text,
  status public.ai_status NOT NULL DEFAULT 'ativo',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_modelos TO authenticated;
GRANT ALL ON public.ai_modelos TO service_role;
ALTER TABLE public.ai_modelos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read ai_modelos" ON public.ai_modelos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manage ai_modelos" ON public.ai_modelos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'gov'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'gov'));
CREATE TRIGGER trg_ai_modelos_updated BEFORE UPDATE ON public.ai_modelos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. MCP Servers
CREATE TABLE public.ai_mcp_servers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  url text NOT NULL,
  transporte public.ai_mcp_transporte NOT NULL DEFAULT 'http',
  auth_tipo text NOT NULL DEFAULT 'none',
  auth_secret_name text,
  descricao text,
  status public.ai_status NOT NULL DEFAULT 'ativo',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_mcp_servers TO authenticated;
GRANT ALL ON public.ai_mcp_servers TO service_role;
ALTER TABLE public.ai_mcp_servers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin read ai_mcp" ON public.ai_mcp_servers FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'gov'));
CREATE POLICY "Admin manage ai_mcp" ON public.ai_mcp_servers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'gov'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'gov'));
CREATE TRIGGER trg_ai_mcp_updated BEFORE UPDATE ON public.ai_mcp_servers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Base de Conhecimento
CREATE TABLE public.ai_base_conhecimento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  tipo text NOT NULL DEFAULT 'documentos',
  descricao text,
  total_documentos int NOT NULL DEFAULT 0,
  total_chunks int NOT NULL DEFAULT 0,
  modelo_embedding text,
  status public.ai_status NOT NULL DEFAULT 'ativo',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_base_conhecimento TO authenticated;
GRANT ALL ON public.ai_base_conhecimento TO service_role;
ALTER TABLE public.ai_base_conhecimento ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read ai_base" ON public.ai_base_conhecimento FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manage ai_base" ON public.ai_base_conhecimento FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'gov'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'gov'));
CREATE TRIGGER trg_ai_base_updated BEFORE UPDATE ON public.ai_base_conhecimento
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Skills (catálogo)
CREATE TABLE public.ai_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  categoria text NOT NULL DEFAULT 'geral',
  descricao text,
  schema_entrada jsonb NOT NULL DEFAULT '{}'::jsonb,
  status public.ai_status NOT NULL DEFAULT 'ativo',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_skills TO authenticated;
GRANT ALL ON public.ai_skills TO service_role;
ALTER TABLE public.ai_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read ai_skills" ON public.ai_skills FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manage ai_skills" ON public.ai_skills FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'gov'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'gov'));
CREATE TRIGGER trg_ai_skills_updated BEFORE UPDATE ON public.ai_skills
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Agentes
CREATE TABLE public.ai_agentes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  modelo_id uuid REFERENCES public.ai_modelos(id) ON DELETE SET NULL,
  base_conhecimento_id uuid REFERENCES public.ai_base_conhecimento(id) ON DELETE SET NULL,
  prompt_sistema text NOT NULL DEFAULT '',
  temperatura numeric(3,2) NOT NULL DEFAULT 0.7,
  max_tokens int NOT NULL DEFAULT 2048,
  status public.ai_status NOT NULL DEFAULT 'ativo',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_agentes TO authenticated;
GRANT ALL ON public.ai_agentes TO service_role;
ALTER TABLE public.ai_agentes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read ai_agentes" ON public.ai_agentes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manage ai_agentes" ON public.ai_agentes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'gov'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'gov'));
CREATE TRIGGER trg_ai_agentes_updated BEFORE UPDATE ON public.ai_agentes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Agente Skills (N:N)
CREATE TABLE public.ai_agente_skills (
  agente_id uuid NOT NULL REFERENCES public.ai_agentes(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES public.ai_skills(id) ON DELETE CASCADE,
  ordem int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (agente_id, skill_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_agente_skills TO authenticated;
GRANT ALL ON public.ai_agente_skills TO service_role;
ALTER TABLE public.ai_agente_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read agente_skills" ON public.ai_agente_skills FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manage agente_skills" ON public.ai_agente_skills FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'gov'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'gov'));

-- 7. Tokens / API keys de provedores
CREATE TABLE public.ai_tokens_provedores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provedor text NOT NULL,
  rotulo text NOT NULL,
  secret_name text NOT NULL,
  descricao text,
  status public.ai_status NOT NULL DEFAULT 'ativo',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_tokens_provedores TO authenticated;
GRANT ALL ON public.ai_tokens_provedores TO service_role;
ALTER TABLE public.ai_tokens_provedores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin read tokens" ON public.ai_tokens_provedores FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'gov'));
CREATE POLICY "Admin manage tokens" ON public.ai_tokens_provedores FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'gov'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'gov'));
CREATE TRIGGER trg_ai_tokens_updated BEFORE UPDATE ON public.ai_tokens_provedores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Cotas por usuário
CREATE TABLE public.ai_cotas_usuario (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  limite_tokens_mes bigint NOT NULL DEFAULT 100000,
  tokens_consumidos_mes bigint NOT NULL DEFAULT 0,
  reset_em date NOT NULL DEFAULT (date_trunc('month', now())::date + interval '1 month')::date,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_cotas_usuario TO authenticated;
GRANT ALL ON public.ai_cotas_usuario TO service_role;
ALTER TABLE public.ai_cotas_usuario ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User read own cota" ON public.ai_cotas_usuario FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'gov'));
CREATE POLICY "Admin manage cotas" ON public.ai_cotas_usuario FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'gov'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'gov'));
CREATE TRIGGER trg_ai_cotas_updated BEFORE UPDATE ON public.ai_cotas_usuario
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Consumo Log
CREATE TABLE public.ai_consumo_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  agente_id uuid REFERENCES public.ai_agentes(id) ON DELETE SET NULL,
  modelo_id uuid REFERENCES public.ai_modelos(id) ON DELETE SET NULL,
  tokens_input int NOT NULL DEFAULT 0,
  tokens_output int NOT NULL DEFAULT 0,
  custo_estimado numeric(10,6) NOT NULL DEFAULT 0,
  sucesso boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.ai_consumo_log TO authenticated;
GRANT ALL ON public.ai_consumo_log TO service_role;
ALTER TABLE public.ai_consumo_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User read own consumo" ON public.ai_consumo_log FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'gov'));
CREATE POLICY "Insert own consumo" ON public.ai_consumo_log FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'gov'));

-- ============ SEED DATA ============
INSERT INTO public.ai_modelos (nome, identificador, provedor, categoria, contexto_max, custo_input_1k, custo_output_1k, suporta_imagem, suporta_tools, descricao) VALUES
('Gemini 3 Flash Preview', 'google/gemini-3-flash-preview', 'Google (Lovable AI)', 'free', 1000000, 0, 0, true, true, 'Modelo rápido padrão para chat e agentes'),
('Gemini 2.5 Flash Lite', 'google/gemini-2.5-flash-lite', 'Google (Lovable AI)', 'free', 1000000, 0, 0, true, true, 'Mais barato/rápido para classificação'),
('Gemini 2.5 Pro', 'google/gemini-2.5-pro', 'Google (Lovable AI)', 'pago', 2000000, 0.00125, 0.005, true, true, 'Raciocínio multimodal forte'),
('GPT-5 Mini', 'openai/gpt-5-mini', 'OpenAI (Lovable AI)', 'pago', 400000, 0.0003, 0.0012, true, true, 'OpenAI custo intermediário'),
('GPT-5', 'openai/gpt-5', 'OpenAI (Lovable AI)', 'pago', 400000, 0.00125, 0.01, true, true, 'OpenAI flagship'),
('SINARV Triagem v1', 'sinarv/triagem-v1', 'Interno SINARV', 'treinado', 32768, 0, 0, false, true, 'Modelo treinado em dados de triagem de recicláveis')
ON CONFLICT (identificador) DO NOTHING;

INSERT INTO public.ai_skills (nome, categoria, descricao, schema_entrada) VALUES
('busca_web', 'pesquisa', 'Busca informações na web', '{"type":"object","properties":{"query":{"type":"string"}},"required":["query"]}'::jsonb),
('consulta_planares', 'dominio', 'Consulta indicadores PLANARES', '{"type":"object","properties":{"municipio":{"type":"string"},"ano":{"type":"integer"}}}'::jsonb),
('gerar_relatorio', 'documento', 'Gera relatório PDF', '{"type":"object","properties":{"titulo":{"type":"string"},"dados":{"type":"object"}}}'::jsonb),
('enviar_email', 'comunicacao', 'Envia email transacional', '{"type":"object","properties":{"para":{"type":"string"},"assunto":{"type":"string"},"corpo":{"type":"string"}}}'::jsonb)
ON CONFLICT (nome) DO NOTHING;

INSERT INTO public.ai_base_conhecimento (nome, tipo, descricao, total_documentos, total_chunks, modelo_embedding) VALUES
('PLANARES 2024', 'documentos', 'Plano Nacional de Resíduos Sólidos', 12, 3450, 'text-embedding-3-small'),
('Legislação Ambiental', 'documentos', 'Leis, decretos e resoluções CONAMA', 87, 21340, 'text-embedding-3-small'),
('FAQ Cooperativas', 'faq', 'Perguntas frequentes operacionais', 240, 480, 'text-embedding-3-small')
ON CONFLICT DO NOTHING;
