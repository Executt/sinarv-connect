
CREATE TABLE IF NOT EXISTS public.telemetria_historico (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contenedor_localizacao_id uuid NOT NULL,
  registrado_em timestamptz NOT NULL DEFAULT now(),
  nivel_preenchimento integer NOT NULL DEFAULT 0,
  evento text NOT NULL DEFAULT 'leitura',
  nivel_antes integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_telemetria_loc_data
  ON public.telemetria_historico (contenedor_localizacao_id, registrado_em DESC);

ALTER TABLE public.telemetria_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read telemetria_historico"
  ON public.telemetria_historico FOR SELECT
  USING (true);

CREATE POLICY "Auth insert telemetria_historico"
  ON public.telemetria_historico FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Seed 30 dias de histórico para cada localização existente
DO $$
DECLARE
  loc RECORD;
  d INT;
  nivel INT;
  alvo INT;
  delta INT;
  evento_tipo TEXT;
  nivel_antes_v INT;
  ts TIMESTAMPTZ;
  rnd FLOAT;
BEGIN
  FOR loc IN SELECT id, COALESCE(nivel_preenchimento, 0) AS atual FROM public.contenedor_localizacoes LOOP
    -- usa o id como seed para determinismo aproximado
    PERFORM setseed(((hashtext(loc.id::text) % 1000)::float / 1000.0));
    alvo := loc.atual;
    nivel := GREATEST(5, alvo - 30 - (random() * 20)::int);
    FOR d IN REVERSE 29..0 LOOP
      ts := now() - (d || ' days')::interval;
      delta := ((alvo - nivel) / GREATEST(1, d + 1)) + ((random() * 10 - 3)::int);
      nivel := GREATEST(0, LEAST(100, nivel + delta));
      evento_tipo := 'leitura';
      nivel_antes_v := NULL;
      rnd := random();
      IF d <> 0 AND nivel > 70 AND rnd < 0.18 THEN
        evento_tipo := 'coleta';
        nivel_antes_v := nivel;
        nivel := GREATEST(5, nivel - (35 + (random() * 25)::int));
      END IF;
      INSERT INTO public.telemetria_historico (contenedor_localizacao_id, registrado_em, nivel_preenchimento, evento, nivel_antes)
      VALUES (loc.id, ts, nivel, evento_tipo, nivel_antes_v);
    END LOOP;
    -- ponto final = nível atual real
    INSERT INTO public.telemetria_historico (contenedor_localizacao_id, registrado_em, nivel_preenchimento, evento)
    VALUES (loc.id, now(), alvo, 'leitura');
  END LOOP;
END $$;
