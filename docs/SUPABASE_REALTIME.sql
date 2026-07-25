
-- The Prisma migration is the canonical source for QueueEvent RLS and grants:
-- prisma/migrations/20260726000000_harden_supabase_rls_grants/migration.sql
-- This script is an idempotent helper for configuring Supabase Realtime
-- manually in a new project or repairing the publication.

begin;

alter table public."QueueEvent" enable row level security;

revoke all privileges on table public."QueueEvent"
from public, anon, authenticated;

grant usage on schema public
to anon, authenticated;

grant select on table public."QueueEvent"
to anon, authenticated;

drop policy if exists "Anon can read queue events for realtime"
on public."QueueEvent";

drop policy if exists "Anon cannot insert queue events"
on public."QueueEvent";

drop policy if exists "Anon cannot update queue events"
on public."QueueEvent";

drop policy if exists "Anon cannot delete queue events"
on public."QueueEvent";

drop policy if exists "Realtime roles can read queue events"
on public."QueueEvent";

create policy "Realtime roles can read queue events"
on public."QueueEvent"
for select
to anon, authenticated
using (true);

do $publication$
begin
  if not exists (
    select 1
    from pg_catalog.pg_publication
    where pubname = 'supabase_realtime'
  ) then
    raise exception 'Publication supabase_realtime does not exist.';
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'QueueEvent'
  ) then
    execute
      'alter publication supabase_realtime add table public."QueueEvent"';
  end if;
end
$publication$;

commit;
