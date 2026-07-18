
alter table public."QueueEvent" enable row level security;

drop policy if exists "Anon can read queue events for realtime" on public."QueueEvent";
drop policy if exists "Anon cannot insert queue events" on public."QueueEvent";
drop policy if exists "Anon cannot update queue events" on public."QueueEvent";
drop policy if exists "Anon cannot delete queue events" on public."QueueEvent";

create policy "Anon can read queue events for realtime"
on public."QueueEvent"
for select
to anon
using (true);

create policy "Anon cannot insert queue events"
on public."QueueEvent"
for insert
to anon
with check (false);

create policy "Anon cannot update queue events"
on public."QueueEvent"
for update
to anon
using (false)
with check (false);

create policy "Anon cannot delete queue events"
on public."QueueEvent"
for delete
to anon
using (false);

grant usage on schema public to anon;
grant select on table public."QueueEvent" to anon;
revoke insert, update, delete on table public."QueueEvent" from anon;

alter publication supabase_realtime add table public."QueueEvent";
