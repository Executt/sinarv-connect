
-- Expose all custom schemas to PostgREST
ALTER ROLE authenticator SET pgrst.db_schemas = 'public, sch_cidadao, sch_ponto_coleta, sch_cooperativa, sch_industria, sch_governo';
NOTIFY pgrst, 'reload config';

-- Grant USAGE on schemas to anon and authenticated
GRANT USAGE ON SCHEMA sch_cidadao TO anon, authenticated;
GRANT USAGE ON SCHEMA sch_ponto_coleta TO anon, authenticated;
GRANT USAGE ON SCHEMA sch_cooperativa TO anon, authenticated;
GRANT USAGE ON SCHEMA sch_industria TO anon, authenticated;
GRANT USAGE ON SCHEMA sch_governo TO anon, authenticated;

-- Grant SELECT on all tables to anon (public read via RLS)
GRANT SELECT ON ALL TABLES IN SCHEMA sch_cidadao TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA sch_ponto_coleta TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA sch_cooperativa TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA sch_industria TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA sch_governo TO anon;

-- Grant ALL on tables to authenticated (write via RLS)
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA sch_cidadao TO authenticated;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA sch_ponto_coleta TO authenticated;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA sch_cooperativa TO authenticated;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA sch_industria TO authenticated;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA sch_governo TO authenticated;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA sch_cidadao GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA sch_ponto_coleta GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA sch_cooperativa GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA sch_industria GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA sch_governo GRANT SELECT ON TABLES TO anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA sch_cidadao GRANT SELECT, INSERT, UPDATE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA sch_ponto_coleta GRANT SELECT, INSERT, UPDATE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA sch_cooperativa GRANT SELECT, INSERT, UPDATE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA sch_industria GRANT SELECT, INSERT, UPDATE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA sch_governo GRANT SELECT, INSERT, UPDATE ON TABLES TO authenticated;
