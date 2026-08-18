-- S1 Bloco 2: tokens de e-mail (reset / verify) e lookup público de convite.

CREATE TABLE "email_token" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "purpose" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "consumed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "email_token_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "email_token_token_hash_key" ON "email_token"("token_hash");
CREATE INDEX "idx_email_token_user_purpose" ON "email_token"("user_id", "purpose");

ALTER TABLE "email_token"
  ADD CONSTRAINT "email_token_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "email_token"
  ADD CONSTRAINT "email_token_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "user"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

SELECT platform.enable_tenant_rls('email_token');

CREATE OR REPLACE FUNCTION platform.lookup_invitation_by_token_hash(p_hash text)
RETURNS TABLE (
  id uuid,
  "tenantId" uuid,
  email citext,
  role text,
  "locationIds" uuid[],
  "tokenHash" text,
  "expiresAt" timestamptz,
  "acceptedAt" timestamptz,
  "invitedBy" uuid
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    i.id,
    i.tenant_id,
    i.email,
    i.role,
    i.location_ids,
    i.token_hash,
    i.expires_at,
    i.accepted_at,
    i.invited_by
  FROM invitation i
  WHERE i.token_hash = p_hash
$$;

CREATE OR REPLACE FUNCTION platform.lookup_email_token_by_hash(p_hash text)
RETURNS TABLE (
  id uuid,
  "tenantId" uuid,
  "userId" uuid,
  purpose text,
  "tokenHash" text,
  "expiresAt" timestamptz,
  "consumedAt" timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    t.id,
    t.tenant_id,
    t.user_id,
    t.purpose,
    t.token_hash,
    t.expires_at,
    t.consumed_at
  FROM email_token t
  WHERE t.token_hash = p_hash
$$;

REVOKE ALL ON FUNCTION platform.lookup_invitation_by_token_hash(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION platform.lookup_email_token_by_hash(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION platform.lookup_invitation_by_token_hash(text) TO app_user;
GRANT EXECUTE ON FUNCTION platform.lookup_email_token_by_hash(text) TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "email_token" TO app_user;
