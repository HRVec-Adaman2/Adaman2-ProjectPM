# ANDAMAN REPORT — ชุดโค้ด Google Apps Script

รุ่นส่งมอบ 26 ตุลาคม 2569 · โค้ดหน้าบ้าน หลังบ้าน และตัวเชื่อม Supabase ครบชุด

ชุดนี้เป็นโมดูลจัดทำรายงาน Andaman Report สำหรับสถาบันการอาชีวศึกษาภาคใต้ 2 โดยใช้ Google Apps Script เปิดหน้าเว็บและรับสำเนารายงาน ใช้ Supabase สำหรับบัญชีผู้ใช้ ฐานข้อมูลรายงาน และภาพออนไลน์ และใช้ Google Sheets/Drive เก็บสำเนา

**ขอบเขต:** ระบบอนุมัติโครงการ จัดสรรงบ เบิกจ่าย สมาชิก และสิทธิ์ Admin/ผู้บริหาร/เจ้าหน้าที่ ยังคงอยู่ในระบบ ProjectPM เดิม ชุดนี้ไม่ได้ย้ายระบบอนุมัติเหล่านั้นมาใช้ Apps Script และไม่ได้เชื่อมข้อมูล `pm_reports` เข้าตารางรายงานแบบแยกโดยอัตโนมัติ

**สถานะการส่งมอบ:** จัดทำและทดสอบโค้ดในสภาพแวดล้อมจำลองแล้ว ยังไม่ได้ติดตั้ง Apps Script, สร้างชีต หรือรัน SQL ในบัญชีจริงของคุณ ตรวจแบบอ่านอย่างเดียวเมื่อ 26 ตุลาคม 2569 พบว่า ANDAMAN2-PM ยังไม่มีตาราง `andaman_project_reports` และ bucket `andaman-report-photos` จึงต้องทำขั้นตอน Supabase ด้านล่างก่อนบันทึกออนไลน์จากเว็บ Apps Script

## 1. สิ่งที่ปรับให้ตรงกับคำขอ

- หัวข้อ 5.1 เชิงปริมาณ และ 5.2 เชิงคุณภาพ มีตารางสองคอลัมน์ “ที่กำหนดไว้ในโครงการ” และ “ที่ดำเนินได้จริง” เริ่มต้นอย่างละ 2 แถว เพิ่ม/ลบได้
- หัวข้อ 6 “ตัวชี้วัดความสำเร็จของโครงการ” ใช้ตารางรูปแบบเดียวกัน เก็บค่าตัวชี้วัด ค่าเป้าหมาย ผลจริง และสถานะเดิมครบ
- เป้าหมายจากรายงานเก่าถูกเก็บในฝั่งที่กำหนดไว้ ไม่สร้างผลจริงขึ้นเอง
- หัวข้อ 7 แสดงค่าเฉลี่ย x̄ และ S.D. ในตารางรายงาน ไม่มีคอลัมน์คะแนน 5/4/3/2/1 ในหน้ารายงาน และมีข้อความสรุปภาพรวม ตามด้วยข้อสูงสุด แล้วข้อที่ต่ำสุด
- ช่องกรอกผลประเมินยังรับจำนวนคำตอบ 5–1 เพื่อใช้คำนวณ ส่วนรายงานพิมพ์ไม่แสดงความถี่เหล่านั้น
- คงรูปแบบหน้าปก โลโก้เหนือชื่อรายงาน สารบัญแบบไม่มีตาราง บันทึกข้อความ ระยะ “ส่วนราชการ–ที่–เรื่อง” เท่ากัน หัวข้อ 6/7 ขนาดเดียวกันและชิดซ้าย เลขหน้าบนขวา 16 pt และระยะบรรทัดตามฉบับที่แก้แล้ว
- เมนูคู่มืออธิบายการกรอกข้อมูล ไม่เพิ่มเมนูตั้งค่าการเชื่อมต่อ คู่มือติดตั้งสำหรับผู้ดูแลแยกอยู่ในไฟล์นี้
- หลังบ้านคำนวณค่าเฉลี่ยและ S.D. จากข้อมูลคำตอบอีกครั้งก่อนลงชีต มีคอลัมน์เป้าหมาย/ผลจริงแบบ JSON และข้อความสรุปผล
- ส่งรายงาน ID เดิม เวอร์ชันใหม่ จะปรับแถวเดิม การส่งซ้ำเวอร์ชันเดิมไม่เพิ่มแถวซ้ำ
- คำสั่งอัปเกรดชีตจะสำรองทั้งแท็บก่อนเปลี่ยนหัวคอลัมน์และเพิ่มคอลัมน์

