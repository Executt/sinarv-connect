CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.schedule('varredura-licencas-diaria', '0 9 * * *', $$SELECT public.fn_varrer_licencas_compliance();$$);