CREATE TABLE public.importacoes_oficiais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL CHECK (tipo IN ('mtr','licencas','munic')),
  origem TEXT NOT NULL DEFAULT 'upload' CHECK (origem IN ('upload','api_publica')),
  arquivo_nome TEXT,
  fonte TEXT,
  escopo_uf TEXT,
  periodo_inicio DATE,
  periodo_fim DATE,
  total_linhas INTEGER NOT NULL DEFAULT 0,
  linhas_ok INTEGER NOT NULL DEFAULT 0,
  linhas_erro INTEGER NOT NULL DEFAULT 0,
  erros JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'concluida',
  observacoes TEXT,
  importado_por UUID,
  importado_por_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.importacoes_oficiais TO authenticated;
GRANT ALL ON public.importacoes_oficiais TO service_role;

ALTER TABLE public.importacoes_oficiais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "importacoes_select_proprias_ou_gov"
ON public.importacoes_oficiais FOR SELECT TO authenticated
USING (
  importado_por = auth.uid()
  OR public.has_role(auth.uid(), 'gov')
  OR public.has_role(auth.uid(), 'super_admin')
);

CREATE INDEX idx_importacoes_oficiais_created ON public.importacoes_oficiais (created_at DESC);
CREATE INDEX idx_importacoes_oficiais_tipo ON public.importacoes_oficiais (tipo);