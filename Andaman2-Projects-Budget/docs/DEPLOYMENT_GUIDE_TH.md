# คู่มือนำระบบไปใช้จริงอย่างละเอียด

ใช้กับระบบบริหารจัดการโครงการและงบประมาณ สถาบันการอาชีวศึกษาภาคใต้ 2 และ Andaman Report v2.0 ที่อยู่ในเมนูรายงานและการติดตาม

## 1. เลือกกรณีให้ตรงก่อนเริ่ม

| สิ่งที่ต้องการ | วิธีดำเนินการ | โปรแกรมที่ต้องใช้ |
|---|---|---|
| ใช้ระบบที่ติดตั้งให้แล้ว | เปิดเว็บไซต์เดิมและเพิ่มสมาชิกตามหน้าที่ | Chrome / Edge |
| แก้บันทึกข้อความและเพิ่มคู่มือบนเว็บไซต์เดิม | รุ่นที่เผยแพร่ล่าสุดรวมการแก้ไขแล้ว เปิดเว็บใหม่หรือกด Ctrl+F5 | Chrome / Edge |
| ใช้งานร่วมกันหลายหน่วยงานผ่าน GitHub Pages | นำชุดโค้ดระบบโครงการขึ้น repository และอนุญาต origin เว็บไซต์ในฟังก์ชันสมาชิก | GitHub Desktop, VS Code, GitHub, Supabase Dashboard |
| ใช้โฮสต์ของสถาบัน | นำไฟล์ภายใน dist ขึ้น HTTPS web hosting | โปรแกรมจัดการโฮสต์ / ผู้ดูแลเว็บไซต์, Supabase Dashboard |
| ย้ายฐานข้อมูลไปโปรเจกต์ใหม่ | ติดตั้ง SQL, Admin และ Edge Function ตามหัวข้อ 6 | Supabase Dashboard, VS Code |
| ทดลองหรือแก้โค้ดในเครื่อง | เปิดโฟลเดอร์โค้ด ติดตั้ง dependency และเปิด local preview | VS Code, Node.js, Chrome / Edge |

ไม่ต้องทำทุกกรณี เริ่มจากกรณีที่ตรงกับการใช้งานของหน่วยงาน

## 2. โปรแกรมและไฟล์แต่ละส่วนทำหน้าที่อะไร

| โปรแกรม / บริการ | ใช้ทำอะไร | ไฟล์ที่เกี่ยวข้อง |
|---|---|---|
| Chrome หรือ Microsoft Edge | เปิดเว็บ กรอกข้อมูล ตรวจรายงาน และบันทึก PDF | dist/index.html และไฟล์หน้าเว็บทั้งหมด |
| Visual Studio Code | เปิดและแก้โค้ด ดูโครงสร้างไฟล์ เปิด Terminal | ทั้งโฟลเดอร์โปรเจกต์ |
| GitHub Desktop | Clone repository, เก็บประวัติ Commit, ส่งขึ้น GitHub ด้วยปุ่ม Push | โฟลเดอร์ repository ระบบโครงการ |
| GitHub / GitHub Actions / Pages | เก็บโค้ด ทดสอบ และให้บริการหน้าเว็บ | .github/workflows/deploy-pages.yml, dist/ |
| Supabase Database | เก็บโครงการ งบ คำขอ รายงาน สมาชิก และประวัติ | supabase/pm_setup.sql |
| Supabase Auth | ตรวจอีเมลและรหัสผ่าน | อ่านผ่าน SDK ใน dist/app.js |
| Supabase Storage | เก็บแบบฟอร์ม ไฟล์ขออนุญาต และภาพรายงานที่ผูกโครงการ | bucket andaman-pm-files |
| Supabase Edge Functions | เพิ่มสมาชิกด้วยการตรวจสิทธิ์ Admin ฝั่งเซิร์ฟเวอร์ | supabase/functions/pm-members/index.ts |
| Node.js 24 | รันคำสั่งเตรียมไฟล์คู่มือ ทดสอบ และ local preview | package.json, scripts/, tests/ |
| Microsoft Excel / LibreOffice Calc / Google Sheets | เปิดไฟล์ CSV สรุปที่ดาวน์โหลด | ไฟล์ CSV จากระบบ |
| Google Apps Script / Sheets / Drive | ทางเลือกใช้ตัวจัดทำรายงานเดิมแบบแยกตามคู่มือรุ่น 2 | apps-script/, docs/LEGACY_REPORT_V2.md |

