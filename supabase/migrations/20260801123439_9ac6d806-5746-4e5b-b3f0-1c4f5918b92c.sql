-- 1. Fluxo de aprovação no MTR
DO $$ BEGIN
  CREATE TYPE public.mtr_fluxo_status AS ENUM ('rascunho','enviado','em_analise','aprovado','bloqueado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.mtr_solicitacoes
  ADD COLUMN IF NOT EXISTS fluxo_status public.mtr_fluxo_status NOT NULL DEFAULT 'rascunho',
  ADD COLUMN IF NOT EXISTS aprovado_por uuid,
  ADD COLUMN IF NOT EXISTS aprovado_em timestamptz,
  ADD COLUMN IF NOT EXISTS motivo_bloqueio text;

-- 2. Trilha de auditoria do módulo
CREATE TABLE IF NOT EXISTS public.residuos_criticos_auditoria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entidade text NOT NULL,
  entidade_id uuid,
  acao text NOT NULL,
  detalhes jsonb NOT NULL DEFAULT '{}'::jsonb,
  user_id uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.residuos_criticos_auditoria TO authenticated;
GRANT ALL ON public.residuos_criticos_auditoria TO service_role;

ALTER TABLE public.residuos_criticos_auditoria ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auditoria_rc_select" ON public.residuos_criticos_auditoria;
CREATE POLICY "auditoria_rc_select" ON public.residuos_criticos_auditoria
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'gov') OR public.has_role(auth.uid(),'super_admin'));

DROP POLICY IF EXISTS "auditoria_rc_insert" ON public.residuos_criticos_auditoria;
CREATE POLICY "auditoria_rc_insert" ON public.residuos_criticos_auditoria
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_rc_auditoria_created ON public.residuos_criticos_auditoria (created_at DESC);

-- 3. Bloqueio automático de emissão por licença vencida
CREATE OR REPLACE FUNCTION public.fn_operador_licenca_vigente(_operador_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE WHEN _operador_id IS NULL THEN true ELSE EXISTS (
    SELECT 1 FROM public.licencas_ambientais l
    WHERE l.operador_id = _operador_id AND l.validade >= CURRENT_DATE
  ) END;
$$;

CREATE OR REPLACE FUNCTION public.mtr_validar_licencas()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_msg text := NULL;
BEGIN
  IF NEW.operador_id IS NOT NULL AND NOT public.fn_operador_licenca_vigente(NEW.operador_id) THEN
    v_msg := 'Transportador sem licença ambiental vigente';
  ELSIF NEW.destinador_id IS NOT NULL AND NOT public.fn_operador_licenca_vigente(NEW.destinador_id) THEN
    v_msg := 'Destinador sem licença ambiental vigente';
  END IF;

  IF v_msg IS NOT NULL THEN
    IF NEW.fluxo_status IN ('enviado','em_analise','aprovado') THEN
      RAISE EXCEPTION '%', v_msg;
    END IF;
    NEW.fluxo_status := 'bloqueado';
    NEW.motivo_bloqueio := v_msg;
  ELSIF NEW.fluxo_status = 'bloqueado' AND NEW.motivo_bloqueio LIKE '%licença ambiental vigente' THEN
    NEW.fluxo_status := 'rascunho';
    NEW.motivo_bloqueio := NULL;
  END IF;

  IF NEW.fluxo_status = 'aprovado' AND (TG_OP = 'INSERT' OR OLD.fluxo_status IS DISTINCT FROM 'aprovado') THEN
    NEW.aprovado_por := COALESCE(NEW.aprovado_por, auth.uid());
    NEW.aprovado_em := COALESCE(NEW.aprovado_em, now());
  END IF;

  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_mtr_validar_licencas ON public.mtr_solicitacoes;
CREATE TRIGGER trg_mtr_validar_licencas
  BEFORE INSERT OR UPDATE ON public.mtr_solicitacoes
  FOR EACH ROW EXECUTE FUNCTION public.mtr_validar_licencas();

-- 4. Auditoria automática de MTR
CREATE OR REPLACE FUNCTION public.mtr_auditar()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.residuos_criticos_auditoria (entidade, entidade_id, acao, detalhes, user_id)
  VALUES (
    'mtr_solicitacoes', NEW.id,
    CASE WHEN TG_OP = 'INSERT' THEN 'criado' ELSE 'atualizado' END,
    jsonb_build_object(
      'codigo', NEW.codigo,
      'status_anterior', CASE WHEN TG_OP='UPDATE' THEN OLD.fluxo_status::text ELSE NULL END,
      'status_novo', NEW.fluxo_status::text,
      'motivo_bloqueio', NEW.motivo_bloqueio
    ),
    auth.uid()
  );
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_mtr_auditar ON public.mtr_solicitacoes;
CREATE TRIGGER trg_mtr_auditar
  AFTER INSERT OR UPDATE ON public.mtr_solicitacoes
  FOR EACH ROW EXECUTE FUNCTION public.mtr_auditar();

ALTER PUBLICATION supabase_realtime ADD TABLE public.residuos_criticos_auditoria;