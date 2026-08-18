CREATE EXTENSION IF NOT EXISTS citext;

CREATE SCHEMA IF NOT EXISTS platform;

CREATE OR REPLACE FUNCTION platform.enable_tenant_rls(target regclass) RETURNS void AS $$
DECLARE
  t text := target::text;
BEGIN
  EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', t);
  EXECUTE format('ALTER TABLE %s FORCE ROW LEVEL SECURITY', t);
  EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %s', t);
  EXECUTE format(
    $f$CREATE POLICY tenant_isolation ON %s
         USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
         WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)$f$,
    t
  );
END;
$$ LANGUAGE plpgsql;

CREATE TABLE "tenant" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" CITEXT NOT NULL,
    "logo_url" TEXT,
    "brand_color" TEXT,
    "status" TEXT NOT NULL DEFAULT 'TRIALING',
    "trial_ends_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tenant_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tenant_slug_key" ON "tenant"("slug");

CREATE TABLE "location" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "slug" CITEXT NOT NULL,
    "name" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    "phone" TEXT,
    "email" CITEXT,
    "booking_lead_time_minutes" INTEGER NOT NULL DEFAULT 60,
    "booking_horizon_days" INTEGER NOT NULL DEFAULT 60,
    "cancel_deadline_hours" INTEGER NOT NULL DEFAULT 2,
    "accepts_online_booking" BOOLEAN NOT NULL DEFAULT true,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "location_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "location_tenant_id_slug_key" ON "location"("tenant_id", "slug");
CREATE UNIQUE INDEX "uq_location_default" ON "location"("tenant_id") WHERE is_default;

CREATE TABLE "user" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "email" CITEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "email_verified_at" TIMESTAMPTZ,
    "last_login_at" TIMESTAMPTZ,
    "failed_attempts" SMALLINT NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

CREATE TABLE "user_location" (
    "tenant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    CONSTRAINT "user_location_pkey" PRIMARY KEY ("tenant_id", "user_id", "location_id")
);

CREATE TABLE "tenant_crypto_key" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "key_version" INTEGER NOT NULL DEFAULT 1,
    "algorithm" TEXT NOT NULL DEFAULT 'AES-256-GCM',
    "wrapped_dek" TEXT NOT NULL,
    "kek_provider" TEXT NOT NULL DEFAULT 'local_vps',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retired_at" TIMESTAMPTZ,
    CONSTRAINT "tenant_crypto_key_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tenant_crypto_key_tenant_id_key_version_key"
  ON "tenant_crypto_key"("tenant_id", "key_version");

CREATE UNIQUE INDEX "uq_tenant_crypto_active"
  ON "tenant_crypto_key" ("tenant_id")
  WHERE status = 'ACTIVE';

CREATE TABLE "audit_log" (
    "id" UUID NOT NULL,
    "tenant_id" UUID,
    "actor_user_id" UUID,
    "actor_type" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "resource_id" UUID,
    "customer_id" UUID,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_audit_tenant_time" ON "audit_log"("tenant_id", "created_at" DESC);

CREATE TABLE "outbox_event" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "occurred_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMPTZ,
    "attempts" SMALLINT NOT NULL DEFAULT 0,
    "last_error" TEXT,
    CONSTRAINT "outbox_event_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "location"
  ADD CONSTRAINT "location_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "user"
  ADD CONSTRAINT "user_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "user_location"
  ADD CONSTRAINT "user_location_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "user_location"
  ADD CONSTRAINT "user_location_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "user"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "user_location"
  ADD CONSTRAINT "user_location_location_id_fkey"
  FOREIGN KEY ("location_id") REFERENCES "location"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "tenant_crypto_key"
  ADD CONSTRAINT "tenant_crypto_key_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "audit_log"
  ADD CONSTRAINT "audit_log_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "outbox_event"
  ADD CONSTRAINT "outbox_event_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "tenant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tenant" FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_select ON "tenant"
  FOR SELECT
  USING (
    id = nullif(current_setting('app.tenant_id', true), '')::uuid
    OR current_setting('app.provisioning', true) = 'on'
  );

CREATE POLICY tenant_insert ON "tenant"
  FOR INSERT
  WITH CHECK (current_setting('app.provisioning', true) = 'on');

CREATE POLICY tenant_update ON "tenant"
  FOR UPDATE
  USING (id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (id = nullif(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY tenant_delete ON "tenant"
  FOR DELETE
  USING (id = nullif(current_setting('app.tenant_id', true), '')::uuid);

SELECT platform.enable_tenant_rls('location');
SELECT platform.enable_tenant_rls('"user"');
SELECT platform.enable_tenant_rls('user_location');
SELECT platform.enable_tenant_rls('tenant_crypto_key');
SELECT platform.enable_tenant_rls('audit_log');
SELECT platform.enable_tenant_rls('outbox_event');

CREATE OR REPLACE FUNCTION platform.audit_log_append_only() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_log_no_update
  BEFORE UPDATE OR DELETE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION platform.audit_log_append_only();

GRANT USAGE ON SCHEMA public TO app_user;
GRANT USAGE ON SCHEMA platform TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  "tenant", "location", "user", "user_location",
  "tenant_crypto_key", "audit_log", "outbox_event"
  TO app_user;