ระบบหลักรุ่นโครงการทำงานด้วยหน้าเว็บและ Supabase ส่วน Google Apps Script / Sheets / Drive เป็นส่วนรายงานเดิมที่เก็บไว้ให้เลือกใช้ ไม่ต้องตั้งค่าส่วนนี้เพื่อเริ่มระบบหลัก

## 3. ใช้เว็บไซต์ที่ติดตั้งให้แล้ว

1. เปิด https://andaman-project-reports-74869.muangyor.chatgpt.site
2. เว็บไซต์เดิมคงสิทธิ์เข้าชมแบบส่วนตัวไว้ ให้เข้าสู่เว็บไซต์ด้วยบัญชีที่ได้รับสิทธิ์ก่อน แล้วจึงเข้าสู่หน้าล็อกอินระบบโครงการ
3. Admin เริ่มต้นพิมพ์ชื่อผู้ใช้ admin และใช้รหัสผ่านเดิมของบัญชี Admin ในโปรเจกต์ที่ใช้อยู่ ไม่ได้เปลี่ยนรหัสผ่านให้ใหม่
4. เปิดโครงสร้างหน่วยงาน ตรวจ 5 ส่วนงานของสถาบันและ 7 สถานศึกษา เพิ่มกลุ่มงานย่อยตามคำสั่งมอบหมายเมื่อจำเป็น
5. เปิดจัดการสมาชิก เพิ่มผู้บริหารและเจ้าหน้าที่ พร้อมหน่วยงานที่ถูกต้อง ควรมีผู้พิจารณาแยกจากผู้จัดทำ เพราะผู้เสนอหรือผู้ขออนุมัติของตนเองไม่ได้
6. ให้สมาชิกตรวจเมนูคู่มือการกรอกข้อมูล แล้วฝึกจากโหมดสาธิตก่อนทำรายการจริง
7. ลำดับเริ่มงานจริงคือ เพิ่มแหล่งเงิน → เสนอโครงการ → อนุมัติ → จัดสรรงบ → ขอเบิก → อนุมัติ → บันทึกจ่ายจริง → รายงาน → ตรวจรับ
8. ถ้าต้องการรายงานอิสระ ให้เปิดรายงานและการติดตาม → Andaman Report v2.0 กดสร้างรายงานใหม่
9. ถ้าต้องการรายงานผูกข้อมูลโครงการ ให้เปิดแท็บติดตามรายงานโครงการ แล้วกดจัดทำรายงานของโครงการนั้น

การเพิ่มสมาชิกในระบบโครงการไม่ได้ให้สิทธิ์เข้าชมเว็บไซต์ Sites อัตโนมัติ ก่อนให้บุคลากรหลายคนใช้ ให้กำหนดผู้เข้าชมเว็บไซต์ตามนโยบายหน่วยงาน หรือเผยแพร่ชุด dist บน GitHub Pages / โฮสต์สถาบันตามขั้นตอนด้านล่าง

## 4. เตรียมโค้ดบน Windows ด้วย GitHub Desktop และ VS Code

