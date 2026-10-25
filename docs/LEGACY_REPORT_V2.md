# Andaman Report — คู่มือติดตั้งและโค้ดทั้งหมด

ปรับปรุง 24 ตุลาคม 2569: บันทึกข้อความตามภาพอ้างอิง มีเส้นประสำหรับข้อมูลหนังสือ ลงชื่อผู้รายงาน และความเห็นผู้บริหาร 2 ช่องคู่กัน ตัดเมนูตั้งค่าการเชื่อมต่อและหัวข้อการติดตั้งออกจากคู่มือบนเว็บ การตั้งค่าทั้งหมดทำโดยผู้ดูแลตามเอกสารนี้

**เริ่มต้น:** แตก ZIP แล้วเปิด `INSTALLATION_AND_CODE.html` ด้วย Chrome / Edge จะเห็นคู่มือนี้และโค้ดทุกไฟล์ พร้อมปุ่มเลือกไฟล์และคัดลอกทั้งไฟล์ HTML นี้เป็นเอกสารอ่านโค้ด ไม่ใช่หน้าเว็บใช้งานระบบ

## 1. แต่ละโปรแกรมใช้ทำอะไร

| โปรแกรม | หน้าที่ | ไฟล์หรือข้อมูลที่ใช้ |
|---|---|---|
| VS Code | แก้ไฟล์ต้นฉบับบนคอมพิวเตอร์ | เปิดโฟลเดอร์ที่แตกจาก ZIP ทั้งโฟลเดอร์ |
| Chrome / Edge | กรอกข้อมูลและพิมพ์รายงาน | เปิด URL เว็บหลังเผยแพร่ |
| GitHub / GitHub Pages | เก็บโค้ดและเปิดหน้าเว็บ | dist/ และ .github/workflows/deploy-pages.yml |
| Supabase Database | เก็บรายงานฉบับหลักและเวอร์ชัน | supabase/setup.sql วางใน SQL Editor |
| Supabase Auth | ตรวจอีเมลและรหัสผ่าน | สร้างผู้ใช้ใน Authentication |
| Supabase Storage | เก็บภาพส่วนตัว | SQL สร้าง bucket andaman-report-photos |
| Supabase Edge Functions | ตรวจสิทธิ์และส่งข้อมูลไป Google | supabase/functions/report-sheet-sync/index.ts |
| Google Apps Script | ตรวจลายเซ็นคำขอและเขียนชีต | apps-script/Code.gs และ appsscript.json |
| Google Sheets | เก็บสำเนาเป็นหัวตารางภาษาไทย | Spreadsheet และชีต รายงานผลโครงการ v2 |
| Google Drive | เก็บสำเนาภาพ | โฟลเดอร์ที่กำหนด DRIVE_FOLDER_ID |
| Node.js | ตรวจโค้ดและรวมเว็บเป็น HTML เดียว | npm ci, npm test, npm run build:gas ใช้ตอนเตรียมไฟล์ |

ลำดับข้อมูล: หน้าเว็บเข้าสู่ระบบ → บันทึก Supabase Database / Storage → กดส่งสำเนา → Edge Function ตรวจผู้ใช้และอ่านรายงานจากฐานข้อมูล → ส่งคำขอพร้อม HMAC ไป Apps Script → Apps Script บันทึก Sheets / Drive

**แนะนำให้ใช้ GitHub Pages เป็นหน้าเว็บหลัก** และให้ Apps Script รับข้อมูลไปลง Google ถ้าต้องการเปิดหน้ากรอกจาก Apps Script แทน มีวิธีในหัวข้อ 8 ไม่จำเป็นต้องใช้เว็บทั้งสองช่องทางพร้อมกัน

## 2. สถานะและสิ่งที่ต้องใส่จริง

เว็บทดลองกรอกข้อมูล บันทึกร่างในเครื่อง ส่งออก JSON และพิมพ์ได้แล้ว **การบันทึกออนไลน์ต้องใส่ค่าของบัญชีจริงตามคู่มือนี้ก่อน** ยังไม่ได้ติดตั้งฐานข้อมูลรายงานหรือ Edge Function ใน Supabase ของผู้ใช้ และยังไม่ได้เชื่อม Google Sheet / Drive จริงในงานนี้

ในบัญชี Supabase ที่เชื่อมต่อมีโปรเจกต์ HRVec-Andaman2 ที่ใช้งานอยู่ หากเลือกใช้โปรเจกต์นี้ ให้เพิ่มเฉพาะตารางและ bucket ของระบบรายงานตาม SQL โค้ดชุดนี้ไม่ได้แก้ตารางบุคลากรเดิม ผู้ดูแลจะเลือกโปรเจกต์แยกก็ได้

