# นำ ANDAMAN PM และ ANDAMAN REPORT ไปใช้จริง

ชุดรวมโค้ดหน้าบ้าน–หลังบ้าน · 27 ตุลาคม 2569

คู่มือนี้ใช้กับระบบบริหารจัดการโครงการและงบประมาณ สถาบันการอาชีวศึกษาภาคใต้ 2, repository `HRVec-Adaman2/Adaman2-ProjectPM` และ Supabase `ANDAMAN2-PM` รวมการแก้หน้า Login รุ่น LOGIN-FIX-20261026-1, ตารางเป้าหมายตามภาพ, ค่าเฉลี่ย/S.D. และการแก้ Supabase SDK ใน Apps Script แล้ว

## 1. สถานะจริงและลำดับที่คุณควรทำ

ตรวจแบบอ่านอย่างเดียวเมื่อ 27 ตุลาคม 2569 พบว่าโปรเจกต์ `ANDAMAN2-PM` ทำงานอยู่ มีตาราง pm_* และ andaman_project_reports เปิด RLS แล้ว มี bucket ส่วนตัว andaman-pm-files / andaman-report-photos และบัญชี andaman.southern2@gmail.com เป็น Admin ที่เปิดใช้งานและยืนยันอีเมลแล้ว จึงไม่ต้องสร้างโปรเจกต์หรือบัญชีนี้ใหม่เพื่ออัปเดตหน้าเว็บ

พบ Edge Function pm-members ทำงานอยู่ ส่วนฟังก์ชันส่งชีตมี slug เป็น report-sheet-sync- ซึ่งมีขีดท้าย แต่โค้ดหน้าเว็บเรียก report-sheet-sync ต้องติดตั้งฟังก์ชันด้วยชื่อที่ตรงกันตามขั้นตอน 11 ไม่ต้องลบฟังก์ชันเก่าเพื่อเริ่มทดสอบ

สำหรับระบบที่คุณมีอยู่ ให้ทำตามลำดับ: เปิดโค้ดใน VS Code → ตรวจ config → build/test → อัปเดต GitHub → ตรวจ pm-members และ origin → วาง Apps Script ครบ 5 ไฟล์ → ตั้ง Script properties / Deploy → ติดตั้ง report-sheet-sync ชื่อให้ตรง → ทดสอบครบเส้นทาง

การส่งสำเนา Supabase → Apps Script → Sheets/Drive ยังต้องทดสอบกับ Google deployment ของคุณ ไม่พบ URL /exec, Spreadsheet ID, Folder ID หรือค่าลับจริงในคำขอนี้ จึงเว้นให้ผู้ดูแลกรอกในบริการที่ระบุ

## 2. โปรแกรมที่ใช้และหน้าที่

| โปรแกรม/บริการ | ใช้ทำอะไร | จำเป็นเมื่อใด |
|---|---|---|
| Chrome / Edge | เปิดเว็บ ทดสอบ และพิมพ์ A4/PDF | ทุกเครื่องผู้ใช้ |
| Visual Studio Code | เปิดและแก้ไฟล์โครงการ ดู Source Control / Terminal | เครื่องผู้ดูแล |
| Git | Clone, Pull, Commit, Push โค้ด | เมื่ออัปเดตผ่าน VS Code |
| Node.js 24 LTS | npm ci, build ไฟล์ Apps Script และรันทดสอบ | เครื่องผู้ดูแลที่ build/test |
| GitHub + Pages + Actions | เก็บโค้ดและเผยแพร่หน้าเว็บหลัก | ระบบโครงการ/งบประมาณ |
| Supabase | Auth, PostgreSQL, Storage, Edge Functions และ RLS | ระบบออนไลน์ |
| Google Sheets | เก็บสำเนารายงานแบบแถวข้อมูล | เมื่อใช้ส่งสำเนาไปชีต |
| Google Drive | เก็บภาพสำเนาและลิงก์ที่ชีตอ้างถึง | เมื่อใช้ส่งสำเนาไปชีต |
| Google Apps Script | เปิดหน้ารายงานแบบแยก และรับคำขอที่มีลายเซ็นเพื่อเขียน Sheets/Drive | ช่องทาง Google |

ติดตั้ง VS Code จาก https://code.visualstudio.com, Git จาก https://git-scm.com/downloads และ Node.js รุ่น 24 จาก https://nodejs.org แล้วเปิด VS Code ใหม่ ตรวจด้วย git --version และ node --version ผู้ใช้งานทั่วไปไม่ต้องติดตั้ง Node.js หรือ Git

## 3. ไฟล์ไหนเป็นหน้าบ้าน–หลังบ้าน และวางที่ใด

