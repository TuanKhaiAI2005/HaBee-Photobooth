BEGIN;

DO $verify_security$
DECLARE
  target_table text;
  rls_enabled boolean;
  rls_forced boolean;
  unexpected_direct_privileges text;
  unexpected_privileges text;
  unexpected_default_privileges text;
BEGIN
  FOREACH target_table IN ARRAY ARRAY[
    'Account',
    'Room',
    'QueueTicket',
    'QueueEvent',
    '_prisma_migrations'
  ]
  LOOP
    SELECT tables.relrowsecurity, tables.relforcerowsecurity
    INTO rls_enabled, rls_forced
    FROM pg_catalog.pg_class AS tables
    INNER JOIN pg_catalog.pg_namespace AS schemas
      ON schemas.oid = tables.relnamespace
    WHERE schemas.nspname = 'public'
      AND tables.relname = target_table
      AND tables.relkind IN ('r', 'p');

    IF rls_enabled IS DISTINCT FROM true THEN
      RAISE EXCEPTION 'RLS is not enabled on public.%', target_table;
    END IF;

    IF rls_forced IS DISTINCT FROM false THEN
      RAISE EXCEPTION
        'RLS is forced on public.%, which would block the Prisma owner',
        target_table;
    END IF;
  END LOOP;

  FOREACH target_table IN ARRAY ARRAY[
    'Account',
    'Room',
    'QueueTicket',
    '_prisma_migrations'
  ]
  LOOP
    SELECT string_agg(
      roles.role_name || ':' || privileges.privilege_name,
      ', '
      ORDER BY roles.role_name, privileges.privilege_name
    )
    INTO unexpected_privileges
    FROM unnest(ARRAY['anon', 'authenticated']) AS roles(role_name)
    CROSS JOIN unnest(
      ARRAY[
        'SELECT',
        'INSERT',
        'UPDATE',
        'DELETE',
        'TRUNCATE',
        'REFERENCES',
        'TRIGGER'
      ]
    ) AS privileges(privilege_name)
    WHERE has_table_privilege(
      roles.role_name,
      format('%I.%I', 'public', target_table),
      privileges.privilege_name
    );

    IF unexpected_privileges IS NOT NULL THEN
      RAISE EXCEPTION
        'Unexpected effective privileges on public.%: %',
        target_table,
        unexpected_privileges;
    END IF;
  END LOOP;

  SELECT string_agg(
    tables.relname || ':' || grantees.rolname || ':' || grants.privilege_type,
    ', '
    ORDER BY tables.relname, grantees.rolname, grants.privilege_type
  )
  INTO unexpected_direct_privileges
  FROM pg_catalog.pg_class AS tables
  INNER JOIN pg_catalog.pg_namespace AS schemas
    ON schemas.oid = tables.relnamespace
  CROSS JOIN LATERAL pg_catalog.aclexplode(tables.relacl) AS grants
  INNER JOIN pg_catalog.pg_roles AS grantees
    ON grantees.oid = grants.grantee
  WHERE schemas.nspname = 'public'
    AND tables.relname IN (
      'Account',
      'Room',
      'QueueTicket',
      '_prisma_migrations'
    )
    AND grantees.rolname IN ('anon', 'authenticated');

  IF unexpected_direct_privileges IS NOT NULL THEN
    RAISE EXCEPTION
      'Protected tables still have direct browser grants: %',
      unexpected_direct_privileges;
  END IF;

  IF NOT has_table_privilege('anon', 'public."QueueEvent"', 'SELECT')
    OR NOT has_table_privilege(
      'authenticated',
      'public."QueueEvent"',
      'SELECT'
    )
  THEN
    RAISE EXCEPTION
      'anon and authenticated must both have SELECT on public.QueueEvent';
  END IF;

  SELECT string_agg(
    roles.role_name || ':' || privileges.privilege_name,
    ', '
    ORDER BY roles.role_name, privileges.privilege_name
  )
  INTO unexpected_privileges
  FROM unnest(ARRAY['anon', 'authenticated']) AS roles(role_name)
  CROSS JOIN unnest(
    ARRAY[
      'INSERT',
      'UPDATE',
      'DELETE',
      'TRUNCATE',
      'REFERENCES',
      'TRIGGER'
    ]
  ) AS privileges(privilege_name)
  WHERE has_table_privilege(
    roles.role_name,
    'public."QueueEvent"',
    privileges.privilege_name
  );

  IF unexpected_privileges IS NOT NULL THEN
    RAISE EXCEPTION
      'QueueEvent has privileges other than SELECT: %',
      unexpected_privileges;
  END IF;

  IF (
    SELECT count(*) <> 2
      OR count(DISTINCT grantees.rolname) <> 2
      OR bool_or(grants.privilege_type <> 'SELECT')
      OR bool_or(grants.is_grantable)
    FROM pg_catalog.pg_class AS tables
    INNER JOIN pg_catalog.pg_namespace AS schemas
      ON schemas.oid = tables.relnamespace
    CROSS JOIN LATERAL pg_catalog.aclexplode(tables.relacl) AS grants
    INNER JOIN pg_catalog.pg_roles AS grantees
      ON grantees.oid = grants.grantee
    WHERE schemas.nspname = 'public'
      AND tables.relname = 'QueueEvent'
      AND grantees.rolname IN ('anon', 'authenticated')
  ) THEN
    RAISE EXCEPTION
      'QueueEvent must directly grant only SELECT, without grant option, to both browser roles';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_class AS tables
    INNER JOIN pg_catalog.pg_namespace AS schemas
      ON schemas.oid = tables.relnamespace
    CROSS JOIN LATERAL pg_catalog.aclexplode(tables.relacl) AS grants
    WHERE schemas.nspname = 'public'
      AND tables.relname IN (
        'Account',
        'Room',
        'QueueTicket',
        'QueueEvent',
        '_prisma_migrations'
      )
      AND grants.grantee = 0
  ) THEN
    RAISE EXCEPTION
      'A protected table still grants privileges to PUBLIC';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'QueueEvent'
      AND policyname = 'Realtime roles can read queue events'
      AND cmd = 'SELECT'
      AND roles @> ARRAY['anon', 'authenticated']::name[]
      AND cardinality(roles) = 2
      AND qual = 'true'
  ) THEN
    RAISE EXCEPTION
      'QueueEvent Realtime SELECT policy is missing or has unexpected roles/condition';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'QueueEvent'
      AND cmd IN ('ALL', 'INSERT', 'UPDATE', 'DELETE')
      AND roles && ARRAY['public', 'anon', 'authenticated']::name[]
  ) THEN
    RAISE EXCEPTION
      'QueueEvent has a write policy applicable to a browser role';
  END IF;

  SELECT string_agg(
    coalesce(grantees.rolname, 'PUBLIC') || ':' || defaults.privilege_type,
    ', '
    ORDER BY coalesce(grantees.rolname, 'PUBLIC'), defaults.privilege_type
  )
  INTO unexpected_default_privileges
  FROM pg_catalog.pg_default_acl AS default_acl
  CROSS JOIN LATERAL pg_catalog.aclexplode(default_acl.defaclacl) AS defaults
  LEFT JOIN pg_catalog.pg_roles AS grantees
    ON grantees.oid = defaults.grantee
  WHERE default_acl.defaclrole = current_user::regrole
    AND default_acl.defaclnamespace = 'public'::regnamespace
    AND default_acl.defaclobjtype = 'r'
    AND (
      defaults.grantee = 0
      OR grantees.rolname IN ('anon', 'authenticated')
    );

  IF unexpected_default_privileges IS NOT NULL THEN
    RAISE EXCEPTION
      'Future tables created by role % still grant browser roles: %',
      current_user,
      unexpected_default_privileges;
  END IF;