## 2. ไฟล์ใช้กับโปรแกรมใด

| ไฟล์ใน ZIP | เปิด/วางในโปรแกรม | หน้าที่ |
| --- | --- | --- |
| `apps-script/Index.html` | Google Apps Script → HTML ชื่อ Index | หน้าบ้านครบทั้ง HTML/CSS/JavaScript รูปแบบรายงานและคู่มือ |
| `apps-script/Config.html` | Google Apps Script → HTML ชื่อ Config | Project URL, publishable key, ชื่อฟังก์ชัน และชื่อย่อ admin |
| `apps-script/Code.gs` | Google Apps Script → Script ชื่อ Code | เปิดเว็บ รับข้อมูลที่ลงลายเซ็นแล้ว อัปเกรดชีต และเก็บข้อมูล/ภาพ |
| `apps-script/Core.gs` | Google Apps Script → Script ชื่อ Core | คำนวณค่าเฉลี่ย/S.D. และจัดข้อมูลเป้าหมายให้ตรงกับหน้าบ้าน |
| `apps-script/appsscript.json` | Google Apps Script → manifest | ตั้งเขตเวลา V8 และสิทธิ์ Sheets/Drive |
| `supabase/setup_report.sql` | Supabase → SQL Editor | ตารางรายงาน แยกสิทธิ์ตามเจ้าของ และ bucket ภาพส่วนตัว |
| `supabase/functions/report-sheet-sync/index.ts` | Supabase → Edge Functions | ตรวจผู้ใช้/เจ้าของรายงานและลงลายเซ็นส่งไป Apps Script |
| `supabase/config.toml` | VS Code / Supabase CLI | ตัวอย่างตั้ง Verify JWT เฉพาะ report-sheet-sync |
| `source/report-editor/` | Visual Studio Code | ต้นฉบับหน้าบ้านแบบแยกไฟล์สำหรับแก้ไขระยะยาว |
| `scripts/build.cjs` | Node.js ผ่าน Terminal | รวมต้นฉบับเป็น Index.html และ Core.gs ใหม่ |
| `START_HERE.html` | Chrome / Edge | คู่มือติดตั้งพร้อมหน้าดูและคัดลอกโค้ดครบไฟล์ |
| `tests/` | Node.js 24 ขึ้นไป | ชุดทดสอบอัตโนมัติ ใช้เมื่อแก้โค้ด |

ถ้าคัดลอกผ่าน Apps Script Editor ไม่ต้องติดตั้ง Node.js, Git หรือ clasp และไม่ต้องสร้างไฟล์ JavaScript ย่อยใน Apps Script เพราะ Index.html รวมไว้แล้ว

## 3. เตรียม Google Sheets และ Drive

1. ลงชื่อเข้า Google ด้วยบัญชีเจ้าของระบบที่หน่วยงานจะใช้ต่อเนื่อง
2. สร้าง Google Sheets ใหม่ ชื่อเช่น **Andaman Report — สำเนารายงาน** ไม่จำเป็นต้องพิมพ์หัวตารางเอง
3. คัดลอก Spreadsheet ID จาก URL เช่น `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit` เอาเฉพาะข้อความระหว่าง `/d/` กับ `/edit`
4. สร้างโฟลเดอร์ใน Google Drive ชื่อเช่น **Andaman Report — ภาพกิจกรรม**
5. คัดลอก Folder ID จาก `https://drive.google.com/drive/folders/DRIVE_FOLDER_ID` เอาเฉพาะ ID หลัง `/folders/`
6. บัญชีที่จะ Deploy Apps Script ต้องมีสิทธิ์แก้ไขชีตและโฟลเดอร์ทั้งสอง เก็บโฟลเดอร์แบบจำกัดสิทธิ์ แล้วแชร์กับผู้รับผิดชอบที่ต้องดูภาพจริงเท่านั้น

ไฟล์ภาพใช้สิทธิ์ที่สืบทอดจากโฟลเดอร์ ไม่เปิดสาธารณะอัตโนมัติ คนที่มีเพียงลิงก์ชีตจึงอาจยังดูภาพไม่ได้จนกว่าเจ้าของจะแชร์โฟลเดอร์ให้

## 4. สร้างโปรเจกต์ Google Apps Script และวางโค้ด

