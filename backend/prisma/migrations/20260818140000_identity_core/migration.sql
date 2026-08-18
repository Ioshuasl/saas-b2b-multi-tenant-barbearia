-- S1 Bloco 1: identity core + seeds de signup (service / business_hours).

CREATE TABLE "tenant_slug_history" (
    "slug" CITEXT NOT NULL,
    "tenant_id" UUID NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "tenant_slug_history_pkey" PRIMARY KEY ("slug")
);

CREATE TABLE "invitation" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "email" CITEXT NOT NULL,
    "role" TEXT NOT NULL,
    "location_ids" UUID[] NOT NULL DEFAULT '{}',
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "accepted_at" TIMESTAMPTZ,
    "invited_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "invitation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "invitation_token_hash_key" ON "invitation"("token_hash");

CREATE TABLE "refresh_token_family" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "family_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "consumed_at" TIMESTAMPTZ,
    "revoked_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "refresh_token_family_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "refresh_token_family_token_hash_key" ON "refresh_token_family"("token_hash");
CREATE INDEX "idx_refresh_family" ON "refresh_token_family"("user_id", "family_id");

CREATE TABLE "service" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "duration_minutes" SMALLINT NOT NULL,
    "buffer_minutes" SMALLINT NOT NULL DEFAULT 0,
    "price_cents" BIGINT NOT NULL DEFAULT 0,
    "color" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "visible_online" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "deleted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "service_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "service_duration_minutes_check" CHECK ("duration_minutes" BETWEEN 5 AND 480),
    CONSTRAINT "service_price_cents_check" CHECK ("price_cents" >= 0)
);

CREATE TABLE "business_hours" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    "staff_id" UUID,
    "weekday" SMALLINT NOT NULL,
    "starts_at" TIME NOT NULL,
    "ends_at" TIME NOT NULL,
    CONSTRAINT "business_hours_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "business_hours_weekday_check" CHECK ("weekday" BETWEEN 1 AND 7),
    CONSTRAINT "business_hours_range_check" CHECK ("ends_at" > "starts_at")
);

ALTER TABLE "tenant_slug_history"
  ADD CONSTRAINT "tenant_slug_history_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "invitation"
  ADD CONSTRAINT "invitation_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "refresh_token_family"
  ADD CONSTRAINT "refresh_token_family_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "refresh_token_family"
  ADD CONSTRAINT "refresh_token_family_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "user"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "service"
  ADD CONSTRAINT "service_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "business_hours"
  ADD CONSTRAINT "business_hours_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "business_hours"
  ADD CONSTRAINT "business_hours_location_id_fkey"
  FOREIGN KEY ("location_id") REFERENCES "location"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

SELECT platform.enable_tenant_rls('tenant_slug_history');
SELECT platform.enable_tenant_rls('invitation');
SELECT platform.enable_tenant_rls('refresh_token_family');
SELECT platform.enable_tenant_rls('service');
SELECT platform.enable_tenant_rls('business_hours');

CREATE OR REPLACE FUNCTION platform.lookup_user_by_email(p_email citext)
RETURNS TABLE (
  id uuid,
  "tenantId" uuid,
  email citext,
  "passwordHash" text,
  name text,
  phone text,
  role text,
  status text,
  "lockedUntil" timestamptz,
  "failedAttempts" smallint,
  "tenantSlug" citext
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    u.id,
    u.tenant_id,
    u.email,
    u.password_hash,
    u.name,
    u.phone,
    u.role,
    u.status,
    u.locked_until,
    u.failed_attempts,
    t.slug
  FROM "user" u
  JOIN tenant t ON t.id = u.tenant_id
  WHERE u.email = p_email
$$;

CREATE OR REPLACE FUNCTION platform.lookup_refresh_by_token_hash(p_hash text)
RETURNS TABLE (
  id uuid,
  "tenantId" uuid,
  "userId" uuid,
  "familyId" uuid,
  "tokenHash" text,
  "expiresAt" timestamptz,
  "consumedAt" timestamptz,
  "revokedAt" timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    r.id,
    r.tenant_id,
    r.user_id,
    r.family_id,
    r.token_hash,
    r.expires_at,
    r.consumed_at,
    r.revoked_at
  FROM refresh_token_family r
  WHERE r.token_hash = p_hash
$$;

REVOKE ALL ON FUNCTION platform.lookup_user_by_email(citext) FROM PUBLIC;
REVOKE ALL ON FUNCTION platform.lookup_refresh_by_token_hash(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION platform.lookup_user_by_email(citext) TO app_user;
GRANT EXECUTE ON FUNCTION platform.lookup_refresh_by_token_hash(text) TO app_user;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  "tenant_slug_history", "invitation", "refresh_token_family",
  "service", "business_hours"
  TO app_user;
