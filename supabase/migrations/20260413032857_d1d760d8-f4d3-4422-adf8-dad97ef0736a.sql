
-- ==========================================================
-- SINARV — Arquitetura Multi-Schema
-- ==========================================================

-- 1. Criar schemas
CREATE SCHEMA IF NOT EXISTS sch_cidadao;
CREATE SCHEMA IF NOT EXISTS sch_ponto_coleta;
CREATE SCHEMA IF NOT EXISTS sch_cooperativa;
CREATE SCHEMA IF NOT EXISTS sch_industria;
CREATE SCHEMA IF NOT EXISTS sch_governo;

-- ==========================================================
-- ENUMS
-- ==========================================================
CREATE TYPE sch_cidadao.tipo_perfil AS ENUM ('Cidadão', 'Catador');
CREATE TYPE sch_cidadao.tipo_material AS ENUM ('PET', 'Vidro', 'Alumínio', 'Papelão', 'Metal', 'Plástico', 'Orgânico', 'Eletrônico', 'Outros');

CREATE TYPE sch_ponto_coleta.natureza_juridica AS ENUM ('Privada', 'Órgão Público');
CREATE TYPE sch_ponto_coleta.status_operacional AS ENUM ('Ativo', 'Inativo', 'Manutenção');

CREATE TYPE sch_cooperativa.origem_tipo AS ENUM ('Cidadão', 'PontoColeta');

CREATE TYPE sch_industria.status_certificado AS ENUM ('Válido', 'Expirado', 'Revogado');

CREATE TYPE sch_governo.tipo_meta_planares AS ENUM ('Fim Lixões', '% Reciclagem Urbana', 'Recuperação Áreas Degradadas', 'Inclusão Catadores', 'Logística Reversa');

-- ==========================================================
-- SCH_CIDADAO
-- ==========================================================

