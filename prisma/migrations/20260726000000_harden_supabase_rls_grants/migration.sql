BEGIN;

-- Prisma Migrate creates future tables with the role from DIRECT_URL.  Apply
-- default privileges only when that role owns every existing Prisma table, so
-- a misconfigured migration connection fails before changing any privileges.
DO $owner_guard$
DECLARE
  target_count integer;
  wrong_owner_tables text;
BEGIN
  SELECT count(*)
  INTO target_count
  FROM pg_catalog.pg_class AS tables
  INNER JOIN pg_catalog.pg_namespace AS schemas
    ON schemas.oid = tables.relnamespace
  WHERE schemas.nspname = 'public'
    AND tables.relkind IN ('r', 'p')
    AND tables.relname IN (
      'Account',
      'Room',
      'QueueTicket',
      'QueueEvent',
      '_prisma_migrations'
    );

  IF target_count <> 5 THEN
    RAISE EXCEPTION
      'Expected five Prisma tables in schema public, found %.',
      target_count;
  END IF;

  SELECT string_agg(
    format(
      '%I.%I (owner %I)',
      schemas.nspname,
      tables.relname,
      pg_catalog.pg_get_userbyid(tables.relowner)
    ),
    ', '
    ORDER BY tables.relname
  )
  INTO wrong_owner_tables
  FROM pg_catalog.pg_class AS tables
  INNER JOIN pg_catalog.pg_namespace AS schemas
    ON schemas.oid = tables.relnamespace
  WHERE schemas.nspname = 'public'
    AND tables.relkind IN ('r', 'p')
    AND tables.relname IN (
      'Account',
      'Room',
      'QueueTicket',
      'QueueEvent',
      '_prisma_migrations'
    )
    AND tables.relowner <> current_user::regrole;

  IF wrong_owner_tables IS NOT NULL THEN
    RAISE EXCEPTION
      'Migration role % does not own all Prisma tables: %. Default privileges were not changed.',
      current_user,
      wrong_owner_tables;
  END IF;
END
$owner_guard$;

ALTER TABLE public."Account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Room" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."QueueTicket" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."QueueEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."_prisma_migrations" ENABLE ROW LEVEL SECURITY;

-- Prisma uses the owning server role and intentionally bypasses RLS.  FORCE
-- would block that owner because the private tables have no browser policies.
ALTER TABLE public."Account" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."Room" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."QueueTicket" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."QueueEvent" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."_prisma_migrations" NO FORCE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public."Account"
FROM PUBLIC, anon, authenticated;

REVOKE ALL PRIVILEGES ON TABLE public."Room"
FROM PUBLIC, anon, authenticated;

REVOKE ALL PRIVILEGES ON TABLE public."QueueTicket"
FROM PUBLIC, anon, authenticated;

REVOKE ALL PRIVILEGES ON TABLE public."_prisma_migrations"
FROM PUBLIC, anon, authenticated;

-- QueueEvent is the only browser-readable table.  Reset its ACL first so no
-- write, truncate, trigger, or references privilege can survive.
REVOKE ALL PRIVILEGES ON TABLE public."QueueEvent"
FROM PUBLIC, anon, authenticated;

GRANT USAGE ON SCHEMA public
TO anon, authenticated;

GRANT SELECT ON TABLE public."QueueEvent"
TO anon, authenticated;

DROP POLICY IF EXISTS "Anon can read queue events for realtime"
ON public."QueueEvent";

DROP POLICY IF EXISTS "Anon cannot insert queue events"
ON public."QueueEvent";

DROP POLICY IF EXISTS "Anon cannot update queue events"
ON public."QueueEvent";

DROP POLICY IF EXISTS "Anon cannot delete queue events"
ON public."QueueEvent";

DROP POLICY IF EXISTS "Realtime roles can read queue events"
ON public."QueueEvent";

CREATE POLICY "Realtime roles can read queue events"
ON public."QueueEvent"
FOR SELECT
TO anon, authenticated
USING (true);

-- Without FOR ROLE, PostgreSQL changes defaults for current_user: the same
-- DIRECT_URL role that passed the ownership guard and creates Prisma tables.
-- Prisma keeps owner privileges; only automatic grants to browser roles stop.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
REVOKE ALL PRIVILEGES ON TABLES
FROM PUBLIC, anon, authenticated;

COMMIT;