END
$verify_security$;

-- Exercise real permission checks as anon.  Both queries must raise
-- insufficient_privilege; catching that exact error keeps this script
-- read-only while proving that RLS/ACL protection is effective.
DO $verify_anon_access$
DECLARE
  account_denied boolean := false;
  queue_ticket_denied boolean := false;
BEGIN
  EXECUTE 'SET LOCAL ROLE anon';

  BEGIN
    EXECUTE 'SELECT 1 FROM public."Account" LIMIT 1';
  EXCEPTION
    WHEN insufficient_privilege THEN
      account_denied := true;
  END;

  BEGIN
    EXECUTE 'SELECT 1 FROM public."QueueTicket" LIMIT 1';
  EXCEPTION
    WHEN insufficient_privilege THEN
      queue_ticket_denied := true;
  END;

  EXECUTE 'RESET ROLE';

  IF NOT account_denied THEN
    RAISE EXCEPTION 'anon unexpectedly read public.Account';
  END IF;

  IF NOT queue_ticket_denied THEN
    RAISE EXCEPTION 'anon unexpectedly read public.QueueTicket';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    EXECUTE 'RESET ROLE';
    RAISE;
END
$verify_anon_access$;

ROLLBACK;

SELECT 'Supabase RLS and GRANT verification passed.' AS result;