1. เปิด https://script.google.com แล้วกด **New project / โปรเจกต์ใหม่**
2. ตั้งชื่อ **ANDAMAN REPORT — Apps Script**
3. เปิด Code.gs ที่มีอยู่ ลบโค้ดตัวอย่าง แล้วคัดลอกเนื้อหา `apps-script/Code.gs` ทั้งไฟล์มาวาง
4. กด **+ → Script** ตั้งชื่อ **Core** แล้ววางเนื้อหา Core.gs ทั้งไฟล์
5. กด **+ → HTML** ตั้งชื่อ **Index** แล้ววางเนื้อหา Index.html ทั้งไฟล์
6. กด **+ → HTML** ตั้งชื่อ **Config** แล้ววางเนื้อหา Config.html ทั้งไฟล์
7. เปิด **Project Settings / การตั้งค่าโปรเจกต์** แล้วเปิดตัวเลือกแสดงไฟล์ **appsscript.json** ในตัวแก้ไข
8. กลับ Editor เปิด appsscript.json แล้ววาง manifest จาก ZIP ทั้งไฟล์
9. กด Save

ชื่อไฟล์ต้องตรงตัวพิมพ์ใหญ่เล็ก: `Code.gs`, `Core.gs`, `Index.html`, `Config.html`, `appsscript.json` ชื่อที่กรอกในหน้าสร้างไฟล์ไม่ต้องเติมนามสกุลซ้ำ และต้องมี Core.gs ด้วยจึงจะส่งรายงานลงชีตได้

## 5. ตรวจ Config.html และการใช้ชื่อ admin

Config.html เตรียมค่าสาธารณะของโปรเจกต์ ANDAMAN2-PM ไว้แล้ว:

```javascript
window.ANDAMAN_CONFIG = {
  supabaseUrl: 'https://trzydkkblhecwpnlzglb.supabase.co',
  supabasePublishableKey: 'sb_publishable_x0Rd2SgTVJFTHMANlcjFzg_z2AtnmXp',
  syncFunction: 'report-sheet-sync',
  loginAliases: { admin: 'andaman.southern2@gmail.com' }
};
```

- ถ้าใช้โปรเจกต์เดิมและกุญแจยังใช้งานอยู่ ไม่ต้องเปลี่ยนสองค่าแรก
- ถ้าเปลี่ยนโปรเจกต์ ให้คัดลอก Project URL และ **publishable key** ของโปรเจกต์นั้นจาก Dashboard มาแทน
- พิมพ์ `admin` ในหน้าเข้าสู่ระบบได้ ระบบจะแปลงเป็นอีเมล `andaman.southern2@gmail.com` แล้วตรวจรหัสผ่านกับ Supabase Auth ตามปกติ
- ใช้รหัสผ่านเดิมของบัญชีจริง ไม่ได้กำหนดรหัสผ่านเริ่มต้น และโค้ดไม่ได้เปลี่ยนรหัสผ่าน
- ถ้าจะใช้บัญชีอื่น ให้เปลี่ยนอีเมลหลัง `admin:` เป็นบัญชีที่มีอยู่จริงใน Authentication → Users
- `admin` เป็นชื่อย่อสำหรับเข้าสู่ระบบ ไม่ใช่การเพิ่มสิทธิ์ Admin ผู้ใช้รายงานแบบแยกนี้ยังอ่าน/บันทึกได้เฉพาะรายงานของตนตาม RLS ส่วนสิทธิ์ใน ProjectPM ยังคงอิงสมาชิกของระบบเดิม
- ห้ามใส่ `service_role`, `sb_secret_...`, รหัสผ่าน หรือ `REPORT_BRIDGE_SECRET` ลง Config.html หรือ Index.html

## 6. ตั้ง Script properties ของ Apps Script

เปิด **Project Settings → Script properties → Add script property** แล้วเพิ่ม 3 รายการ:

| Property | Value |
| --- | --- |
| `SPREADSHEET_ID` | ID ของ Google Sheets จากขั้นตอน 3 |
| `DRIVE_FOLDER_ID` | ID ของโฟลเดอร์ภาพจากขั้นตอน 3 |
| `REPORT_BRIDGE_SECRET` | ค่าสุ่มลับอย่างน้อย 32 ตัวอักษร เก็บไว้ใช้ค่าเดียวกันใน Supabase |

สร้าง REPORT_BRIDGE_SECRET ด้วยตัวสร้างรหัสผ่านของคุณ หรือถ้ามี Node.js เปิด Terminal ใน VS Code แล้วรัน:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

คัดลอกผลลัพธ์ 64 ตัวอักษรไปไว้ใน Script properties และ Supabase Secrets เท่านั้น ไม่ Commit ค่านี้เข้า GitHub ไม่ใช้ publishable key หรือรหัสผ่านของผู้ใช้แทน secret

สำหรับโปรเจกต์เดิม ให้รักษาค่า secret เดิมที่ตรงกับ Supabase ไว้ ไม่ต้องสร้างใหม่เพียงเพราะอัปเดตโค้ด

