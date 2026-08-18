-- Prioriza eventos scheduling no dispatcher (backlog identity.tenant_created do seed).

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
  ORDER BY
    CASE WHEN e.name LIKE 'scheduling.%' THEN 0 ELSE 1 END,
    e.occurred_at ASC
  LIMIT GREATEST(1, LEAST(p_limit, 500));
$$;
