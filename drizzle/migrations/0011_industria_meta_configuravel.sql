ALTER TABLE public.industrias
  ADD COLUMN IF NOT EXISTS meta_anual_kg numeric CHECK (meta_anual_kg IS NULL OR meta_anual_kg > 0),
  ADD COLUMN IF NOT EXISTS meta_ano_referencia integer,
  ADD COLUMN IF NOT EXISTS meta_fonte text,
  ADD COLUMN IF NOT EXISTS meta_fonte_url text,
  ADD COLUMN IF NOT EXISTS meta_atualizada_em timestamptz;
COMMENT ON COLUMN public.industrias.meta_fonte IS 'Fonte normativa/contratual da meta (ex.: Termo de Compromisso, acordo setorial, Decreto 10.936/2022)';