## 7. สร้าง/อัปเกรดหัวตารางและอนุญาตสิทธิ์ Google

กรณีชีตใหม่:

1. กลับหน้า Editor เลือกฟังก์ชัน **setupReportSystem_** จากรายการด้านบน
2. กด **Run / เรียกใช้**
3. เลือกบัญชีเจ้าของ ตรวจคำขออนุญาตเข้าถึง Sheets/Drive ของสคริปต์ที่คุณสร้าง แล้วดำเนินการอนุญาตตามนโยบายหน่วยงาน
4. เมื่อสำเร็จ เปิด Sheets จะพบแท็บ **รายงานผลโครงการ v2** มีหัวตาราง 47 คอลัมน์

กรณีมีชีตรุ่นเดิม 43 คอลัมน์:

1. วาง Code.gs/Core.gs รุ่นใหม่นี้ก่อน
2. รัน **upgradeReportSheet_**
3. ระบบคัดลอกแท็บเดิมเป็นชื่อ **สำรองก่อนอัปเกรด-วันเวลา-รหัส** แล้วเปลี่ยนชื่อคอลัมน์ค่าเฉลี่ยและเพิ่มคอลัมน์ท้ายตาราง
4. ข้อมูลรายงานเดิมยังอยู่ แถวเก่ายังไม่มีข้อมูลในคอลัมน์ใหม่จนกว่าจะเปิดรายงานแล้วส่งสำเนาอีกครั้ง
5. รันซ้ำได้โดยไม่ทำสำเนาซ้ำเมื่อหัวตารางเป็นรุ่นปัจจุบันแล้ว

ระบบจะหยุดถ้าหัวตารางไม่ตรงรุ่นที่รู้จักหรือมีคอลัมน์เพิ่มเติมในชีตเก่า ไม่ควรลบหรือย้ายคอลัมน์เพื่อฝืนให้อัปเกรดผ่าน ให้ใช้ชีตใหม่ หรือปรับแผนย้ายข้อมูลเฉพาะชีตนั้นก่อน

## 8. Deploy เป็น Web app

1. กด **Deploy → New deployment**
2. เลือกชนิด **Web app**
3. Description ใส่เช่น **Andaman Report ตารางเป้าหมายและ S.D. 2026-10-26**
4. **Execute as:** เลือก **Me / ฉัน** คือบัญชีเจ้าของที่มีสิทธิ์ในชีตและ Drive
5. **Who has access:** เลือก **Anyone / ทุกคน** เพื่อให้ Edge Function เรียก doPost ได้โดยไม่ต้องผ่านหน้า Google sign-in
6. กด Deploy และคัดลอก **Web app URL ที่ลงท้าย /exec**
7. เปิด URL นี้เพื่อตรวจว่าหน้า Andaman Report แสดงขึ้นได้

Anyone เปิดให้เข้าถึงหน้าเว็บและ endpoint แต่การบันทึกชีตยังต้องมีลายเซ็นที่หลังบ้านตรวจรับเท่านั้น ส่วนรายงานออนไลน์ยังต้องเข้าสู่ระบบ Supabase หากนโยบาย Google Workspace ไม่อนุญาต Anyone การเชื่อมแบบนี้จะยังทำงานไม่ได้ ต้องให้ผู้ดูแล Google Workspace พิจารณาวิธีติดตั้งที่หน่วยงานอนุญาต

อย่าใช้ URL `/dev` เป็น REPORT_GAS_URL และอย่าเลือกบัญชีผู้เข้าชมเป็นผู้รัน เพราะ Edge Function ไม่มีเซสชัน Google ของผู้ใช้

## 9. ติดตั้งตารางรายงานใน Supabase

1. เปิดโปรเจกต์ **ANDAMAN2-PM** อ้างอิง `trzydkkblhecwpnlzglb`
2. เปิด **SQL Editor → New query**
3. เปิดไฟล์ `supabase/setup_report.sql` ใน VS Code หรือหน้าโค้ดใน START_HERE.html
4. คัดลอกทั้งไฟล์วางใน SQL Editor ตรวจว่าเป็นโปรเจกต์ที่ต้องการ แล้วกด Run
5. ตรวจผลท้ายไฟล์ว่าตาราง `andaman_project_reports` เปิด RLS และมี policy select/insert/update ตามเจ้าของ
6. เปิด Storage ตรวจ bucket **andaman-report-photos** ต้องเป็น private

ไฟล์นี้ใช้ตาราง/schema/bucket ของ Andaman Report แบบแยก ไม่ใช่ `pm_setup.sql` และไม่แก้ตาราง `pm_*` หรือ bucket `andaman-pm-files` ไม่ต้องรัน bootstrap_admin.sql ซ้ำเพื่อใช้รายงานแบบแยก

