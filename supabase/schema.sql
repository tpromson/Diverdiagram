create extension if not exists pgcrypto;

create table if not exists public.driver_diagrams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  title text not null,
  purpose_title text not null default '',
  purpose_kpi text not null default '',
  diagram_data jsonb not null,
  mermaid_code text not null,
  thumbnail_svg text not null default '',
  is_favorite boolean not null default false,
  archived_at timestamptz,
  share_id uuid,
  shared_at timestamptz,
  share_expires_at timestamptz,
  share_revoked_at timestamptz,
  last_opened_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.driver_diagram_versions (
  id uuid primary key default gen_random_uuid(),
  diagram_id uuid not null references public.driver_diagrams (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  diagram_data jsonb not null,
  mermaid_code text not null,
  save_source text not null default 'manual',
  created_at timestamptz not null default now()
);

create table if not exists public.shared_driver_diagrams (
  id uuid primary key default gen_random_uuid(),
  diagram_id uuid not null unique references public.driver_diagrams (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  share_token uuid not null unique,
  title text not null,
  purpose_title text not null default '',
  diagram_data jsonb not null,
  mermaid_code text not null,
  thumbnail_svg text not null default '',
  is_public_gallery boolean not null default false,
  gallery_submitted_at timestamptz,
  gallery_submitter_name text not null default '',
  shared_at timestamptz not null default now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shared_driver_diagram_request_logs (
  id bigserial primary key,
  ip_address text not null,
  share_token uuid,
  requested_at timestamptz not null default now()
);

create table if not exists public.gallery_item_reports (
  id bigserial primary key,
  share_token uuid not null references public.shared_driver_diagrams (share_token) on delete cascade,
  reporter_email text not null default '',
  reason text not null default '',
  resolved_at timestamptz,
  resolved_by uuid references auth.users (id) on delete set null,
  resolution_note text not null default '',
  reported_at timestamptz not null default now()
);

create table if not exists public.gallery_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null default '',
  created_at timestamptz not null default now()
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
  add column if not exists share_expires_at timestamptz;

alter table public.driver_diagrams
  add column if not exists share_revoked_at timestamptz;

alter table public.driver_diagrams
  add column if not exists thumbnail_svg text not null default '';

alter table public.shared_driver_diagrams
  add column if not exists purpose_title text not null default '';

alter table public.shared_driver_diagrams
  add column if not exists expires_at timestamptz;

alter table public.shared_driver_diagrams
  add column if not exists revoked_at timestamptz;

alter table public.shared_driver_diagrams
  add column if not exists updated_at timestamptz not null default now();

alter table public.shared_driver_diagrams
  add column if not exists is_public_gallery boolean not null default false;

alter table public.shared_driver_diagrams
  add column if not exists gallery_submitted_at timestamptz;

alter table public.shared_driver_diagrams
  add column if not exists gallery_submitter_name text not null default '';

alter table public.shared_driver_diagrams
  add column if not exists thumbnail_svg text not null default '';

alter table public.shared_driver_diagrams
  add column if not exists gallery_hidden_at timestamptz;

alter table public.shared_driver_diagrams
  add column if not exists gallery_hidden_reason text not null default '';

alter table public.shared_driver_diagrams
  add column if not exists gallery_hidden_by uuid references auth.users (id) on delete set null;

alter table public.gallery_item_reports
  add column if not exists resolved_at timestamptz;

alter table public.gallery_item_reports
  add column if not exists resolved_by uuid references auth.users (id) on delete set null;

alter table public.gallery_item_reports
  add column if not exists resolution_note text not null default '';

create index if not exists driver_diagrams_user_id_idx on public.driver_diagrams using btree (user_id);
create index if not exists driver_diagrams_last_opened_at_idx on public.driver_diagrams using btree (last_opened_at desc);
create index if not exists driver_diagrams_is_favorite_idx on public.driver_diagrams using btree (is_favorite desc);
create index if not exists driver_diagrams_archived_at_idx on public.driver_diagrams using btree (archived_at desc);
create unique index if not exists driver_diagrams_share_id_idx on public.driver_diagrams using btree (share_id) where share_id is not null;
create index if not exists driver_diagrams_share_expires_at_idx on public.driver_diagrams using btree (share_expires_at);
create index if not exists driver_diagram_versions_diagram_id_created_at_idx on public.driver_diagram_versions using btree (diagram_id, created_at desc);
create index if not exists driver_diagram_versions_user_id_idx on public.driver_diagram_versions using btree (user_id);
create unique index if not exists shared_driver_diagrams_share_token_idx on public.shared_driver_diagrams using btree (share_token);
create unique index if not exists shared_driver_diagrams_diagram_id_idx on public.shared_driver_diagrams using btree (diagram_id);
create index if not exists shared_driver_diagrams_user_id_idx on public.shared_driver_diagrams using btree (user_id);
create index if not exists shared_driver_diagrams_expires_at_idx on public.shared_driver_diagrams using btree (expires_at);
create index if not exists shared_driver_diagrams_public_gallery_idx on public.shared_driver_diagrams using btree (is_public_gallery, gallery_submitted_at desc);
create index if not exists shared_driver_diagram_request_logs_ip_requested_at_idx on public.shared_driver_diagram_request_logs using btree (ip_address, requested_at desc);
create index if not exists shared_driver_diagram_request_logs_requested_at_idx on public.shared_driver_diagram_request_logs using btree (requested_at desc);
create index if not exists gallery_item_reports_share_token_reported_at_idx on public.gallery_item_reports using btree (share_token, reported_at desc);
create index if not exists gallery_item_reports_unresolved_idx on public.gallery_item_reports using btree (resolved_at, reported_at desc);
create index if not exists gallery_admins_email_idx on public.gallery_admins using btree (email);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if row(new.user_id, new.title, new.purpose_title, new.purpose_kpi, new.diagram_data, new.mermaid_code, new.thumbnail_svg, new.is_favorite, new.archived_at, new.share_id, new.shared_at, new.share_expires_at, new.share_revoked_at)
    is distinct from
    row(old.user_id, old.title, old.purpose_title, old.purpose_kpi, old.diagram_data, old.mermaid_code, old.thumbnail_svg, old.is_favorite, old.archived_at, old.share_id, old.shared_at, old.share_expires_at, old.share_revoked_at) then
    new.updated_at = now();
  else
    new.updated_at = old.updated_at;
  end if;
  return new;
end;
$$;

create or replace function public.touch_updated_at()
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

drop trigger if exists shared_driver_diagrams_set_updated_at on public.shared_driver_diagrams;

create trigger shared_driver_diagrams_set_updated_at
before update on public.shared_driver_diagrams
for each row
execute function public.touch_updated_at();

revoke all on table public.driver_diagrams from anon;
revoke all on table public.driver_diagram_versions from anon;
revoke all on table public.shared_driver_diagrams from anon;
revoke all on table public.shared_driver_diagram_request_logs from anon;
revoke all on table public.gallery_item_reports from anon;
revoke all on table public.gallery_admins from anon;
grant usage, select on all sequences in schema public to authenticated;
grant select, insert, update, delete on table public.driver_diagrams to authenticated;
grant select, insert, update, delete on table public.driver_diagrams to service_role;
grant select, insert, delete on table public.driver_diagram_versions to authenticated;
grant select, insert, delete on table public.driver_diagram_versions to service_role;
grant select, insert, update, delete on table public.shared_driver_diagrams to authenticated;
grant select, insert, update, delete on table public.shared_driver_diagrams to service_role;
grant select, insert, delete on table public.shared_driver_diagram_request_logs to service_role;
grant select, insert, delete on table public.gallery_item_reports to service_role;
grant select, insert, delete on table public.gallery_admins to service_role;

alter table public.driver_diagrams enable row level security;
alter table public.driver_diagram_versions enable row level security;
alter table public.shared_driver_diagrams enable row level security;
alter table public.shared_driver_diagram_request_logs enable row level security;
alter table public.gallery_item_reports enable row level security;
alter table public.gallery_admins enable row level security;

drop policy if exists "Public read driver diagrams" on public.driver_diagrams;
drop policy if exists "Public insert driver diagrams" on public.driver_diagrams;
drop policy if exists "Public update driver diagrams" on public.driver_diagrams;
drop policy if exists "Public delete driver diagrams" on public.driver_diagrams;
drop policy if exists "Anyone can read shared driver diagrams" on public.driver_diagrams;
drop policy if exists "Users can read their own diagram versions" on public.driver_diagram_versions;
drop policy if exists "Users can insert their own diagram versions" on public.driver_diagram_versions;
drop policy if exists "Users can delete their own diagram versions" on public.driver_diagram_versions;
drop policy if exists "Users can read their own shared driver diagrams" on public.shared_driver_diagrams;
drop policy if exists "Users can insert their own shared driver diagrams" on public.shared_driver_diagrams;
drop policy if exists "Users can update their own shared driver diagrams" on public.shared_driver_diagrams;
drop policy if exists "Users can delete their own shared driver diagrams" on public.shared_driver_diagrams;
drop policy if exists "Users can read their own gallery admin row" on public.gallery_admins;

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

create policy "Users can read their own diagram versions"
on public.driver_diagram_versions
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert their own diagram versions"
on public.driver_diagram_versions
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own diagram versions"
on public.driver_diagram_versions
for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can read their own shared driver diagrams"
on public.shared_driver_diagrams
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert their own shared driver diagrams"
on public.shared_driver_diagrams
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own shared driver diagrams"
on public.shared_driver_diagrams
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own shared driver diagrams"
on public.shared_driver_diagrams
for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can read their own gallery admin row"
on public.gallery_admins
for select
to authenticated
using ((select auth.uid()) = user_id);
