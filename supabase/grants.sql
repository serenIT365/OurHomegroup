-- Run in Supabase SQL Editor
grant usage on schema public to postgres, anon, authenticated, service_role;

grant select, insert, update, delete on
  public.organizations,
  public.members,
  public.meetings,
  public.attendance
to anon, authenticated, service_role;
