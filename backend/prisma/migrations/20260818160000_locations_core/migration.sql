-- S1 Bloco 3: cadastros da rede (locations, staff, hours, time_block, onboarding).

ALTER TABLE "tenant"
  ADD COLUMN "onboarding" JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE "location"
  ADD COLUMN "address" JSONB,
  ADD COLUMN "latitude" DECIMAL(9, 6),
  ADD COLUMN "longitude" DECIMAL(9, 6),
  ADD COLUMN "cover_url" TEXT;

CREATE TABLE "location_slug_history" (
    "tenant_id" UUID NOT NULL,
    "slug" CITEXT NOT NULL,
    "location_id" UUID NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "location_slug_history_pkey" PRIMARY KEY ("tenant_id", "slug")
);

CREATE TABLE "staff" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "home_location_id" UUID NOT NULL,
    "user_id" UUID,
    "name" TEXT NOT NULL,
    "photo_url" TEXT,
    "bio" TEXT,
    "commission_percent" DECIMAL(5, 2) NOT NULL DEFAULT 0,
    "accepts_online_booking" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "staff_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "staff_commission_percent_check" CHECK ("commission_percent" BETWEEN 0 AND 100)
);

CREATE TABLE "staff_location" (
    "tenant_id" UUID NOT NULL,
    "staff_id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    CONSTRAINT "staff_location_pkey" PRIMARY KEY ("tenant_id", "staff_id", "location_id")
);

CREATE TABLE "location_service" (
    "tenant_id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    "service_id" UUID NOT NULL,
    "price_cents_override" BIGINT,
    "duration_minutes_override" SMALLINT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "location_service_pkey" PRIMARY KEY ("location_id", "service_id"),
    CONSTRAINT "location_service_price_check" CHECK ("price_cents_override" IS NULL OR "price_cents_override" >= 0),
    CONSTRAINT "location_service_duration_check" CHECK (
      "duration_minutes_override" IS NULL OR "duration_minutes_override" BETWEEN 5 AND 480
    )
);

CREATE TABLE "staff_service" (
    "tenant_id" UUID NOT NULL,
    "staff_id" UUID NOT NULL,
    "service_id" UUID NOT NULL,
    CONSTRAINT "staff_service_pkey" PRIMARY KEY ("staff_id", "service_id")
);

CREATE TABLE "service_catalog_template" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "duration_minutes" SMALLINT NOT NULL,
    "sort_order" INTEGER NOT NULL,
    CONSTRAINT "service_catalog_template_pkey" PRIMARY KEY ("code")
);

CREATE TABLE "time_block" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    "staff_id" UUID,
    "starts_at" TIMESTAMPTZ NOT NULL,
    "ends_at" TIMESTAMPTZ NOT NULL,
    "reason" TEXT NOT NULL,
    "rrule" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "time_block_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "time_block_range_check" CHECK ("ends_at" > "starts_at")
);

INSERT INTO "service_catalog_template" ("code", "name", "duration_minutes", "sort_order")
VALUES
  ('CORTE', 'Corte', 40, 1),
  ('BARBA', 'Barba', 20, 2),
  ('CORTE_BARBA', 'Corte + barba', 50, 3)
ON CONFLICT ("code") DO NOTHING;

ALTER TABLE "location_slug_history"
  ADD CONSTRAINT "location_slug_history_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "location_slug_history"
  ADD CONSTRAINT "location_slug_history_location_id_fkey"
  FOREIGN KEY ("location_id") REFERENCES "location"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "staff"
  ADD CONSTRAINT "staff_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "staff"
  ADD CONSTRAINT "staff_home_location_id_fkey"
  FOREIGN KEY ("home_location_id") REFERENCES "location"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "staff"
  ADD CONSTRAINT "staff_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "user"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "staff_location"
  ADD CONSTRAINT "staff_location_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "staff_location"
  ADD CONSTRAINT "staff_location_staff_id_fkey"
  FOREIGN KEY ("staff_id") REFERENCES "staff"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "staff_location"
  ADD CONSTRAINT "staff_location_location_id_fkey"
  FOREIGN KEY ("location_id") REFERENCES "location"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "location_service"
  ADD CONSTRAINT "location_service_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "location_service"
  ADD CONSTRAINT "location_service_location_id_fkey"
  FOREIGN KEY ("location_id") REFERENCES "location"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "location_service"
  ADD CONSTRAINT "location_service_service_id_fkey"
  FOREIGN KEY ("service_id") REFERENCES "service"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "staff_service"
  ADD CONSTRAINT "staff_service_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "staff_service"
  ADD CONSTRAINT "staff_service_staff_id_fkey"
  FOREIGN KEY ("staff_id") REFERENCES "staff"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "staff_service"
  ADD CONSTRAINT "staff_service_service_id_fkey"
  FOREIGN KEY ("service_id") REFERENCES "service"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "time_block"
  ADD CONSTRAINT "time_block_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "time_block"
  ADD CONSTRAINT "time_block_location_id_fkey"
  FOREIGN KEY ("location_id") REFERENCES "location"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "time_block"
  ADD CONSTRAINT "time_block_staff_id_fkey"
  FOREIGN KEY ("staff_id") REFERENCES "staff"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "business_hours"
  ADD CONSTRAINT "business_hours_staff_id_fkey"
  FOREIGN KEY ("staff_id") REFERENCES "staff"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

SELECT platform.enable_tenant_rls('location_slug_history');
SELECT platform.enable_tenant_rls('staff');
SELECT platform.enable_tenant_rls('staff_location');
SELECT platform.enable_tenant_rls('location_service');
SELECT platform.enable_tenant_rls('staff_service');
SELECT platform.enable_tenant_rls('time_block');

CREATE OR REPLACE FUNCTION platform.tenant_slug_available(p_slug citext, p_except_tenant uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM tenant WHERE slug = p_slug AND id IS DISTINCT FROM p_except_tenant
  ) AND NOT EXISTS (
    SELECT 1 FROM tenant_slug_history
    WHERE slug = p_slug
      AND expires_at > now()
      AND tenant_id IS DISTINCT FROM p_except_tenant
  );
$$;

REVOKE ALL ON FUNCTION platform.tenant_slug_available(citext, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION platform.tenant_slug_available(citext, uuid) TO app_user;

CREATE OR REPLACE FUNCTION platform.lookup_tenant_by_slug(p_slug citext)
RETURNS TABLE (id uuid, name text, slug citext)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.id, t.name, t.slug
  FROM tenant t
  WHERE t.slug = p_slug
     OR EXISTS (
       SELECT 1 FROM tenant_slug_history h
       WHERE h.slug = p_slug AND h.expires_at > now() AND h.tenant_id = t.id
     )
  LIMIT 1
$$;

REVOKE ALL ON FUNCTION platform.lookup_tenant_by_slug(citext) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION platform.lookup_tenant_by_slug(citext) TO app_user;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  "location_slug_history", "staff", "staff_location",
  "location_service", "staff_service", "time_block"
  TO app_user;

GRANT SELECT ON TABLE "service_catalog_template" TO app_user;
