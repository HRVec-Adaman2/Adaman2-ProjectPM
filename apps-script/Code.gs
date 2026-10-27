/**
 * ANDAMAN REPORT · Google Apps Script backend · 2026-10-26
 * Only doGet/doPost are public. Owner setup functions end with _.
 * Writes require an HMAC-signed request from report-sheet-sync.
 * No passwords, Supabase secret keys or service_role keys belong in HTML.
 */
var REPORT_SHEET_NAME = 'รายงานผลโครงการ v2';
var LEGACY_REPORT_HEADERS = ['รหัสรายงาน','เวอร์ชัน','รหัสเจ้าของรายงาน','เวลาบันทึก','ชื่อโครงการ','ปีงบประมาณ','ลิงก์โลโก้','ชื่อผู้รับผิดชอบ','ตำแหน่ง','แผนกวิชา / งาน','วิทยาลัย / หน่วยงาน','สังกัด','คำนำเพิ่มเติม','ผู้ลงนามคำนำ','ส่วนราชการ','เลขที่หนังสือ','วันที่หนังสือ','เรียน','งบประมาณที่ได้รับ','งบประมาณที่ใช้จริง','ร้อยละความสำเร็จ','ระดับคุณภาพ','ความเห็นลำดับที่ 1','ความเห็นลำดับที่ 2','ความสอดคล้อง','สถานะ','วัตถุประสงค์ (JSON)','เป้าหมายเชิงปริมาณ','เป้าหมายเชิงคุณภาพ','ผู้ตอบแบบสอบถาม (JSON)','ผลประเมิน (JSON)','ค่าเฉลี่ยรวมถ่วงน้ำหนัก','แปลผลรวม','อภิปรายผล','ตัวชี้วัด (JSON)','จุดเด่น','จุดที่ควรพัฒนา','ข้อเสนอแนะ','ภาพกิจกรรม (JSON)','วันเริ่มโครงการ','วันสิ้นสุดโครงการ','สถานที่','ข้อมูลรายงานฉบับเต็ม (JSON)'];
var REPORT_HEADERS = LEGACY_REPORT_HEADERS.map(function(x,i){return i===31?'ค่าเฉลี่ย':x;}).concat([
  'เป้าหมายเชิงปริมาณ ที่กำหนด / ผลจริง (JSON)',
  'เป้าหมายเชิงคุณภาพ ที่กำหนด / ผลจริง (JSON)',
  'S.D. ภาพรวม',
  'สรุปผลการประเมินความพึงพอใจ'
]);

