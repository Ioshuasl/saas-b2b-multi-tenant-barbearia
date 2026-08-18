-- Garante roles em ambientes onde o init do Docker não rodou (ex.: CI service).
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_migrator') THEN
    CREATE ROLE app_migrator LOGIN PASSWORD 'migrator' NOSUPERUSER NOBYPASSRLS CREATEDB;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_user') THEN
    CREATE ROLE app_user LOGIN PASSWORD 'app' NOSUPERUSER NOBYPASSRLS;
  END IF;
END
$$;

GRANT CONNECT ON DATABASE barbearia_dev TO app_migrator;
GRANT CONNECT ON DATABASE barbearia_dev TO app_user;
GRANT ALL ON SCHEMA public TO app_migrator;
GRANT CREATE ON SCHEMA public TO app_migrator;
GRANT USAGE ON SCHEMA public TO app_user;
