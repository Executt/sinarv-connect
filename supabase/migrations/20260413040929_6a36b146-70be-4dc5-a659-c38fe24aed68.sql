
DROP VIEW IF EXISTS public.v_registro_entrada;
DROP VIEW IF EXISTS public.v_despacho_lote;

CREATE VIEW public.v_registro_entrada WITH (security_invoker = true) AS
  SELECT * FROM sch_ponto_coleta.registro_entrada;

CREATE VIEW public.v_despacho_lote WITH (security_invoker = true) AS
  SELECT * FROM sch_ponto_coleta.despacho_lote;
