-- S5 Bloco 1: messaging core (conta WAHA, templates, automações, notifications, webhook idempotência).

CREATE TABLE "whatsapp_account" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "session_name" TEXT NOT NULL,
    "display_phone" TEXT,
    "risk_accepted_at" TIMESTAMPTZ,
    "waba_id" TEXT,
    "phone_number_id" TEXT,
    "access_token_ref" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "kill_switch" BOOLEAN NOT NULL DEFAULT false,
    "last_error" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "whatsapp_account_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "whatsapp_account_tenant_id_key" ON "whatsapp_account"("tenant_id");
CREATE UNIQUE INDEX "whatsapp_account_session_name_key" ON "whatsapp_account"("session_name");

ALTER TABLE "whatsapp_account"
  ADD CONSTRAINT "whatsapp_account_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "message_template" (
    "id" UUID NOT NULL,
    "tenant_id" UUID,
    "key" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'pt_BR',
    "body" TEXT NOT NULL,
    "variables" JSONB NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_template_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "message_template"
  ADD CONSTRAINT "message_template_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "automation" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "automation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "automation_tenant_id_key_key" ON "automation"("tenant_id", "key");

ALTER TABLE "automation"
  ADD CONSTRAINT "automation_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "automation_run" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "automation_id" UUID NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" UUID NOT NULL,
    "scheduled_for" TIMESTAMPTZ NOT NULL,
    "executed_at" TIMESTAMPTZ,
    "result" TEXT,
    "notification_id" UUID,

    CONSTRAINT "automation_run_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "automation_run_tenant_automation_target_key"
  ON "automation_run"("tenant_id", "automation_id", "target_type", "target_id");

ALTER TABLE "automation_run"
  ADD CONSTRAINT "automation_run_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "automation_run"
  ADD CONSTRAINT "automation_run_automation_id_fkey"
    FOREIGN KEY ("automation_id") REFERENCES "automation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "notification" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "location_id" UUID,
    "appointment_id" UUID,
    "customer_id" UUID,
    "channel" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "template_key" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "scheduled_for" TIMESTAMPTZ,
    "sent_at" TIMESTAMPTZ,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "provider_message_id" TEXT,
    "error" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uq_notification_provider_id"
  ON "notification"("provider_message_id")
  WHERE "provider_message_id" IS NOT NULL;

CREATE INDEX "idx_notification_due" ON "notification"("status", "scheduled_for");

ALTER TABLE "notification"
  ADD CONSTRAINT "notification_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "notification"
  ADD CONSTRAINT "notification_location_id_fkey"
    FOREIGN KEY ("location_id") REFERENCES "location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "notification"
  ADD CONSTRAINT "notification_appointment_id_fkey"
    FOREIGN KEY ("appointment_id") REFERENCES "appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "notification"
  ADD CONSTRAINT "notification_customer_id_fkey"
    FOREIGN KEY ("customer_id") REFERENCES "customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "webhook_event" (
    "id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_event_id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processed_at" TIMESTAMPTZ,
    "error" TEXT,

    CONSTRAINT "webhook_event_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "webhook_event_provider_provider_event_id_key"
  ON "webhook_event"("provider", "provider_event_id");

-- RLS tenant-scoped
SELECT platform.enable_tenant_rls('whatsapp_account');
SELECT platform.enable_tenant_rls('automation');
SELECT platform.enable_tenant_rls('automation_run');
SELECT platform.enable_tenant_rls('notification');

-- message_template: catálogo global (tenant_id NULL) + overrides por tenant
ALTER TABLE "message_template" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "message_template" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS message_template_read ON "message_template";
CREATE POLICY message_template_read ON "message_template"
  FOR SELECT
  USING (
    tenant_id IS NULL
    OR tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid
  );

DROP POLICY IF EXISTS message_template_write ON "message_template";
CREATE POLICY message_template_write ON "message_template"
  FOR ALL
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

-- webhook_event: sem tenant (idempotência de provedor)
-- platform lookup para webhook WAHA
CREATE OR REPLACE FUNCTION platform.resolve_whatsapp_account_by_session_name(p_session_name text)
RETURNS TABLE (tenant_id uuid, account_id uuid)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT wa.tenant_id, wa.id
  FROM whatsapp_account wa
  WHERE wa.session_name = p_session_name
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION platform.resolve_whatsapp_account_by_session_name(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION platform.resolve_whatsapp_account_by_session_name(text) TO app_user;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "whatsapp_account" TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "message_template" TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "automation" TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "automation_run" TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "notification" TO app_user;
GRANT SELECT, INSERT, UPDATE ON TABLE "webhook_event" TO app_user;

-- Templates globais pt-BR (MVP — docs/modulos/06 §4)
INSERT INTO "message_template" ("id", "tenant_id", "key", "category", "language", "body", "variables", "status")
VALUES
  (
    '018f6001-0001-7000-8000-000000000001',
    NULL,
    'appointment_confirmation',
    'UTILITY',
    'pt_BR',
    'Olá {{customerName}}! Seu horário na {{locationName}} está confirmado para {{startsAtLocal}}. Para cancelar: {{cancelLink}}',
    '["customerName","locationName","startsAtLocal","cancelLink"]'::jsonb,
    'ACTIVE'
  ),
  (
    '018f6001-0001-7000-8000-000000000002',
    NULL,
    'reminder_24h',
    'UTILITY',
    'pt_BR',
    'Lembrete: amanhã você tem horário na {{locationName}} às {{startsAtLocal}}. Cancelar: {{cancelLink}}',
    '["customerName","locationName","startsAtLocal","cancelLink"]'::jsonb,
    'ACTIVE'
  ),
  (
    '018f6001-0001-7000-8000-000000000003',
    NULL,
    'reminder_2h',
    'UTILITY',
    'pt_BR',
    'Seu horário na {{locationName}} é em 2 horas ({{startsAtLocal}}). Te esperamos!',
    '["customerName","locationName","startsAtLocal","cancelLink"]'::jsonb,
    'ACTIVE'
  ),
  (
    '018f6001-0001-7000-8000-000000000004',
    NULL,
    'appointment_cancelled',
    'UTILITY',
    'pt_BR',
    'Seu horário na {{locationName}} de {{startsAtLocal}} foi cancelado. Para remarcar, acesse nosso site.',
    '["customerName","locationName","startsAtLocal","cancelLink"]'::jsonb,
    'ACTIVE'
  ),
  (
    '018f6001-0001-7000-8000-000000000005',
    NULL,
    'appointment_rescheduled',
    'UTILITY',
    'pt_BR',
    'Seu horário na {{locationName}} foi remarcado para {{startsAtLocal}}. Cancelar: {{cancelLink}}',
    '["customerName","locationName","startsAtLocal","cancelLink"]'::jsonb,
    'ACTIVE'
  );
