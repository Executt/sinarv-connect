
-- Tabela de contenedores (catálogo)
CREATE TABLE public.contenedores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cor TEXT NOT NULL,
  nome TEXT NOT NULL,
  material TEXT NOT NULL,
  descricao TEXT NOT NULL DEFAULT '',
  volumes TEXT[] NOT NULL DEFAULT '{}',
  boas_praticas TEXT[] NOT NULL DEFAULT '{}',
  icone TEXT NOT NULL DEFAULT 'Recycle',
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contenedores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read contenedores" ON public.contenedores FOR SELECT USING (true);
CREATE POLICY "Auth insert contenedores" ON public.contenedores FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update contenedores" ON public.contenedores FOR UPDATE TO authenticated USING (true);

CREATE TRIGGER update_contenedores_updated_at BEFORE UPDATE ON public.contenedores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela de localizações de contenedores
CREATE TABLE public.contenedor_localizacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contenedor_id UUID NOT NULL REFERENCES public.contenedores(id) ON DELETE CASCADE,
  nome_local TEXT NOT NULL,
  endereco TEXT NOT NULL DEFAULT '',
  cidade TEXT NOT NULL,
  uf CHAR(2) NOT NULL,
  cep TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  capacidade_litros INTEGER NOT NULL DEFAULT 240,
  status_operacional TEXT NOT NULL DEFAULT 'Ativo',
  ultima_coleta TIMESTAMPTZ,
  nivel_preenchimento INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contenedor_localizacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read contenedor_localizacoes" ON public.contenedor_localizacoes FOR SELECT USING (true);
CREATE POLICY "Auth insert contenedor_localizacoes" ON public.contenedor_localizacoes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update contenedor_localizacoes" ON public.contenedor_localizacoes FOR UPDATE TO authenticated USING (true);

CREATE TRIGGER update_contenedor_localizacoes_updated_at BEFORE UPDATE ON public.contenedor_localizacoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela de configurações de integrações externas
CREATE TABLE public.configuracoes_integracoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT NOT NULL DEFAULT '',
  tipo TEXT NOT NULL DEFAULT 'api_rest',
  url_base TEXT NOT NULL DEFAULT '',
  auth_type TEXT NOT NULL DEFAULT 'none',
  auth_header TEXT,
  status TEXT NOT NULL DEFAULT 'inativo',
  ultimo_sync TIMESTAMPTZ,
  intervalo_sync_min INTEGER NOT NULL DEFAULT 60,
  modulo TEXT NOT NULL DEFAULT 'ponto_coleta',
  metadados JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.configuracoes_integracoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth read configuracoes" ON public.configuracoes_integracoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert configuracoes" ON public.configuracoes_integracoes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update configuracoes" ON public.configuracoes_integracoes FOR UPDATE TO authenticated USING (true);

CREATE TRIGGER update_configuracoes_integracoes_updated_at BEFORE UPDATE ON public.configuracoes_integracoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