| ไฟล์/โฟลเดอร์ | หน้าที่ | โปรแกรมที่ใช้ |
|---|---|---|
| dist/index.html, dist/styles.css, dist/app.js | หน้า Login, Dashboard และเมนูระบบ PM | GitHub Pages / Browser |
| dist/pm-core.js | คำนวณงบและสิทธิ์สำหรับหน้าจอ/โหมดสาธิต | Browser; สิทธิ์จริงตรวจที่ฐานข้อมูลอีกชั้น |
| dist/config.js | URL, publishable key และชื่อย่อ admin ของ PM | แก้ใน VS Code |
| dist/report-editor/ | ANDAMAN REPORT v2.0, A4, เป้าหมาย, ค่าเฉลี่ย/S.D., ภาพและคู่มือ | Browser; ถูกเปิดจากเมนูรายงาน |
| dist/report-editor/sdk-loader.js | รอโหลด Supabase SDK และใช้แหล่งสำรองเมื่อจำเป็น | Browser / Apps Script HTML |
| supabase/pm_setup.sql | ตาราง pm_*, สิทธิ์, คำสั่งทำรายการ และ bucket ไฟล์ PM | Supabase SQL Editor |
| supabase/bootstrap_admin.sql | เพิ่มสมาชิก Admin แรกจากบัญชี Auth ที่มีอยู่ | SQL Editor เฉพาะติดตั้งใหม่ |
| supabase/setup.sql | andaman_project_reports และ bucket ภาพสำหรับรายงานแบบแยก | SQL Editor |
| supabase/functions/pm-members/index.ts | หลังบ้านสร้าง/เพิ่มบัญชีสมาชิก ตรวจผู้ใช้และ Admin | Supabase Edge Function ชื่อ pm-members |
| supabase/functions/report-sheet-sync/index.ts | ตรวจเจ้าของรายงาน โหลดภาพ และลงลายเซ็นส่ง Apps Script | Edge Function ชื่อ report-sheet-sync |
| supabase/config.toml | การตั้งค่า gateway ตรวจ JWT ของสองฟังก์ชัน | Supabase CLI; ถ้าใช้ Dashboard ตั้งใน Settings |
| apps-script/Index.html | หน้าบ้านรายงาน HTML/CSS/JS ที่รวมไฟล์และแก้ SDK แล้ว | Apps Script ไฟล์ HTML ชื่อ Index |
| apps-script/Config.html | ค่าหน้าเว็บรายงานแบบแยก เฉพาะ public settings | Apps Script ไฟล์ HTML ชื่อ Config |
| apps-script/Code.gs | doGet, doPost, ตรวจ HMAC, เขียนชีต/ภาพ และอัปเกรดหัวตาราง | Apps Script ไฟล์ Script ชื่อ Code |
| apps-script/Core.gs | คำนวณค่าเฉลี่ย/S.D. และตรวจข้อมูลเหมือนหน้าบ้าน | Apps Script ไฟล์ Script ชื่อ Core |
| apps-script/appsscript.json | V8, เขตเวลา Asia/Bangkok และสิทธิ์ Google | Apps Script manifest |
| .github/workflows/deploy-pages.yml | ทดสอบและเผยแพร่ dist ไป GitHub Pages | GitHub Actions |
| scripts/, tests/, package*.json | build, ตรวจการคำนวณ/สิทธิ์/การส่งข้อมูล และล็อก dependency | Node.js ใน VS Code Terminal |
| START_HERE.html | คู่มือการกรอกทุกเมนู และขั้นตอนติดตั้ง | เปิดด้วย Chrome / Edge หลังแตก ZIP |
| INSTALLATION_AND_CODE.html | ดู ค้นหา และคัดลอกโค้ดทุกไฟล์ในชุด | เปิดด้วย Chrome / Edge หลังแตก ZIP |

ไม่ต้องนำโค้ดทุกไฟล์ไปต่อรวมกัน ไฟล์ .gs วางใน Apps Script, .sql รันใน SQL Editor, index.ts วางใน Edge Function และ dist ส่งไป Pages แต่ละส่วนใช้คนละตัวรัน

## 4. เปิดโครงการใน Visual Studio Code

ถ้า Clone ไว้แล้ว ให้ File → Open Folder แล้วเลือกโฟลเดอร์ Adaman2-ProjectPM ที่มี dist, supabase, apps-script, package.json และ .github อยู่ชั้นบนสุด บันทึก/Commit งานที่ค้างก่อน Pull แล้วคัดลอกชุดอัปเดตทับไฟล์โค้ดในโฟลเดอร์นั้น

ถ้ายังไม่เคย Clone ให้ติดตั้ง Git ก่อน เปิด VS Code → Ctrl + Shift + P → Git: Clone → ใส่ https://github.com/HRVec-Adaman2/Adaman2-ProjectPM → เลือกโฟลเดอร์เก็บงาน → Open เมื่อระบบถาม ไม่ใช้ Download ZIP มาวางซ้อนใน repository อีกชั้น

ใช้ Terminal ได้เช่นกัน:

```bash
git clone https://github.com/HRVec-Adaman2/Adaman2-ProjectPM.git
cd Adaman2-ProjectPM
code .
```

ถ้าใช้คำสั่ง code ไม่ได้ ให้เปิด VS Code แล้ว File → Open Folder แทน หาก git --version ไม่พบคำสั่ง ให้ติดตั้ง Git แล้วปิดและเปิด VS Code ใหม่

## 5. Supabase — เฉพาะติดตั้งโปรเจกต์ใหม่

ผู้ใช้ ANDAMAN2-PM ที่ตรวจพบตารางแล้วให้ข้ามการสร้างและรัน SQL ซ้ำ แล้วไปหัวข้อ 6–7 สำหรับโครงการอื่นหรือติดตั้งใหม่:

1. เข้า https://supabase.com/dashboard เลือกองค์กร → New project → ตั้งชื่อและรหัสผ่านฐานข้อมูลในบัญชีคุณ รอพร้อมใช้งาน
2. เปิดโปรเจกต์นั้น → SQL Editor → New query
3. เปิด supabase/pm_setup.sql ใน VS Code → Ctrl + A → Ctrl + C → วางใน SQL Editor ทั้งไฟล์ → Run ต้องสำเร็จก่อนขั้นตอน Admin
4. ถ้าต้องใช้รายงานแบบแยก/ส่งชีตด้วย ให้รัน supabase/setup.sql ทั้งไฟล์อีกหนึ่ง query
5. เปิด Table Editor ตรวจตาราง pm_* และ andaman_project_reports; เปิด Storage ตรวจ bucket andaman-pm-files และ andaman-report-photos เป็น Private
6. คัดลอก Project URL และ publishable key จาก Connect / Settings → API Keys ของโปรเจกต์เดียวกัน แล้วแทนค่า public configuration ตามหัวข้อ 7

ตรวจสถานะได้ด้วย SQL แบบอ่านอย่างเดียว:

```sql
select tablename, rowsecurity
from pg_tables
where schemaname='public'
  and (tablename like 'pm\_%' escape '\' or tablename='andaman_project_reports')
order by tablename;

select id, public from storage.buckets
where id in ('andaman-pm-files','andaman-report-photos');
```

