-- OurHomegroup schema — run in Supabase SQL Editor
create extension if not exists "pgcrypto";

create table if not exists organizations (
  id text primary key,
  name text not null,
  slug text unique not null,
  logo_url text,
  mission text,
  created_at timestamptz not null default now()
);

create table if not exists members (
  id text primary key,
  email text not null,
  name text not null,
  nickname text,
  role text not null default 'member'
    check (role in ('visitor','member','moderator','admin','superadmin')),
  organization_id text references organizations(id) on delete set null,
  pronouns text,
  recovery_anniversary date,
  timezone text,
  avatar_url text,
  hide_last_name boolean not null default false,
  hide_email boolean not null default true,
  hide_attendance boolean not null default false,
  anonymous_display boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists meetings (
  id text primary key,
  organization_id text not null references organizations(id) on delete cascade,
  name text not null,
  description text,
  type text,
  host_id text,
  provider text not null default 'hybrid'
    check (provider in ('livekit','zoom','hybrid')),
  livekit_room_name text not null,
  zoom_join_url text,
  capacity int not null default 40,
  waiting_room_enabled boolean not null default true,
  password text,
  recording_enabled boolean not null default false,
  visibility text not null default 'private'
    check (visibility in ('public','private','invite')),
  timezone text not null default 'America/New_York',
  language text not null default 'en',
  start_at timestamptz not null,
  end_at timestamptz,
  recurrence text not null default 'none'
    check (recurrence in ('none','daily','weekly','monthly')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists attendance (
  id text primary key,
  meeting_id text not null references meetings(id) on delete cascade,
  organization_id text not null references organizations(id) on delete cascade,
  user_id text not null,
  display_name text not null,
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  duration_seconds int,
  device text,
  role text not null default 'member'
);

create index if not exists meetings_org_idx on meetings (organization_id, start_at);
create index if not exists members_org_idx on members (organization_id);
create index if not exists attendance_meeting_idx on attendance (meeting_id);

alter table organizations enable row level security;
alter table members enable row level security;
alter table meetings enable row level security;
alter table attendance enable row level security;

insert into organizations (id, name, slug, mission)
values (
  'org_demo',
  'Demo Recovery Collective',
  'demo',
  'Safe peer support for recovery journeys.'
)
on conflict (id) do nothing;

insert into members (id, email, name, nickname, role, organization_id, pronouns, hide_email)
values
  ('user_alex', 'alex@example.com', 'Alex Rivera', 'Alex', 'member', 'org_demo', 'they/them', true),
  ('user_jordan', 'jordan@example.com', 'Jordan Lee', 'Jordan', 'moderator', 'org_demo', 'she/her', true),
  ('user_sam', 'sam@example.com', 'Sam Okonkwo', 'Sam', 'admin', 'org_demo', null, true)
on conflict (id) do nothing;

insert into meetings (
  id, organization_id, name, description, type, provider,
  livekit_room_name, capacity, waiting_room_enabled, recording_enabled,
  visibility, timezone, language, start_at, recurrence
) values
(
  'mtg_womens', 'org_demo', 'Women''s Recovery',
  'Closed women''s peer support meeting.', 'Women''s Recovery', 'hybrid',
  'ohg-demo-womens', 40, true, false,
  'private', 'America/New_York', 'en', now() + interval '1 day', 'weekly'
),
(
  'mtg_veterans', 'org_demo', 'Veterans Support',
  'Open discussion for veterans in recovery.', 'Veterans', 'livekit',
  'ohg-demo-veterans', 50, true, false,
  'public', 'America/New_York', 'en', now() + interval '2 days', 'weekly'
)
on conflict (id) do nothing;
