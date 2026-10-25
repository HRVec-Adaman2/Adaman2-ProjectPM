/** Andaman Report v2.0 — all server writes require a signed request. */
var REPORT_SHEET_NAME = 'รายงานผลโครงการ v2';
var REPORT_HEADERS = ['รหัสรายงาน','เวอร์ชัน','รหัสเจ้าของรายงาน','เวลาบันทึก','ชื่อโครงการ','ปีงบประมาณ','ลิงก์โลโก้','ชื่อผู้รับผิดชอบ','ตำแหน่ง','แผนกวิชา / งาน','วิทยาลัย / หน่วยงาน','สังกัด','คำนำเพิ่มเติม','ผู้ลงนามคำนำ','ส่วนราชการ','เลขที่หนังสือ','วันที่หนังสือ','เรียน','งบประมาณที่ได้รับ','งบประมาณที่ใช้จริง','ร้อยละความสำเร็จ','ระดับคุณภาพ','ความเห็นลำดับที่ 1','ความเห็นลำดับที่ 2','ความสอดคล้อง','สถานะ','วัตถุประสงค์ (JSON)','เป้าหมายเชิงปริมาณ','เป้าหมายเชิงคุณภาพ','ผู้ตอบแบบสอบถาม (JSON)','ผลประเมิน (JSON)','ค่าเฉลี่ยรวมถ่วงน้ำหนัก','แปลผลรวม','อภิปรายผล','ตัวชี้วัด (JSON)','จุดเด่น','จุดที่ควรพัฒนา','ข้อเสนอแนะ','ภาพกิจกรรม (JSON)','วันเริ่มโครงการ','วันสิ้นสุดโครงการ','สถานที่','ข้อมูลรายงานฉบับเต็ม (JSON)'];

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index').setTitle('Andaman Report — ระบบรายงานผลโครงการ').addMetaTag('viewport','width=device-width, initial-scale=1');
}