ผลที่ต้องการคือ rowsecurity = true และ public = false ห้ามนำ SQL ของระบบ HRVec มารันแทนไฟล์ PM ชื่อ secret ของระบบนี้ก็ใช้ชุดของ PM/REPORT ตามคู่มือนี้

## 6. บัญชี Admin และชื่อผู้ใช้ admin

ANDAMAN2-PM มีบัญชี andaman.southern2@gmail.com เป็น Admin อยู่แล้ว ใช้รหัสผ่านจริงของบัญชีนี้ได้ ไม่ต้องสร้างบัญชีซ้ำ การจับคู่ admin เป็นเพียงชื่อที่พิมพ์หน้าเว็บแทนอีเมล ไม่ใช่การตั้งรหัสผ่าน และไม่ใช่การมอบสิทธิ์ Admin

สำหรับติดตั้งใหม่ เปิด Supabase → Authentication → Users → Add user / Create new user → กรอกอีเมลจริงและรหัสผ่านที่เจ้าของบัญชีกำหนด หากเป็นบัญชีที่ตรวจสอบแล้วให้ยืนยันอีเมลตามตัวเลือก Dashboard จากนั้นเปิด supabase/bootstrap_admin.sql เปลี่ยน CHANGE_TO_YOUR_ADMIN_EMAIL@example.com เป็นอีเมลนั้น และรันทั้งไฟล์

ตัวอย่างคำสั่งสำหรับบัญชีอีเมลที่ระบุในชุดนี้:

```sql
begin;
insert into public.pm_members(user_id,email,display_name,role,unit_id)
select id,email,'ผู้ดูแลระบบสถาบัน','admin','office'
from auth.users
where lower(email)=lower('andaman.southern2@gmail.com')
on conflict(user_id) do nothing;
select email,display_name,role,unit_id,active
from public.pm_members where role='admin';
commit;
```

คำสั่งนี้ไม่ตั้ง/แสดง/เปลี่ยนรหัสผ่าน และไม่ยกระดับสมาชิกเดิมที่เป็นบทบาทอื่นโดยอัตโนมัติ ถ้าสมาชิกมีอยู่แล้ว ให้ตรวจบทบาท/สถานะในเมนูจัดการสมาชิกหรือให้ Admin ที่มีสิทธิ์ดำเนินการตามหน้าที่

เพิ่มสมาชิกอื่นผ่านหน้า PM → จัดการสมาชิก → เพิ่มสมาชิก → ระบุอีเมล ชื่อ หน่วยงาน บทบาท และรหัสผ่านเริ่มต้น 12–128 ตัวอักษร หรือเลือกเพิ่มจากบัญชีเดิม pm-members เป็นผู้ทำงานนี้ฝั่งเซิร์ฟเวอร์

## 7. ตั้งค่า public configuration ให้ตรงกัน

ชุดนี้ตั้ง Project URL/publishable key เป็น ANDAMAN2-PM แล้ว ค่าพวกนี้เปิดเผยในหน้าเว็บได้ แต่ยังต้องมีรหัสผ่านและผ่าน RLS เมื่อต้องเข้าถึงข้อมูล

ไฟล์ dist/config.js ของระบบ PM:

```javascript
window.ANDAMAN_CONFIG = {
  supabaseUrl: 'https://trzydkkblhecwpnlzglb.supabase.co',
  supabasePublishableKey: 'sb_publishable_x0Rd2SgTVJFTHMANlcjFzg_z2AtnmXp',
  membersFunction: 'pm-members',
  loginAliases: { admin: 'andaman.southern2@gmail.com' }
};
```

ไฟล์ apps-script/Config.html ของเว็บรายงาน:

```html
<script>
window.ANDAMAN_CONFIG = {
  supabaseUrl: 'https://trzydkkblhecwpnlzglb.supabase.co',
  supabasePublishableKey: 'sb_publishable_x0Rd2SgTVJFTHMANlcjFzg_z2AtnmXp',
  syncFunction: 'report-sheet-sync',
  loginAliases: { admin: 'andaman.southern2@gmail.com' }
};
console.info('ANDAMAN_REPORT_ORIGIN=' + window.location.origin);
</script>
```

เมื่อแก้ Config.html ให้รัน npm run build:gas เพื่อสร้าง dist/report-editor/config.js, apps-script/Index.html และ Core.gs ให้สอดคล้องกัน ถ้าไม่ใช้ Node.js ต้องแก้ public config ของ report editor ให้ตรงด้วย และใช้ Index.html ที่รวมมาแล้วโดยไม่แก้ JavaScript ย่อยในนั้น

ห้ามวางรหัสผ่าน, REPORT_BRIDGE_SECRET, sb_secret_ หรือ service_role ในไฟล์ข้างต้นหรือใน GitHub ค่าเซิร์ฟเวอร์อยู่ใน Supabase Secrets และ Script properties ตามหัวข้อถัดไปเท่านั้น

## 8. ติดตั้ง/อัปเดต Edge Function pm-members

1. Supabase → โปรเจกต์ ANDAMAN2-PM → Edge Functions → เลือก pm-members ถ้ามีแล้ว หรือ Deploy a new function → Via Editor ถ้ายังไม่มี
2. ชื่อต้องเป็น pm-members ตรงกับ membersFunction ไม่ใส่นามสกุลและไม่เติมขีดท้าย
3. วาง supabase/functions/pm-members/index.ts ทั้งไฟล์ → Deploy
4. ใน Settings ของฟังก์ชัน ใช้ gateway Verify JWT = ON ตาม supabase/config.toml ของชุดนี้ ฟังก์ชันนี้เรียกจากผู้ใช้ที่ Login แล้ว โดยส่ง JWT ผู้ใช้ใน Authorization และส่ง publishable key ใน apikey
5. Secrets สำหรับ PM: เพิ่ม PM_ALLOWED_ORIGINS เป็น https://hrvec-adaman2.github.io ถ้าใช้หลายโดเมนให้คั่นด้วยจุลภาค เช่น https://hrvec-adaman2.github.io,https://andaman-project-reports-74869.muangyor.chatgpt.site
6. SUPABASE_URL, SUPABASE_ANON_KEY และ SUPABASE_SERVICE_ROLE_KEY เป็น environment มาตรฐานที่ Supabase จัดให้ โค้ดใช้ค่าพวกนี้ฝั่ง Edge Function หากใช้ secret key รุ่นใหม่แทน ให้ตั้ง PM_SUPABASE_SECRET_KEY เป็น sb_secret_... เฉพาะใน Secrets แล้วไม่ต้องนำค่านั้นใส่หน้าเว็บ
7. Login เป็น Admin แล้วลองเพิ่มสมาชิกทดสอบหนึ่งบัญชีในหน่วยงานที่ถูกต้อง ต้องแสดงใน Authentication และ pm_members และมีประวัติการดำเนินการ

