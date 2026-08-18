-- S2 Bloco 2: agenda — appointment, snapshots, histórico, EXCLUDE anti-overbooking.

CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE "appointment" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "staff_id" UUID NOT NULL,
    "starts_at" TIMESTAMPTZ NOT NULL,
    "ends_at" TIMESTAMPTZ NOT NULL,
    "period" tstzrange GENERATED ALWAYS AS (tstzrange("starts_at", "ends_at", '[)')) STORED,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "source" TEXT NOT NULL DEFAULT 'PANEL',
    "total_price_cents" BIGINT NOT NULL DEFAULT 0,
    "notes" TEXT,
    "cancel_token_hash" TEXT,
    "canceled_at" TIMESTAMPTZ,
    "canceled_by" TEXT,
    "cancel_reason" TEXT,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "appointment_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "appointment_ends_after_start" CHECK ("ends_at" > "starts_at")
);

ALTER TABLE "appointment"
  ADD CONSTRAINT "appointment_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "appointment"
  ADD CONSTRAINT "appointment_location_id_fkey"
    FOREIGN KEY ("location_id") REFERENCES "location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "appointment"
  ADD CONSTRAINT "appointment_customer_id_fkey"
    FOREIGN KEY ("customer_id") REFERENCES "customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "appointment"
  ADD CONSTRAINT "appointment_staff_id_fkey"
    FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE UNIQUE INDEX "uq_appointment_cancel_token_hash"
  ON "appointment" ("cancel_token_hash")
  WHERE "cancel_token_hash" IS NOT NULL;

ALTER TABLE "appointment" ADD CONSTRAINT "appointment_staff_no_overlap"
  EXCLUDE USING gist (
    "tenant_id" WITH =,
    "staff_id" WITH =,
    "period" WITH &&
  ) WHERE ("status" IN ('SCHEDULED', 'CONFIRMED', 'IN_SERVICE'));

CREATE INDEX "idx_appointment_agenda"
  ON "appointment" ("tenant_id", "location_id", "starts_at");

CREATE INDEX "idx_appointment_staff"
  ON "appointment" ("tenant_id", "staff_id", "starts_at");

CREATE INDEX "idx_appointment_customer"
  ON "appointment" ("tenant_id", "customer_id", "starts_at" DESC);

CREATE TABLE "appointment_service" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "appointment_id" UUID NOT NULL,
    "service_id" UUID NOT NULL,
    "price_cents" BIGINT NOT NULL,
    "duration_minutes" SMALLINT NOT NULL,

    CONSTRAINT "appointment_service_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "appointment_service_price_check" CHECK ("price_cents" >= 0),
    CONSTRAINT "appointment_service_duration_check" CHECK ("duration_minutes" BETWEEN 5 AND 480)
);

ALTER TABLE "appointment_service"
  ADD CONSTRAINT "appointment_service_appointment_id_fkey"
    FOREIGN KEY ("appointment_id") REFERENCES "appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "appointment_service"
  ADD CONSTRAINT "appointment_service_service_id_fkey"
    FOREIGN KEY ("service_id") REFERENCES "service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "idx_appointment_service_appointment"
  ON "appointment_service" ("tenant_id", "appointment_id");

CREATE TABLE "appointment_history" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "appointment_id" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "from_value" JSONB,
    "to_value" JSONB,
    "actor_id" UUID,
    "actor_type" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "appointment_history_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "appointment_history"
  ADD CONSTRAINT "appointment_history_appointment_id_fkey"
    FOREIGN KEY ("appointment_id") REFERENCES "appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "idx_appointment_history_appointment"
  ON "appointment_history" ("tenant_id", "appointment_id", "created_at" DESC);

SELECT platform.enable_tenant_rls('appointment');
SELECT platform.enable_tenant_rls('appointment_service');
SELECT platform.enable_tenant_rls('appointment_history');

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  "appointment", "appointment_service", "appointment_history"
  TO app_user;
