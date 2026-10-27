-- Andaman Report v2.0 · run once in the selected project's SQL Editor.
-- Uses its own table, bucket, policies and internal schema.
begin;
create schema if not exists andaman_report_internal;
revoke all on schema andaman_report_internal from public, anon, authenticated;

create table if not exists public.andaman_project_reports (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  payload jsonb not null,
  project_name text generated always as (payload->>'projectName') stored,
  fiscal_year text generated always as (payload->>'academicYear') stored,
  institution text generated always as (payload->>'schoolName') stored,
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint andaman_payload_object check (jsonb_typeof(payload) = 'object'),
  constraint andaman_payload_size check (octet_length(payload::text) <= 4194304),
  constraint andaman_project_name check (length(btrim(coalesce(payload->>'projectName',''))) between 1 and 100000),
  constraint andaman_fiscal_year check (coalesce(payload->>'academicYear','') ~ '^2[5-7][0-9]{2}$'),
  constraint andaman_status check (coalesce(payload->>'q2Status','') in ('ยังไม่ได้ดำเนินการ','อยู่ระหว่างดำเนินการ','ดำเนินการเสร็จสิ้นแล้ว'))
);

create index if not exists andaman_reports_owner_updated_idx on public.andaman_project_reports(owner_id, updated_at desc);

create or replace function andaman_report_internal.touch_report()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  new.owner_id := old.owner_id;
  new.created_at := old.created_at;
  new.version := old.version + 1;
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function andaman_report_internal.touch_report() from public, anon, authenticated;
drop trigger if exists andaman_report_update on public.andaman_project_reports;
create trigger andaman_report_update before update on public.andaman_project_reports
for each row execute function andaman_report_internal.touch_report();

alter table public.andaman_project_reports enable row level security;
drop policy if exists andaman_reports_select_own on public.andaman_project_reports;
create policy andaman_reports_select_own on public.andaman_project_reports
for select to authenticated using (owner_id = (select auth.uid()));
drop policy if exists andaman_reports_insert_own on public.andaman_project_reports;
create policy andaman_reports_insert_own on public.andaman_project_reports
for insert to authenticated with check (owner_id = (select auth.uid()));
drop policy if exists andaman_reports_update_own on public.andaman_project_reports;
create policy andaman_reports_update_own on public.andaman_project_reports
for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

-- Explicit grants required for projects with automatic Data API exposure disabled.
revoke all on public.andaman_project_reports from public, anon, authenticated;
grant select on public.andaman_project_reports to authenticated;
grant insert(id,payload) on public.andaman_project_reports to authenticated;
grant update(payload) on public.andaman_project_reports to authenticated;

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('andaman-report-photos','andaman-report-photos',false,1572864,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=false,file_size_limit=1572864,allowed_mime_types=array['image/jpeg','image/png','image/webp'];

drop policy if exists andaman_photo_select_own on storage.objects;
create policy andaman_photo_select_own on storage.objects for select to authenticated
using (bucket_id='andaman-report-photos' and (storage.foldername(name))[1]=(select auth.uid())::text);
drop policy if exists andaman_photo_insert_own on storage.objects;
create policy andaman_photo_insert_own on storage.objects for insert to authenticated
with check (bucket_id='andaman-report-photos' and (storage.foldername(name))[1]=(select auth.uid())::text);
drop policy if exists andaman_photo_delete_own on storage.objects;
create policy andaman_photo_delete_own on storage.objects for delete to authenticated
using (bucket_id='andaman-report-photos' and (storage.foldername(name))[1]=(select auth.uid())::text);
commit;

-- Verification queries (run after setup):
select tablename, rowsecurity from pg_tables where schemaname='public' and tablename='andaman_project_reports';
select policyname, cmd from pg_policies where schemaname='public' and tablename='andaman_project_reports';
select id, public, file_size_limit from storage.buckets where id='andaman-report-photos';
