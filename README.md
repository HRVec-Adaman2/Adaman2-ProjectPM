# ANDAMAN PM — ระบบบริหารจัดการโครงการและงบประมาณ

สำหรับสถาบันการอาชีวศึกษาภาคใต้ 2 · ชุดรวม 27 ตุลาคม 2569

ชุดนี้มีโค้ดหน้าบ้าน GitHub Pages, หลังบ้าน Supabase และหน้ารายงาน/หลังบ้าน Google Apps Script ครบ รวมการแก้หน้า Login ที่ต้องกรอกข้อมูลใหม่เมื่อเปิดหรือรีเฟรชหน้า PM, ตารางเป้าหมายตามแบบ, ค่าเฉลี่ย/S.D. และ SDK loader ที่แก้แล้ว

## เริ่มใช้งาน

1. แตก ZIP แล้วเปิด START_HERE.html ด้วย Chrome/Edge เลือก “ขั้นตอนนำระบบไปใช้จริง”
2. เปิด INSTALLATION_AND_CODE.html เพื่อดู ค้นหา และคัดลอกโค้ดทุกไฟล์ แถบโปรแกรมจะบอกว่าใช้ไฟล์นั้นที่ใด
3. โค้ด PM อยู่ dist, SQL/Edge Functions อยู่ supabase, Google Apps Script อยู่ apps-script และคู่มือละเอียดอยู่ docs/DEPLOYMENT_GUIDE_TH.md
4. ชุดนี้ใส่ public settings ของ ANDAMAN2-PM แล้ว ชื่อผู้ใช้ admin จับคู่กับ andaman.southern2@gmail.com และยังใช้รหัสผ่านจริงของบัญชีนั้น
5. หากใช้โปรเจกต์อื่นให้แก้ dist/config.js และ apps-script/Config.html แล้ว build:gas ตามคู่มือก่อนเผยแพร่

## ระบบและข้อมูล

PM มีสิทธิ์ Admin/ผู้บริหาร/เจ้าหน้าที่, Dashboard, ข้อเสนอ/อนุมัติโครงการ, จัดสรรงบ, เบิก/อนุมัติ/บันทึกจ่าย, ไฟล์ขออนุญาต, ติดตามรายงาน, จัดการสมาชิก/สิทธิ์เมนู และประวัติ การตรวจสิทธิ์และวงเงินจริงอยู่ใน Supabase และ RLS

รายงานที่ผูกโครงการเก็บใน pm_reports และใช้บันทึก/ส่งตรวจรับผ่าน PM รายงานแบบแยกเก็บใน andaman_project_reports และส่งสำเนาผ่าน report-sheet-sync ไป Google Sheets/Drive ไม่มีการซิงก์สองตารางนี้อัตโนมัติ หากต้องส่งรายงาน PM ไปชีต ใช้ส่งออก JSON → นำเข้าในรายงานแบบแยก → บันทึกออนไลน์ → ส่งสำเนา ตามคู่มือ

## คำสั่งสำหรับผู้พัฒนา

ใช้ Node.js 24:

```bash
npm ci
npm run build:gas
npm test
npm run build:user-guide
npm run build:handbook
```

build:gas สร้าง dist/report-editor/config.js จาก apps-script/Config.html และรวมหน้าเว็บ/การคำนวณเป็น Index.html กับ Core.gs เมื่อแก้ code/config ต้องวางไฟล์ที่ build ใน Apps Script และ Deploy New version ด้วย

## ขอบเขตการส่งมอบ

ผ่านการทดสอบอัตโนมัติ 58 รายการ ตรวจฐานข้อมูลจริงแบบอ่านอย่างเดียวว่ามีตาราง/bucket และ Admin แล้ว การติดตั้งใน GitHub, Apps Script และ Supabase Edge Functions ของคุณทำตามคู่มือ ไม่ได้ Push/Deploy บริการเหล่านั้นให้โดยอัตโนมัติ และต้องทดสอบ Sheets/Drive กับ deployment จริง

ชุดนี้ไม่มีรหัสผ่านหรือ server secrets ค่า secret ใส่ใน Supabase Secrets และ Apps Script Script properties เท่านั้น