เอกสาร Authorization headers ปัจจุบันของ Supabase ระบุว่า gateway รองรับ JWT ผู้ใช้แบบ legacy และ asymmetric แล้ว จึงคง Verify JWT ไว้สำหรับฟังก์ชันที่เรียกด้วย JWT ผู้ใช้ คำอธิบายรุ่นก่อนที่ให้ปิดเพียงเพราะใช้กุญแจใหม่จึงไม่ใช้เป็นค่าเริ่มต้นในชุดนี้ ภายในโค้ดยังตรวจ auth.getUser(token) และ active Admin อีกชั้นเสมอ

ไม่ใช้ publishable key เป็น Bearer token และไม่ใช้ secret key ในหน้าเว็บ การตั้งค่า origin เป็นเพียงข้อจำกัดคำขอจากเบราว์เซอร์ ไม่ใช่สิ่งทดแทนการตรวจผู้ใช้/สิทธิ์

## 9. เตรียม Google Sheets และ Drive

1. ใช้บัญชี Google ของหน่วยงานที่มีสิทธิ์ดูแลระบบต่อเนื่อง
2. สร้าง Google Sheets เช่น ANDAMAN REPORT — สำเนารายงาน ไม่ต้องพิมพ์หัวคอลัมน์เอง
3. คัดลอก Spreadsheet ID จาก URL ระหว่าง /d/ กับ /edit
4. สร้างโฟลเดอร์ Drive เช่น ANDAMAN REPORT — ภาพกิจกรรม คัดลอก Folder ID หลัง /folders/
5. ให้บัญชีที่จะ Deploy Apps Script มีสิทธิ์แก้ไขทั้งชีตและโฟลเดอร์
6. โฟลเดอร์ภาพกำหนดผู้ที่เปิดได้ตามงานจริง ผู้มีลิงก์ชีตอาจยังเปิดภาพไม่ได้จนกว่าจะได้รับสิทธิ์โฟลเดอร์

## 10. วาง Apps Script ครบ 5 ไฟล์ ตั้งค่าและ Deploy

1. เปิด Google Sheets ที่เตรียม → Extensions / ส่วนขยาย → Apps Script หรือสร้างโครงการจาก https://script.google.com
2. ไฟล์ Script ชื่อ Code: วาง apps-script/Code.gs ทั้งไฟล์แทนโค้ดตัวอย่าง
3. กด + → Script ชื่อ Core: วาง Core.gs ทั้งไฟล์
4. กด + → HTML ชื่อ Index: วาง Index.html ทั้งไฟล์ ไม่ต้องพิมพ์ .html เพิ่มในช่องชื่อ
5. กด + → HTML ชื่อ Config: วาง Config.html ทั้งไฟล์
6. Project Settings → เปิดแสดง appsscript.json แล้ววาง manifest จากชุดนี้
7. Project Settings → Script properties → Add script property ตามตารางด้านล่าง → Save

| Property | ค่า |
|---|---|
| SPREADSHEET_ID | เฉพาะ Spreadsheet ID ไม่ใช่ URL เต็ม |
| DRIVE_FOLDER_ID | เฉพาะ Folder ID ไม่ใช่ URL เต็ม |
| REPORT_BRIDGE_SECRET | สตริงสุ่มอย่างน้อย 32 ตัวอักษร ต้องตรงกับ Supabase Secret ชื่อเดียวกันทุกตัวอักษร |

สร้าง secret บนเครื่องผู้ดูแลใน VS Code Terminal:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

คัดลอกผลลัพธ์ไว้ในสองช่องลับของบริการโดยตรง ไม่ใส่ใน Code.gs, Config.html, GitHub หรือข้อความสนทนา ถ้าระบบเดิมมี secret ที่ใช้งานอยู่แล้ว ให้ใช้ค่าเดิมที่คุณเก็บไว้ ไม่สุ่มเปลี่ยนข้างเดียว

8. กด Save → กลับ Editor → เลือก setupReportSystem_ → Run → ให้สิทธิ์ Google แก่บัญชีเจ้าของตามงาน Sheets/Drive ที่ระบบใช้
9. ถ้าพบหัวตารางรุ่นเดิม ให้เจ้าของเลือก upgradeReportSheet_ → Run โค้ดจะสำรองทั้งแท็บก่อนเปลี่ยนหัวตารางและเพิ่มคอลัมน์ เป้าหมาย/ผลจริง, S.D. และข้อความสรุป ถ้าหัวตารางไม่ตรงรุ่นที่รองรับให้ใช้ชีตใหม่ ไม่แก้คอลัมน์ข้อมูลเดิมด้วยการเดา
10. สำหรับติดตั้งใหม่ Deploy → New deployment → Web app → Execute as: Me → Who has access: Anyone เพื่อให้เซิร์ฟเวอร์ Supabase เรียก endpoint ได้ → Deploy → คัดลอก URL ที่ลงท้าย /exec
11. ถ้ามี deployment เดิม ให้ Deploy → Manage deployments → เลือกตัวเดิม → Edit → Version: New version → Deploy เพื่อใช้ URL เดิมต่อ การกด Save อย่างเดียวไม่อัปเดตเว็บที่ผู้ใช้เปิด

