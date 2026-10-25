const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {PGlite}=require('@electric-sql/pglite');
test('SQL setup, ownership RLS, column grants, versioning and private images',async()=>{
  const db=await PGlite.create();
  try{
    await db.exec(`create role anon;create role authenticated;create schema auth;create schema storage;
      create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      grant usage on schema auth,storage,public to authenticated,anon;grant execute on function auth.uid() to authenticated,anon;
      create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
      create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);
      alter table storage.objects enable row level security;grant select,insert,delete on storage.objects to authenticated;
      create function storage.foldername(text) returns text[] language sql immutable as $$ select string_to_array($1,'/') $$;
      grant execute on function storage.foldername(text) to authenticated;
      insert into auth.users values ('11111111-1111-4111-8111-111111111111'),('22222222-2222-4222-8222-222222222222');`);
    const setup=fs.readFileSync(require.resolve('../supabase/setup.sql'),'utf8');
    await db.exec(setup);await db.exec(setup); // idempotent install
    assert.equal((await db.query("select public from storage.buckets where id='andaman-report-photos'")).rows[0].public,false);
    const payload={projectName:'รายงานทดสอบ',academicYear:'2570',schoolName:'สถาบัน',q2Status:'ยังไม่ได้ดำเนินการ'};
    await db.exec("set role authenticated; set request.jwt.claim.sub='11111111-1111-4111-8111-111111111111';");
    await db.query('insert into public.andaman_project_reports(id,payload)values($1,$2)', ['aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',payload]);
    await assert.rejects(()=>db.query('insert into public.andaman_project_reports(id,owner_id,payload)values($1,$2,$3)', ['bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','22222222-2222-4222-8222-222222222222',payload]));
    const updated=await db.query('update public.andaman_project_reports set payload=$1 where id=$2 and version=1 returning version',[{...payload,projectName:'แก้ไขแล้ว'},'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa']);
    assert.equal(updated.rows[0].version,2);
    assert.equal((await db.query('update public.andaman_project_reports set payload=$1 where version=1 returning id',[payload])).rows.length,0);
    await assert.rejects(()=>db.exec("update public.andaman_project_reports set owner_id='22222222-2222-4222-8222-222222222222'"));
    await db.exec("insert into storage.objects(bucket_id,name)values('andaman-report-photos','11111111-1111-4111-8111-111111111111/report/photo.jpg');");
    await assert.rejects(()=>db.exec("insert into storage.objects(bucket_id,name)values('andaman-report-photos','22222222-2222-4222-8222-222222222222/report/photo.jpg')"));
    await db.exec("set request.jwt.claim.sub='22222222-2222-4222-8222-222222222222';");
    assert.equal((await db.query('select * from public.andaman_project_reports')).rows.length,0);
    assert.equal((await db.query('select * from storage.objects')).rows.length,0);
    assert.equal((await db.query('update public.andaman_project_reports set payload=$1 returning id',[payload])).rows.length,0);
    await db.exec('reset role;set role anon;');
    await assert.rejects(()=>db.query('select * from public.andaman_project_reports'));
    await db.exec('reset role;');
    assert.equal((await db.query("select prosecdef from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='andaman_report_internal'")).rows[0].prosecdef,false);
  }finally{await db.close();}
});
