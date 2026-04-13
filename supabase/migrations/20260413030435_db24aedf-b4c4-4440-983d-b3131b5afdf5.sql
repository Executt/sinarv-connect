
CREATE TYPE public.transaction_status AS ENUM ('Concluída', 'Em Trânsito', 'Pendente', 'Auditoria');
CREATE TYPE public.lote_status AS ENUM ('Coletado', 'Em Processamento', 'Em Trânsito', 'Entregue');
CREATE TYPE public.audit_status AS ENUM ('Conforme', 'Não Conforme', 'Pendente', 'Em Análise');
CREATE TYPE public.alert_severity AS ENUM ('critical', 'high', 'medium', 'low');
CREATE TYPE public.alert_status AS ENUM ('active', 'acknowledged', 'resolved');

CREATE TABLE public.cooperativas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  cidade TEXT NOT NULL,
  estado TEXT NOT NULL CHECK (char_length(estado) = 2),
  cnpj TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.industrias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  cidade TEXT NOT NULL,
  estado TEXT NOT NULL CHECK (char_length(estado) = 2),
  cnpj TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.transacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE,
  cooperativa_id UUID REFERENCES public.cooperativas(id),
  industria_id UUID REFERENCES public.industrias(id),
  origem TEXT NOT NULL,
  destino TEXT NOT NULL,
  material TEXT NOT NULL,
  peso TEXT NOT NULL,
  status public.transaction_status NOT NULL DEFAULT 'Pendente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.lotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE,
  material TEXT NOT NULL,
  peso TEXT NOT NULL,
  origem TEXT NOT NULL,
  destino TEXT NOT NULL,
  etapa_atual INT NOT NULL DEFAULT 1 CHECK (etapa_atual BETWEEN 1 AND 4),
  status public.lote_status NOT NULL DEFAULT 'Coletado',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.auditorias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE,
  entidade TEXT NOT NULL,
  tipo TEXT NOT NULL,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  auditor TEXT NOT NULL,
  status public.audit_status NOT NULL DEFAULT 'Pendente',
  pontuacao INT NOT NULL DEFAULT 0 CHECK (pontuacao BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.alertas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity public.alert_severity NOT NULL DEFAULT 'low',
  status public.alert_status NOT NULL DEFAULT 'active',
  source TEXT NOT NULL,
  module TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.indicadores_sustentabilidade (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label TEXT NOT NULL,
  value NUMERIC NOT NULL DEFAULT 0,
  suffix TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cooperativas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.industrias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alertas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.indicadores_sustentabilidade ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read cooperativas" ON public.cooperativas FOR SELECT USING (true);
CREATE POLICY "Public read industrias" ON public.industrias FOR SELECT USING (true);
CREATE POLICY "Public read transacoes" ON public.transacoes FOR SELECT USING (true);
CREATE POLICY "Public read lotes" ON public.lotes FOR SELECT USING (true);
CREATE POLICY "Public read auditorias" ON public.auditorias FOR SELECT USING (true);
CREATE POLICY "Public read alertas" ON public.alertas FOR SELECT USING (true);
CREATE POLICY "Public read indicadores" ON public.indicadores_sustentabilidade FOR SELECT USING (true);

CREATE POLICY "Auth insert cooperativas" ON public.cooperativas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update cooperativas" ON public.cooperativas FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth insert industrias" ON public.industrias FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update industrias" ON public.industrias FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth insert transacoes" ON public.transacoes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update transacoes" ON public.transacoes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth insert lotes" ON public.lotes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update lotes" ON public.lotes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth insert auditorias" ON public.auditorias FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update auditorias" ON public.auditorias FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth insert alertas" ON public.alertas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update alertas" ON public.alertas FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth insert indicadores" ON public.indicadores_sustentabilidade FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update indicadores" ON public.indicadores_sustentabilidade FOR UPDATE TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_cooperativas_updated_at BEFORE UPDATE ON public.cooperativas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_industrias_updated_at BEFORE UPDATE ON public.industrias FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_transacoes_updated_at BEFORE UPDATE ON public.transacoes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_lotes_updated_at BEFORE UPDATE ON public.lotes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_auditorias_updated_at BEFORE UPDATE ON public.auditorias FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_alertas_updated_at BEFORE UPDATE ON public.alertas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