ถ้าองค์กรไม่อนุญาตตัวเลือก Anyone ให้ผู้ดูแล Google Workspace กำหนดช่องทางที่อนุญาตก่อน ไม่ถือว่า endpoint พร้อมรับคำขอจาก Supabase จนกว่าจะทดสอบได้ การเขียนข้อมูลใน Code.gs ตรวจ HMAC และอายุคำขอทุกครั้ง ไม่มี endpoint เขียนชีตที่เชื่อข้อมูลจากหน้าเว็บโดยตรง

เปิด /exec จะเป็นหน้า ANDAMAN REPORT แบบแยกสำหรับกรอก/บันทึก/พิมพ์รายงาน หน้าโครงการและงบประมาณยังเปิดจาก GitHub Pages ตามหัวข้อ 13 อย่านำ Index.html ไปวางเป็น Code.gs และอย่ากด Run doPost ใน Editor เพื่อทดสอบ เพราะ doPost ต้องได้รับ event จากคำขอ HTTP จริง

## 11. ติดตั้ง Edge Function report-sheet-sync และตั้ง Secrets

1. Supabase → ANDAMAN2-PM → Edge Functions → สร้างชื่อ report-sheet-sync ให้ตรงทุกตัวอักษร ขณะตรวจพบฟังก์ชันเก่ามี slug report-sheet-sync- จึงต้องสร้างตัวชื่อที่ไม่มีขีดท้าย หาก Dashboard ไม่อนุญาตเปลี่ยน slug ให้สร้างชื่อถูกต้องเพิ่มเติม ไม่ต้องลบตัวเดิม
2. วาง supabase/functions/report-sheet-sync/index.ts ทั้งไฟล์ แล้ว Deploy
3. ตั้ง Verify JWT = ON เพราะผู้เรียกเป็นผู้ใช้ที่ Login แล้ว และโค้ดตรวจ auth.getUser / เจ้าของรายงานอีกครั้ง ฟังก์ชันนี้ไม่ต้องใช้ service_role key
4. Edge Functions → Secrets เพิ่มตามตาราง

| Secret | ค่า |
|---|---|
| REPORT_GAS_URL | URL Apps Script deployment ลงท้าย /exec จากหัวข้อ 10 |
| REPORT_BRIDGE_SECRET | ค่าเดียวกับ Script property ทุกตัวอักษร |
| REPORT_SUPABASE_PUBLISHABLE_KEY | sb_publishable_x0Rd2SgTVJFTHMANlcjFzg_z2AtnmXp สำหรับ ANDAMAN2-PM |
| ALLOWED_ORIGINS | https://hrvec-adaman2.github.io และ origin Apps Script จริงหากใช้ช่องทางนั้น คั่นหลายค่าด้วยจุลภาค |

หากใช้สำเนาเว็บ https://andaman-project-reports-74869.muangyor.chatgpt.site ด้วย ให้เพิ่ม origin นี้ใน ALLOWED_ORIGINS สำหรับการส่งชีต และใน PM_ALLOWED_ORIGINS สำหรับสมาชิกตามการใช้งานจริง คั่นหลาย origin ด้วยจุลภาค

ถ้าใช้โปรเจกต์อื่นให้เปลี่ยน URL และ key ของโปรเจกต์นั้นทุกจุด ใช้ REPORT_GAS_URL ไม่ใช่ GAS_URL และใช้ REPORT_BRIDGE_SECRET ไม่ใช่ BRIDGE_SECRET ของระบบ HR

ฟังก์ชันส่งได้เฉพาะรายงานที่เก็บแล้วใน andaman_project_reports ของผู้ใช้ มี version ตรงกัน ดาวน์โหลดภาพจาก andaman-report-photos แล้วลงลายเซ็นก่อนเรียก Apps Script ไม่ต้องนำ token ผู้ใช้หรือรหัสผ่านไปบันทึกใน Secrets

## 12. ตั้ง origin ให้ตรง โดยไม่ใส่ชื่อ repository

| ช่องที่ตั้ง | ตัวอย่างที่ถูกต้อง |
|---|---|
| PM_ALLOWED_ORIGINS | https://hrvec-adaman2.github.io |
| ALLOWED_ORIGINS สำหรับ Pages | https://hrvec-adaman2.github.io |
| URL เปิดเว็บจริง | https://hrvec-adaman2.github.io/Adaman2-ProjectPM/ |
| Auth → URL Configuration → Site URL ถ้าตั้งสำหรับระบบนี้ | URL เปิดเว็บจริงข้างบน |

origin มีเพียง protocol + host + port ถ้ามี จึงไม่มี /Adaman2-ProjectPM/ และไม่มี / ท้าย ค่า Site URL เป็นคนละช่อง ใช้ URL เว็บเต็มได้ การเข้าสู่ระบบด้วยรหัสผ่านของชุดนี้ไม่ได้ใช้ redirect callback

หากใช้หน้า Apps Script ให้เปิด /exec → F12 → Console → ค้นหา ANDAMAN_REPORT_ORIGIN= แล้วนำค่าหลังเครื่องหมายเท่ากับไปต่อท้าย ALLOWED_ORIGINS ด้วยจุลภาค หรือดู Network → คำขอ report-sheet-sync → Request Headers → Origin โดยคัดลอกเฉพาะค่า Origin

iframe ของ Apps Script มักมี origin เป็น https://…-script.googleusercontent.com ไม่ใช่ script.google.com ห้ามเดาค่าหรือใส่ wildcard เพราะโค้ดตรวจค่าเต็ม หลัง deploy ถ้า origin เปลี่ยนต้องอัปเดต allowlist นี้ด้วย

## 13. Build, ทดสอบ และเผยแพร่ GitHub Pages

เปิด VS Code Terminal ที่โฟลเดอร์ซึ่งมี package.json ตรวจ node --version เป็น v24 ขึ้นไป แล้วรันตามลำดับ:

```bash
npm ci
npm run build:gas
npm test
npm run build:user-guide
npm run build:handbook
```

