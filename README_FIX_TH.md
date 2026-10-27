# แก้ GitHub Actions รอบ #18 — ANDAMAN PM

แพตช์ CI-FIX-20261027-1 · 27 ตุลาคม 2569

## สาเหตุที่ตรวจพบจริง

ตรวจ GitHub Actions run 40455596552 / รอบ #18 ของ HRVec-Adaman2/Adaman2-ProjectPM ที่ Commit cd71f2fa2c95e1488a8d985e114ec9bf83632df3 พบว่า Set up Node และ Install pinned dependencies สำเร็จ แต่งานหยุดที่ Verify calculations, RLS and signed sync ซึ่งเรียก npm test

ดาวน์โหลดโค้ดจาก Commit เดียวกันมาตรวจ พบไฟล์ tests/bundle.test.cjs รุ่นเก่าค้างอยู่จากชุด Apps Script เดิม ไฟล์นี้ตรวจว่า Index.html มี 6 สคริปต์ ขณะที่รุ่นแก้ SDK เพิ่ม sdk-loader.js แล้วจึงมี 7 สคริปต์ ผลทดสอบก่อนแก้: 64 รายการ ผ่าน 63 ล้มเหลว 1 ด้วย AssertionError: 7 !== 6 ที่ tests/bundle.test.cjs:11

การคัดลอกชุดอัปเดตทับโฟลเดอร์เดิมไม่ได้ลบไฟล์ทดสอบเก่าให้อัตโนมัติ แพตช์นี้จึงมีไฟล์ชื่อเดิมเพื่อให้เรียกชุดทดสอบปัจจุบัน โดยยังตรวจ HTML, config และการคำนวณครบ คำเตือน actions/setup-node@v4 เป็นอีกเรื่องหนึ่ง จึงอัปเดต action และตรึง runner ในไฟล์ workflow ด้วย

## ไฟล์ที่ต้องนำไปแทน

| ไฟล์ | การแก้ไข |
|---|---|
| tests/bundle.test.cjs | ให้ชื่อไฟล์ทดสอบเดิมเรียก gas-bundle.test.cjs รุ่นปัจจุบัน ซึ่งรองรับ SDK loader และตรวจ 7 สคริปต์ |
| .github/workflows/deploy-pages.yml | ใช้ actions/setup-node@v6, Node.js 24 และ ubuntu-24.04 พร้อมคง npm ci / npm test ก่อนเผยแพร่ |

แพตช์นี้ไม่เปลี่ยน config.js, บัญชีผู้ใช้, SQL, ข้อมูลโครงการ หรือ Apps Script ที่ Deploy ไว้ การอัปเดตเพื่อแก้ Actions ใช้เพียงสองไฟล์ข้างบน ไม่ต้องนำ backend ไปติดตั้งใหม่

## วิธีติดตั้งผ่าน Visual Studio Code

1. แตก Andaman-PM-GitHub-Actions-Fix-2026-10-27.zip
2. เปิด VS Code → File → Open Folder → เลือกโฟลเดอร์ Adaman2-ProjectPM ที่ Clone ไว้เดิม ต้องเห็น package.json และ dist อยู่ชั้นบนสุด
3. บันทึก/Commit งานที่ค้าง แล้ว Pull ล่าสุดจาก GitHub
4. คัดลอก tests/bundle.test.cjs จากแพตช์ไปแทน tests/bundle.test.cjs เดิม
5. คัดลอก .github/workflows/deploy-pages.yml ไปแทนไฟล์ workflow เดิมในตำแหน่งเดียวกัน
6. ถ้าต้องการทดสอบในเครื่อง ใช้ Node.js 24 รัน npm ci ตามด้วย npm test; ถ้า PowerShell บล็อก npm.ps1 ให้ใช้ npm.cmd แทน npm
7. Source Control → กด + ข้างสองไฟล์นี้ → ใส่ข้อความ Commit ว่า Fix legacy bundle test and update Actions runner → Commit → Push หรือ Sync Changes
8. เปิด GitHub → Actions → เปิดรอบใหม่ที่เกิดจาก Commit ใหม่นี้ รอขั้น Verify calculations, RLS and signed sync ผ่าน แล้วรอ Deploy สำเร็จ
9. เปิดเว็บไซต์จาก URL ของ deployment แล้วกด Ctrl + Shift + R

คำสั่งหลังคัดลอกไฟล์และตรวจรายการแก้ไขแล้ว:

```bash
git status
git add tests/bundle.test.cjs .github/workflows/deploy-pages.yml
git commit -m "Fix legacy bundle test and update Actions runner"
git push
```

ไม่ใช้ Re-run jobs ของรอบ #18 เพื่อทดสอบไฟล์ใหม่ เพราะการรันซ้ำของรอบเดิมยังผูกกับ Commit เก่า ต้องเปิดรอบที่เกิดจาก Commit ใหม่ หรือ Run workflow บน main หลัง Push แล้ว

## วิธีแก้ผ่านหน้า GitHub โดยตรง

1. เปิด repository → tests → bundle.test.cjs → Edit
2. แทนเนื้อหาทั้งไฟล์ด้วยโค้ดด้านล่าง แล้ว Commit changes ลง main
3. เปิด .github → workflows → deploy-pages.yml → Edit แล้วแทนด้วยไฟล์จากแพตช์ทั้งไฟล์ → Commit changes
4. เปิด Actions ของ Commit ล่าสุด หลังไฟล์ทั้งสองถูกอัปเดตแล้ว

```javascript
// Compatibility for repositories updated over the older Apps Script package.
// Keep the legacy filename on the current suite, including the SDK loader script.
require('./gas-bundle.test.cjs');
```

ไฟล์ gas-bundle.test.cjs ต้องยังอยู่ใน tests ตามชุดล่าสุด ไม่ลบ tests ทั้งโฟลเดอร์และไม่ปิด npm test เพื่อให้ Deploy ผ่าน

## ผลการตรวจสอบ

- ก่อนแก้บนสำเนา Commit จากภาพ: ผ่าน 63/64 และล้มเหลว 1 รายการ ด้วย 7 !== 6
- หลังแทนสองไฟล์นี้บนสำเนา Commit เดิม โดยเก็บไฟล์เก่าอื่นครบ: ผ่าน 64/64, ไม่มีรายการข้าม
- ชุดต้นฉบับล่าสุดที่รวมแพตช์: ผ่าน 61/61 ต่างกันเพราะ repository ของผู้ใช้มีไฟล์ทดสอบ bridge ชื่อเก่าเพิ่มอยู่อีก 3 รายการ
- ใช้ dependency ที่ตรงกับ package-lock.json ของ Commit ซึ่งขั้น npm ci บน GitHub สำเร็จอยู่แล้ว
- ยังไม่ได้ Push เข้า GitHub ของคุณจากที่นี่ การ Deploy บน GitHub จริงต้องตรวจรอบใหม่หลังคุณอัปเดตไฟล์

อ้างอิง: https://github.com/actions/setup-node และ https://github.com/HRVec-Adaman2/Adaman2-ProjectPM/actions/runs/40455596552
