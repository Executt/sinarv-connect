DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.lixoes; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.lixao_volume_historico; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.lixao_encerramento_etapas; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

ALTER TABLE public.lixoes REPLICA IDENTITY FULL;
ALTER TABLE public.lixao_volume_historico REPLICA IDENTITY FULL;
ALTER TABLE public.lixao_encerramento_etapas REPLICA IDENTITY FULL;