-- Andaman PM 3.0: isolated tables, guarded workflows, role-based reads.
begin;
create schema if not exists pm_private;
revoke all on schema pm_private from public,anon;
grant usage on schema pm_private to authenticated;
create table if not exists public.pm_units(id text primary key,name text not null,parent_id text references public.pm_units(id),kind text not null default 'office',active boolean not null default true);
create table if not exists public.pm_members(user_id uuid primary key references auth.users(id) on delete cascade,email text not null,display_name text not null,role text not null check(role in('admin','executive','officer')),unit_id text not null references public.pm_units(id),active boolean not null default true,created_at timestamptz not null default now());
create table if not exists public.pm_permissions(role text not null check(role in('admin','executive','officer')),menu text not null,can_read boolean not null default true,can_write boolean not null default false,can_approve boolean not null default false,primary key(role,menu),check(role<>'officer' or not can_approve));
create table if not exists public.pm_sources(id uuid primary key default gen_random_uuid(),name text not null,fiscal_year integer not null check(fiscal_year between 2500 and 2800),category text not null default 'operating',amount numeric(14,2) not null check(amount>=0),note text not null default '',created_by uuid not null references auth.users(id),created_at timestamptz not null default now());
create table if not exists public.pm_proposals(id uuid primary key default gen_random_uuid(),title text not null,unit_id text not null references public.pm_units(id),fiscal_year integer not null check(fiscal_year between 2500 and 2800),requested_budget numeric(14,2) not null check(requested_budget>0),objectives text not null default '',description text not null default '',start_date date,end_date date,report_due date,owner_id uuid not null references auth.users(id),owner_name text not null,status text not null default 'draft' check(status in('draft','pending','approved','rejected','returned')),review_note text not null default '',reviewer_id uuid references auth.users(id),reviewer_name text,reviewed_at timestamptz,version int not null default 1,created_at timestamptz not null default now(),check(end_date is null or start_date is null or end_date>=start_date));
create table if not exists public.pm_projects(id uuid primary key default gen_random_uuid(),proposal_id uuid unique references public.pm_proposals(id),code text unique not null,title text not null,unit_id text not null references public.pm_units(id),fiscal_year integer not null,approved_budget numeric(14,2) not null check(approved_budget>0),objectives text not null default '',description text not null default '',start_date date,end_date date,report_due date,owner_id uuid not null references auth.users(id),owner_name text not null,status text not null default 'planned' check(status in('planned','active','completed','cancelled')),progress int not null default 0 check(progress between 0 and 100),version int not null default 1,created_at timestamptz not null default now());
create table if not exists public.pm_allocations(id uuid primary key default gen_random_uuid(),source_id uuid not null references public.pm_sources(id),project_id uuid not null references public.pm_projects(id),amount numeric(14,2) not null check(amount>0),note text not null default '',actor_id uuid not null references auth.users(id),created_at timestamptz not null default now());
create table if not exists public.pm_disbursements(id uuid primary key default gen_random_uuid(),project_id uuid references public.pm_projects(id),source_id uuid references public.pm_sources(id),fund_id uuid not null references public.pm_sources(id),unit_id text not null references public.pm_units(id),fiscal_year integer not null,kind text not null default 'project',purpose text not null,amount numeric(14,2) not null check(amount>0),requester_id uuid not null references auth.users(id),requester_name text not null,status text not null default 'pending' check(status in('pending','approved','rejected','paid')),review_note text not null default '',reviewer_id uuid references auth.users(id),reviewer_name text,reviewed_at timestamptz,paid_by uuid references auth.users(id),paid_at timestamptz,payment_date date,voucher_no text,version int not null default 1,created_at timestamptz not null default now(),check((project_id is null)<>(source_id is null)));
create table if not exists public.pm_reports(id uuid primary key default gen_random_uuid(),project_id uuid unique not null references public.pm_projects(id),unit_id text not null references public.pm_units(id),owner_id uuid not null references auth.users(id),payload jsonb not null default '{}'::jsonb,status text not null default 'draft' check(status in('draft','submitted','accepted','returned')),review_note text not null default '',submitted_at timestamptz,reviewed_at timestamptz,reviewer_id uuid references auth.users(id),version int not null default 1,updated_at timestamptz not null default now(),check(jsonb_typeof(payload)='object' and octet_length(payload::text)<=4194304));
create table if not exists public.pm_forms(id uuid primary key default gen_random_uuid(),title text not null,category text not null default 'permission',description text not null default '',path text not null,file_name text not null,mime_type text not null,size_bytes int not null check(size_bytes between 1 and 10485760),active boolean not null default true,created_by uuid not null references auth.users(id),created_at timestamptz not null default now());
create table if not exists public.pm_documents(id uuid primary key default gen_random_uuid(),project_id uuid not null references public.pm_projects(id),unit_id text not null references public.pm_units(id),kind text not null default 'permission',title text not null,path text not null,file_name text not null,mime_type text not null,size_bytes int not null check(size_bytes between 1 and 10485760),owner_id uuid not null references auth.users(id),status text not null default 'pending' check(status in('pending','accepted','returned')),review_note text not null default '',created_at timestamptz not null default now());
create table if not exists public.pm_audit(id uuid primary key default gen_random_uuid(),actor_id uuid references auth.users(id),actor_name text not null,action text not null,entity_id text,unit_id text,detail jsonb not null default '{}'::jsonb,created_at timestamptz not null default now());
create table if not exists public.pm_commands(id uuid primary key,actor_id uuid not null,action text not null,response jsonb not null,created_at timestamptz not null default now());
create index if not exists pm_proposals_scope_idx on public.pm_proposals(unit_id,status,fiscal_year);
create index if not exists pm_projects_scope_idx on public.pm_projects(unit_id,fiscal_year);
create index if not exists pm_allocations_source_idx on public.pm_allocations(source_id);
create index if not exists pm_allocations_project_idx on public.pm_allocations(project_id);
create index if not exists pm_disbursements_project_idx on public.pm_disbursements(project_id,status);
create index if not exists pm_disbursements_source_idx on public.pm_disbursements(source_id,status);
create index if not exists pm_reports_scope_idx on public.pm_reports(unit_id,status);
create index if not exists pm_documents_project_idx on public.pm_documents(project_id);
create index if not exists pm_audit_created_idx on public.pm_audit(created_at desc);
create index if not exists pm_members_unit_idx on public.pm_members(unit_id);
insert into public.pm_units(id,name,kind) values
('office','สำนักงานผู้อำนวยการสถาบัน','office'),('strategy','สำนักพัฒนายุทธศาสตร์และความร่วมมืออาชีวศึกษา','bureau'),('students','สำนักพัฒนากิจการนักศึกษาและกิจการพิเศษ','bureau'),('research','ศูนย์วิจัยและพัฒนาการอาชีวศึกษา','center'),('graduate','อาชีวศึกษาบัณฑิต','office'),
('ranong','วิทยาลัยเทคนิคระนอง','college'),('phangnga','วิทยาลัยเทคนิคพังงา','college'),('phuket-tech','วิทยาลัยเทคนิคภูเก็ต','college'),('phuket-voc','วิทยาลัยอาชีวศึกษาภูเก็ต','college'),('krabi','วิทยาลัยเทคนิคกระบี่','college'),('trang-tech','วิทยาลัยเทคนิคตรัง','college'),('trang-career','วิทยาลัยการอาชีพตรัง','college') on conflict(id) do nothing;
insert into public.pm_permissions(role,menu,can_read,can_write,can_approve)
select r,m,not (r<>'admin' and m in('members','permissions') or r='officer' and m='audit'),
case when r='admin' then true when r='officer' then m in('proposals','projects','disbursements','reports','documents') else false end,
case when r in('admin','executive') then m in('proposals','disbursements','reports','documents') else false end
from unnest(array['admin','executive','officer']) r cross join unnest(array['dashboard','sources','allocations','proposals','projects','utilities','disbursements','payments','reports','documents','forms','units','members','permissions','audit']) m
on conflict do nothing;

