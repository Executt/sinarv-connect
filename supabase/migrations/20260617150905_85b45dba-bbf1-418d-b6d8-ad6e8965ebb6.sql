GRANT SELECT, INSERT, UPDATE, DELETE ON public.lixoes TO authenticated;
GRANT ALL ON public.lixoes TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lixao_volume_historico TO authenticated;
GRANT ALL ON public.lixao_volume_historico TO service_role;
GRANT SELECT ON public.vw_lixoes_correlacao TO authenticated;
GRANT ALL ON public.vw_lixoes_correlacao TO service_role;