1. ดาวน์โหลด ZIP ฉบับปรับปรุง แล้วคลิกขวา Extract All เพื่อแตกไฟล์ อย่าเปิดแก้ไฟล์อยู่ภายใน ZIP
2. เปิดโฟลเดอร์ที่มี package.json, dist, supabase, scripts และ .github อยู่ระดับเดียวกัน ไฟล์ START_HERE.html ใช้อ่านคู่มือแบบออฟไลน์ได้
3. ติดตั้ง Visual Studio Code จาก https://code.visualstudio.com/download และ GitHub Desktop จาก https://desktop.github.com/download/ หากยังไม่มี
4. เปิด GitHub Desktop และลงชื่อเข้าใช้ GitHub ของผู้ดูแลระบบ
5. ถ้ามี repository ระบบโครงการอยู่แล้ว ให้เลือก File → Clone repository → เลือก repository → กำหนด Local path → Clone
6. ถ้าระบบยังไม่มี repository ให้สร้าง repository สำหรับระบบโครงการบน GitHub แล้ว Clone ลงมาใน GitHub Desktop
7. ใน GitHub Desktop เลือก Repository → Show in Explorer แล้วคัดลอกไฟล์จากโฟลเดอร์ที่แตก ZIP มาวางในโฟลเดอร์ repository โดยให้ package.json และ dist อยู่ที่ราก repository ไม่ซ้อนโฟลเดอร์ชื่อ ZIP อีกชั้น
8. ตรวจว่ามี .github/workflows/deploy-pages.yml ด้วย File Explorer อาจต้องเปิด View → Show → Hidden items เพื่อดูโฟลเดอร์ที่ขึ้นต้นด้วยจุด
9. เปิด VS Code → File → Open Folder → เลือกโฟลเดอร์ repository เพื่อดูหรือแก้โค้ด
10. วิธีนี้ใช้ GitHub Desktop จัดการ Clone / Commit / Push จึงไม่ต้องเริ่มจากคำสั่ง Git: Clone ใน VS Code

ถ้าอัปเดตของเดิม ให้ Fetch origin และ Pull origin ใน GitHub Desktop ก่อนคัดลอกไฟล์ปรับปรุง แล้วตรวจรายการ Changes ว่ามีเฉพาะสิ่งที่ตั้งใจแก้

## 5. ใช้ Supabase โปรเจกต์เดิม แล้วเผยแพร่หน้าเว็บที่ GitHub Pages

ข้อมูลระบบหลักติดตั้งในโปรเจกต์ HRVec-Andaman2 รหัส oftlfxiywhtoftxluviv อยู่แล้ว ใช้ตาราง pm_* แยกจากตารางบุคลากร การย้ายหน้าเว็บไม่จำเป็นต้องลบตารางหรือรันสร้างฐานข้อมูลใหม่

1. ใน VS Code เปิด dist/config.js ตรวจว่า supabaseUrl ชี้โปรเจกต์ที่ต้องการใช้ และใช้ publishable key ของโปรเจกต์เดียวกัน โค้ดชุดที่ให้ตั้งค่าโปรเจกต์เดิมไว้แล้ว
2. ไม่ใส่ secret key หรือ service_role key ลง dist/config.js หรือไฟล์หน้าเว็บ เพราะไฟล์หน้าเว็บถูกส่งให้เบราว์เซอร์อ่าน
3. ใน GitHub Desktop ตรวจ Changes กรอก Summary เช่น Update memo layout and user guide → Commit to main → Push origin
4. เปิดหน้า repository ในเว็บไซต์ GitHub → Settings → Pages → Build and deployment → Source เลือก GitHub Actions
บัญชี GitHub Free ใช้ Pages กับ repository แบบ public ส่วน repository แบบ private ต้องใช้แผนที่รองรับ หากไม่พบ Pages ให้ตรวจสิทธิ์ผู้ดูแล repository และประเภทแผนบัญชีก่อน โดยไม่เปลี่ยนการเปิดเผย repository โดยอัตโนมัติ