-- These guarded, non-exposed helpers are necessary for role lookup without RLS recursion.
create or replace function pm_private.allowed(p_menu text,p_operation text default 'read') returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.pm_members m join public.pm_permissions p on p.role=m.role where m.user_id=auth.uid() and m.active and p.menu=p_menu and (m.role='admin' or case p_operation when 'write' then p.can_write when 'approve' then p.can_approve else p.can_read end));
$$;
create or replace function pm_private.in_scope(p_unit text,p_owner uuid default null) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.pm_members m where m.user_id=auth.uid() and m.active and (m.role in('admin','executive') or m.unit_id=p_unit or p_owner=auth.uid()));
$$;
create or replace function pm_private.is_admin() returns boolean language sql stable security definer set search_path='' as $$select auth.uid() is not null and exists(select 1 from public.pm_members m where m.user_id=auth.uid() and m.active and m.role='admin');$$;
create or replace function pm_private.active_member() returns boolean language sql stable security definer set search_path='' as $$select auth.uid() is not null and exists(select 1 from public.pm_members m where m.user_id=auth.uid() and m.active);$$;
create or replace function pm_private.project_access(p_id text) returns boolean language sql stable security definer set search_path='' as $$ select auth.uid() is not null and exists(select 1 from public.pm_projects p where p.id::text=p_id and pm_private.in_scope(p.unit_id,p.owner_id));$$;
revoke all on all functions in schema pm_private from public,anon,authenticated;
grant execute on function pm_private.allowed(text,text),pm_private.in_scope(text,uuid),pm_private.is_admin(),pm_private.active_member(),pm_private.project_access(text) to authenticated;