บัญชีใน Authentication → Users ใช้บัญชีที่มีอยู่แล้วได้ หากสร้างบัญชีเพิ่มต้องกำหนดรหัสผ่าน/ยืนยันบัญชีตามขั้นตอนของ Supabase ก่อนเข้าสู่ระบบ

## 10. สร้าง Edge Function และตั้ง Secrets

1. เปิด **Supabase → Edge Functions**
2. เลือกสร้างฟังก์ชันใหม่ผ่าน Editor ตั้งชื่อ **report-sheet-sync** ให้ตรงทุกตัวอักษร
3. วางเนื้อหา `supabase/functions/report-sheet-sync/index.ts` ทั้งไฟล์ใน index.ts
4. สำหรับชุดนี้ให้ **Verify JWT = true / เปิด** เพราะผู้ใช้เรียกด้วย access token หลังเข้าสู่ระบบ และโค้ดยังเรียก `auth.getUser(token)` ตรวจอีกครั้ง
5. กด Deploy แล้วตั้ง Secrets ตามตาราง

| Secret ใน Supabase | ค่า |
| --- | --- |
| `REPORT_GAS_URL` | URL Web app จากขั้นตอน 8 ลงท้าย `/exec` |
| `REPORT_BRIDGE_SECRET` | ค่าเดียวกับ Apps Script ทุกตัวอักษร |
| `REPORT_SUPABASE_PUBLISHABLE_KEY` | publishable key ของ ANDAMAN2-PM เดียวกับ Config.html |
| `ALLOWED_ORIGINS` | origin จริงของหน้ารายงาน ดูขั้นตอนถัดไป |

Supabase จัด `SUPABASE_URL` ให้เอง ฟังก์ชันนี้ไม่ใช้ service_role key และไม่ต้องตั้ง PM_SUPABASE_SECRET_KEY ส่วน `PM_ALLOWED_ORIGINS` ใช้กับ pm-members คนละฟังก์ชันกับ `ALLOWED_ORIGINS` ในชุดนี้

เอกสาร Supabase ปัจจุบันระบุว่า gateway ตรวจ JWT ได้ทั้งแบบเดิมและ asymmetric signing keys แล้ว จึงไม่จำเป็นต้องปิด Verify JWT เพียงเพราะใช้กุญแจแบบใหม่ การตั้ง true ในชุดนี้ไม่ใช่คำสั่งให้เปลี่ยนฟังก์ชัน pm-members เดิม

## 11. หา origin ให้ถูกต้องสำหรับ ALLOWED_ORIGINS

Apps Script แสดงหน้าบ้านใน iframe จึงอย่าคัดลอก URL `/exec` ทั้งเส้น หรือใส่แค่ `https://script.google.com` โดยเดา

1. เปิดเว็บ `/exec` จากขั้นตอน 8 ด้วย Chrome หรือ Edge บนคอมพิวเตอร์
2. กด F12 เปิด **Console**
3. รีเฟรชหน้าเว็บ แล้วค้นข้อความ **ANDAMAN_REPORT_ORIGIN=** ที่โค้ดแสดงไว้
4. คัดลอกเฉพาะค่าหลังเครื่องหมาย `=` เช่น `https://รหัสจริงของหน้า-script.googleusercontent.com` (ตัวอย่างนี้ไม่ใช่ค่าที่ให้คัดลอก)
5. นำ origin จริงไปวางใน Supabase → Edge Functions → Secrets → **ALLOWED_ORIGINS**
6. ห้ามใส่ path, query string หรือ `/` ท้าย origin
7. ถ้าใช้มากกว่าหนึ่ง origin ให้คั่นด้วยจุลภาค เช่น `https://ORIGIN-จริง.script.googleusercontent.com,https://hrvec-adaman2.github.io` โดยใช้ hostname จริงของแต่ละหน้า
8. ถ้าสร้าง deployment ใหม่หรือเปลี่ยน URL ให้ตรวจ origin ใหม่ หากเปลี่ยนต้องปรับรายการนี้

Config.html แสดงเฉพาะ origin เพื่อช่วยติดตั้ง ไม่แสดง token, password หรือ secret

## 12. ทดสอบใช้งานจริงให้ครบวงจร

ใช้ข้อมูลสมมติที่ระบุว่า “ทดสอบ” ก่อนหนึ่งรายงาน หรือใช้เมนูนำเข้า JSON แล้วเลือก `examples/report-demo.json` ซึ่งระบุชัดว่าเป็นข้อมูลสมมติ:

