-- สำหรับติดตั้งใหม่เท่านั้น: สร้าง Auth user ก่อน แล้วแก้อีเมลในคำสั่งนี้
-- ไม่ตั้งรหัสผ่าน และไม่แก้ไขบัญชีที่มีอยู่แล้ว
begin;
insert into public.pm_members(user_id,email,display_name,role,unit_id)
select id,email,'ผู้ดูแลระบบสถาบัน','admin','office'
from auth.users
where lower(email)=lower('CHANGE_TO_YOUR_ADMIN_EMAIL@example.com')
on conflict(user_id) do nothing;
select email,display_name,role,unit_id,active from public.pm_members where role='admin';
commit;
