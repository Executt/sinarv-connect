CREATE TABLE public.lixao_alertas_tratativas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alerta_key text NOT NULL UNIQUE,
  lixao_id uuid REFERENCES public.lixoes(id) ON DELETE CASCADE,
  origem text NOT NULL,
  titulo text NOT NULL,
  situacao text NOT NULL DEFAULT 'tratado',
  observacoes text,
  tratado_por uuid,
  tratado_em timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lixao_alertas_tratativas TO authenticated;
GRANT ALL ON public.lixao_alertas_tratativas TO service_role;

ALTER TABLE public.lixao_alertas_tratativas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados podem ver tratativas"
  ON public.lixao_alertas_tratativas FOR SELECT TO authenticated USING (true);

CREATE POLICY "Gov gerencia tratativas"
  ON public.lixao_alertas_tratativas FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'gov') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'gov') OR public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER trg_lixao_alertas_tratativas_updated
  BEFORE UPDATE ON public.lixao_alertas_tratativas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.lixao_prazo_historico (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  etapa_id uuid REFERENCES public.lixao_encerramento_etapas(id) ON DELETE CASCADE,
  lixao_id uuid,
  etapa text NOT NULL,
  prazo_anterior date,
  prazo_novo date,
  alterado_por uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.lixao_prazo_historico TO authenticated;
GRANT ALL ON public.lixao_prazo_historico TO service_role;

ALTER TABLE public.lixao_prazo_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados podem ver historico de prazos"
  ON public.lixao_prazo_historico FOR SELECT TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.lixao_registrar_prazo()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.data_prevista IS DISTINCT FROM OLD.data_prevista THEN
    INSERT INTO public.lixao_prazo_historico (etapa_id, lixao_id, etapa, prazo_anterior, prazo_novo, alterado_por)
    VALUES (NEW.id, NEW.lixao_id, NEW.etapa, OLD.data_prevista, NEW.data_prevista, auth.uid());
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_lixao_registrar_prazo
  AFTER UPDATE ON public.lixao_encerramento_etapas
  FOR EACH ROW EXECUTE FUNCTION public.lixao_registrar_prazo();