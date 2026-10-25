import { createClient } from 'npm:@supabase/supabase-js@2.118.0';

Deno.serve(async (req: Request) => {
  const origin=req.headers.get('origin');
  const origins=new Set(['https://andaman-project-reports-74869.muangyor.chatgpt.site',...(Deno.env.get('PM_ALLOWED_ORIGINS')||'').split(',').map(x=>x.trim()).filter(Boolean)]);
  const headers:Record<string,string>={'Content-Type':'application/json','Vary':'Origin','Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version'};
  if(origin&&origins.has(origin))headers['Access-Control-Allow-Origin']=origin;
  const reply=(value:unknown,status=200)=>new Response(JSON.stringify(value),{status,headers});
  if(origin&&!origins.has(origin))return reply({error:'Origin not allowed'},403);
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
  if(req.method!=='POST')return reply({error:'Method not allowed'},405);
  const token=req.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
  if(!token)return reply({error:'กรุณาเข้าสู่ระบบ'},401);
  try {
    const url=Deno.env.get('SUPABASE_URL')||'',anon=Deno.env.get('SUPABASE_ANON_KEY')||'',secret=Deno.env.get('PM_SUPABASE_SECRET_KEY')||Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
    if(!url||!anon||!secret)return reply({error:'การตั้งค่าฝั่งเซิร์ฟเวอร์ยังไม่ครบ'},503);
    const actorClient=createClient(url,anon,{global:{headers:{Authorization:'Bearer '+token}},auth:{persistSession:false,autoRefreshToken:false}});
    const {data:auth,error:authError}=await actorClient.auth.getUser(token);
    if(authError||!auth.user)return reply({error:'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่'},401);
    const {data:actor,error:roleError}=await actorClient.from('pm_members').select('user_id,display_name,role,active').eq('user_id',auth.user.id).single();
    if(roleError||!actor?.active||actor.role!=='admin')return reply({error:'เฉพาะ Admin ที่ใช้งานได้เท่านั้น'},403);
    const text=await req.text();if(text.length>8000)return reply({error:'ข้อมูลยาวเกินกำหนด'},413);
    const input=JSON.parse(text),email=String(input.email||'').trim().toLowerCase();
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||!['admin','executive','officer'].includes(input.role)||typeof input.display_name!=='string'||input.display_name.trim().length<2||input.display_name.length>200)return reply({error:'ตรวจสอบชื่อ อีเมล และบทบาท'},400);
    const admin=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
    const {data:unit}=await admin.from('pm_units').select('id').eq('id',input.unit_id).eq('active',true).single();
    if(!unit)return reply({error:'หน่วยงานไม่ถูกต้อง'},400);
    const {data:existing}=await admin.from('pm_members').select('user_id').eq('email',email).maybeSingle();
    if(existing)return reply({error:'อีเมลนี้เป็นสมาชิกแล้ว ให้แก้ไขจากรายชื่อสมาชิก'},409);
    let targetId:string|undefined,created=false;
    if(input.action==='create') {
      if(typeof input.password!=='string'||input.password.length<12||input.password.length>128)return reply({error:'รหัสผ่านเริ่มต้นต้องมี 12–128 ตัวอักษร'},400);
      // createUser does not send invitations or messages.
      const {data,error}=await admin.auth.admin.createUser({email,password:input.password,email_confirm:true,user_metadata:{display_name:input.display_name.trim()}});
      if(error||!data.user)return reply({error:'สร้างบัญชีไม่ได้ อีเมลอาจมีอยู่แล้ว ให้เลือกเพิ่มจากบัญชีเดิม'},400);
      targetId=data.user.id;created=true;
    } else if(input.action==='add_existing') {
      for(let page=1;page<=20;page++) {
        const {data,error}=await admin.auth.admin.listUsers({page,perPage:500});
        if(error)return reply({error:'ค้นหาบัญชีเดิมไม่สำเร็จ'},502);
        const found=data.users.find(u=>u.email?.toLowerCase()===email);
        if(found){targetId=found.id;break;}
        if(data.users.length<500)break;
      }
      if(!targetId)return reply({error:'ไม่พบบัญชีเดิมในโปรเจกต์นี้'},404);
    } else return reply({error:'คำสั่งไม่ถูกต้อง'},400);
    const {error:insertError}=await admin.from('pm_members').insert({user_id:targetId,email,display_name:input.display_name.trim(),role:input.role,unit_id:unit.id,active:true});
    if(insertError){if(created&&targetId)await admin.auth.admin.deleteUser(targetId);return reply({error:'เพิ่มสมาชิกไม่สำเร็จ กรุณาตรวจสอบและลองใหม่'},409);}
    await admin.from('pm_audit').insert({actor_id:actor.user_id,actor_name:actor.display_name,action:'members.create',entity_id:targetId,unit_id:unit.id,detail:{email,role:input.role,method:input.action}});
    return reply({success:true,user_id:targetId});
  } catch {return reply({error:'ดำเนินการไม่สำเร็จ กรุณาตรวจสอบข้อมูลและลองใหม่'},500);}
});