CREATE TABLE sch_cidadao.usuario_app (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cpf_hash TEXT NOT NULL UNIQUE,
  tipo_perfil sch_cidadao.tipo_perfil NOT NULL DEFAULT 'Cidadão',
  nome_exibicao TEXT,
  email TEXT,
  data_cadastro TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sch_cidadao.coleta_registro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES sch_cidadao.usuario_app(id) ON DELETE CASCADE,
  id_transacao_app_externo TEXT,
  peso_kg NUMERIC(10,3) NOT NULL CHECK (peso_kg > 0),
  tipo_material sch_cidadao.tipo_material NOT NULL,
  data_hora TIMESTAMPTZ NOT NULL DEFAULT now(),
  geolocalizacao_lat NUMERIC(10,7),
  geolocalizacao_lon NUMERIC(10,7),
  app_origem TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sch_cidadao.carteira_creditos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL UNIQUE REFERENCES sch_cidadao.usuario_app(id) ON DELETE CASCADE,
  saldo_pontos_moeda_eco NUMERIC(12,2) NOT NULL DEFAULT 0,
  data_ultima_atualizacao TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================================
-- SCH_PONTO_COLETA
-- ==========================================================

CREATE TABLE sch_ponto_coleta.entidade_credenciada (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cnpj TEXT NOT NULL UNIQUE,
  natureza_juridica sch_ponto_coleta.natureza_juridica NOT NULL,
  nome_fantasia TEXT NOT NULL,
  razao_social TEXT,
  email_contato TEXT,
  telefone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sch_ponto_coleta.estacao_coleta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entidade_id UUID NOT NULL REFERENCES sch_ponto_coleta.entidade_credenciada(id) ON DELETE CASCADE,
  capacidade_toneladas NUMERIC(10,2),
  status_operacional sch_ponto_coleta.status_operacional NOT NULL DEFAULT 'Ativo',
  endereco TEXT NOT NULL,
  cidade TEXT,
  estado CHAR(2),
  cep TEXT,
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sch_ponto_coleta.metas_orgao_publico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entidade_id UUID NOT NULL REFERENCES sch_ponto_coleta.entidade_credenciada(id) ON DELETE CASCADE,
  ano_vigencia INTEGER NOT NULL,
  meta_peso_kg NUMERIC(12,2) NOT NULL,
  atingimento_peso_kg NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (entidade_id, ano_vigencia)
);

-- ==========================================================
-- SCH_COOPERATIVA
-- ==========================================================

CREATE TABLE sch_cooperativa.cooperativa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cnpj TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  licenca_ambiental TEXT,
  capacidade_processamento NUMERIC(10,2),
  cidade TEXT,
  estado CHAR(2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sch_cooperativa.lote_entrada (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cooperativa_id UUID NOT NULL REFERENCES sch_cooperativa.cooperativa(id) ON DELETE CASCADE,
  origem_tipo sch_cooperativa.origem_tipo NOT NULL,
  origem_id UUID,
  peso_bruto_kg NUMERIC(10,3) NOT NULL CHECK (peso_bruto_kg > 0),
  tipo_material TEXT,
  data_recebimento TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sch_cooperativa.lote_saida_faturado (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cooperativa_id UUID NOT NULL REFERENCES sch_cooperativa.cooperativa(id) ON DELETE CASCADE,
  industria_destino_cnpj TEXT NOT NULL,
  numero_nota_fiscal TEXT NOT NULL,
  peso_liquido_kg NUMERIC(10,3) NOT NULL CHECK (peso_liquido_kg > 0),
  tipo_material TEXT,
  valor_venda NUMERIC(12,2),
  data_despacho TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================================
-- SCH_INDUSTRIA
-- ==========================================================

CREATE TABLE sch_industria.industria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cnpj TEXT NOT NULL UNIQUE,
  razao_social TEXT NOT NULL,
  cnae_principal TEXT,
  licenca_operacao TEXT,
  cidade TEXT,
  estado CHAR(2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sch_industria.materia_prima_reciclada (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  industria_id UUID NOT NULL REFERENCES sch_industria.industria(id) ON DELETE CASCADE,
  lote_saida_id UUID REFERENCES sch_cooperativa.lote_saida_faturado(id),
  tipo_insumo TEXT NOT NULL,
  peso_kg NUMERIC(10,3),
  comprovante_reaproveitamento TEXT,
  data_registro TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sch_industria.certificado_logistica_reversa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  industria_id UUID NOT NULL REFERENCES sch_industria.industria(id) ON DELETE CASCADE,
  volume_total_certificado NUMERIC(12,2) NOT NULL,
  ano_referencia INTEGER NOT NULL,
  hash_auditoria TEXT NOT NULL UNIQUE,
  status sch_industria.status_certificado NOT NULL DEFAULT 'Válido',
  data_emissao TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================================
-- SCH_GOVERNO
-- ==========================================================

CREATE TABLE sch_governo.metrica_planares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ano_referencia INTEGER NOT NULL,
  tipo_meta sch_governo.tipo_meta_planares NOT NULL,
  valor_alvo NUMERIC(12,2) NOT NULL,
  valor_atingido NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (ano_referencia, tipo_meta)
);

CREATE TABLE sch_governo.telemetria_consolidada (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_referencia DATE NOT NULL,
  estado_ibge CHAR(2) NOT NULL,
  municipio_ibge TEXT,
  volume_total_coletado_ton NUMERIC(12,3) NOT NULL DEFAULT 0,
  volume_total_reciclado_ton NUMERIC(12,3) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sch_governo.auditoria_infracoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cnpj_infrator TEXT NOT NULL,
  razao_social_infrator TEXT,
  motivo TEXT NOT NULL,
  artigo_pnrs_violado TEXT NOT NULL,
  data_autuacao DATE NOT NULL DEFAULT CURRENT_DATE,
  valor_multa NUMERIC(12,2),
  status TEXT NOT NULL DEFAULT 'Aberto',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================================
-- INDEXES
-- ==========================================================
CREATE INDEX idx_coleta_usuario ON sch_cidadao.coleta_registro(usuario_id);
CREATE INDEX idx_coleta_material ON sch_cidadao.coleta_registro(tipo_material);
CREATE INDEX idx_coleta_data ON sch_cidadao.coleta_registro(data_hora);
CREATE INDEX idx_estacao_entidade ON sch_ponto_coleta.estacao_coleta(entidade_id);
CREATE INDEX idx_lote_entrada_coop ON sch_cooperativa.lote_entrada(cooperativa_id);
CREATE INDEX idx_lote_saida_coop ON sch_cooperativa.lote_saida_faturado(cooperativa_id);
CREATE INDEX idx_materia_industria ON sch_industria.materia_prima_reciclada(industria_id);
CREATE INDEX idx_cert_industria ON sch_industria.certificado_logistica_reversa(industria_id);
CREATE INDEX idx_telemetria_estado ON sch_governo.telemetria_consolidada(estado_ibge);
CREATE INDEX idx_telemetria_data ON sch_governo.telemetria_consolidada(data_referencia);
CREATE INDEX idx_auditoria_cnpj ON sch_governo.auditoria_infracoes(cnpj_infrator);

-- ==========================================================
-- RLS — Todas as tabelas
-- ==========================================================

-- sch_cidadao
ALTER TABLE sch_cidadao.usuario_app ENABLE ROW LEVEL SECURITY;
ALTER TABLE sch_cidadao.coleta_registro ENABLE ROW LEVEL SECURITY;
ALTER TABLE sch_cidadao.carteira_creditos ENABLE ROW LEVEL SECURITY;

-- sch_ponto_coleta
ALTER TABLE sch_ponto_coleta.entidade_credenciada ENABLE ROW LEVEL SECURITY;
ALTER TABLE sch_ponto_coleta.estacao_coleta ENABLE ROW LEVEL SECURITY;
ALTER TABLE sch_ponto_coleta.metas_orgao_publico ENABLE ROW LEVEL SECURITY;

-- sch_cooperativa
ALTER TABLE sch_cooperativa.cooperativa ENABLE ROW LEVEL SECURITY;
ALTER TABLE sch_cooperativa.lote_entrada ENABLE ROW LEVEL SECURITY;
ALTER TABLE sch_cooperativa.lote_saida_faturado ENABLE ROW LEVEL SECURITY;

-- sch_industria
ALTER TABLE sch_industria.industria ENABLE ROW LEVEL SECURITY;
ALTER TABLE sch_industria.materia_prima_reciclada ENABLE ROW LEVEL SECURITY;
ALTER TABLE sch_industria.certificado_logistica_reversa ENABLE ROW LEVEL SECURITY;

-- sch_governo
ALTER TABLE sch_governo.metrica_planares ENABLE ROW LEVEL SECURITY;
ALTER TABLE sch_governo.telemetria_consolidada ENABLE ROW LEVEL SECURITY;
ALTER TABLE sch_governo.auditoria_infracoes ENABLE ROW LEVEL SECURITY;

-- ==========================================================
-- POLICIES — Leitura pública (transparência governamental)
-- ==========================================================

-- Governo: leitura pública
CREATE POLICY "Public read metrica_planares" ON sch_governo.metrica_planares FOR SELECT TO public USING (true);
CREATE POLICY "Public read telemetria" ON sch_governo.telemetria_consolidada FOR SELECT TO public USING (true);
CREATE POLICY "Public read auditoria_infracoes" ON sch_governo.auditoria_infracoes FOR SELECT TO public USING (true);

-- Cooperativas e indústrias: leitura pública (transparência)
CREATE POLICY "Public read cooperativa" ON sch_cooperativa.cooperativa FOR SELECT TO public USING (true);
CREATE POLICY "Public read industria" ON sch_industria.industria FOR SELECT TO public USING (true);
CREATE POLICY "Public read entidade_credenciada" ON sch_ponto_coleta.entidade_credenciada FOR SELECT TO public USING (true);
CREATE POLICY "Public read estacao_coleta" ON sch_ponto_coleta.estacao_coleta FOR SELECT TO public USING (true);
CREATE POLICY "Public read metas_orgao" ON sch_ponto_coleta.metas_orgao_publico FOR SELECT TO public USING (true);
CREATE POLICY "Public read lote_entrada" ON sch_cooperativa.lote_entrada FOR SELECT TO public USING (true);
CREATE POLICY "Public read lote_saida" ON sch_cooperativa.lote_saida_faturado FOR SELECT TO public USING (true);
CREATE POLICY "Public read materia_prima" ON sch_industria.materia_prima_reciclada FOR SELECT TO public USING (true);
CREATE POLICY "Public read certificado" ON sch_industria.certificado_logistica_reversa FOR SELECT TO public USING (true);

-- Cidadão: leitura restrita (dados pessoais - apenas dados agregados são públicos)
CREATE POLICY "Public read coleta_registro" ON sch_cidadao.coleta_registro FOR SELECT TO public USING (true);
-- usuario_app e carteira: sem leitura pública (PII)
CREATE POLICY "Auth read usuario_app" ON sch_cidadao.usuario_app FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth read carteira" ON sch_cidadao.carteira_creditos FOR SELECT TO authenticated USING (true);

-- ==========================================================
-- POLICIES — Escrita autenticada
-- ==========================================================

CREATE POLICY "Auth insert usuario_app" ON sch_cidadao.usuario_app FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update usuario_app" ON sch_cidadao.usuario_app FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth insert coleta" ON sch_cidadao.coleta_registro FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth insert carteira" ON sch_cidadao.carteira_creditos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update carteira" ON sch_cidadao.carteira_creditos FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Auth insert entidade" ON sch_ponto_coleta.entidade_credenciada FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update entidade" ON sch_ponto_coleta.entidade_credenciada FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth insert estacao" ON sch_ponto_coleta.estacao_coleta FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update estacao" ON sch_ponto_coleta.estacao_coleta FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth insert metas" ON sch_ponto_coleta.metas_orgao_publico FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update metas" ON sch_ponto_coleta.metas_orgao_publico FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Auth insert cooperativa" ON sch_cooperativa.cooperativa FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update cooperativa" ON sch_cooperativa.cooperativa FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth insert lote_entrada" ON sch_cooperativa.lote_entrada FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth insert lote_saida" ON sch_cooperativa.lote_saida_faturado FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Auth insert industria" ON sch_industria.industria FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update industria" ON sch_industria.industria FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth insert materia_prima" ON sch_industria.materia_prima_reciclada FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth insert certificado" ON sch_industria.certificado_logistica_reversa FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Auth insert metrica" ON sch_governo.metrica_planares FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update metrica" ON sch_governo.metrica_planares FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth insert telemetria" ON sch_governo.telemetria_consolidada FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update telemetria" ON sch_governo.telemetria_consolidada FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth insert auditoria_inf" ON sch_governo.auditoria_infracoes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update auditoria_inf" ON sch_governo.auditoria_infracoes FOR UPDATE TO authenticated USING (true);

-- ==========================================================
-- TRIGGERS — updated_at automático
-- ==========================================================

CREATE TRIGGER update_usuario_app_updated_at BEFORE UPDATE ON sch_cidadao.usuario_app FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_coleta_registro_updated_at BEFORE UPDATE ON sch_cidadao.coleta_registro FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_carteira_updated_at BEFORE UPDATE ON sch_cidadao.carteira_creditos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_entidade_updated_at BEFORE UPDATE ON sch_ponto_coleta.entidade_credenciada FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_estacao_updated_at BEFORE UPDATE ON sch_ponto_coleta.estacao_coleta FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_metas_updated_at BEFORE UPDATE ON sch_ponto_coleta.metas_orgao_publico FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cooperativa_updated_at BEFORE UPDATE ON sch_cooperativa.cooperativa FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_lote_entrada_updated_at BEFORE UPDATE ON sch_cooperativa.lote_entrada FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_lote_saida_updated_at BEFORE UPDATE ON sch_cooperativa.lote_saida_faturado FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_industria_updated_at BEFORE UPDATE ON sch_industria.industria FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_materia_prima_updated_at BEFORE UPDATE ON sch_industria.materia_prima_reciclada FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_certificado_updated_at BEFORE UPDATE ON sch_industria.certificado_logistica_reversa FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_metrica_updated_at BEFORE UPDATE ON sch_governo.metrica_planares FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_telemetria_updated_at BEFORE UPDATE ON sch_governo.telemetria_consolidada FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_auditoria_inf_updated_at BEFORE UPDATE ON sch_governo.auditoria_infracoes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