## 3. ติดตั้งฐานข้อมูลและบัญชีผู้ใช้ใน Supabase

1. เปิด Supabase Dashboard และเลือกโปรเจกต์ที่จะใช้
2. SQL Editor → New query → คัดลอก supabase/setup.sql ทั้งไฟล์ → Run
3. ตรวจผลท้ายคำสั่ง: ตาราง andaman_project_reports มี rowsecurity = true และ bucket andaman-report-photos มี public = false
4. Authentication → Users → Add user สร้างอีเมลและรหัสผ่านผู้ใช้ ตั้งยืนยันอีเมลสำหรับบัญชีที่ผู้ดูแลตรวจสอบแล้ว
5. คัดลอก Project URL จาก Project Settings / Connect และ Publishable key จาก API Keys ใช้ key ขึ้นต้น sb_publishable_ หรือ legacy anon key
6. ใส่สองค่านี้ใน dist/config.js ตามหัวข้อ 4

SQL แยกสิทธิ์ตามเจ้าของรายงาน ผู้ใช้คนที่สองต้องไม่เห็นรายงานและรูปของคนแรก รุ่นนี้ยังไม่มีสิทธิ์ผู้ตรวจรวมทุกหน่วยงานหรือการอนุมัติออนไลน์ ช่องความเห็นและลงนามใช้จัดรูปแบบเอกสาร

ตรวจหลังติดตั้งใน SQL Editor:

```sql
select tablename, rowsecurity from pg_tables
where schemaname='public' and tablename='andaman_project_reports';
select policyname, cmd from pg_policies
where schemaname='public' and tablename='andaman_project_reports';
select id, public, file_size_limit from storage.buckets
where id='andaman-report-photos';
```

## 4. ตั้งค่าหน้าเว็บใน VS Code

เปิด dist/config.js แล้วแก้เฉพาะค่าระหว่างเครื่องหมายคำพูด:

```javascript
window.ANDAMAN_CONFIG = {
  supabaseUrl: 'https://YOUR_PROJECT_REF.supabase.co',
  supabasePublishableKey: 'sb_publishable_REPLACE_WITH_YOUR_KEY',
  syncFunction: 'report-sheet-sync'
};
```

ใช้ URL ของโปรเจกต์เดียวกับที่รัน SQL และสร้างบัญชี ไม่ใช่ URL หน้า Dashboard และไม่ใส่ /functions หรือ /rest ต่อท้าย

รุ่นนี้ไม่มีฟอร์มตั้งค่าบนเว็บ และไม่อ่าน URL / key เก่าที่เคยบันทึกใน localStorage ต้องแก้ config.js และเผยแพร่ใหม่ ผู้ใช้จึงไม่ต้องตั้งค่าด้วยตนเอง

**ใส่ได้เฉพาะ publishable / anon key ในหน้าเว็บ** ห้ามใส่ service_role, sb_secret_…, รหัสผ่านฐานข้อมูล หรือ REPORT_BRIDGE_SECRET ใน config.js, Index.html หรือ GitHub

ถ้าใช้ GitHub Pages อย่างเดียว แก้ config.js ได้โดยไม่ใช้ Node.js ถ้าใช้หน้า Apps Script ด้วย ต้องสร้าง Index.html ใหม่ตามหัวข้อ 8

## 5. เตรียม Google Sheets, Drive และ Apps Script

1. สร้าง Google Spreadsheet สำหรับรายงาน จด Spreadsheet ID ระหว่าง /d/ กับ /edit ใน URL
2. สร้างโฟลเดอร์ Drive สำหรับภาพ จด Folder ID หลัง /folders/ ใน URL ตั้งสิทธิ์เฉพาะผู้เกี่ยวข้องตั้งแต่แรก
3. เปิด Spreadsheet → Extensions → Apps Script
4. วาง apps-script/Code.gs ทั้งไฟล์ลง Code.gs
5. สร้างไฟล์ชนิด HTML ชื่อ Index แล้ววาง apps-script/Index.html ทั้งไฟล์ ชื่อ Index ต้องตรงตัวพิมพ์ ห้ามวาง HTML ใน Code.gs
6. Project Settings → เปิด Show appsscript.json manifest file in editor แล้ววาง apps-script/appsscript.json ในไฟล์ manifest
7. Project Settings → Script properties เพิ่มค่าตามตาราง

