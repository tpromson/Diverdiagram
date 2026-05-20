create extension if not exists pgcrypto;

create table if not exists public.driver_diagrams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  title text not null,
  purpose_title text not null default '',
  purpose_kpi text not null default '',
  diagram_data jsonb not null,
  mermaid_code text not null,
  is_favorite boolean not null default false,
  archived_at timestamptz,
  share_id uuid,
  shared_at timestamptz,
  share_revoked_at timestamptz,
  last_opened_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.driver_diagrams
  add column if not exists user_id uuid references auth.users (id) on delete cascade;

alter table public.driver_diagrams
  add column if not exists last_opened_at timestamptz;

alter table public.driver_diagrams
  add column if not exists is_favorite boolean not null default false;

alter table public.driver_diagrams
  add column if not exists archived_at timestamptz;

alter table public.driver_diagrams
  add column if not exists share_id uuid;

alter table public.driver_diagrams
  add column if not exists shared_at timestamptz;

alter table public.driver_diagrams
  add column if not exists share_revoked_at timestamptz;

create index if not exists driver_diagrams_user_id_idx on public.driver_diagrams using btree (user_id);
create index if not exists driver_diagrams_last_opened_at_idx on public.driver_diagrams using btree (last_opened_at desc);
create index if not exists driver_diagrams_is_favorite_idx on public.driver_diagrams using btree (is_favorite desc);
create index if not exists driver_diagrams_archived_at_idx on public.driver_diagrams using btree (archived_at desc);
create unique index if not exists driver_diagrams_share_id_idx on public.driver_diagrams using btree (share_id) where share_id is not null;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if row(new.user_id, new.title, new.purpose_title, new.purpose_kpi, new.diagram_data, new.mermaid_code, new.is_favorite, new.archived_at, new.share_id, new.shared_at, new.share_revoked_at)
    is distinct from
    row(old.user_id, old.title, old.purpose_title, old.purpose_kpi, old.diagram_data, old.mermaid_code, old.is_favorite, old.archived_at, old.share_id, old.shared_at, old.share_revoked_at) then
    new.updated_at = now();
  else
    new.updated_at = old.updated_at;
  end if;
  return new;
end;
$$;

drop trigger if exists driver_diagrams_set_updated_at on public.driver_diagrams;

create trigger driver_diagrams_set_updated_at
before update on public.driver_diagrams
for each row
execute function public.set_updated_at();

revoke all on table public.driver_diagrams from anon;
grant select on table public.driver_diagrams to anon;
grant usage, select on all sequences in schema public to authenticated;
grant select, insert, update, delete on table public.driver_diagrams to authenticated;
grant select, insert, update, delete on table public.driver_diagrams to service_role;

alter table public.driver_diagrams enable row level security;

drop policy if exists "Public read driver diagrams" on public.driver_diagrams;
drop policy if exists "Public insert driver diagrams" on public.driver_diagrams;
drop policy if exists "Public update driver diagrams" on public.driver_diagrams;
drop policy if exists "Public delete driver diagrams" on public.driver_diagrams;
drop policy if exists "Anyone can read shared driver diagrams" on public.driver_diagrams;

drop policy if exists "Users can read their own driver diagrams" on public.driver_diagrams;
create policy "Users can read their own driver diagrams"
on public.driver_diagrams
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Anyone can read shared driver diagrams"
on public.driver_diagrams
for select
to anon, authenticated
using (share_id is not null and share_revoked_at is null);

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
