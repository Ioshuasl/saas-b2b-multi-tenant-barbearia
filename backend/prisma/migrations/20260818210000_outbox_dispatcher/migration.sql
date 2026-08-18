-- S5 Bloco 2: funções SECURITY DEFINER para dispatcher do outbox (cross-tenant).

CREATE OR REPLACE FUNCTION platform.list_pending_outbox_events(p_limit integer)
RETURNS TABLE (
  id uuid,
  tenant_id uuid,
  name text,
  payload jsonb,
  occurred_at timestamptz,
  attempts smallint,
  last_error text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT e.id, e.tenant_id, e.name, e.payload, e.occurred_at, e.attempts, e.last_error
  FROM outbox_event e
  WHERE e.processed_at IS NULL
  ORDER BY e.occurred_at ASC
  LIMIT GREATEST(1, LEAST(p_limit, 500));
$$;

CREATE OR REPLACE FUNCTION platform.mark_outbox_processed(p_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE outbox_event
  SET processed_at = now(), last_error = NULL
  WHERE id = p_id AND processed_at IS NULL;
$$;

CREATE OR REPLACE FUNCTION platform.mark_outbox_failed(p_id uuid, p_error text, p_max_attempts smallint)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE outbox_event
  SET
    attempts = attempts + 1,
    last_error = left(p_error, 2000),
    processed_at = CASE
      WHEN attempts + 1 >= p_max_attempts THEN now()
      ELSE processed_at
    END
  WHERE id = p_id AND processed_at IS NULL;
$$;

REVOKE ALL ON FUNCTION platform.list_pending_outbox_events(integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION platform.mark_outbox_processed(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION platform.mark_outbox_failed(uuid, text, smallint) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION platform.list_pending_outbox_events(integer) TO app_user;
GRANT EXECUTE ON FUNCTION platform.mark_outbox_processed(uuid) TO app_user;
GRANT EXECUTE ON FUNCTION platform.mark_outbox_failed(uuid, text, smallint) TO app_user;