| Script property | ค่า | เอามาจากไหน |
|---|---|---|
| SPREADSHEET_ID | ID Spreadsheet | URL Google Sheets |
| DRIVE_FOLDER_ID | ID โฟลเดอร์ภาพ | URL โฟลเดอร์ Drive |
| REPORT_BRIDGE_SECRET | สตริงสุ่มอย่างน้อย 32 ตัวอักษร | สร้างเองและใช้ตรงกับ Edge Function |

สร้างสตริงสุ่มบนเครื่องผู้ดูแลด้วย Node.js แล้วเก็บเฉพาะ Script properties และ Edge Function Secrets:

```sh
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

8. เลือกฟังก์ชัน setupReportSystem_ ใน Apps Script Editor → Run → ให้สิทธิ์บัญชีเจ้าของ จะสร้างชีต รายงานผลโครงการ v2 และตรวจโฟลเดอร์
9. Deploy → New deployment → Web app → Execute as: Me → Who has access: Anyone เพื่อให้เซิร์ฟเวอร์ Supabase เรียกได้ แล้วคัดลอก URL ลงท้าย /exec

การเขียนข้อมูลทุกครั้งตรวจ HMAC และเวลาหมดอายุใน Code.gs แม้ endpoint รับคำขอผ่านเครือข่ายได้ ถ้าบัญชีองค์กรไม่อนุญาต Anyone ต้องให้ผู้ดูแล Google Workspace กำหนดช่องทางที่อนุญาตก่อนส่งสำเนา

ภาพรับสิทธิ์ตามโฟลเดอร์ Drive ไม่มีการเปิด Anyone with link อัตโนมัติ อย่าใช้โฟลเดอร์สาธารณะเก็บภาพส่วนตัว

**เมื่อแก้ Code.gs หรือ Index.html:** Manage deployments → Edit → New version → Deploy การกด Save อย่างเดียวไม่อัปเดต Web app ที่ใช้งานอยู่

## 6. ติดตั้ง Edge Function ใน Supabase Dashboard

1. เลือกโปรเจกต์เดียวกับหัวข้อ 3 → Edge Functions → Deploy a new function → Via Editor
2. ตั้งชื่อ report-sheet-sync ให้ตรงกับ config.js
3. วาง supabase/functions/report-sheet-sync/index.ts ทั้งไฟล์ในตัวแก้ไข โค้ด import SDK ด้วย npm: และล็อกเวอร์ชัน จึงวางใน Dashboard ได้โดยตรง
4. Deploy function แล้วเปิด Settings ของฟังก์ชัน ตั้ง Verify JWT with legacy secret เป็น OFF ตาม supabase/config.toml ตัวฟังก์ชันตรวจ token ด้วย auth.getUser(token) ทุกคำขออยู่แล้ว รองรับ signing key แบบใหม่
5. Edge Functions → Secrets เพิ่ม 4 ค่าตามตาราง

| Secret | ค่า | ต้องตรงกับ |
|---|---|---|
| REPORT_GAS_URL | URL Apps Script ลงท้าย /exec | Deployment หัวข้อ 5 |
| REPORT_BRIDGE_SECRET | สตริงสุ่มค่าเดียวกันทุกตัวอักษร | Script property ชื่อเดียวกัน |
| REPORT_SUPABASE_PUBLISHABLE_KEY | Publishable key ของโปรเจกต์ | key ใน dist/config.js |
| ALLOWED_ORIGINS | origin เว็บผู้ใช้ หลายค่าคั่นด้วยจุลภาค | URL หน้าเว็บหัวข้อ 7 |

ตัวอย่าง ALLOWED_ORIGINS สำหรับ GitHub Pages: https://YOUR_GITHUB_USERNAME.github.io **ไม่ใส่ชื่อ repository, path หรือ / ท้าย**

ถ้าจะใช้เว็บทดลองที่ส่งให้ด้วย เพิ่ม https://andaman-project-reports-74869.muangyor.chatgpt.site ด้วยจุลภาค และต้องเผยแพร่เว็บทดลองนั้นใหม่ด้วย config จริงด้วย การแก้ config.js ใน GitHub ไม่ได้อัปเดตเว็บทดลองนี้อัตโนมัติ

ไม่ใช้ GAS_URL / BRIDGE_SECRET ของ HRVec ระบบรายงานใช้ชื่อ REPORT_ แยกกัน

ทดสอบฟังก์ชันด้วย publishable key อย่างเดียวจะไม่ผ่าน ต้องมี access token ของผู้ใช้ที่เข้าสู่ระบบแล้ว ให้ทดสอบจากหน้าเว็บตามหัวข้อ 9

## 7. เปิดเว็บด้วย GitHub Pages — ไม่ต้อง Git Clone

1. แตก ZIP และเปิดโฟลเดอร์ Andaman-Report-v2.0
2. สร้าง GitHub repository สำหรับระบบรายงาน ใช้ Public หากใช้ GitHub Free
3. Add file → Upload files อัปโหลดให้เห็น dist, apps-script, supabase, scripts, tests, package.json, package-lock.json และ .github ที่ชั้นบนสุดของ repository
4. ถ้า .github ไม่ติด ให้ Add file → Create new file ใส่ชื่อ .github/workflows/deploy-pages.yml แล้ววางโค้ด workflow จากชุดนี้
5. Commit ลง branch main
6. Settings → Pages → Source เลือก GitHub Actions
7. Actions → Deploy Andaman Report to GitHub Pages → Run workflow → รอเครื่องหมายสีเขียว → เปิด URL ใน deployment
8. ใส่เฉพาะ origin ของเว็บนี้ใน ALLOWED_ORIGINS ตามหัวข้อ 6
9. เปิดเว็บ → ปุ่มบัญชีผู้ใช้มุมขวาบน → เข้าสู่ระบบด้วยบัญชีที่สร้างใน Supabase Auth

อย่าอัปโหลด ZIP ทั้งไฟล์เป็นหน้าเว็บ และอย่าซ้อนโฟลเดอร์ Andaman-Report-v2.0 อีกชั้นบน GitHub เพราะ workflow ต้องพบ dist/ ที่ root เมื่อแก้แล้ว Commit ระบบ Actions จะตรวจและเผยแพร่ใหม่ ถ้ายังเห็นของเดิมให้กด Ctrl + F5

## 8. ทางเลือก: เปิดหน้ากรอกจาก Apps Script

1. แก้ dist/config.js ตามหัวข้อ 4 ให้เรียบร้อย
2. เปิด VS Code Terminal ในโฟลเดอร์ที่มี package.json ใช้ Node.js 24 แล้วรัน:

```sh
npm ci
npm test
npm run build:gas
```

3. คัดลอก apps-script/Index.html ที่สร้างใหม่ไปวางไฟล์ HTML ชื่อ Index ใน Apps Script แล้ว Deploy เป็น New version
4. ถ้าไม่ใช้ Node.js เปิด apps-script/Index.html ใน VS Code ค้นหา window.ANDAMAN_CONFIG = แล้วแก้เฉพาะบล็อก Project URL / key ให้ตรงกับ dist/config.js
5. เพิ่ม origin ของ iframe หน้า Apps Script ใน ALLOWED_ORIGINS ค่าเป็น https://…-script.googleusercontent.com ให้ตรวจจาก DevTools → Network → request report-sheet-sync → Request Headers → Origin ไม่ใช่ script.google.com
6. ถ้า origin เปลี่ยนหลัง Deploy ให้ปรับ ALLOWED_ORIGINS ใหม่ GitHub Pages เหมาะเป็นหน้าเว็บหลักเพราะ origin คงที่กว่า

ร่างในเครื่องแยกตามโดเมน ย้ายด้วย JSON หรือดึงรายงานออนไลน์เมื่อใช้คนละช่องทาง

## 9. ทดสอบการใช้งานจริงครบเส้นทาง

1. สร้างรายงาน กรอกชื่อ ผู้รับผิดชอบ ปีงบประมาณ และข้อมูลที่จำเป็น รอดูสถานะบันทึกร่างในเครื่อง
2. กรอกจำนวนผู้ตอบและคะแนนให้ถูกต้อง → บันทึกออนไลน์ ต้องแสดงเวอร์ชันที่บันทึกสำเร็จ
3. ตรวจ Supabase Table Editor ต้องพบแถวรายงาน และ Storage ต้องพบรูปของผู้ใช้
4. เปิดอีกเบราว์เซอร์ เข้าบัญชีเดิม → รายงานของฉัน → ดึงรายงานออนไลน์ → เปิดในเครื่อง ต้องได้เนื้อหาและรูปครบ
5. ตัวอย่างรายงาน → ส่งสำเนาไป Google Sheets → ตรวจชีตและ Drive ต้องมีข้อมูลและลิงก์ภาพ กดซ้ำต้องอัปเดตรหัสเดิม ไม่เพิ่มแถวซ้ำ
6. ตรวจบันทึกข้อความ สารบัญ และเลขหน้าบนขวา 16 pt → พิมพ์ A4 / Scale 100% / ปิด Headers and footers
7. ใช้บัญชีคนที่สองตรวจว่ามองไม่เห็นรายงานคนแรก และตรวจ Supabase Security Advisors

**บันทึกในเครื่อง บันทึกออนไลน์ และส่งสำเนาไปชีต เป็นคนละขั้นตอน** สถานะสำเร็จขั้นตอนหนึ่งไม่รับรองว่าอีกขั้นตอนสำเร็จแล้ว

## 10. แก้ปัญหาตรงจุด

| อาการ | จุดตรวจ |
|---|---|
| ระบบยังไม่พร้อมบันทึกออนไลน์ | config.js มีค่าจริงและเผยแพร่ใหม่แล้วหรือยัง |
| เข้าสู่ระบบไม่ได้ | โปรเจกต์ตรงกัน อีเมลยืนยันแล้ว และรหัสผ่านถูกต้องหรือไม่ |
| relation does not exist / permission denied | รัน setup.sql ทั้งไฟล์ในโปรเจกต์ที่ตรงกับ config.js ตรวจ grants / RLS |
| Origin not allowed | ALLOWED_ORIGINS ตรง Request Origin ไม่มี path หรือ / ท้าย |
| Function not found | ชื่อ report-sheet-sync และโปรเจกต์ถูกต้องหรือไม่ |
| Server configuration incomplete | Secrets ครบหรือไม่ REPORT_BRIDGE_SECRET ต้องอย่างน้อย 32 ตัวอักษร |
| Apps Script returned non-JSON | URL ลงท้าย /exec และอนุญาตเซิร์ฟเวอร์เรียกได้หรือไม่ |
| ลายเซ็นคำขอไม่ถูกต้อง | REPORT_BRIDGE_SECRET สองบริการต้องตรงทุกตัวอักษร |
| No HTML file named Index | สร้างไฟล์ชนิด HTML ชื่อ Index และ Deploy เวอร์ชันใหม่ |
| ข้อมูลชีตยาวเกินกำหนด | เซลล์รวม JSON จำกัด 49,000 ตัวอักษร ใช้ข้อมูลฉบับหลักใน Supabase / JSON สำรอง |
| รูปใหญ่เกินขนาดส่งสำเนา | สูงสุด 20 ภาพ ภาพย่อไม่เกิน 1.5 MB ต่อภาพ รวมภาพส่งชีตไม่เกิน 9 MB |

## 11. โค้ดทั้งหมดและขอบเขตการตรวจ

INSTALLATION_AND_CODE.html รวมโค้ดทุกไฟล์ในชุด ยกเว้นภาพ binary และไฟล์คู่มือที่กำลังเปิด มีทั้งไฟล์ที่พัฒนาเอง ไฟล์ทดสอบ และ SDK ภายนอก เลือกชื่อไฟล์แล้วคัดลอกให้ตรงโปรแกรม ไม่ต้องนำโค้ดทุกไฟล์ไปรวมในไฟล์เดียว

SQL ทดสอบด้วย Postgres WASM / PGlite และต้องตรวจอีกครั้งบน Supabase จริงหลังติดตั้ง การส่ง Supabase → Edge Function → Apps Script → Sheets / Drive ยังไม่ได้ทดสอบครบเส้นทางบนบัญชีจริงของผู้ใช้

โค้ดภาพเก่าใน Storage / Drive ไม่ลบตามร่างในเครื่อง ผู้ดูแลควรกำหนดการเก็บรักษาเอกสารของหน่วยงาน ฟอนต์ใช้ TH Sarabun New หากติดตั้ง มิฉะนั้นใช้ Sarabun / Tahoma ควรตรวจตัวอย่างบนเครื่องที่พิมพ์ทุกครั้ง

## อ้างอิง

- Supabase Dashboard editor: https://supabase.com/docs/guides/functions/quickstart-dashboard
- Supabase Edge Auth: https://supabase.com/docs/guides/functions/auth
- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase API keys: https://supabase.com/docs/guides/api/api-keys
- Apps Script Web Apps: https://developers.google.com/apps-script/guides/web
- Apps Script HMAC: https://developers.google.com/apps-script/reference/utilities/utilities
- GitHub Pages: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
- โลโก้ที่ผู้ใช้ให้: https://img2.pic.in.th/S__15728643.th.jpg
- ตราครุฑ: https://secretary.fda.moph.go.th/manage/gg-101
