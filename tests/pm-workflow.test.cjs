const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const {PGlite}=require('@electric-sql/pglite');const C=require('../dist/pm-core.js');
const ids={admin:'10000000-0000-4000-8000-000000000001',executive:'10000000-0000-4000-8000-000000000002',officer:'10000000-0000-4000-8000-000000000003',other:'10000000-0000-4000-8000-000000000004'};
async function setup(){const db=await PGlite.create();await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create schema storage;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth,storage,public to authenticated,anon;grant execute on function auth.uid() to authenticated,anon;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);alter table storage.objects enable row level security;grant select,insert,delete on storage.objects to authenticated;`);await db.exec(fs.readFileSync('supabase/pm_setup.sql','utf8'));for(const [role,id]of Object.entries(ids)){await db.query('insert into auth.users values($1)',[id]);await db.query('insert into pm_members(user_id,email,display_name,role,unit_id) values($1,$2,$3,$4,$5)',[id,role+'@example.invalid',role,role==='other'?'officer':role,role==='other'?'research':role==='officer'?'strategy':'office']);}return db;}
async function as(db,role,fn){await db.exec('begin');try{await db.query("select set_config('request.jwt.claim.sub',$1,true)",[ids[role]||'']);await db.exec('set local role '+(role?'authenticated':'anon'));const r=await fn();await db.exec('commit');return r;}catch(e){await db.exec('rollback');throw e;}}
async function action(db,role,a,d={}){return as(db,role,async()=>{const r=await db.query('select pm_action($1,$2::jsonb) result',[a,JSON.stringify({command_id:C.uuid(),...d})]);return r.rows[0].result;});}
async function get(db,sql,args=[]){return (await db.query(sql,args)).rows;}
test('Database: approval, financial limits, RLS, reports and member safeguards',async()=>{const db=await setup();try{
await assert.rejects(action(db,'officer','sources.create',{name:'Unauthorized',amount:'100',fiscal_year:C.fy()}),/สิทธิ์/);
const fund=(await action(db,'admin','sources.create',{name:'Test fund',amount:'10000',fiscal_year:C.fy()})).id;
const proposal=(await action(db,'officer','proposals.submit',{title:'โครงการทดสอบระบบ',unit_id:'strategy',requested_budget:'7000',fiscal_year:C.fy(),objectives:'ทดสอบ'})).id;
await assert.rejects(action(db,'officer','proposals.review',{id:proposal,version:1,decision:'approved'}),/สิทธิ์/);
const command=C.uuid(),review={id:proposal,version:1,decision:'approved',approved_budget:'7000',command_id:command};
await action(db,'executive','proposals.review',review);await action(db,'executive','proposals.review',review);
const projects=await get(db,'select * from pm_projects where proposal_id=$1',[proposal]);assert.equal(projects.length,1);const p=projects[0];
await assert.rejects(action(db,'admin','proposals.review',{...review,command_id:C.uuid()}),/ดำเนินการแล้ว/);
await assert.rejects(action(db,'admin','allocations.create',{project_id:p.id,source_id:fund,amount:'7001'}),/เกินวงเงิน/);
await action(db,'admin','allocations.create',{project_id:p.id,source_id:fund,amount:'7000'});
const claim=(await action(db,'officer','disbursements.create',{project_id:p.id,fund_id:fund,purpose:'ค่าใช้จ่ายทดสอบ',amount:'5000'})).id;
await assert.rejects(action(db,'officer','disbursements.create',{project_id:p.id,fund_id:fund,purpose:'เกินวงเงิน',amount:'2000.01'}),/ไม่เพียงพอ/);
await assert.rejects(action(db,'admin','sources.adjust',{id:fund,amount:'6999',note:'ทดสอบลดงบ'}),/ต่ำกว่า/);
await assert.rejects(action(db,'other','projects.progress',{id:p.id,version:2,progress:30}),/ไม่สามารถ/);
const officerProjects=await as(db,'officer',()=>get(db,'select id from pm_projects'));assert.equal(officerProjects.length,1);
const otherProjects=await as(db,'other',()=>get(db,'select id from pm_projects'));assert.equal(otherProjects.length,0);
await assert.rejects(as(db,'officer',()=>db.exec('update pm_projects set progress=100')),/permission denied/);
await assert.rejects(as(db,'',()=>get(db,'select * from pm_projects')),/permission denied/);
await action(db,'executive','disbursements.review',{id:claim,version:1,decision:'approved'});
await assert.rejects(action(db,'admin','disbursements.pay',{id:claim,version:1,voucher_no:'TEST-1',payment_date:C.today()}),/เปลี่ยนแล้ว/);
await action(db,'admin','disbursements.pay',{id:claim,version:2,voucher_no:'TEST-1',payment_date:C.today()});
await assert.rejects(action(db,'admin','disbursements.pay',{id:claim,version:3,voucher_no:'TEST-2',payment_date:C.today()}),/อนุมัติแล้ว/);
const central=(await action(db,'admin','utilities.create',{source_id:fund,purpose:'ค่าน้ำส่วนกลาง',amount:'3000'})).id;
await assert.rejects(action(db,'admin','utilities.create',{source_id:fund,purpose:'เกินเงินกลาง',amount:'0.01'}),/ไม่เพียงพอ/);
await assert.rejects(action(db,'admin','disbursements.review',{id:central,version:1,decision:'approved'}),/ผู้ขอ/);
await action(db,'executive','disbursements.review',{id:central,version:1,decision:'rejected',note:'ยกเลิกคำขอทดสอบ'});
await action(db,'admin','utilities.create',{source_id:fund,purpose:'สร้างคำขอใหม่',amount:'3000'});
const report=(await action(db,'officer','reports.submit',{project_id:p.id,version:0,payload:{projectName:'forged',budgetPlanned:'999999',memoBudget:'999999',quantGoals:[{planned:'30 คน',actual:'32 คน'}],qualGoals:[{planned:'ผ่านเกณฑ์',actual:'ผ่านเกณฑ์ร้อยละ 90'}],kpis:[{kpiText:'ผู้เข้าร่วม',target:'30 คน',actual:'32 คน',status:'บรรลุ'}],photos:[]}})).id;
const r=(await get(db,'select * from pm_reports where id=$1',[report]))[0];assert.equal(r.payload.budgetPlanned,'7000.00');assert.equal(r.payload.memoBudget,'5000.00');assert.equal(r.payload.projectName,p.title);assert.deepEqual(r.payload.quantGoals,[{planned:'30 คน',actual:'32 คน'}]);assert.equal(r.payload.qualGoals[0].actual,'ผ่านเกณฑ์ร้อยละ 90');assert.equal(r.payload.kpis[0].target,'30 คน');
await assert.rejects(action(db,'officer','reports.save',{project_id:p.id,version:1,payload:{}}),/ถูกส่ง/);
await action(db,'executive','reports.review',{id:report,version:1,decision:'accepted'});assert.equal((await get(db,'select status from pm_projects where id=$1',[p.id]))[0].status,'completed');
await assert.rejects(action(db,'admin','members.update',{id:ids.admin,display_name:'Admin',role:'officer',unit_id:'office',active:true}),/อย่างน้อย/);
await action(db,'admin','permissions.save',{role:'officer',menu:'proposals',can_read:true,can_write:false,can_approve:false});
await assert.rejects(action(db,'officer','proposals.save',{title:'ทดสอบ',requested_budget:'100',unit_id:'strategy',fiscal_year:C.fy()}),/สิทธิ์/);
await db.query('update pm_members set active=false where user_id=$1',[ids.officer]);
await assert.rejects(action(db,'officer','projects.progress',{id:p.id,version:2,progress:20}),/ถูกระงับ/);
assert.equal((await as(db,'officer',()=>get(db,'select id from pm_projects'))).length,0);
const audit=await get(db,'select actor_id,action from pm_audit');assert.ok(audit.length>=10);assert.ok(audit.every(x=>x.actor_id));
}finally{await db.close();}});
test('Money, demo role scope, pending reserve, idempotency and export safety primitives',()=>{assert.equal(C.cents('1.01'),101);for(const x of ['-1','1e3','1.001','NaN'])assert.throws(()=>C.cents(x));let d=C.demoData(),admin=d.members[0],exec=d.members[1],staff=d.members[2];assert.equal(C.allowed(d,staff,'members'),false);const scoped=C.scopedDemo(d,staff);assert.ok(scoped.projects.every(p=>p.unit_id===staff.unit_id));let p=d.projects[0],f=d.sources[0],cap=C.projectStats(d,p.id).available;assert.throws(()=>C.demoAction(d,staff,'disbursements.create',{project_id:p.id,fund_id:f.id,purpose:'test',amount:String(cap+0.01),command_id:C.uuid()}),/ไม่เพียงพอ/);const id=C.uuid(),a={project_id:p.id,fund_id:f.id,purpose:'test',amount:'100',command_id:id};d=C.demoAction(d,staff,'disbursements.create',a).data;const count=d.disbursements.length;d=C.demoAction(d,staff,'disbursements.create',a).data;assert.equal(d.disbursements.length,count);assert.equal(C.projectStats(d,p.id).available,cap-100);});