do $$ declare t text;begin
 foreach t in array array['pm_units','pm_members','pm_permissions','pm_sources','pm_proposals','pm_projects','pm_allocations','pm_disbursements','pm_reports','pm_forms','pm_documents','pm_audit','pm_commands'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from public,anon,authenticated',t);
 execute format('grant select on public.%I to authenticated',t);
 execute format('grant all on public.%I to service_role',t);
 execute format('drop policy if exists pm_read on public.%I',t);
 end loop;
end $$;
create policy pm_read on public.pm_units for select to authenticated using(pm_private.active_member());
create policy pm_read on public.pm_members for select to authenticated using(user_id=(select auth.uid()) or pm_private.is_admin());
create policy pm_read on public.pm_permissions for select to authenticated using(pm_private.is_admin() or (pm_private.active_member() and role=(select m.role from public.pm_members m where m.user_id=(select auth.uid()))));
create policy pm_read on public.pm_sources for select to authenticated using(pm_private.active_member());
create policy pm_read on public.pm_proposals for select to authenticated using(pm_private.allowed('proposals') and pm_private.in_scope(unit_id,owner_id));
create policy pm_read on public.pm_projects for select to authenticated using((pm_private.allowed('projects') or pm_private.allowed('reports')) and pm_private.in_scope(unit_id,owner_id));
create policy pm_read on public.pm_allocations for select to authenticated using(pm_private.active_member() and pm_private.project_access(project_id::text));
create policy pm_read on public.pm_disbursements for select to authenticated using((pm_private.allowed('disbursements') or pm_private.allowed('payments')) and pm_private.in_scope(unit_id,requester_id));
create policy pm_read on public.pm_reports for select to authenticated using(pm_private.allowed('reports') and pm_private.in_scope(unit_id,owner_id));
create policy pm_read on public.pm_forms for select to authenticated using(pm_private.allowed('forms') and (active or pm_private.is_admin()));
create policy pm_read on public.pm_documents for select to authenticated using(pm_private.allowed('documents') and pm_private.in_scope(unit_id,owner_id));
create policy pm_read on public.pm_audit for select to authenticated using(pm_private.allowed('audit') and pm_private.in_scope(unit_id,actor_id));
-- pm_commands deliberately has no read policy; it is only used inside the guarded dispatcher.

create or replace function pm_private.money(p text) returns numeric language plpgsql immutable security invoker set search_path='' as $$begin if p is null or p !~ '^[0-9]+([.][0-9]{1,2})?$' or length(p)>16 then raise exception 'จำนวนเงินไม่ถูกต้อง (ทศนิยมไม่เกิน 2 ตำแหน่ง)';end if;return p::numeric;end;$$;
revoke all on function pm_private.money(text) from public,anon,authenticated;

-- All state changes use one atomic, idempotent, explicitly authorized transaction.
-- SECURITY DEFINER is confined to this non-exposed schema. No direct client table writes.
create or replace function pm_private.dispatch(p_action text,d jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare
 m public.pm_members; q public.pm_proposals; p public.pm_projects; s public.pm_sources; w public.pm_disbursements; rr public.pm_reports;
 x uuid; cmd uuid; result jsonb; amount numeric; used numeric; cap numeric; target_unit text; action_menu text; operation text; actor_name text; new_status text; ver int; details jsonb; paydate date;
begin
 if auth.uid() is null then raise exception 'กรุณาเข้าสู่ระบบ';end if;
 select * into m from public.pm_members where user_id=auth.uid() and active;
 if not found then raise exception 'บัญชีนี้ยังไม่ได้รับสิทธิ์หรือถูกระงับการใช้งาน';end if;
 if jsonb_typeof(d)<>'object' or octet_length(d::text)>4194304 then raise exception 'ข้อมูลคำขอไม่ถูกต้อง';end if;
 cmd:=(d->>'command_id')::uuid;if cmd is null then raise exception 'ไม่พบรหัสคำขอ';end if;
 perform pg_advisory_xact_lock(hashtextextended(cmd::text,0));
 select response into result from public.pm_commands where id=cmd and actor_id=auth.uid() and action=p_action;
 if found then return result;end if;
 actor_name:=m.display_name;
 action_menu:=split_part(p_action,'.',1); operation:='write';
 if p_action in('proposals.review','disbursements.review','reports.review','documents.review') then operation:='approve';end if;
 if p_action='disbursements.pay' then action_menu:='payments';end if;
 if not pm_private.allowed(action_menu,operation) then raise exception 'ไม่มีสิทธิ์ดำเนินการในเมนูนี้';end if;
 if operation='approve' and m.role not in('admin','executive') then raise exception 'เฉพาะผู้บริหารหรือ Admin เท่านั้นที่อนุมัติได้';end if;
 if d ? 'id' then x:=(d->>'id')::uuid;end if;
 if p_action='sources.create' then
  amount:=pm_private.money(d->>'amount');if amount<=0 or length(trim(d->>'name'))<1 then raise exception 'ระบุชื่อแหล่งเงินและวงเงินมากกว่า 0';end if;
  insert into public.pm_sources(name,fiscal_year,category,amount,note,created_by) values(trim(d->>'name'),(d->>'fiscal_year')::int,coalesce(d->>'category','operating'),amount,coalesce(d->>'note',''),m.user_id) returning id into x;
 elsif p_action='sources.adjust' then
  select * into strict s from public.pm_sources where id=x for update;amount:=pm_private.money(d->>'amount');
  select coalesce(sum(a.amount),0) into used from public.pm_allocations a where a.source_id=x;
  select used+coalesce(sum(a.amount),0) into used from public.pm_disbursements a where a.source_id=x and status in('pending','approved','paid');
  if amount<used or length(trim(coalesce(d->>'note','')))<3 then raise exception 'ยอดใหม่ต่ำกว่ายอดผูกพัน หรือยังไม่ได้ระบุเหตุผล';end if;
  update public.pm_sources b set amount=pm_private.money(d->>'amount'),note=d->>'note' where b.id=x;
 elsif p_action in('proposals.save','proposals.submit') then
  target_unit:=coalesce(d->>'unit_id',m.unit_id);
  if m.role='officer' and target_unit<>m.unit_id then raise exception 'เสนอได้เฉพาะหน่วยงานของตน';end if;
  if not exists(select 1 from public.pm_units where id=target_unit and active) then raise exception 'หน่วยงานไม่พร้อมใช้งาน';end if;
  amount:=pm_private.money(d->>'requested_budget');if amount<=0 or length(trim(coalesce(d->>'title','')))<3 then raise exception 'ระบุชื่อโครงการและวงเงินที่ขอ';end if;
  if x is not null then
   select * into strict q from public.pm_proposals where id=x for update;
   if q.owner_id<>m.user_id and m.role<>'admin' then raise exception 'แก้ไขได้เฉพาะข้อเสนอของตน';end if;
   if q.status not in('draft','returned') or q.version is distinct from (d->>'version')::int then raise exception 'สถานะหรือเวอร์ชันเปลี่ยนแล้ว กรุณาโหลดใหม่';end if;
   update public.pm_proposals b set title=trim(d->>'title'),unit_id=target_unit,fiscal_year=(d->>'fiscal_year')::int,requested_budget=pm_private.money(d->>'requested_budget'),objectives=coalesce(d->>'objectives',''),description=coalesce(d->>'description',''),start_date=nullif(d->>'start_date','')::date,end_date=nullif(d->>'end_date','')::date,report_due=nullif(d->>'report_due','')::date,status=case when p_action='proposals.submit' then 'pending' else 'draft' end,version=b.version+1 where b.id=x;
  else
   insert into public.pm_proposals(title,unit_id,fiscal_year,requested_budget,objectives,description,start_date,end_date,report_due,owner_id,owner_name,status) values(trim(d->>'title'),target_unit,(d->>'fiscal_year')::int,amount,coalesce(d->>'objectives',''),coalesce(d->>'description',''),nullif(d->>'start_date','')::date,nullif(d->>'end_date','')::date,nullif(d->>'report_due','')::date,m.user_id,m.display_name,case when p_action='proposals.submit' then 'pending' else 'draft' end) returning id into x;
  end if;
 elsif p_action='proposals.review' then
  select * into strict q from public.pm_proposals where id=x for update;
  if q.status<>'pending' or q.version is distinct from (d->>'version')::int then raise exception 'ข้อเสนอนี้ถูกดำเนินการแล้ว';end if;
  if q.owner_id=m.user_id then raise exception 'ผู้เสนอไม่สามารถอนุมัติข้อเสนอของตนเอง';end if;
  new_status:=d->>'decision';if new_status not in('approved','rejected','returned') then raise exception 'ผลพิจารณาไม่ถูกต้อง';end if;
  if new_status<>'approved' and length(trim(coalesce(d->>'note','')))<3 then raise exception 'กรุณาระบุเหตุผล';end if;
  update public.pm_proposals b set status=new_status,review_note=coalesce(d->>'note',''),reviewer_id=m.user_id,reviewer_name=m.display_name,reviewed_at=now(),version=b.version+1 where b.id=x;
  if new_status='approved' then
   amount:=pm_private.money(coalesce(nullif(d->>'approved_budget',''),q.requested_budget::text));if amount<=0 or amount>q.requested_budget then raise exception 'วงเงินอนุมัติต้องไม่เกินที่เสนอ';end if;
   insert into public.pm_projects(proposal_id,code,title,unit_id,fiscal_year,approved_budget,objectives,description,start_date,end_date,report_due,owner_id,owner_name) values(q.id,'PM-'||q.fiscal_year||'-'||upper(substr(q.id::text,1,8)),q.title,q.unit_id,q.fiscal_year,amount,q.objectives,q.description,q.start_date,q.end_date,q.report_due,q.owner_id,q.owner_name);
  end if;
  target_unit:=q.unit_id;
 elsif p_action='allocations.create' then
  select * into strict s from public.pm_sources where id=(d->>'source_id')::uuid for update;
  select * into strict p from public.pm_projects where id=(d->>'project_id')::uuid for update;
  if not pm_private.in_scope(p.unit_id,p.owner_id) or p.status in('completed','cancelled') or s.fiscal_year<>p.fiscal_year then raise exception 'โครงการหรือปีงบประมาณไม่ถูกต้อง';end if;
  amount:=pm_private.money(d->>'amount');if amount<=0 then raise exception 'จำนวนเงินต้องมากกว่า 0';end if;
  select coalesce(sum(a.amount),0) into used from public.pm_allocations a where a.source_id=s.id;
  select used+coalesce(sum(a.amount),0) into used from public.pm_disbursements a where a.source_id=s.id and a.status in('pending','approved','paid');
  if used+amount>s.amount then raise exception 'วงเงินคงเหลือของแหล่งเงินไม่เพียงพอ';end if;
  select coalesce(sum(a.amount),0) into cap from public.pm_allocations a where a.project_id=p.id;
  if cap+amount>p.approved_budget then raise exception 'จัดสรรเกินวงเงินโครงการที่อนุมัติ';end if;
  insert into public.pm_allocations(source_id,project_id,amount,note,actor_id) values(s.id,p.id,amount,coalesce(d->>'note',''),m.user_id) returning id into x;
  update public.pm_projects b set status='active',version=b.version+1 where b.id=p.id;target_unit:=p.unit_id;
 elsif p_action in('disbursements.create','utilities.create') then
  amount:=pm_private.money(d->>'amount');if amount<=0 or length(trim(coalesce(d->>'purpose','')))<3 then raise exception 'ระบุวัตถุประสงค์และจำนวนเงิน';end if;
  if p_action='utilities.create' then
   select * into strict s from public.pm_sources where id=(d->>'source_id')::uuid for update;
   select coalesce(sum(a.amount),0) into cap from public.pm_allocations a where a.source_id=s.id;
   select cap+coalesce(sum(a.amount),0) into used from public.pm_disbursements a where a.source_id=s.id and a.status in('pending','approved','paid');
   if used+amount>s.amount then raise exception 'งบส่วนกลางที่ยังไม่ผูกพันไม่เพียงพอ';end if;
   insert into public.pm_disbursements(source_id,fund_id,unit_id,fiscal_year,kind,purpose,amount,requester_id,requester_name) values(s.id,s.id,m.unit_id,s.fiscal_year,coalesce(d->>'kind','utility'),d->>'purpose',amount,m.user_id,m.display_name) returning id into x;target_unit:=m.unit_id;
  else
   select * into strict p from public.pm_projects where id=(d->>'project_id')::uuid for update;
   if not pm_private.in_scope(p.unit_id,p.owner_id) or p.status in('completed','cancelled') then raise exception 'ไม่สามารถเบิกจากโครงการนี้';end if;
   select coalesce(sum(a.amount),0) into cap from public.pm_allocations a where a.project_id=p.id and a.source_id=(d->>'fund_id')::uuid;
   select coalesce(sum(a.amount),0) into used from public.pm_disbursements a where a.project_id=p.id and a.fund_id=(d->>'fund_id')::uuid and a.status in('pending','approved','paid');
   if used+amount>cap then raise exception 'วงเงินโครงการไม่เพียงพอ (รวมรายการรออนุมัติแล้ว)';end if;
   insert into public.pm_disbursements(project_id,fund_id,unit_id,fiscal_year,purpose,amount,requester_id,requester_name) values(p.id,(d->>'fund_id')::uuid,p.unit_id,p.fiscal_year,d->>'purpose',amount,m.user_id,m.display_name) returning id into x;target_unit:=p.unit_id;
  end if;
 elsif p_action in('disbursements.review','disbursements.pay') then
  select * into strict w from public.pm_disbursements where id=x;
  if w.project_id is not null then perform 1 from public.pm_projects where id=w.project_id for update;else perform 1 from public.pm_sources where id=w.source_id for update;end if;
  select * into strict w from public.pm_disbursements where id=x for update;
  if w.version is distinct from (d->>'version')::int then raise exception 'รายการเปลี่ยนแล้ว กรุณาโหลดใหม่';end if;
  if p_action='disbursements.review' then
   if w.status<>'pending' or w.requester_id=m.user_id then raise exception 'ผู้ขอไม่สามารถอนุมัติเอง หรือรายการไม่รอพิจารณา';end if;
   new_status:=d->>'decision';if new_status not in('approved','rejected') then raise exception 'ผลพิจารณาไม่ถูกต้อง';end if;
   if new_status='rejected' and length(trim(coalesce(d->>'note','')))<3 then raise exception 'กรุณาระบุเหตุผล';end if;
   update public.pm_disbursements b set status=new_status,review_note=coalesce(d->>'note',''),reviewer_id=m.user_id,reviewer_name=m.display_name,reviewed_at=now(),version=b.version+1 where b.id=x;
  else
   if w.status<>'approved' or not pm_private.in_scope(w.unit_id,w.requester_id) then raise exception 'บันทึกจ่ายได้เฉพาะรายการอนุมัติแล้ว';end if;
   if length(trim(coalesce(d->>'voucher_no','')))<2 then raise exception 'กรุณาระบุเลขที่หลักฐานการจ่าย';end if;
   paydate:=coalesce(nullif(d->>'payment_date','')::date,timezone('Asia/Bangkok',now())::date);
   if paydate>timezone('Asia/Bangkok',now())::date or paydate<make_date(w.fiscal_year-544,10,1) or paydate>=make_date(w.fiscal_year-543,10,1) then raise exception 'วันที่จ่ายต้องอยู่ในปีงบประมาณและไม่ใช่วันในอนาคต';end if;
   update public.pm_disbursements b set status='paid',voucher_no=d->>'voucher_no',paid_by=m.user_id,paid_at=now(),payment_date=paydate,version=b.version+1 where b.id=x;
  end if;target_unit:=w.unit_id;
 elsif p_action='projects.progress' then
  select * into strict p from public.pm_projects where id=x for update;
  if not pm_private.in_scope(p.unit_id,p.owner_id) or p.status in('completed','cancelled') or p.version is distinct from (d->>'version')::int then raise exception 'ไม่สามารถปรับโครงการนี้';end if;
  update public.pm_projects b set progress=(d->>'progress')::int,version=b.version+1 where b.id=x;target_unit:=p.unit_id;
 elsif p_action in('reports.save','reports.submit') then
  select * into strict p from public.pm_projects where id=(d->>'project_id')::uuid for update;
  if not pm_private.in_scope(p.unit_id,p.owner_id) or p.status='cancelled' then raise exception 'ไม่มีสิทธิ์จัดทำรายงานโครงการนี้';end if;
  select * into rr from public.pm_reports where project_id=p.id for update;
  if found and (rr.version<>coalesce((d->>'version')::int,0) or rr.status in('submitted','accepted')) then raise exception 'รายงานถูกส่งหรือตรวจแล้ว กรุณาโหลดใหม่';end if;
  details:=d->'payload';if details is null or jsonb_typeof(details)<>'object' then raise exception 'ข้อมูลรายงานไม่ถูกต้อง';end if;
  select coalesce(sum(a.amount),0) into amount from public.pm_disbursements a where a.project_id=p.id and status='paid';
  select coalesce(sum(a.amount),0) into cap from public.pm_allocations a where a.project_id=p.id;
  if jsonb_typeof(coalesce(details->'photos','[]'::jsonb))<>'array' or jsonb_array_length(coalesce(details->'photos','[]'::jsonb))>20 then raise exception 'รายการภาพไม่ถูกต้อง';end if;
  if exists(select 1 from jsonb_array_elements(coalesce(details->'photos','[]'::jsonb)) a where coalesce(a->>'path','') not like 'projects/'||p.id::text||'/%') then raise exception 'ภาพต้องอยู่ในโครงการนี้';end if;
  details:=details||jsonb_build_object('projectName',p.title,'academicYear',p.fiscal_year::text,'schoolName',(select name from public.pm_units where id=p.unit_id),'budgetPlanned',cap::text,'memoBudget',amount::text);
  if rr.id is null then
   insert into public.pm_reports(project_id,unit_id,owner_id,payload,status,submitted_at) values(p.id,p.unit_id,m.user_id,details,case when p_action='reports.submit' then 'submitted' else 'draft' end,case when p_action='reports.submit' then now() else null end) returning id into x;
  else
   x:=rr.id;update public.pm_reports b set owner_id=m.user_id,payload=details,status=case when p_action='reports.submit' then 'submitted' else 'draft' end,submitted_at=case when p_action='reports.submit' then now() else null end,version=b.version+1,updated_at=now() where b.id=x;
  end if;target_unit:=p.unit_id;
 elsif p_action='reports.review' then
  select * into strict rr from public.pm_reports where id=x;
  perform 1 from public.pm_projects where id=rr.project_id for update;
  select * into strict rr from public.pm_reports where id=x for update;
  if rr.status<>'submitted' or rr.version is distinct from (d->>'version')::int or rr.owner_id=m.user_id then raise exception 'ไม่สามารถตรวจรับรายงานนี้';end if;
  new_status:=d->>'decision';if new_status not in('accepted','returned') then raise exception 'ผลตรวจไม่ถูกต้อง';end if;
  if new_status='returned' and length(trim(coalesce(d->>'note','')))<3 then raise exception 'กรุณาระบุสิ่งที่ต้องแก้ไข';end if;
  update public.pm_reports b set status=new_status,review_note=coalesce(d->>'note',''),reviewer_id=m.user_id,reviewed_at=now(),version=b.version+1 where b.id=x;
  if new_status='accepted' then update public.pm_projects b set progress=100,status='completed',version=b.version+1 where b.id=rr.project_id;end if;target_unit:=rr.unit_id;
 elsif p_action in('forms.create','documents.create') then
  if (d->>'size_bytes')::int not between 1 and 10485760 or coalesce(d->>'mime_type','') not in('application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','image/jpeg','image/png','image/webp') then raise exception 'ประเภทหรือขนาดไฟล์ไม่ถูกต้อง';end if;
  if p_action='forms.create' then
   if split_part(d->>'path','/',1)<>'forms' or split_part(d->>'path','/',2)<>m.user_id::text then raise exception 'ตำแหน่งไฟล์ไม่ถูกต้อง';end if;
   insert into public.pm_forms(title,category,description,path,file_name,mime_type,size_bytes,created_by) values(d->>'title',coalesce(d->>'kind','permission'),coalesce(d->>'description',''),d->>'path',d->>'file_name',d->>'mime_type',(d->>'size_bytes')::int,m.user_id) returning id into x;
  else
   select * into strict p from public.pm_projects where id=(d->>'project_id')::uuid;
   if not pm_private.in_scope(p.unit_id,p.owner_id) or split_part(d->>'path','/',1)<>'projects' or split_part(d->>'path','/',2)<>p.id::text or split_part(d->>'path','/',3)<>m.user_id::text then raise exception 'ไม่มีสิทธิ์แนบไฟล์โครงการนี้';end if;
   insert into public.pm_documents(project_id,unit_id,kind,title,path,file_name,mime_type,size_bytes,owner_id) values(p.id,p.unit_id,coalesce(d->>'kind','permission'),d->>'title',d->>'path',d->>'file_name',d->>'mime_type',(d->>'size_bytes')::int,m.user_id) returning id into x;target_unit:=p.unit_id;
  end if;
 elsif p_action='documents.review' then
  new_status:=d->>'decision';if new_status not in('accepted','returned') then raise exception 'ผลตรวจไม่ถูกต้อง';end if;
  perform 1 from public.pm_documents where id=x for update;
  if new_status='returned' and length(trim(coalesce(d->>'note','')))<3 then raise exception 'กรุณาระบุสิ่งที่ต้องแก้ไข';end if;
  if not exists(select 1 from public.pm_documents where id=x and status='pending' and owner_id<>m.user_id) then raise exception 'เอกสารนี้ถูกดำเนินการแล้ว';end if;
  update public.pm_documents set status=new_status,review_note=coalesce(d->>'note','') where id=x;
 elsif p_action='forms.archive' then
  update public.pm_forms set active=false where id=x;
 elsif p_action='units.save' then
  if not pm_private.is_admin() then raise exception 'เฉพาะ Admin';end if;
  if length(trim(coalesce(d->>'name','')))<2 then raise exception 'ระบุชื่อหน่วยงาน';end if;
  target_unit:=coalesce(nullif(d->>'unit_id',''),'unit-'||substr(gen_random_uuid()::text,1,8));
  if target_unit=coalesce(d->>'parent_id','') then raise exception 'หน่วยงานเป็นแม่ของตนไม่ได้';end if;
  if exists(with recursive tree as (select id from public.pm_units where parent_id=target_unit union all select u.id from public.pm_units u join tree t on u.parent_id=t.id) select 1 from tree where id=d->>'parent_id') then raise exception 'โครงสร้างหน่วยงานวนกลับไม่ได้';end if;
  insert into public.pm_units(id,name,parent_id,kind) values(target_unit,trim(d->>'name'),nullif(d->>'parent_id',''),coalesce(d->>'kind','work')) on conflict(id) do update set name=excluded.name,parent_id=excluded.parent_id,kind=excluded.kind;
 elsif p_action='members.update' then
  if not pm_private.is_admin() then raise exception 'เฉพาะ Admin';end if;
  lock table public.pm_members in share row exclusive mode;
  if d->>'role' not in('admin','executive','officer') then raise exception 'บทบาทไม่ถูกต้อง';end if;
  if not exists(select 1 from public.pm_units where id=d->>'unit_id' and active) then raise exception 'หน่วยงานไม่ถูกต้อง';end if;
  update public.pm_members set display_name=d->>'display_name',role=d->>'role',unit_id=d->>'unit_id',active=(d->>'active')::boolean where user_id=x;
  if not exists(select 1 from public.pm_members where role='admin' and active) then raise exception 'ต้องมี Admin ที่ใช้งานได้อย่างน้อย 1 คน';end if;
 elsif p_action='permissions.save' then
  if not pm_private.is_admin() or d->>'role'='admin' then raise exception 'แก้ไขสิทธิ์นี้ไม่ได้';end if;
  update public.pm_permissions set can_read=(d->>'can_read')::boolean,can_write=(d->>'can_write')::boolean,can_approve=(d->>'can_approve')::boolean where role=d->>'role' and menu=d->>'menu';
 else raise exception 'ไม่รู้จักคำสั่ง %',p_action;
 end if;
 result:=jsonb_build_object('success',true,'id',x,'unit_id',target_unit);
 insert into public.pm_audit(actor_id,actor_name,action,entity_id,unit_id,detail) values(m.user_id,m.display_name,p_action,coalesce(x::text,target_unit),target_unit,jsonb_build_object('note',coalesce(d->>'note',''),'amount',coalesce(d->>'amount',''),'decision',d->>'decision'));
 insert into public.pm_commands(id,actor_id,action,response) values(cmd,m.user_id,p_action,result);
 return result;
end;$$;
revoke all on function pm_private.dispatch(text,jsonb) from public,anon,authenticated;
grant execute on function pm_private.dispatch(text,jsonb) to authenticated;
create or replace function public.pm_action(p_action text,p_data jsonb) returns jsonb language sql security invoker set search_path='' as $$select pm_private.dispatch(p_action,p_data);$$;
revoke all on function public.pm_action(text,jsonb) from public,anon;
grant execute on function public.pm_action(text,jsonb) to authenticated;

create or replace function pm_private.fund_balances() returns jsonb language plpgsql stable security definer set search_path='' as $$begin
if auth.uid() is null or not pm_private.allowed('sources') then return '[]'::jsonb;end if;
return (select coalesce(jsonb_agg(jsonb_build_object('source_id',s.id,'allocated',coalesce(a.total,0),'central_reserved',coalesce(c.total,0),'paid',coalesce(w.total,0),'unallocated',s.amount-coalesce(a.total,0)-coalesce(c.total,0))),'[]'::jsonb) from public.pm_sources s
left join lateral(select sum(amount) total from public.pm_allocations where source_id=s.id) a on true
left join lateral(select sum(amount) total from public.pm_disbursements where source_id=s.id and status in('pending','approved','paid')) c on true
left join lateral(select sum(amount) total from public.pm_disbursements where fund_id=s.id and status='paid') w on true);
end;$$;
revoke all on function pm_private.fund_balances() from public,anon;grant execute on function pm_private.fund_balances() to authenticated;
create or replace function public.pm_fund_balances() returns jsonb language sql security invoker set search_path='' as $$select pm_private.fund_balances();$$;
revoke all on function public.pm_fund_balances() from public,anon;grant execute on function public.pm_fund_balances() to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('andaman-pm-files','andaman-pm-files',false,10485760,array['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','image/jpeg','image/png','image/webp']) on conflict(id) do update set public=false,file_size_limit=10485760,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists pm_file_read on storage.objects;
create policy pm_file_read on storage.objects for select to authenticated using(bucket_id='andaman-pm-files' and ((split_part(name,'/',1)='forms' and pm_private.allowed('forms')) or (split_part(name,'/',1)='projects' and (pm_private.allowed('documents') or pm_private.allowed('reports')) and pm_private.project_access(split_part(name,'/',2)))));
drop policy if exists pm_file_insert on storage.objects;
create policy pm_file_insert on storage.objects for insert to authenticated with check(bucket_id='andaman-pm-files' and ((split_part(name,'/',1)='forms' and split_part(name,'/',2)=(select auth.uid())::text and pm_private.allowed('forms','write')) or (split_part(name,'/',1)='projects' and split_part(name,'/',3)=(select auth.uid())::text and pm_private.project_access(split_part(name,'/',2)) and (pm_private.allowed('documents','write') or pm_private.allowed('reports','write')))));
create or replace function pm_private.file_unreferenced(p_path text) returns boolean language sql stable security definer set search_path='' as $$
select auth.uid() is not null and pm_private.active_member() and not exists(select 1 from public.pm_forms f where f.path=p_path) and not exists(select 1 from public.pm_documents d where d.path=p_path) and not exists(select 1 from public.pm_reports r where r.payload::text like '%'||p_path||'%');$$;
revoke all on function pm_private.file_unreferenced(text) from public,anon;grant execute on function pm_private.file_unreferenced(text) to authenticated;
drop policy if exists pm_file_cleanup on storage.objects;
create policy pm_file_cleanup on storage.objects for delete to authenticated using(bucket_id='andaman-pm-files' and pm_private.file_unreferenced(name) and ((split_part(name,'/',1)='forms' and split_part(name,'/',2)=(select auth.uid())::text) or(split_part(name,'/',1)='projects' and split_part(name,'/',3)=(select auth.uid())::text)));
create index if not exists pm_units_parent_idx on public.pm_units(parent_id);
create index if not exists pm_sources_creator_idx on public.pm_sources(created_by);
create index if not exists pm_proposals_owner_idx on public.pm_proposals(owner_id);
create index if not exists pm_proposals_reviewer_idx on public.pm_proposals(reviewer_id);
create index if not exists pm_projects_owner_idx on public.pm_projects(owner_id);
create index if not exists pm_allocations_actor_idx on public.pm_allocations(actor_id);
create index if not exists pm_disbursements_fund_idx on public.pm_disbursements(fund_id,status);
create index if not exists pm_disbursements_unit_idx on public.pm_disbursements(unit_id);
create index if not exists pm_disbursements_requester_idx on public.pm_disbursements(requester_id);
create index if not exists pm_disbursements_reviewer_idx on public.pm_disbursements(reviewer_id);
create index if not exists pm_disbursements_payer_idx on public.pm_disbursements(paid_by);
create index if not exists pm_reports_owner_idx on public.pm_reports(owner_id);
create index if not exists pm_reports_reviewer_idx on public.pm_reports(reviewer_id);
create index if not exists pm_forms_creator_idx on public.pm_forms(created_by);
create index if not exists pm_documents_owner_idx on public.pm_documents(owner_id);
create index if not exists pm_documents_unit_idx on public.pm_documents(unit_id);
create index if not exists pm_audit_actor_idx on public.pm_audit(actor_id);
drop policy if exists pm_cache_private on public.pm_commands;
create policy pm_cache_private on public.pm_commands for select to authenticated using(false);
drop policy if exists pm_read on public.pm_permissions;
create policy pm_read on public.pm_permissions for select to authenticated using(pm_private.is_admin() or (pm_private.active_member() and role=(select m.role from public.pm_members m where m.user_id=(select auth.uid()))));
commit;
