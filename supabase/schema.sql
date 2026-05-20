create extension if not exists pgcrypto;

create table if not exists public.driver_diagrams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  title text not null,
  purpose_title text not null default '',
  purpose_kpi text not null default '',
  diagram_data jsonb not null,
  mermaid_code text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.driver_diagrams
  add column if not exists user_id uuid references auth.users (id) on delete cascade;

create index if not exists driver_diagrams_user_id_idx on public.driver_diagrams using btree (user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists driver_diagrams_set_updated_at on public.driver_diagrams;

create trigger driver_diagrams_set_updated_at
before update on public.driver_diagrams
for each row
execute function public.set_updated_at();

revoke all on table public.driver_diagrams from anon;
grant usage, select on all sequences in schema public to authenticated;
grant select, insert, update, delete on table public.driver_diagrams to authenticated;
grant select, insert, update, delete on table public.driver_diagrams to service_role;

alter table public.driver_diagrams enable row level security;

drop policy if exists "Public read driver diagrams" on public.driver_diagrams;
drop policy if exists "Public insert driver diagrams" on public.driver_diagrams;
drop policy if exists "Public update driver diagrams" on public.driver_diagrams;
drop policy if exists "Public delete driver diagrams" on public.driver_diagrams;

drop policy if exists "Users can read their own driver diagrams" on public.driver_diagrams;
create policy "Users can read their own driver diagrams"
on public.driver_diagrams
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own driver diagrams" on public.driver_diagrams;
create policy "Users can insert their own driver diagrams"
on public.driver_diagrams
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own driver diagrams" on public.driver_diagrams;
create policy "Users can update their own driver diagrams"
on public.driver_diagrams
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own driver diagrams" on public.driver_diagrams;
create policy "Users can delete their own driver diagrams"
on public.driver_diagrams
for delete
to authenticated
using ((select auth.uid()) = user_id);