1. เปิด URL Apps Script `/exec` แล้วเข้าสู่ระบบด้วย `admin` หรืออีเมล พร้อมรหัสผ่านจริงของบัญชี
2. กดสร้างรายงานใหม่ กรอกชื่อโครงการ ปีงบประมาณ ผู้รับผิดชอบ และหน่วยงาน
3. ใน **02 ผลการดำเนินงาน** กรอก 5.1 เช่น “ผู้เข้าร่วม 30 คน” / “ผู้เข้าร่วมจริง 32 คน” และกรอก 5.2 เป็นเป้าหมาย/ผลจริงเชิงคุณภาพ
4. ใน **03 ผลการประเมิน** ใส่จำนวนผู้ตอบ และจำนวนคำตอบ 5–1 ของแต่ละข้อ จำนวนคำตอบรายข้อต้องไม่เกินผู้ตอบทั้งหมด
5. ใน **04 สรุปและข้อเสนอแนะ** กรอกตัวชี้วัด ค่าเป้าหมาย ผลจริง และสถานะ
6. ใน **05 ภาพกิจกรรม** แนบภาพพร้อมคำบรรยายหนึ่งภาพ
7. กด **บันทึกออนไลน์** รอข้อความสำเร็จและเลขเวอร์ชัน
8. เปิดอีกเบราว์เซอร์หรือหน้าต่างส่วนตัว ลงชื่อเข้าบัญชีเดียวกัน เปิดเมนูรายงานของฉันและรายการออนไลน์ แล้วโหลดรายงาน ตรวจว่าตาราง/ภาพยังครบ การสลับบัญชีไม่ทำให้เห็นรายงานของคนอื่น
9. เปิด **06 ตัวอย่างรายงาน** ตรวจหน้าปก สารบัญ บันทึกข้อความ ตาราง 5.1/5.2/6 และผลประเมิน 7
10. กด **ส่งสำเนาไป Google Sheets** รอข้อความสำเร็จ ปุ่มนี้บันทึกเวอร์ชันออนไลน์ล่าสุดก่อนส่งด้วย
11. เปิด Sheets ตรวจชื่อโครงการ คอลัมน์ค่าเฉลี่ย S.D. ข้อมูลเป้าหมาย/ผลจริง และข้อความสรุปผล
12. เปิด Drive ตรวจโฟลเดอร์ย่อยตามรหัสรายงานและภาพ PNG/JPEG/WebP
13. แก้ผลจริงหนึ่งช่องแล้วส่งซ้ำ ตรวจว่าแถวเดิมเปลี่ยนเวอร์ชัน ไม่เพิ่มรายงานซ้ำ ส่วนไฟล์ภาพเก่าต่างเวอร์ชันเก็บไว้เพื่อไม่ลบหลักฐานเดิม
14. พิมพ์/บันทึก PDF เลือก A4 ขนาด 100% และปิดหัวกระดาษ/ท้ายกระดาษที่เบราว์เซอร์เพิ่มเอง เพื่อไม่ให้เลขหน้าของเบราว์เซอร์ซ้อนกับเลขหน้า 16 pt ที่รายงานจัดไว้

**การกรอกแต่ละเมนู** มีอยู่ในแถบ **คู่มือการใช้งาน** ภายในระบบแล้ว คู่มือนี้จึงเน้นงานติดตั้งของผู้ดูแล

## 13. อัปเดต Apps Script ที่ใช้งานอยู่

1. สำรองโค้ดเดิมและตรวจ ID ของ Sheets/Drive ที่ใช้อยู่
2. แทน Code.gs และ Index.html และเพิ่ม/แทน Core.gs, Config.html, appsscript.json ตามชุดนี้
3. รักษา Config.html ของโปรเจกต์จริงและ Script properties เดิมให้ตรงกัน
4. ถ้ามีชีต 43 คอลัมน์ รัน upgradeReportSheet_ หนึ่งครั้ง
5. กด **Deploy → Manage deployments → เลือก deployment เดิม → Edit (ดินสอ) → Version: New version → Deploy**
6. ใช้ URL `/exec` ของ deployment เดิมต่อได้ การกด Save อย่างเดียวไม่ทำให้ผู้ใช้ได้รับโค้ดเวอร์ชันใหม่
7. อัปเดต index.ts ใน Supabase Edge Function แล้ว Deploy ด้วย หากฟังก์ชันเดิมยังเป็นโค้ดคนละรุ่น
8. ตรวจ origin และทดสอบรายงานหนึ่งฉบับตามขั้นตอน 12

## 14. เก็บโค้ดใน GitHub ผ่าน Visual Studio Code

