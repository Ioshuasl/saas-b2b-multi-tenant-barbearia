-- S2 Bloco 1: cadastro de clientes finais (E3 Must).

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE "customer" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "first_location_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" CITEXT,
    "notes" TEXT,
    "birthdate" DATE,
    "marketing_opt_in" BOOLEAN NOT NULL DEFAULT false,
    "origin" TEXT NOT NULL DEFAULT 'PANEL',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "customer"
  ADD CONSTRAINT "customer_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "customer"
  ADD CONSTRAINT "customer_first_location_id_fkey"
    FOREIGN KEY ("first_location_id") REFERENCES "location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE UNIQUE INDEX "uq_customer_phone"
  ON "customer" ("tenant_id", "phone")
  WHERE "deleted_at" IS NULL;

CREATE INDEX "idx_customer_name_trgm"
  ON "customer" USING gin ("name" gin_trgm_ops);

CREATE INDEX "idx_customer_phone"
  ON "customer" ("tenant_id", "phone");

SELECT platform.enable_tenant_rls('customer');

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "customer" TO app_user;