// Run from the Apps Script editor after adding Script properties.
// Trailing underscore prevents invocation through google.script.run.
function setupReportSystem_() {
  var cfg = reportConfig_();
  var ss = SpreadsheetApp.openById(cfg.SPREADSHEET_ID);
  var sheet = ss.getSheetByName(REPORT_SHEET_NAME) || ss.insertSheet(REPORT_SHEET_NAME);
  ensureHeaders_(sheet);
  DriveApp.getFolderById(cfg.DRIVE_FOLDER_ID);
  console.log('พร้อมใช้งาน: ' + sheet.getName());
}
function reportConfig_() {
  var cfg = PropertiesService.getScriptProperties().getProperties();
  ['SPREADSHEET_ID','DRIVE_FOLDER_ID','REPORT_BRIDGE_SECRET'].forEach(function(k){ if(!cfg[k]) throw new Error('ยังไม่ได้ตั้งค่า ' + k); });
  if(cfg.REPORT_BRIDGE_SECRET.length < 32) throw new Error('REPORT_BRIDGE_SECRET ต้องยาวอย่างน้อย 32 ตัวอักษร');
  return cfg;
}
function ensureHeaders_(sheet) {
  if(sheet.getLastRow() === 0) {
    sheet.getRange(1,1,1,REPORT_HEADERS.length).setValues([REPORT_HEADERS]).setFontWeight('bold').setBackground('#e6eee5').setWrap(true);
    sheet.setFrozenRows(1);
    return;
  }
  var actual = sheet.getRange(1,1,1,REPORT_HEADERS.length).getValues()[0];
  if(actual.join('\u001f') !== REPORT_HEADERS.join('\u001f')) throw new Error('หัวตารางไม่ตรงรุ่น 2.0 กรุณาใช้ชีตแยก ห้ามทับข้อมูลเดิม');
}
function jsonResponse_(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
function sameSignature_(a,b) {
  if(typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length)return false;
  var diff=0;for(var i=0;i<a.length;i++)diff |= a.charCodeAt(i)^b.charCodeAt(i);return diff===0;
}
function safeCell_(value) {
  if(value == null)return '';
  if(typeof value==='number')return value;
  var text=String(value);
  if(text.length>49000)throw new Error('ข้อมูลบางช่องเกิน 49,000 ตัวอักษร กรุณาย่อข้อความก่อนส่งสำเนาไปชีต');
  return /^[\s\u0000-\u001f]*[=+@-]/.test(text) ? "'"+text : text;
}
function imageFile_(base64,folder,fileName) {
  var match=String(base64||'').match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
  if(!match)throw new Error('ข้อมูลภาพไม่ถูกต้อง');
  var existing=folder.getFilesByName(fileName);
  if(existing.hasNext())return existing.next().getUrl();
  var bytes=Utilities.base64Decode(match[2]);
  if(bytes.length>1572864)throw new Error('ขนาดภาพเกิน 1.5 MB');
  // Inherits folder permissions. No ANYONE_WITH_LINK sharing.
  return folder.createFile(Utilities.newBlob(bytes,match[1],fileName)).getUrl();
}
function reportFolder_(root,id) {
  var found=root.getFoldersByName(id);
  return found.hasNext()?found.next():root.createFolder(id);
}
function doPost(e) {
  var lock=LockService.getScriptLock(),locked=false;
  try {
    if(!e||!e.postData||!e.postData.contents)throw new Error('ไม่พบข้อมูลคำขอ');
    if(e.postData.contents.length>16000000)throw new Error('ข้อมูลภาพรวมใหญ่เกินกำหนด');
    var cfg=reportConfig_(),request=JSON.parse(e.postData.contents);
    if(typeof request.message!=='string'||typeof request.signature!=='string')throw new Error('คำขอไม่มีลายเซ็น');
    var expected=Utilities.base64Encode(Utilities.computeHmacSha256Signature(request.message,cfg.REPORT_BRIDGE_SECRET,Utilities.Charset.UTF_8));
    if(!sameSignature_(request.signature,expected))throw new Error('ลายเซ็นคำขอไม่ถูกต้อง');
    var data=JSON.parse(request.message),r=data.payload;
    if(!Number.isFinite(data.timestamp)||Math.abs(Date.now()-data.timestamp)>300000)throw new Error('คำขอหมดอายุ');
    if(!/^[0-9a-f-]{36}$/i.test(data.reportId)||!Number.isInteger(data.version)||data.version<1||!r||typeof r.projectName!=='string'||!r.projectName.trim())throw new Error('ข้อมูลรายงานไม่ถูกต้อง');
    if(!Array.isArray(r.photos)||r.photos.length>20)throw new Error('รายการภาพไม่ถูกต้อง');
    lock.waitLock(20000);locked=true;
    var ss=SpreadsheetApp.openById(cfg.SPREADSHEET_ID),sheet=ss.getSheetByName(REPORT_SHEET_NAME)||ss.insertSheet(REPORT_SHEET_NAME);
    ensureHeaders_(sheet);
    var row=0,previousVersion=0;
    if(sheet.getLastRow()>1){var found=sheet.getRange(2,1,sheet.getLastRow()-1,1).createTextFinder(data.reportId).matchEntireCell(true).findNext();if(found){row=found.getRow();previousVersion=Number(sheet.getRange(row,2).getValue())||0;}}
    if(previousVersion>=data.version)return jsonResponse_({success:true,reportId:data.reportId,version:previousVersion,duplicate:true});
    var root=DriveApp.getFolderById(cfg.DRIVE_FOLDER_ID),folder=reportFolder_(root,data.reportId);
    var logoUrl=r.logoBase64?imageFile_(r.logoBase64,folder,'logo-v'+data.version+'.jpg'):'';
    var photos=r.photos.map(function(photo){if(!/^[0-9a-f-]{36}$/i.test(photo.id))throw new Error('รหัสภาพไม่ถูกต้อง');return {id:photo.id,caption:String(photo.caption||''),url:imageFile_(photo.base64,folder,photo.id+'.jpg')};});
    var full=Object.assign({},r,{logoBase64:undefined,logoUrl:logoUrl,photos:photos});
    var cells=[data.reportId,data.version,data.ownerId,new Date().toISOString(),r.projectName,r.academicYear,logoUrl,r.respName,r.respPos,r.respDept,r.schoolName,r.schoolArea,r.introExtra,r.introReporter,r.memoDept,r.memoNo,r.memoDate,r.memoTo,r.budgetPlanned,r.memoBudget,r.memoPercent,r.memoGrade,[r.memoViceCheck,r.memoViceComment].filter(Boolean).join(' '),[r.memoDirCheck,r.memoDirComment].filter(Boolean).join(' '),r.q1Align,r.q2Status,JSON.stringify(r.objectives),r.q4Quant,r.q4Qual,JSON.stringify(r.respondents),JSON.stringify(r.evaluations),r.evalOverallMean,r.evalOverallTrans,r.q7Discuss,JSON.stringify(r.kpis),r.q9Strength,r.q10Weakness,r.q11Suggest,JSON.stringify(photos),r.startDate,r.endDate,r.location,JSON.stringify(full)];
    cells=cells.map(safeCell_);
    sheet.getRange(row||sheet.getLastRow()+1,1,1,cells.length).setValues([cells]);
    SpreadsheetApp.flush();
    return jsonResponse_({success:true,reportId:data.reportId,version:data.version});
  } catch(error) {return jsonResponse_({success:false,message:String(error.message||error)});}
  finally{if(locked)lock.releaseLock();}
}
