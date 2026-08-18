-- Roles da aplicação (docs/06, ADR-0002).
-- Roda só no primeiro boot do volume Postgres.

CREATE ROLE app_migrator LOGIN PASSWORD 'migrator' NOSUPERUSER NOBYPASSRLS CREATEDB;
CREATE ROLE app_user LOGIN PASSWORD 'app' NOSUPERUSER NOBYPASSRLS;

GRANT CONNECT ON DATABASE barbearia_dev TO app_migrator;
GRANT CONNECT ON DATABASE barbearia_dev TO app_user;

GRANT ALL ON SCHEMA public TO app_migrator;
GRANT CREATE ON SCHEMA public TO app_migrator;
GRANT USAGE ON SCHEMA public TO app_user;

ALTER DEFAULT PRIVILEGES FOR ROLE app_migrator IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;
ALTER DEFAULT PRIVILEGES FOR ROLE app_migrator IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO app_user;
