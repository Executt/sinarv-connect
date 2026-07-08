
-- Módulo de Gestão de Resíduos Críticos (Perigosos + Hospitalares/RSS)

-- 1. Geradores críticos (hospitais, clínicas, indústrias)
CREATE TABLE public.geradores_criticos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  razao_social TEXT NOT NULL,
  cnpj TEXT NOT NULL UNIQUE,
  tipo TEXT NOT NULL CHECK (tipo IN ('hospital','clinica','laboratorio','industria_publica','industria_privada','outro')),
  cnes TEXT,
  endereco TEXT,
  municipio TEXT,
  uf TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  responsavel_nome TEXT,
  responsavel_email TEXT,
  responsavel_telefone TEXT,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.geradores_criticos TO authenticated;
GRANT ALL ON public.geradores_criticos TO service_role;
ALTER TABLE public.geradores_criticos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gov e admin gerenciam geradores" ON public.geradores_criticos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'gov') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'gov') OR public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER trg_geradores_updated BEFORE UPDATE ON public.geradores_criticos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Operadores logísticos (transportadores homologados)
CREATE TABLE public.operadores_logisticos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  razao_social TEXT NOT NULL,
  cnpj TEXT NOT NULL UNIQUE,
  tipo TEXT NOT NULL CHECK (tipo IN ('transportador','destinador','ambos')),
  natureza TEXT NOT NULL DEFAULT 'privado' CHECK (natureza IN ('publico','privado','misto')),
  contato_email TEXT,
  contato_telefone TEXT,
  homologado BOOLEAN NOT NULL DEFAULT FALSE,
  bloqueado BOOLEAN NOT NULL DEFAULT FALSE,
  motivo_bloqueio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.operadores_logisticos TO authenticated;
GRANT ALL ON public.operadores_logisticos TO service_role;
ALTER TABLE public.operadores_logisticos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gov e admin gerenciam operadores" ON public.operadores_logisticos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'gov') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'gov') OR public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER trg_operadores_updated BEFORE UPDATE ON public.operadores_logisticos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Licenças ambientais
CREATE TABLE public.licencas_ambientais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  operador_id UUID NOT NULL REFERENCES public.operadores_logisticos(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  numero TEXT NOT NULL,
  orgao_emissor TEXT NOT NULL,
  emissao DATE NOT NULL,
  validade DATE NOT NULL,
  arquivo_url TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.licencas_ambientais TO authenticated;
GRANT ALL ON public.licencas_ambientais TO service_role;
ALTER TABLE public.licencas_ambientais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gov e admin gerenciam licencas" ON public.licencas_ambientais FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'gov') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'gov') OR public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER trg_licencas_updated BEFORE UPDATE ON public.licencas_ambientais FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: bloqueia operador quando todas as licenças vencerem
CREATE OR REPLACE FUNCTION public.reavaliar_bloqueio_operador() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_op UUID; v_ativas INT;
BEGIN
  v_op := COALESCE(NEW.operador_id, OLD.operador_id);
  SELECT count(*) INTO v_ativas FROM public.licencas_ambientais WHERE operador_id = v_op AND validade >= CURRENT_DATE;
  IF v_ativas = 0 THEN
    UPDATE public.operadores_logisticos SET bloqueado = TRUE, motivo_bloqueio = 'Nenhuma licença ambiental vigente' WHERE id = v_op;
  ELSE
    UPDATE public.operadores_logisticos SET bloqueado = FALSE, motivo_bloqueio = NULL WHERE id = v_op AND motivo_bloqueio = 'Nenhuma licença ambiental vigente';
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_licencas_bloqueio AFTER INSERT OR UPDATE OR DELETE ON public.licencas_ambientais
  FOR EACH ROW EXECUTE FUNCTION public.reavaliar_bloqueio_operador();

-- 4. Veículos homologados (extensão de veiculos_frota via chave própria)
CREATE TABLE public.veiculos_homologados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  operador_id UUID NOT NULL REFERENCES public.operadores_logisticos(id) ON DELETE CASCADE,
  placa TEXT NOT NULL UNIQUE,
  tipo TEXT NOT NULL,
  capacidade_kg NUMERIC,
  onu_class TEXT,
  antt TEXT,
  vistoria_validade DATE,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.veiculos_homologados TO authenticated;
GRANT ALL ON public.veiculos_homologados TO service_role;
ALTER TABLE public.veiculos_homologados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gov e admin gerenciam veiculos homologados" ON public.veiculos_homologados FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'gov') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'gov') OR public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER trg_veiculos_hom_updated BEFORE UPDATE ON public.veiculos_homologados FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. MTR (Manifesto de Transporte de Resíduos)
CREATE TABLE public.mtr_solicitacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE DEFAULT ('MTR-' || to_char(now(),'YYYYMMDD') || '-' || substr(gen_random_uuid()::text,1,8)),
  gerador_id UUID NOT NULL REFERENCES public.geradores_criticos(id),
  operador_id UUID REFERENCES public.operadores_logisticos(id),
  destinador_id UUID REFERENCES public.operadores_logisticos(id),
  veiculo_id UUID REFERENCES public.veiculos_homologados(id),
  classe_residuo TEXT NOT NULL,
  onu_number TEXT,
  quantidade_kg NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'solicitado' CHECK (status IN ('solicitado','aceito','em_transito','recebido','recusado','divergente','cancelado')),
  data_prevista TIMESTAMPTZ,
  data_coleta TIMESTAMPTZ,
  data_recepcao TIMESTAMPTZ,
  assinatura_gerador TEXT,
  assinatura_transportador TEXT,
  assinatura_destinador TEXT,
  observacoes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mtr_solicitacoes TO authenticated;
GRANT ALL ON public.mtr_solicitacoes TO service_role;
ALTER TABLE public.mtr_solicitacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gov e admin gerenciam MTR" ON public.mtr_solicitacoes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'gov') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'gov') OR public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER trg_mtr_updated BEFORE UPDATE ON public.mtr_solicitacoes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.mtr_solicitacoes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.operadores_logisticos;
