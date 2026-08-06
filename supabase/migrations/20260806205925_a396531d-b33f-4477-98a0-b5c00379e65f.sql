CREATE TABLE public.lixao_auditoria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entidade text NOT NULL,
  entidade_id uuid,
  lixao_id uuid,
  acao text NOT NULL,
  detalhes jsonb NOT NULL DEFAULT '{}'::jsonb,
  user_id uuid,
  user_email text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.lixao_auditoria TO authenticated;
GRANT ALL ON public.lixao_auditoria TO service_role;

ALTER TABLE public.lixao_auditoria ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gov e admin leem auditoria de lixoes"
  ON public.lixao_auditoria FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'gov') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Gov e admin registram auditoria de lixoes"
  ON public.lixao_auditoria FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'gov') OR public.has_role(auth.uid(), 'super_admin'));

CREATE INDEX idx_lixao_auditoria_created ON public.lixao_auditoria (created_at DESC);

CREATE OR REPLACE FUNCTION public.lixao_auditar_tratativa()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_email text;
BEGIN
  SELECT email INTO v_email FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
  INSERT INTO public.lixao_auditoria (entidade, entidade_id, lixao_id, acao, detalhes, user_id, user_email)
  VALUES (
    'lixao_alertas_tratativas', NEW.id, NEW.lixao_id,
    CASE WHEN NEW.situacao = 'tratado' THEN 'alerta_tratado' ELSE 'alerta_reaberto' END,
    jsonb_build_object(
      'alerta_key', NEW.alerta_key,
      'titulo', NEW.titulo,
      'origem', NEW.origem,
      'situacao', NEW.situacao,
      'tratado_em', NEW.tratado_em
    ),
    auth.uid(), v_email
  );
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_lixao_auditar_tratativa
AFTER INSERT OR UPDATE ON public.lixao_alertas_tratativas
FOR EACH ROW EXECUTE FUNCTION public.lixao_auditar_tratativa();

CREATE OR REPLACE FUNCTION public.lixao_auditar_prazo()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_email text;
BEGIN
  IF NEW.data_prevista IS DISTINCT FROM OLD.data_prevista THEN
    SELECT email INTO v_email FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
    INSERT INTO public.lixao_auditoria (entidade, entidade_id, lixao_id, acao, detalhes, user_id, user_email)
    VALUES (
      'lixao_encerramento_etapas', NEW.id, NEW.lixao_id, 'prazo_alterado',
      jsonb_build_object(
        'etapa', NEW.etapa,
        'ordem', NEW.ordem,
        'prazo_anterior', OLD.data_prevista,
        'prazo_novo', NEW.data_prevista
      ),
      auth.uid(), v_email
    );
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_lixao_auditar_prazo
AFTER UPDATE ON public.lixao_encerramento_etapas
FOR EACH ROW EXECUTE FUNCTION public.lixao_auditar_prazo();