5. เปิดแท็บ Actions → เลือก workflow Deploy Andaman PM to GitHub Pages ถ้ายังไม่เริ่มให้กด Run workflow โดยเลือก branch main
6. รอขั้นตอนทดสอบและ Deploy เป็นสีเขียว จากนั้นคัดลอก URL จากหน้า deployment หรือ Settings → Pages
7. URL แบบ project site มักมีรูป https://USERNAME.github.io/REPOSITORY/ ให้ใช้ URL ที่ GitHub แสดงจริง ไม่คาดเดาชื่อ
8. เปิด Supabase Dashboard → เลือกโปรเจกต์เดียวกับ dist/config.js → Edge Functions → Secrets
9. เพิ่มหรือแก้ PM_ALLOWED_ORIGINS เป็น origin ของเว็บไซต์ เช่น https://USERNAME.github.io หากใช้หลาย origin ให้คั่นด้วยจุลภาค เช่น https://USERNAME.github.io,https://projects.example.ac.th
10. origin หมายถึง scheme + host เท่านั้น ไม่ใส่ /REPOSITORY/ หรือเครื่องหมาย / ท้าย ค่า origin นี้ใช้กับฟังก์ชันเพิ่มสมาชิก
11. ฟังก์ชัน pm-members ที่ติดตั้งไว้ตรวจ token และสมาชิก Admin ภายในโค้ดอยู่แล้ว ค่า Verify JWT ที่ gateway จึงเป็น false ตาม supabase/config.toml ห้ามลบการตรวจผู้ใช้และ Admin ออกจากโค้ด
12. เปิด URL ใหม่ กด Ctrl+F5 แล้วเข้าสู่ระบบด้วยบัญชีเดิม ข้อมูลโครงการออนไลน์มาจากโปรเจกต์เดิม
13. ทดสอบเพิ่มสมาชิกด้วยบัญชี Admin เพื่อยืนยันว่า origin ถูกต้อง และให้สมาชิกแต่ละบทบาทตรวจขอบเขตข้อมูล

ร่างรายงาน v2.0 อิสระอยู่ตาม origin ของเว็บไซต์ หากย้ายจาก Sites ไป GitHub Pages ร่างในเบราว์เซอร์เดิมจะไม่ย้ายตาม ให้ส่งออก JSON จากเว็บไซต์เดิม แล้วนำเข้าที่เว็บไซต์ใหม่ ส่วนรายงานที่บันทึกเข้าโครงการเก็บในฐานข้อมูลและเปิดที่ URL ใหม่ได้หลังเข้าสู่ระบบ

## 6. ติดตั้ง Supabase โปรเจกต์ใหม่ทั้งชุด

ใช้หัวข้อนี้เมื่อหน่วยงานต้องการฐานข้อมูลใหม่ หากใช้โปรเจกต์เดิมตามหัวข้อ 5 ให้ข้ามขั้นตอนสร้างฐานข้อมูลและ Admin

