CREATE TABLE public.fiscalizacao_acoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  municipio text NOT NULL,
  uf text NOT NULL,
  titulo text NOT NULL,
  descricao text,
  tipo text NOT NULL DEFAULT 'fiscalizacao',
  prioridade text NOT NULL DEFAULT 'media' CHECK (prioridade IN ('baixa','media','alta','critica')),
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','em_andamento','concluida','cancelada')),
  prazo date,
  responsavel text,
  origem text NOT NULL DEFAULT 'manual',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fiscalizacao_acoes TO authenticated;
GRANT ALL ON public.fiscalizacao_acoes TO service_role;
ALTER TABLE public.fiscalizacao_acoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gov le acoes" ON public.fiscalizacao_acoes FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'gov') OR public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "gov cria acoes" ON public.fiscalizacao_acoes FOR INSERT TO authenticated WITH CHECK ((public.has_role(auth.uid(),'gov') OR public.has_role(auth.uid(),'super_admin')) AND created_by = auth.uid());
CREATE POLICY "gov edita acoes" ON public.fiscalizacao_acoes FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'gov') OR public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "admin apaga acoes" ON public.fiscalizacao_acoes FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER trg_fiscalizacao_acoes_upd BEFORE UPDATE ON public.fiscalizacao_acoes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();