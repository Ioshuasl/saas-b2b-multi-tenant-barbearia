-- Grants app_user na tabela customer (complemento da migração customers_core).

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "customer" TO app_user;