ถ้า PowerShell แจ้ง npm.ps1 ถูกบล็อก ให้ใช้ npm.cmd แทน npm ในคำสั่งข้างบน หรือเลือก Terminal แบบ Command Prompt ไม่จำเป็นต้องเปลี่ยนนโยบายทั้งเครื่อง ชุดส่งมอบมีไฟล์ build พร้อมแล้ว ขั้นตอน build ใช้เมื่อคุณแก้ public config หรือต้นฉบับ

ใน VS Code → Source Control ตรวจไฟล์ที่จะส่ง → Stage → พิมพ์ข้อความ Commit เช่น Update Andaman PM full deployment and login → Commit → Push หรือ Sync Changes คำสั่งเทียบเท่าหลังตรวจไฟล์:

```bash
git status
git add dist apps-script supabase scripts tests docs .github README.md START_HERE.html INSTALLATION_AND_CODE.html TEST_RESULTS.md
git commit -m "Update Andaman PM full deployment and login"
git push
```

รหัสผ่านและ .env ที่มี secret ต้องไม่อยู่ในรายการที่จะ Commit ไม่ใช้ Force Push เพื่อแก้ conflict ให้รวมการแก้ไขก่อน

บน GitHub repository → Settings → Pages → Build and deployment → Source: GitHub Actions จากนั้น Actions → Deploy Andaman PM to GitHub Pages → เปิดงานล่าสุดหรือ Run workflow บน main → รอสีเขียว แล้วเปิด URL ที่งานเผยแพร่แสดง สำหรับ repository เดิมคือ https://hrvec-adaman2.github.io/Adaman2-ProjectPM/

ถ้าไม่ใช้ Git Clone ให้ Add file → Upload files อัปโหลดไฟล์/โฟลเดอร์ที่แตกแล้วให้อยู่ root ของ repository อย่าอัปโหลด ZIP เป็นตัวเว็บไซต์ ถ้า .github ไม่ติด ให้สร้างไฟล์ .github/workflows/deploy-pages.yml ผ่าน Add file → Create new file แล้วคัดลอก workflow ทั้งไฟล์จากชุดนี้

ต้องเห็น dist และ package.json อยู่ root ไม่ซ้อนโฟลเดอร์โครงการอีกชั้น Actions ของชุดนี้เผยแพร่เฉพาะ dist และรัน npm test ก่อน การเผยแพร่ Pages ไม่ได้รัน SQL หรือติดตั้ง Apps Script / Edge Function ให้เอง

## 14. สิ่งที่ต้องทดสอบก่อนใช้ข้อมูลจริง

1. เปิดเว็บไซต์ PM โดยยังไม่กรอกข้อมูล: ต้องค้างหน้า Login และไม่เห็น Dashboard แม้ URL ลงท้าย #guide
2. กรอกรหัสผ่านผิด: ต้องไม่เข้าระบบ กรอก admin และรหัสผ่านจริงของ andaman.southern2@gmail.com: ต้องเข้าสู่ Dashboard ตามสิทธิ์ Admin
3. บันทึกงานแล้วรีเฟรช PM: ต้องกลับหน้า Login การแก้ครั้งนี้ตั้งใจให้กรอกรหัสผ่านใหม่เมื่อเปิด/รีเฟรชหน้า PM ขณะที่เปิดหน้าเดิมอยู่ยังต่ออายุ token ตามปกติ
4. Admin เพิ่มสมาชิกทดสอบบทบาทเจ้าหน้าที่และผู้บริหารในหน่วยงานที่ถูกต้อง จากนั้นเข้าด้วยเบราว์เซอร์/โปรไฟล์แยก ตรวจเมนูและขอบเขตข้อมูล
5. Admin บันทึกแหล่งงบประมาณ/ปีงบประมาณ เจ้าหน้าที่เสนอโครงการ ผู้มีสิทธิ์อนุมัติพิจารณา แล้วตรวจว่าโครงการถูกสร้างและงบไม่ถูกจัดสรรเกินวงเงิน
6. จัดสรรงบให้โครงการ → ส่งคำขอเบิก → ผู้มีสิทธิ์อนุมัติ → ผู้มีหน้าที่บันทึกจ่ายจริง ต้องแยกสถานะรออนุมัติ/อนุมัติ/จ่ายจริง และตรวจยอด Dashboard
7. เปิดติดตามรายงานโครงการ → จัดทำรายงาน → กรอกเป้าหมาย/ผลจริงทั้ง 3 ตาราง แนบภาพ → บันทึกเข้าโครงการ → ตรวจ pm_reports และ andaman-pm-files
8. ส่งรายงานเพื่อตรวจรับ → ผู้มีสิทธิ์ตรวจรับ/ส่งกลับแก้ไข ตรวจสถานะและประวัติ เจ้าหน้าที่ต้องไม่อนุมัติงานตนเองแทนผู้มีอำนาจ
9. ทดสอบรายงานแบบแยกตามหัวข้อ 15: บันทึกออนไลน์ → เปิดอีกเบราว์เซอร์ด้วยบัญชีเดิม → ดึงรายงานและภาพ → ส่งสำเนาไปชีต → เปิดชีตและภาพใน Drive
10. ส่งรายงาน ID/เวอร์ชันเดิมซ้ำ ต้องไม่เพิ่มแถวชีตซ้ำ แก้รายงานและบันทึกเวอร์ชันใหม่แล้วส่งอีกครั้ง ต้องปรับแถวเดิม
11. ทดสอบด้วยบัญชีอีกคนว่ามองไม่เห็นรายงานแบบแยกและรูปของคนแรก ตรวจ Supabase Security Advisors และแก้รายการที่เกี่ยวข้องก่อนเปิดใช้ทางการ
12. เปิดตัวอย่างรายงาน → พิมพ์ A4, Scale 100%, ปิด Headers and footers ของเบราว์เซอร์ ตรวจหน้า Memo, สารบัญ, เลขหน้าบนขวา 16 pt, เป้าหมาย และค่าเฉลี่ย/S.D.