สำหรับ repository `https://github.com/HRVec-Adaman2/Adaman2-ProjectPM` ที่ Clone ไว้แล้ว:

1. เปิดโฟลเดอร์ repository ใน VS Code
2. สร้างโฟลเดอร์ `integrations/andaman-report-apps-script` แล้วคัดลอกไฟล์ทั้งหมดจาก ZIP ที่แตกแล้วไปไว้ในนั้น เพื่อเก็บชุดติดตั้งนี้โดยไม่ทับหน้าหลัก ProjectPM
3. ถ้าต้องการปรับต้นฉบับหน้าบ้าน แก้ไฟล์ใน `source/report-editor/` แล้วเปิด Terminal ที่โฟลเดอร์ชุดนี้ รันคำสั่งด้านล่าง
4. เปิด Source Control ตรวจไฟล์เปลี่ยนแปลง ระวังอย่าใส่ REPORT_BRIDGE_SECRET, รหัสผ่าน หรือไฟล์ .env ที่มี secret
5. กด Stage → ใส่ข้อความ Commit เช่น `Add Andaman Report Apps Script target tables and SD` → Commit → Push/Sync Changes
6. คัดลอกไฟล์ที่ build แล้วไปวาง Apps Script และ Deploy new version ตามขั้นตอน 13

```bash
npm run build
npm test
```

ใช้ Node.js 24 ขึ้นไปสำหรับชุดทดสอบนี้ ไม่ต้อง `npm install` เพราะ build/test ของแพ็กเกจนี้ใช้โมดูลที่มาพร้อม Node ส่วน Supabase SDK ฝั่งเว็บรวมไว้แล้ว และ Edge Function ใช้ dependency ที่ระบุเวอร์ชันในไฟล์ index.ts

**GitHub Push หรือ GitHub Pages Actions ไม่ได้อัปเดต Apps Script/Supabase ให้เอง** ชุดนี้ไม่ได้ตั้ง CI เพื่อ deploy บริการเหล่านั้น และการวางไว้ใน integrations ไม่เปลี่ยนหน้า GitHub Pages ของระบบหลัก

## 15. ความสัมพันธ์กับรายงานใน ProjectPM เดิม

- ProjectPM แบบฝัง report editor เก็บรายงานใน `pm_reports.payload` และบันทึกผ่านระบบหลัก
- Apps Script แบบแยกในชุดนี้เก็บรายงานใน `andaman_project_reports` ของเจ้าของบัญชี
- ทั้งสองรูปแบบใช้ข้อมูลตารางเป้าหมายเดียวกัน แต่ไม่ซิงก์ระหว่างสองตารางให้อัตโนมัติ
- ถ้าต้องย้ายรายงานจากระบบหลักมาใช้แบบแยก ให้เปิดรายงานเดิม ส่งออก JSON แล้วนำเข้า JSON ในเว็บ Apps Script จากนั้นตรวจข้อมูลและบันทึกออนไลน์ การนำเข้าเป็นสำเนาใหม่ ไม่เขียนทับรายงานเดิมใน PM
- หากใช้งานรายงานในระบบหลักต่อ ให้เก็บงานอนุมัติและการติดตามงบในระบบหลัก และไม่ถือว่าการส่งสำเนาไปชีตเป็นการอนุมัติทางการเงิน

## 16. ข้อจำกัดที่เกี่ยวกับข้อมูล

- ภาพไม่เกิน 20 ภาพต่อรายงาน แต่ละภาพไม่เกิน 1.5 MB และส่งไปชีต/Drive รวมภาพกิจกรรมไม่เกิน 9 MB ต่อครั้ง
- เซลล์ที่ส่ง Sheets จำกัดที่ 49,000 ตัวอักษรเพื่อเผื่อขีดจำกัด Sheets ถ้าข้อมูลรายงานรวมเป็น JSON ยาวเกินนี้ การส่งสำเนาจะถูกปฏิเสธพร้อมข้อความ รายงานใน Supabase ยังอยู่
- แถวข้อมูลฉบับเต็มใน Sheets แทน Base64 ภาพด้วย URL ของ Drive ไม่ใช่ไฟล์ JSON สำหรับนำเข้าโดยตรง ควรใช้ปุ่มส่งออก JSON ในเว็บเมื่อต้องการสำเนาสำหรับนำกลับเข้า
- S.D. รายข้อเป็นส่วนเบี่ยงเบนมาตรฐานของตัวอย่างจากความถี่คำตอบ; S.D. ภาพรวมรวมคำตอบทุกข้อ ไม่ใช่ S.D. ของคะแนนเฉลี่ยรายคน เพราะระบบไม่ได้เก็บคำตอบรายบุคคล หากต้องการสถิติรายบุคคลต้องเก็บข้อมูลเพิ่ม
- ช่องไม่มีคำตอบใช้ “—” และไม่สร้างผลประเมินขึ้นเอง ส่วนคำอธิบายสูตร/ช่วงแปลผลไม่แสดงในรายงานพิมพ์
- ร่างในเครื่องเก็บในเบราว์เซอร์ การย้ายเครื่อง/ล้างข้อมูล/เปลี่ยน origin ไม่ได้ย้ายร่างให้ ควรบันทึกออนไลน์หรือส่งออก JSON ก่อน
- Supabase และ Apps Script มีโควตาตามบริการ ต้องทดสอบปริมาณงานจริงของหน่วยงานก่อนใช้งานพร้อมกันจำนวนมาก