1. เปิด https://supabase.com/dashboard ลงชื่อเข้าใช้ แล้วสร้างหรือเลือกโปรเจกต์ที่หน่วยงานอนุมัติให้ใช้
2. เปิด SQL Editor → New query จากนั้นเปิด supabase/pm_setup.sql ใน VS Code คัดลอกทั้งหมดไปวางแล้วกด Run
3. ตรวจ Table Editor ว่ามี pm_units, pm_members, pm_sources, pm_proposals, pm_projects, pm_allocations, pm_disbursements, pm_reports, pm_forms, pm_documents, pm_permissions, pm_audit และ pm_commands
4. เปิด Storage ตรวจ bucket ชื่อ andaman-pm-files ต้องเป็น private จำกัดไฟล์ 10 MB
5. เปิด Authentication → Users → Add user / Create user สร้างบัญชี Admin เริ่มต้นด้วยอีเมลจริงของผู้ดูแล กำหนดรหัสผ่านด้วยตนเอง และยืนยันสถานะอีเมลตามตัวเลือกใน Dashboard
6. เปิด supabase/bootstrap_admin.sql ใน VS Code เปลี่ยน CHANGE_TO_YOUR_ADMIN_EMAIL@example.com เป็นอีเมลที่สร้าง แล้วรันใน SQL Editor ตรวจผลว่ามี role admin และ unit office
7. เปิด Edge Functions สร้างฟังก์ชันชื่อ pm-members โดยเลือกตัวแก้โค้ดใน Dashboard แล้วใช้ supabase/functions/pm-members/index.ts เป็นไฟล์ index.ts
8. ตั้ง Verify JWT ที่ gateway เป็น false ตาม config.toml เพราะฟังก์ชันนี้ตรวจ auth.getUser(token) และ pm_members ฝั่งเซิร์ฟเวอร์เอง ก่อนทำงานทุกครั้ง จากนั้น Deploy function
9. ฟังก์ชันปัจจุบันอ่าน SUPABASE_URL, SUPABASE_ANON_KEY และ SUPABASE_SERVICE_ROLE_KEY ที่เป็น environment มาตรฐาน หากใช้ secret key แบบใหม่เป็นค่าทดแทน ให้ตั้งชื่อ PM_SUPABASE_SECRET_KEY ใน Edge Function Secrets เท่านั้น ไม่สร้าง secret ชื่อขึ้นต้น SUPABASE_ เอง
10. ตั้ง PM_ALLOWED_ORIGINS ให้ตรง origin เว็บที่ใช้งานจริง ตามตัวอย่างหัวข้อ 5
11. เปิดหน้า Project API / API Keys ของโปรเจกต์ คัดลอก Project URL และ publishable key ลง dist/config.js ตามตัวอย่างด้านล่าง
12. ค่า loginAliases ของโปรเจกต์ใหม่ใช้ว่างได้ สมาชิกจะเข้าสู่ระบบด้วยอีเมล ถ้าต้องการชื่อผู้ใช้ admin ให้เพิ่ม alias ที่ชี้อีเมล Admin จริง การมี alias ไม่ได้ให้สิทธิ์ Admin โดยตัวมันเอง
13. Commit / Push หน้าเว็บและรอ Deploy แล้วเข้าสู่ระบบด้วยบัญชี Admin ที่สร้าง
14. เพิ่มผู้บริหารและเจ้าหน้าที่จากเมนูสมาชิก ตรวจสิทธิ์หน่วยงานก่อนเริ่มงานจริง

```javascript
window.ANDAMAN_CONFIG = {
  supabaseUrl: 'https://YOUR_PROJECT_REF.supabase.co',
  supabasePublishableKey: 'YOUR_PUBLISHABLE_KEY',
  membersFunction: 'pm-members',
  loginAliases: {
    admin: 'ADMIN_EMAIL_OF_YOUR_INSTITUTE'
  }
};
```

ไฟล์ SQL ติดตั้งใหม่ไม่คัดลอกข้อมูลโครงการเดิมให้โดยอัตโนมัติ หากจะย้ายข้อมูลจริงระหว่างโปรเจกต์ ให้จัดทำแผนสำรองและย้ายข้อมูลแยกจากการเปลี่ยนหน้าเว็บ

## 7. ใช้โฮสต์หรือโดเมนของสถาบัน

1. ให้ผู้ดูแลเว็บไซต์สร้างพื้นที่ HTTPS สำหรับระบบ เช่น https://projects.example.ac.th
2. นำไฟล์และโฟลเดอร์ทั้งหมดภายใน dist ขึ้น document root ของพื้นที่นั้น ต้องมี index.html, app.js, config.js, pm-core.js, styles.css, supabase.js, โลโก้ และ report-editor อยู่ครบ
3. เปิด dist/config.js ให้ชี้โปรเจกต์ฐานข้อมูลที่ต้องการ หากยังใช้โปรเจกต์เดิม คงค่าที่ให้ไว้
4. เพิ่ม origin โดเมนนี้ใน PM_ALLOWED_ORIGINS ฝั่ง Supabase
5. เปิดหน้าเว็บ ทดสอบเข้าสู่ระบบ แท็บรายงาน v2.0 คู่มือ และการเพิ่มสมาชิก
6. ให้สมาชิกเข้า URL ของสถาบัน ไม่ต้องติดตั้ง Node.js หรือโปรแกรมแก้โค้ดในเครื่องสมาชิก

