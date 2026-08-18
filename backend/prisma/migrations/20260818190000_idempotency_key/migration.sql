-- S2 Bloco 3: idempotência de POST (dedupe 24 h por tenant).

CREATE TABLE "idempotency_key" (
    "tenant_id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "request_hash" TEXT NOT NULL,
    "response_status" SMALLINT NOT NULL,
    "response_body" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "idempotency_key_pkey" PRIMARY KEY ("tenant_id", "key")
);

CREATE INDEX "idx_idempotency_key_created_at"
  ON "idempotency_key" ("created_at");

SELECT platform.enable_tenant_rls('idempotency_key');

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "idempotency_key" TO app_user;