คำว่า Admin เป็นบทบาทระบบและชื่อย่อ Login คนละส่วนกัน และการสร้าง Auth user อย่างเดียวไม่ได้ทำให้เป็นสมาชิก PM ต้องมี pm_members ที่ active ตามบทบาทด้วย

## 15. รายงานสองรูปแบบ — เลือกบันทึกให้ถูกที่

| ช่องทาง | แหล่งข้อมูลจริง | การบันทึก / การส่งชีต |
|---|---|---|
| รายงานและการติดตาม → ติดตามรายงานโครงการ → จัดทำรายงาน | pm_reports.payload, andaman-pm-files | บันทึกเข้าโครงการ / ส่งรายงานเพื่อตรวจรับ ผ่านสิทธิ์ PM |
| รายงานและการติดตาม → Andaman Report v2.0 หรือหน้า Apps Script /exec | ร่างในเบราว์เซอร์; เมื่อบันทึกออนไลน์ใช้ andaman_project_reports และ andaman-report-photos | เข้าบัญชีของโมดูลรายงาน → บันทึกออนไลน์ → ตัวอย่างรายงาน → ส่งสำเนาไป Google Sheets |

ปุ่มส่งชีตอยู่ในรายงานแบบแยก ส่วนรายงานที่ฝังเพื่อผูกโครงการใช้ปุ่ม PM และซ่อนปุ่มส่งชีต ไม่มีการซิงก์ระหว่าง pm_reports กับ andaman_project_reports อัตโนมัติในรุ่นนี้ การเข้าสู่ PM ไม่ได้ส่ง token ของ PM ไป Login รายงานแบบแยกให้เอง

หากต้องนำรายงานจากโครงการไปส่งชีต:

1. เปิดรายงานที่ผูกโครงการใน PM → ส่งออก JSON
2. เปิดแท็บ Andaman Report v2.0 หรือหน้า Apps Script → นำเข้า JSON รายงานนั้น
3. ตรวจข้อมูลและภาพ การนำเข้าเป็นสำเนาใหม่ มี ID ใหม่ ไม่เขียนทับรายงาน PM เดิม
4. กดบัญชีผู้ใช้ของโมดูลรายงาน → Login ด้วยอีเมลหรือ admin และรหัสผ่านจริง → บันทึกออนไลน์
5. เปิดตัวอย่างรายงาน → ส่งสำเนาไป Google Sheets
6. ตรวจชื่อโครงการ เป้าหมาย/ผลจริง ค่าเฉลี่ย S.D. ข้อความสรุป และลิงก์ภาพในชีต/Drive การส่งสำเนาไม่ใช่การอนุมัติงบประมาณ

รายงานที่เก็บออนไลน์แล้วเปิดอีกเครื่องได้ด้วยบัญชีเดิมผ่านรายการรายงานออนไลน์ ร่างที่ยังเก็บเฉพาะเบราว์เซอร์ต้องย้ายด้วย JSON หรือบันทึกออนไลน์ก่อน

## 16. คู่มือกรอกข้อมูลแต่ละเมนู

เปิด START_HERE.html → คู่มือการกรอกข้อมูล หรือในระบบ PM → คู่มือการกรอกข้อมูล จะมีรายละเอียดช่องกรอกทุกเมนู ได้แก่ ภาพรวม เสนอโครงการ โครงการ/กิจกรรม แหล่งงบประมาณ จัดสรรงบ คำขอเบิก บันทึกจ่ายจริง งบส่วนกลาง รายงาน แบบฟอร์ม ไฟล์ขออนุญาต หน่วยงาน สมาชิก สิทธิ์เมนู และประวัติ

การแจ้งเตือนของรุ่นนี้อยู่ภายใน Dashboard/ปุ่มกระดิ่ง เช่น ข้อเสนอรออนุมัติ เบิกรออนุมัติ และรายงานรอตรวจ ไม่ได้ตั้งการส่ง LINE หรืออีเมลอัตโนมัติในชุดนี้ สิทธิ์ทางฐานข้อมูลและงานอนุมัติยังต้องตรงกับการมอบหมายของหน่วยงาน

## 17. แก้ปัญหาที่พบบ่อย

หากเป็น GitHub Actions รอบ #18 ที่พบ 7 !== 6 ให้ใช้แพตช์สองไฟล์ตาม FIX_GITHUB_ACTIONS_TH.md ซึ่งรองรับไฟล์ทดสอบรุ่นเดิมที่ค้างอยู่ใน repository และยังคงตรวจครบก่อนเผยแพร่