## 8. ทดลองและตรวจโค้ดในเครื่องด้วย VS Code / Node.js

1. ติดตั้ง Node.js รุ่น 24 จาก https://nodejs.org/en/download แล้วปิด–เปิด VS Code ใหม่
2. ใน VS Code เปิดโฟลเดอร์ที่มี package.json
3. เลือก Terminal → New Terminal ถ้า PowerShell ของเครื่องบล็อก npm.ps1 ให้กดลูกศรข้างปุ่ม + ของ Terminal แล้วเลือก Command Prompt สำหรับคำสั่งในหัวข้อนี้
4. รันคำสั่งต่อไปนี้ทีละบรรทัดและรอให้จบก่อนบรรทัดถัดไป

```bash
node --version
npm --version
npm ci
npm run build:gas
npm test
npm run build:user-guide
npm run build:handbook
```

npm ci ติดตั้งตาม package-lock.json; build:gas สร้างไฟล์รายงานแบบรวมสำหรับ Apps Script; npm test ตรวจระบบ; build:user-guide สร้าง START_HERE.html; build:handbook สร้าง INSTALLATION_AND_CODE.html ที่มีโค้ดทุกไฟล์

5. เปิด preview หน้าเว็บด้วยคำสั่ง

```bash
node scripts/preview-static.cjs
```

6. เปิด http://127.0.0.1:4173 ใน Chrome / Edge แล้วเข้าโหมดสาธิตเพื่อทดสอบ หยุด preview ด้วย Ctrl+C ใน Terminal
7. หากจะเพิ่มสมาชิกผ่าน preview เครื่องตนเอง ต้องอนุญาต origin http://127.0.0.1:4173 ใน PM_ALLOWED_ORIGINS ก่อน การเข้าโหมดสาธิตไม่เรียกสร้างบัญชีจริง
8. เปิดรายงานตัวอย่าง ตรวจบันทึกข้อความ ระยะหัวข้อ 2 เคาะ คู่มือทั้งสองส่วน และการสลับแท็บก่อน Commit / Push

การเปิด dist/index.html ด้วยการดับเบิลคลิกเป็น file:// ไม่ใช่วิธีทดสอบระบบหลักที่เชื่อมบริการออนไลน์ ให้เปิดผ่าน local preview หรือ HTTPS hosting

## 9. ตั้งค่าพิมพ์รายงานและบันทึกข้อความ

1. เข้า Andaman Report v2.0 → กรอกข้อมูลให้ครบ → ตัวอย่างรายงาน
2. ตรวจหน้าบันทึกข้อความ: ส่วนราชการอยู่บรรทัดเดียว; ที่ / วันที่อยู่แถวเดียวกัน; เรื่องอยู่ก่อนเรียน; ช่องข้อมูลห่างจากหัวข้อ 2 เคาะตามที่กำหนด
3. ชื่อบันทึกข้อความใช้ 29 pt; หัวส่วนราชการ / ที่ / วันที่ / เรื่องใช้ 20 pt; ข้อมูลและเนื้อความใช้ 16 pt; ระยะบรรทัด 1.0; หัวข้อใหม่เว้น 1.5 บรรทัดด้วยระยะก่อนหน้า 8 pt; ย่อหน้าเนื้อความ 2.5 ซม. ชื่อบันทึกข้อความคงระยะ Exactly 35 pt ตามแบบสารบรรณ และระหว่างย่อหน้าบันทึกเพิ่ม 6 pt; ส่วนราชการ–ที่–เรื่องมีระยะระหว่างแถวเท่ากัน; หัวข้อ 7 ใช้ 16 pt ตัวหนาชิดซ้ายเท่าหัวข้อ 6; ตารางผลประเมินใช้รายการประเมิน ค่าเฉลี่ย (x̄), S.D. และแปลผล โดยคงเส้นตาราง; บทสรุปภาพรวม สูงสุด และต่ำสุดใช้ระยะบรรทัด 1.5 ไม่แสดงสูตรและเกณฑ์ใต้ตาราง
4. ฟอนต์เอกสารให้ใช้ TH Sarabun New เมื่อเครื่องติดตั้งไว้ หากไม่มีระบบใช้ Sarabun หรือฟอนต์สำรอง ต้องตรวจตัวอย่างบนอุปกรณ์ที่ใช้พิมพ์จริง
5. กดพิมพ์ / บันทึก PDF เลือกกระดาษ A4, Scale 100% และปิด Headers and footers ของเบราว์เซอร์ เลขหน้าด้านบนขวาเป็นส่วนที่ระบบจัดให้แล้ว
6. ตรวจ PDF ก่อนนำไปลงนาม ชื่อและช่องความเห็นในแบบพิมพ์ไม่แทนการลงนามหรือการอนุมัติตามกระบวนการของหน่วยงาน