## 17. แก้ปัญหาที่พบบ่อย

| อาการ | ตรวจที่ใด |
| --- | --- |
| เปิดเว็บแล้วหาไฟล์ Config หรือ Core ไม่พบ | สร้างไฟล์ชื่อถูกต้อง วางครบ และ Deploy new version |
| เข้าด้วย admin ไม่ได้ | Config.html อีเมลจริงตรงบัญชี Supabase; ใช้รหัสผ่านของอีเมลนั้น ไม่ใช่คำว่า admin เป็นรหัสผ่าน |
| บันทึกออนไลน์ไม่ได้/ไม่มีตาราง | รัน setup_report.sql ในโปรเจกต์เดียวกับ Config; ตรวจ RLS และบัญชีที่เข้าสู่ระบบ |
| ส่งสำเนาแล้ว Origin not allowed | ใช้ค่า ANDAMAN_REPORT_ORIGIN จาก Console ใน ALLOWED_ORIGINS ของฟังก์ชัน |
| HTTP 401 | เข้าสู่ระบบใหม่ ตรวจ URL/key ว่าเป็นโปรเจกต์เดียวกัน และส่ง user access token; publishable key ใช้แทน token ไม่ได้ |
| Server configuration incomplete | ตรวจ REPORT_GAS_URL, REPORT_BRIDGE_SECRET, REPORT_SUPABASE_PUBLISHABLE_KEY ใน Supabase Secrets |
| ลายเซ็นไม่ถูกต้อง | REPORT_BRIDGE_SECRET ต้องตรงกันใน Apps Script และ Supabase ไม่มีช่องว่างเกิน |
| Apps Script returned non-JSON | ใช้ URL /exec, access Anyone, execute as owner, อนุญาตสิทธิ์แล้ว และ deploy เวอร์ชันล่าสุด |
| หัวตารางรุ่นเดิม | เจ้าของรัน upgradeReportSheet_ ไม่ต้องลบข้อมูลชีต |
| เปิดภาพไม่ได้ | ตรวจสิทธิ์ Google Drive ของผู้เปิดภาพ |
| กดส่งแล้ว timeout | ดู Apps Script Executions และ Supabase Function Logs; ส่งซ้ำได้ ระบบไม่เพิ่มแถวซ้ำของรายงานเดิม |

## 18. ผลการทดสอบและแหล่งอ้างอิง

ชุดทดสอบอัตโนมัติ 36 รายการผ่าน ครอบคลุมการคำนวณ สรุปผล เป้าหมายเก่า/ใหม่ ความถูกต้องของ bundle การตรวจ token/เจ้าของ/ลายเซ็น การส่งซ้ำ การสำรองชีต การป้องกันสูตรจากข้อความ และไฟล์ภาพ ดู `TEST_RESULTS.md`

การทดสอบนี้ใช้ Node.js และจำลอง Google/Supabase APIs ไม่ใช่หลักฐานว่า deployment ในบัญชี Google ของคุณพร้อมแล้ว ต้องทดสอบจริงตามขั้นตอน 12 หลังติดตั้ง

เอกสารทางการที่ตรวจประกอบเมื่อ 26 ตุลาคม 2569:

- Apps Script Web Apps: https://developers.google.com/apps-script/guides/web
- Apps Script Properties: https://developers.google.com/apps-script/guides/properties
- Apps Script HTML templates: https://developers.google.com/apps-script/guides/html/templates
- Apps Script iframe restrictions: https://developers.google.com/apps-script/guides/html/restrictions
- Supabase Edge Function dashboard: https://supabase.com/docs/guides/functions/quickstart-dashboard
- Supabase environment variables: https://supabase.com/docs/guides/functions/secrets
- Supabase authorization headers / verify_jwt: https://supabase.com/docs/guides/functions/auth-headers