function doGet() {
  return HtmlService.createTemplateFromFile('Index').evaluate()
    .setTitle('Andaman Report — ระบบรายงานผลโครงการ')
    .addMetaTag('viewport','width=device-width, initial-scale=1');
}
function includePublicConfig_() {
  return HtmlService.createHtmlOutputFromFile('Config').getContent();
}
function reportConfig_() {
  var cfg=PropertiesService.getScriptProperties().getProperties();
  ['SPREADSHEET_ID','DRIVE_FOLDER_ID','REPORT_BRIDGE_SECRET'].forEach(function(k){
    if(!cfg[k])throw new Error('ยังไม่ได้ตั้งค่า '+k);
  });
  if(cfg.REPORT_BRIDGE_SECRET.length<32)throw new Error('REPORT_BRIDGE_SECRET ต้องยาวอย่างน้อย 32 ตัวอักษร');
  return cfg;
}
// Run only in the Apps Script editor with the owner's Google account.
function setupReportSystem_() {
  var lock=LockService.getScriptLock();lock.waitLock(20000);
  try {
    var cfg=reportConfig_(),ss=SpreadsheetApp.openById(cfg.SPREADSHEET_ID);
    DriveApp.getFolderById(cfg.DRIVE_FOLDER_ID);
    var sheet=ss.getSheetByName(REPORT_SHEET_NAME)||ss.insertSheet(REPORT_SHEET_NAME);
    ensureHeaders_(sheet);SpreadsheetApp.flush();
    console.log('พร้อมใช้งาน: '+sheet.getName()+' ('+REPORT_HEADERS.length+' คอลัมน์)');
  } finally {lock.releaseLock();}
}
function headerKind_(sheet) {
  if(sheet.getLastRow()===0)return 'empty';
  var width=Math.max(1,sheet.getLastColumn());
  var actual=sheet.getRange(1,1,1,width).getValues()[0];
  if(actual.slice(0,REPORT_HEADERS.length).join('\u001f')===REPORT_HEADERS.join('\u001f'))return 'current';
  var legacy=actual.slice(0,LEGACY_REPORT_HEADERS.length);
  var firstMatch=legacy.join('\u001f')===LEGACY_REPORT_HEADERS.join('\u001f');
  var renamed=LEGACY_REPORT_HEADERS.map(function(x,i){return i===31?'ค่าเฉลี่ย':x;});
  firstMatch=firstMatch||legacy.join('\u001f')===renamed.join('\u001f');
  // Refuse an unknown schema or any extra user data before appending columns.
  return firstMatch&&sheet.getLastColumn()<=LEGACY_REPORT_HEADERS.length?'legacy':'unknown';
}
function writeHeaders_(sheet) {
  if(sheet.getMaxColumns()<REPORT_HEADERS.length)
    sheet.insertColumnsAfter(sheet.getMaxColumns(),REPORT_HEADERS.length-sheet.getMaxColumns());
  sheet.getRange(1,1,1,REPORT_HEADERS.length).setValues([REPORT_HEADERS])
    .setFontWeight('bold').setBackground('#e6eee5').setWrap(true);
  sheet.setFrozenRows(1);
}
function ensureHeaders_(sheet) {
  var kind=headerKind_(sheet);
  if(kind==='empty')writeHeaders_(sheet);
  else if(kind==='legacy')throw new Error('พบหัวตารางรุ่นเดิม ให้เจ้าของรัน upgradeReportSheet_ ใน Apps Script ก่อนส่งสำเนาอีกครั้ง');
  else if(kind!=='current')throw new Error('หัวตารางไม่ตรงรูปแบบที่รองรับ กรุณาใช้ Google Sheets ใหม่ ระบบไม่ทับคอลัมน์เดิม');
}
/** Back up the entire old sheet before changing headers. Old report rows remain. */
function upgradeReportSheet_() {
  var lock=LockService.getScriptLock();lock.waitLock(20000);
  try {
    var cfg=reportConfig_(),ss=SpreadsheetApp.openById(cfg.SPREADSHEET_ID);
    var sheet=ss.getSheetByName(REPORT_SHEET_NAME);
    if(!sheet){sheet=ss.insertSheet(REPORT_SHEET_NAME);writeHeaders_(sheet);}
    else {
      var kind=headerKind_(sheet);
      if(kind==='unknown')throw new Error('ไม่ใช่หัวตารางเดิมที่รองรับ จึงหยุดโดยไม่แก้ไขข้อมูล');
      if(kind==='legacy'){
        var backup=sheet.copyTo(ss);
        var suffix=Utilities.formatDate(new Date(),'Asia/Bangkok','yyyyMMdd-HHmmss')+'-'+Utilities.getUuid().slice(0,6);
        backup.setName('สำรองก่อนอัปเกรด-'+suffix);
        SpreadsheetApp.flush();
        writeHeaders_(sheet);
        console.log('สร้างสำรองแล้ว: '+backup.getName());
      }else if(kind==='empty')writeHeaders_(sheet);
    }
    SpreadsheetApp.flush();
    console.log('หัวตารางพร้อมใช้งาน ค่าคอลัมน์ใหม่ของรายงานเก่าจะเติมเมื่อส่งสำเนารายงานนั้นอีกครั้ง');
  }finally{lock.releaseLock();}
}
function jsonResponse_(obj){return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);}
function sameSignature_(a,b){
  if(typeof a!=='string'||typeof b!=='string'||a.length!==b.length)return false;
  var diff=0;for(var i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);return diff===0;
}
function validUuid_(v){return typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);}
function safeCell_(value){
  if(value==null)return '';
  if(typeof value==='number'){if(!Number.isFinite(value))throw new Error('ค่าตัวเลขไม่ถูกต้อง');return value;}
  var text=String(value);
  if(text.length>49000)throw new Error('ข้อมูลบางช่องเกิน 49,000 ตัวอักษร กรุณาย่อข้อความก่อนส่งสำเนาไปชีต รายงานออนไลน์ยังอยู่ครบ');
  return /^[\s\u0000-\u001f]*[=+@-]/.test(text)?"'"+text:text;
}
function normalizePayload_(raw,id){
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new Error('ข้อมูลรายงานไม่ถูกต้อง');
  var r=Object.assign(AndamanReportCore.blank(),AndamanReportCore.normalizeGoals(raw),{id:id});
  AndamanReportCore.textFields.forEach(function(k){
    if(k==='q4Quant'||k==='q4Qual')return;
    if(typeof r[k]!=='string'&&typeof r[k]!=='number')throw new Error('ชนิดข้อมูลไม่ถูกต้อง: '+k);
    r[k]=String(r[k]);if(r[k].length>100000)throw new Error('ข้อความยาวเกินกำหนด: '+k);
  });
  ['objectives','evaluations','kpis','photos'].forEach(function(k){
    if(!Array.isArray(r[k])||r[k].length>(k==='photos'?20:200))throw new Error('รายการ '+k+' ไม่ถูกต้อง');
  });
  r.objectives.forEach(function(x){if(typeof x!=='string'||x.length>100000)throw new Error('วัตถุประสงค์ไม่ถูกต้อง');});
  r.evaluations.forEach(function(x){if(!x||typeof x.topic!=='string'||x.topic.length>500)throw new Error('หัวข้อประเมินไม่ถูกต้อง');});
  r.kpis.forEach(function(x){if(!x||typeof x.kpiText!=='string'||x.kpiText.length>1000||['target','actual'].some(function(k){return x[k]!=null&&typeof x[k]!=='string'&&typeof x[k]!=='number';}))throw new Error('ตัวชี้วัดไม่ถูกต้อง');});
  if(!r.respondents||typeof r.respondents!=='object'||Array.isArray(r.respondents))throw new Error('จำนวนผู้ตอบไม่ถูกต้อง');
  if(!['ยังไม่ได้ดำเนินการ','อยู่ระหว่างดำเนินการ','ดำเนินการเสร็จสิ้นแล้ว'].includes(r.q2Status))throw new Error('สถานะโครงการไม่ถูกต้อง');
  var ids={};
  r.photos.forEach(function(p){
    if(!p||!validUuid_(p.id)||ids[p.id]||typeof p.caption!=='string'||p.caption.length>600)throw new Error('รายการภาพไม่ถูกต้อง');
    ids[p.id]=true;imageParts_(p.base64);
  });
  if(r.logoBase64)imageParts_(r.logoBase64);
  r=AndamanReportCore.derived(r); // Never trust client-supplied means or S.D.
  AndamanReportCore.validate(r,true);
  return r;
}
function imageParts_(base64){
  var match=String(base64||'').match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
  if(!match)throw new Error('ข้อมูลภาพไม่ถูกต้อง');
  var bytes=Utilities.base64Decode(match[2]);
  if(!bytes.length||bytes.length>1572864)throw new Error('ขนาดภาพต้องมากกว่า 0 และไม่เกิน 1.5 MB');
  return {bytes:bytes,mime:match[1],extension:match[1]==='image/jpeg'?'jpg':match[1].split('/')[1]};
}
function imageFile_(base64,folder,stem){
  var parts=imageParts_(base64),fileName=stem+'.'+parts.extension;
  var existing=folder.getFilesByName(fileName);
  if(existing.hasNext())return existing.next().getUrl();
  // Inherit folder permissions. Do not enable public-link sharing.
  return folder.createFile(Utilities.newBlob(parts.bytes,parts.mime,fileName)).getUrl();
}
function reportFolder_(root,id){var found=root.getFoldersByName(id);return found.hasNext()?found.next():root.createFolder(id);}
function reportCells_(data,r,logoUrl,photos){
  var full=Object.assign({},r,{logoBase64:undefined,logoUrl:logoUrl,photos:photos});
  return [data.reportId,data.version,data.ownerId,new Date().toISOString(),r.projectName,r.academicYear,logoUrl,r.respName,r.respPos,r.respDept,r.schoolName,r.schoolArea,r.introExtra,r.introReporter,r.memoDept,r.memoNo,r.memoDate,r.memoTo,r.budgetPlanned,r.memoBudget,r.memoPercent,r.memoGrade,[r.memoViceCheck,r.memoViceComment].filter(Boolean).join(' '),[r.memoDirCheck,r.memoDirComment].filter(Boolean).join(' '),r.q1Align,r.q2Status,JSON.stringify(r.objectives),r.q4Quant,r.q4Qual,JSON.stringify(r.respondents),JSON.stringify(r.evaluations),r.evalOverallMean,r.evalOverallTrans,r.q7Discuss,JSON.stringify(r.kpis),r.q9Strength,r.q10Weakness,r.q11Suggest,JSON.stringify(photos),r.startDate,r.endDate,r.location,JSON.stringify(full),JSON.stringify(r.quantGoals),JSON.stringify(r.qualGoals),r.evalOverallSd,AndamanReportCore.evaluationNarrative(AndamanReportCore.evaluate(r.evaluations))].map(safeCell_);
}
function doPost(e){
  var lock=LockService.getScriptLock(),locked=false;
  try{
    if(!e||!e.postData||!e.postData.contents)throw new Error('ไม่พบข้อมูลคำขอ');
    if(e.postData.contents.length>16000000)throw new Error('ข้อมูลภาพรวมใหญ่เกินกำหนด');
    var cfg=reportConfig_(),request=JSON.parse(e.postData.contents);
    if(typeof request.message!=='string'||typeof request.signature!=='string')throw new Error('คำขอไม่มีลายเซ็น');
    var expected=Utilities.base64Encode(Utilities.computeHmacSha256Signature(request.message,cfg.REPORT_BRIDGE_SECRET,Utilities.Charset.UTF_8));
    if(!sameSignature_(request.signature,expected))throw new Error('ลายเซ็นคำขอไม่ถูกต้อง');
    var data=JSON.parse(request.message);
    if(!Number.isFinite(data.timestamp)||Math.abs(Date.now()-data.timestamp)>300000)throw new Error('คำขอหมดอายุ');
    if(!validUuid_(data.reportId)||!validUuid_(data.ownerId)||!Number.isSafeInteger(data.version)||data.version<1)throw new Error('ข้อมูลรายงานไม่ถูกต้อง');
    var r=normalizePayload_(data.payload,data.reportId);
    // Check cell limits before creating Drive files. Final URL lengths are checked again.
    reportCells_(data,r,'',r.photos.map(function(p){return {id:p.id,caption:p.caption,url:''};}));
    lock.waitLock(20000);locked=true;
    var ss=SpreadsheetApp.openById(cfg.SPREADSHEET_ID),sheet=ss.getSheetByName(REPORT_SHEET_NAME)||ss.insertSheet(REPORT_SHEET_NAME);
    ensureHeaders_(sheet);
    var row=0,previousVersion=0;
    if(sheet.getLastRow()>1){
      var found=sheet.getRange(2,1,sheet.getLastRow()-1,1).createTextFinder(data.reportId).matchEntireCell(true).findNext();
      if(found){
        row=found.getRow();previousVersion=Number(sheet.getRange(row,2).getValue())||0;
        if(sheet.getRange(row,3).getValue()!==data.ownerId)throw new Error('เจ้าของรายงานไม่ตรงกับข้อมูลเดิม');
      }
    }
    if(previousVersion>=data.version)return jsonResponse_({success:true,reportId:data.reportId,version:previousVersion,duplicate:true});
    var root=DriveApp.getFolderById(cfg.DRIVE_FOLDER_ID),folder=reportFolder_(root,data.reportId);
    var logoUrl=r.logoBase64?imageFile_(r.logoBase64,folder,'logo-v'+data.version):'';
    var photos=r.photos.map(function(p){return {id:p.id,caption:p.caption,url:imageFile_(p.base64,folder,p.id+'-v'+data.version)};});
    var cells=reportCells_(data,r,logoUrl,photos);
    sheet.getRange(row||sheet.getLastRow()+1,1,1,cells.length).setValues([cells]);
    SpreadsheetApp.flush();
    return jsonResponse_({success:true,reportId:data.reportId,version:data.version});
  }catch(error){return jsonResponse_({success:false,message:String(error.message||error)});}
  finally{if(locked)lock.releaseLock();}
}