ใช้แนวทางรูปแบบหนังสือภายในจากคู่มือการพิมพ์หนังสือราชการของหน่วยงานรัฐประกอบการจัดหน้า และใช้ระยะหลังหัวข้อ 2 เคาะตามรูปแบบที่ผู้ใช้กำหนด

## 10. ใช้ Google Apps Script / Sheets / Drive เฉพาะตัวรายงานเดิม

ชุดนี้เก็บตัวเลือกของระบบรายงานเดิมไว้ใน apps-script แต่ระบบโครงการหลักใช้ Supabase ตามหัวข้อก่อนหน้า

1. หากต้องการตัวจัดทำรายงานเดี่ยว ให้เปิด https://script.google.com แล้วสร้าง project
2. คัดลอก apps-script/Code.gs ลงไฟล์ Code.gs และเพิ่มไฟล์ HTML ชื่อ Index แล้วคัดลอก apps-script/Index.html ทั้งหมดไปวาง
3. ถ้าต้องใช้ manifest ให้เปิด Project Settings → Show appsscript.json manifest file แล้วใช้ apps-script/appsscript.json ที่รวมไว้
4. Deploy → New deployment → Web app ตามสิทธิ์บัญชีและนโยบายหน่วยงาน ตัวรายงานแบบเดี่ยวเก็บร่างในเบราว์เซอร์และพิมพ์ PDF ได้
5. ถ้าต้องการสะพานส่งสำเนาไป Sheets / Drive ของรุ่นเดิม ให้อ่าน docs/LEGACY_REPORT_V2.md เพื่อกำหนดชีต โฟลเดอร์ และ secret ฝั่งเซิร์ฟเวอร์ ไม่ใส่ secret ลงหน้าเว็บ
6. ไม่ใช้ bridge รุ่นเดิมแทนตาราง pm_reports ของระบบโครงการ หากต้องการติดตามรายงานกับโครงการ ให้ใช้แท็บติดตามรายงานโครงการในระบบหลัก

## 11. อาการที่พบบ่อยและวิธีแก้ให้ตรงจุด

