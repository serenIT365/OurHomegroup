-- Chairperson is meeting- and occurrence-scoped.
-- Run in Supabase SQL Editor.

alter table members drop constraint if exists members_role_check;
alter table members add constraint members_role_check
  check (role in ('visitor','member','moderator','admin','poweruser','superadmin'));

alter table meetings add column if not exists chair_id text;

create table if not exists meeting_occurrences (
  id text primary key,
  meeting_id text not null references meetings(id) on delete cascade,
  organization_id text not null references organizations(id) on delete cascade,
  start_at timestamptz not null,
  chair_id text,
  created_at timestamptz not null default now(),
  unique (meeting_id, start_at)
);

create index if not exists occ_meeting_idx on meeting_occurrences (meeting_id, start_at);

grant select, insert, update, delete on public.meeting_occurrences
  to anon, authenticated, service_role;
