create extension if not exists pgcrypto;

create table if not exists public.driver_diagrams (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  purpose_title text not null default '',
  purpose_kpi text not null default '',
  diagram_data jsonb not null,
  mermaid_code text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
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

grant select, insert, update, delete on table public.driver_diagrams to anon;
grant select, insert, update, delete on table public.driver_diagrams to authenticated;

alter table public.driver_diagrams enable row level security;

drop policy if exists "Public read driver diagrams" on public.driver_diagrams;
create policy "Public read driver diagrams"
on public.driver_diagrams
for select
to anon, authenticated
using (true);

drop policy if exists "Public insert driver diagrams" on public.driver_diagrams;
create policy "Public insert driver diagrams"
on public.driver_diagrams
for insert
to anon, authenticated
with check (true);

drop policy if exists "Public update driver diagrams" on public.driver_diagrams;
create policy "Public update driver diagrams"
on public.driver_diagrams
for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "Public delete driver diagrams" on public.driver_diagrams;
create policy "Public delete driver diagrams"
on public.driver_diagrams
for delete
to anon, authenticated
using (true);