| อาการ | ตรวจที่โปรแกรมไหน | แนวทางแก้ |
|---|---|---|
| เห็น Log in to access | เว็บไซต์ Sites | ใช้บัญชีที่ได้รับสิทธิ์เข้าชมเว็บไซต์ หรือใช้ URL โฮสต์ที่หน่วยงานเปิดให้สมาชิก |
| เข้าระบบแล้วแจ้งยังไม่ได้รับสิทธิ์ | ระบบ / Supabase | ตรวจว่ามีสมาชิก active ใน pm_members ตรง Auth user และหน่วยงานถูกต้อง |
| เพิ่มสมาชิกแล้วเกิด 403 / Origin not allowed | Supabase Edge Function Secrets | ตรวจ PM_ALLOWED_ORIGINS ให้ตรง scheme และ host จริง ไม่ใส่ path |
| เพิ่มสมาชิกแล้วฟังก์ชันใช้ไม่ได้ | Supabase Edge Functions | ตรวจชื่อ pm-members ว่า Deploy แล้ว และตรวจ log โดยไม่เผยแพร่รหัสผ่านหรือกุญแจ |
| GitHub Actions ล้มเหลว | GitHub → Actions | เปิดขั้นตอนสีแดง อ่านข้อผิดพลาด ตรวจว่ามี package-lock.json, dist และ .github ครบ |
| ไม่เห็นเมนู Pages | GitHub / สิทธิ์ repository | ตรวจสิทธิ์ผู้ดูแลและแผนบัญชี สำหรับ GitHub Free ให้ใช้ repository ประเภทที่รองรับ Pages ตามนโยบายของหน่วยงาน |
| หน้า Pages เป็น 404 | GitHub → Settings → Pages | ตรวจ Source เป็น GitHub Actions และ workflow deploy สำเร็จ ใช้ URL ที่ GitHub แสดงจริง |
| บนเว็บยังเห็นหน้าตาเดิม | Chrome / Edge | กด Ctrl+F5 หลัง Deploy สำเร็จ และตรวจว่าเปิด URL ของ repository ที่อัปเดต |
| หาร่าง v2.0 ไม่เจอเมื่อเปลี่ยน URL / เครื่อง | Andaman Report v2.0 | เปิดเว็บไซต์เดิม ส่งออก JSON แล้วนำเข้าเว็บไซต์ใหม่ หรือใช้รายงานผูกโครงการที่บันทึกออนไลน์ไว้ |
| npm ใช้ไม่ได้ / npm.ps1 ถูกบล็อก | VS Code Terminal | ติดตั้ง Node.js และเปิด Terminal แบบ Command Prompt แล้วเปิด VS Code ใหม่ |
| ไม่พบคำสั่ง git ใน VS Code | GitHub Desktop | ใช้เมนู Clone, Commit และ Push ใน GitHub Desktop ตามหัวข้อ 4 |
| เลขหน้าซ้ำหรือมี URL บน PDF | หน้าต่างพิมพ์เบราว์เซอร์ | ปิด Headers and footers และใช้ A4 / Scale 100% |
| ส่วนราชการหรือหัวข้อแสดงผิดจากรุ่นใหม่ | หน้าเว็บ / ไฟล์โฮสต์ | ตรวจว่าอัปเดต report-editor/print.js และ styles.css คู่กัน แล้วกด Ctrl+F5 |

## 12. ตรวจพร้อมใช้ก่อนเปิดรอบงานจริง

1. ผู้ดูแลเลือกฐานข้อมูลและ URL ที่จะใช้ร่วมกันชัดเจน
2. สมาชิกเข้าเว็บไซต์และล็อกอินได้จริงตามบทบาท
3. ผู้จัดทำและผู้พิจารณาเป็นคนละบัญชี หน่วยงานตรงการมอบหมาย
4. แหล่งเงินและการจัดสรรอ้างอิงเอกสารจริง ตัวเลขไม่ใช่ข้อมูลสาธิต
5. ทดสอบลำดับงานในโหมดสาธิต แล้วตรวจการแนบไฟล์ด้วยไฟล์ทดสอบที่หน่วยงานอนุญาตก่อนเริ่มใช้งานจริง
6. ตรวจรายงาน A4 และการสำรอง JSON / ไฟล์ PDF บนอุปกรณ์ที่ใช้ทำงานจริง

## แหล่งอ้างอิงสำหรับผู้ดูแล

- แนวทางพิมพ์หนังสือภายใน หน่วยงานรัฐ: https://www.doonlocal.go.th/fileupload/1110685043.pdf
- GitHub Pages / custom workflow: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
- Supabase / environment variables: https://supabase.com/docs/guides/functions/secrets
- Supabase / Dashboard quickstart: https://supabase.com/docs/guides/functions/quickstart-dashboard
- VS Code: https://code.visualstudio.com/download
- GitHub Desktop: https://desktop.github.com/download/
- Node.js: https://nodejs.org/en/download
