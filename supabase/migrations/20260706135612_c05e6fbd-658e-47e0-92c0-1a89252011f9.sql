
-- Enums
CREATE TYPE public.carga_categoria AS ENUM ('contaminado_perigoso', 'hospitalar', 'quimico');
CREATE TYPE public.carga_status AS ENUM ('planejada', 'em_transito', 'entregue', 'divergente', 'cancelada');
CREATE TYPE public.alerta_geo_tipo AS ENUM ('desvio_rota', 'porta_aberta', 'peso_divergente', 'parada_nao_autorizada');
CREATE TYPE public.alerta_severidade AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE public.alerta_geo_status AS ENUM ('active', 'acknowledged', 'resolved');
CREATE TYPE public.porta_status AS ENUM ('fechada', 'aberta');

-- 1. veiculos_frota
CREATE TABLE public.veiculos_frota (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  placa TEXT NOT NULL UNIQUE,
  tracker_id TEXT NOT NULL UNIQUE,
  transportadora TEXT NOT NULL,
  tipo_licenca TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.veiculos_frota TO authenticated;
GRANT ALL ON public.veiculos_frota TO service_role;
ALTER TABLE public.veiculos_frota ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gov e super_admin gerenciam frota" ON public.veiculos_frota
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'gov') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'gov') OR public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER trg_veiculos_frota_updated BEFORE UPDATE ON public.veiculos_frota
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. cargas_perigosas
CREATE TABLE public.cargas_perigosas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria public.carga_categoria NOT NULL,
  detalhamento TEXT NOT NULL,
  origem_tipo TEXT NOT NULL,
  origem_identificacao_hash TEXT,
  origem_localidade TEXT,
  peso_declarado_kg NUMERIC(12,3),
  peso_origem_kg NUMERIC(12,3),
  peso_destino_kg NUMERIC(12,3),
  destino_final TEXT NOT NULL,
  veiculo_id UUID REFERENCES public.veiculos_frota(id) ON DELETE SET NULL,
  status public.carga_status NOT NULL DEFAULT 'planejada',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cargas_perigosas TO authenticated;
GRANT ALL ON public.cargas_perigosas TO service_role;
ALTER TABLE public.cargas_perigosas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gov e super_admin gerenciam cargas" ON public.cargas_perigosas
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'gov') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'gov') OR public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER trg_cargas_perigosas_updated BEFORE UPDATE ON public.cargas_perigosas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. rotas_planejadas
CREATE TABLE public.rotas_planejadas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  carga_id UUID NOT NULL REFERENCES public.cargas_perigosas(id) ON DELETE CASCADE,
  origem_lat NUMERIC(9,6) NOT NULL,
  origem_lng NUMERIC(9,6) NOT NULL,
  destino_lat NUMERIC(9,6) NOT NULL,
  destino_lng NUMERIC(9,6) NOT NULL,
  waypoints JSONB NOT NULL DEFAULT '[]'::jsonb,
  raio_tolerancia_m INTEGER NOT NULL DEFAULT 2000,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rotas_planejadas TO authenticated;
GRANT ALL ON public.rotas_planejadas TO service_role;
ALTER TABLE public.rotas_planejadas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gov e super_admin gerenciam rotas" ON public.rotas_planejadas
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'gov') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'gov') OR public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER trg_rotas_planejadas_updated BEFORE UPDATE ON public.rotas_planejadas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. telemetria_frota (append-only)
CREATE TABLE public.telemetria_frota (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  veiculo_id UUID NOT NULL REFERENCES public.veiculos_frota(id) ON DELETE CASCADE,
  carga_id UUID REFERENCES public.cargas_perigosas(id) ON DELETE SET NULL,
  lat NUMERIC(9,6) NOT NULL,
  lng NUMERIC(9,6) NOT NULL,
  peso_carga_kg NUMERIC(12,3),
  status_porta public.porta_status NOT NULL DEFAULT 'fechada',
  velocidade_kmh NUMERIC(6,2),
  recebido_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_telemetria_veiculo_ts ON public.telemetria_frota(veiculo_id, recebido_em DESC);
CREATE INDEX idx_telemetria_carga_ts ON public.telemetria_frota(carga_id, recebido_em DESC);
GRANT SELECT ON public.telemetria_frota TO authenticated;
GRANT ALL ON public.telemetria_frota TO service_role;
ALTER TABLE public.telemetria_frota ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gov e super_admin veem telemetria" ON public.telemetria_frota
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'gov') OR public.has_role(auth.uid(),'super_admin'));

-- 5. alertas_geofencing
CREATE TABLE public.alertas_geofencing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  veiculo_id UUID REFERENCES public.veiculos_frota(id) ON DELETE SET NULL,
  carga_id UUID REFERENCES public.cargas_perigosas(id) ON DELETE SET NULL,
  tipo public.alerta_geo_tipo NOT NULL,
  severidade public.alerta_severidade NOT NULL DEFAULT 'high',
  distancia_desvio_m NUMERIC(10,2),
  latitude NUMERIC(9,6),
  longitude NUMERIC(9,6),
  mensagem TEXT NOT NULL,
  status public.alerta_geo_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_alertas_geo_status ON public.alertas_geofencing(status, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.alertas_geofencing TO authenticated;
GRANT ALL ON public.alertas_geofencing TO service_role;
ALTER TABLE public.alertas_geofencing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gov e super_admin gerenciam alertas geo" ON public.alertas_geofencing
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'gov') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'gov') OR public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER trg_alertas_geo_updated BEFORE UPDATE ON public.alertas_geofencing
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.telemetria_frota;
ALTER PUBLICATION supabase_realtime ADD TABLE public.alertas_geofencing;
ALTER TABLE public.telemetria_frota REPLICA IDENTITY FULL;
ALTER TABLE public.alertas_geofencing REPLICA IDENTITY FULL;