| อาการ | จุดตรวจและวิธีแก้ |
|---|---|
| เปิด PM แล้วเข้าระบบเอง | dist/app.js ต้องมี LOGIN-FIX-20261026-1; ตรวจ Commit/Actions แล้วกด Ctrl + Shift + R; ไม่ล้างข้อมูลเว็บไซต์ทั้งหมดเพราะมีร่างรายงาน |
| ใช้ admin ไม่ได้ | config จับคู่กับอีเมลที่มีอยู่จริง ใช้รหัสผ่านของอีเมลนั้น ไม่ใช่ใช้คำว่า admin เป็นรหัสผ่าน |
| Login ผ่าน Auth แต่เข้า PM ไม่ได้ | ตรวจ pm_members.user_id, role และ active ให้ตรงผู้ใช้และโปรเจกต์ |
| Error 401 จาก Edge Function | Login ก่อนเรียก ตรวจว่ามี Authorization เป็น JWT ผู้ใช้ ไม่ใช่ publishable key แล้วเปิด Logs ตรวจต้นเหตุ; อย่าปิด Verify JWT โดยอัตโนมัติ |
| Function not found | ชื่อ slug ต้อง report-sheet-sync ไม่มีขีดท้าย และ config ใช้โปรเจกต์เดียวกับที่ Deploy |
| Origin not allowed / CORS | ใส่ origin จริงใน PM_ALLOWED_ORIGINS หรือ ALLOWED_ORIGINS ให้ถูกช่อง ไม่มี path หรือ / ท้าย |
| Server configuration incomplete | ตรวจชื่อ Secrets / Script properties ให้ตรงตารางและ secret อย่างน้อย 32 ตัวอักษร |
| Apps Script returned non-JSON | URL /exec ถูก deployment ใช้ Execute as Me และสิทธิ์ให้เซิร์ฟเวอร์เรียกได้ ไม่มีหน้าล็อกอิน Google มาคั่น |
| ลายเซ็นคำขอไม่ถูกต้อง | REPORT_BRIDGE_SECRET ใน Supabase และ Script properties ต้องตรงทุกตัวอักษร |
| No HTML file named Index / Config | สร้างไฟล์ HTML ชื่อถูกต้อง วางครบ และ Deploy New version |
| AndamanReportCore is not defined | ยังไม่ได้สร้าง/วาง Core.gs หรือใช้ deployment รุ่นเก่า |
| โหลด Supabase SDK ไม่สำเร็จ | ใช้ Index.html ฉบับในชุดที่มี window.supabase และ sdk-loader แล้ว Deploy New version ไม่ใช่ Save อย่างเดียว |
| หัวตารางเก่า 43 คอลัมน์ | ให้เจ้าของรัน upgradeReportSheet_ เพื่อสำรองก่อนอัปเกรดเป็น 47 คอลัมน์; หัวตารางอื่นใช้ชีตใหม่ |
| ส่งชีตแล้วรูปเปิดไม่ได้ | ตรวจสิทธิ์โฟลเดอร์ Drive และบัญชีผู้เปิดภาพ ไม่เปิดภาพสาธารณะอัตโนมัติ |
| Push แล้วเว็บไม่เปลี่ยน | Actions ของ Commit นั้นสำเร็จหรือไม่, Pages ใช้ GitHub Actions หรือไม่, dist อยู่ root หรือไม่ แล้ว Ctrl + Shift + R |
| npm.ps1 ถูกบล็อก | ใช้ npm.cmd หรือ Command Prompt ใน VS Code |

## 18. เมื่อแก้โค้ด ต้องอัปเดตบริการใด

| เปลี่ยนอะไร | สิ่งที่ต้องทำต่อ |
|---|---|
| dist/app.js / CSS / หน้า PM | Commit + Push → รอ GitHub Pages Actions สำเร็จ |
| apps-script/Config.html หรือ source ของรายงาน | npm run build:gas → อัปเดต dist บน GitHub และวางไฟล์ที่ build ใน Apps Script → New version → Deploy |
| apps-script/Code.gs / Core.gs / Index.html | วางไฟล์ใน Apps Script → New version → Deploy; อัปเกรดชีตเฉพาะเมื่อระบบระบุ |
| supabase/functions/.../index.ts | Deploy ฟังก์ชันนั้นใน Supabase โดยคงชื่อให้ตรง config |
| Secrets / Script properties | เปลี่ยนในบริการนั้น ไม่ใส่ค่าลับใน GitHub; ทดสอบเส้นทางที่เกี่ยวข้อง |
| SQL | ตรวจความต่างและผลกระทบก่อนใช้ ไม่รันไฟล์ตั้งต้นซ้ำทุกครั้งที่แก้หน้าเว็บ |

GitHub Actions ของชุดนี้ไม่ Deploy SQL, Edge Functions หรือ Apps Script อัตโนมัติ การอัปเดตแต่ละบริการต้องทำตามตารางนี้

## 19. ขอบเขตการตรวจและข้อจำกัดที่เกี่ยวกับงาน

ชุดรวมนี้ผ่าน npm test 61 รายการ รวม PostgreSQL จำลองตรวจสิทธิ์/วงเงิน การ Login ไม่คืน session อัตโนมัติ การคำนวณค่าเฉลี่ย/S.D. เป้าหมาย/ผลจริง SDK loader และตัวจำลอง Supabase → HMAC → Apps Script ไม่ได้หมายความว่า Google deployment ของคุณผ่านทดสอบจริงแล้ว

ตรวจ Supabase จริงแบบอ่านอย่างเดียวตามหัวข้อ 1; ไม่แก้ฐานข้อมูล บัญชี รหัสผ่านหรือ Secrets จริงในการจัดชุดนี้ และไม่ได้ Push เข้า GitHub ของคุณโดยตรง คุณต้องนำชุดไป Commit/Push และ Deploy บริการที่ระบุ แล้วทดสอบบัญชีจริงตามหัวข้อ 14

ภาพไม่เกิน 20 ภาพต่อรายงาน ภาพละไม่เกิน 1.5 MB และภาพกิจกรรมรวมส่งสำเนาไม่เกิน 9 MB เซลล์ชีตเก็บข้อความไม่เกิน 49,000 ตัวอักษร ร่างในเครื่องไม่ย้ายข้ามโดเมนโดยอัตโนมัติ ให้บันทึกออนไลน์หรือส่งออก JSON ก่อนย้ายเครื่อง

S.D. เป็นส่วนเบี่ยงเบนมาตรฐานของตัวอย่างจากความถี่คำตอบที่กรอก ภาพรวมรวมคำตอบทุกข้อ ไม่ใช่ S.D. ของคะแนนเฉลี่ยรายบุคคล เพราะไม่มีคำตอบรายคน ข้อไม่มีคำตอบใช้เครื่องหมาย — และไม่สร้างผลขึ้นเอง

## 20. เอกสารทางการประกอบ

- Supabase API keys: https://supabase.com/docs/guides/getting-started/api-keys
- Supabase Authorization headers / Verify JWT: https://supabase.com/docs/guides/functions/auth-headers
- Supabase Edge Function Dashboard: https://supabase.com/docs/guides/functions/quickstart-dashboard
- Supabase Secrets: https://supabase.com/docs/guides/functions/secrets
- Apps Script Web Apps: https://developers.google.com/apps-script/guides/web
- Apps Script deployments: https://developers.google.com/apps-script/concepts/deployments
- GitHub Pages custom workflows: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
