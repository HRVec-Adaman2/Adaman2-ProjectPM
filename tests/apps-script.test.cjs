const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const crypto=require('node:crypto');
const path=require('node:path');
const C=require('../source/report-editor/core.js');
const SECRET='TEST-ONLY-SECRET-32-CHARACTERS-LONG';
const ID='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const OWNER='11111111-1111-4111-8111-111111111111';
const PHOTO='22222222-2222-4222-8222-222222222222';
function harness(initial=[]){
 const state={locks:0,released:0,backups:[],files:[],folders:0,expansions:0};
 function sheetFor(initialRows,name='รายงานผลโครงการ v2'){
  const rows=structuredClone(initialRows);let maxCols=Math.max(26,...rows.map(r=>r.length));
  const sheet={rows,getName:()=>name,setName(v){name=v;return sheet;},getLastRow:()=>rows.length,
   getLastColumn:()=>Math.max(0,...rows.map(r=>r.reduce((last,v,i)=>v!==''&&v!=null?i+1:last,0))),
   getMaxColumns:()=>maxCols,insertColumnsAfter(at,n){assert.equal(at,maxCols);maxCols+=n;state.expansions++;},setFrozenRows(){},
   copyTo(){const copy=sheetFor(rows,'copy');state.backups.push(copy);return copy;},
   getRange(row,col,n=1,width=1){
    if(col+width-1>maxCols)throw Error('Range outside grid');
    const range={getValues:()=>Array.from({length:n},(_,i)=>Array.from({length:width},(_,j)=>rows[row-1+i]?.[col-1+j]??'')),getValue:()=>rows[row-1]?.[col-1],
     setValues(v){v.forEach((r,i)=>{rows[row-1+i]??=[];r.forEach((cell,j)=>rows[row-1+i][col-1+j]=cell);});return range;},
     setFontWeight(){return range;},setBackground(){return range;},setWrap(){return range;},
     createTextFinder(id){return {matchEntireCell(){return this;},findNext(){const index=rows.findIndex((r,i)=>i>=row-1&&i<row-1+n&&r[col-1]===id);return index<0?null:{getRow:()=>index+1};}};}};
    return range;
   }
  };return sheet;
 }
 const sheet=sheetFor(initial);
 const folder={getFoldersByName:()=>({hasNext:()=>false}),createFolder(){state.folders++;return folder;},
  getFilesByName:name=>({hasNext:()=>state.files.some(x=>x.name===name),next:()=>({getUrl:()=>`https://drive.google.com/file/d/${name}`})}),
  createFile(blob){state.files.push(blob);return {getUrl:()=>`https://drive.google.com/file/d/${blob.name}`};}};
 const ctx={console:{log(){}},Date,Number,JSON,Object,PropertiesService:{getScriptProperties:()=>({getProperties:()=>({SPREADSHEET_ID:'test',DRIVE_FOLDER_ID:'test',REPORT_BRIDGE_SECRET:SECRET})})},
  Utilities:{Charset:{UTF_8:'utf8'},computeHmacSha256Signature:(message,key)=>crypto.createHmac('sha256',key).update(message).digest(),base64Encode:bytes=>Buffer.from(bytes).toString('base64'),base64Decode:val=>Buffer.from(val,'base64'),newBlob:(bytes,mime,name)=>({bytes,mime,name}),getUuid:()=>crypto.randomUUID(),formatDate:()=> '20261026-120000'},
  SpreadsheetApp:{openById:()=>({getSheetByName:()=>sheet,insertSheet:()=>sheet}),flush(){}},DriveApp:{getFolderById:()=>folder},ContentService:{MimeType:{JSON:'json'},createTextOutput:text=>({setMimeType:()=>text})},LockService:{getScriptLock:()=>({waitLock(){state.locks++;},releaseLock(){state.released++;}})}};
 vm.createContext(ctx);for(const name of ['Code.gs','Core.gs'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../apps-script',name),'utf8'),ctx);
 const call=obj=>JSON.parse(ctx.doPost({postData:{contents:JSON.stringify(obj)}}));
 const sign=data=>{const message=JSON.stringify(data);return {message,signature:crypto.createHmac('sha256',SECRET).update(message).digest('base64')};};
 const payload=Object.assign(C.blank(),{projectName:'ทดสอบระบบ',respName:'ผู้ทดสอบ',academicYear:'2570',respondents:{teacher:{count:2}},evaluations:[{topic:'ข้อสูง',s5:2},{topic:'ข้อต่ำ',s1:2}],evalOverallMean:999,evalOverallSd:999,quantGoals:[{planned:'30 คน',actual:'32 คน'}],qualGoals:[{planned:'ผ่านร้อยละ 80',actual:'ผ่านร้อยละ 90'}],kpis:[{kpiText:'ผู้เข้าร่วม',target:'30 คน',actual:'32 คน',status:'บรรลุ'}]});
 const input={reportId:ID,version:1,timestamp:Date.now(),ownerId:OWNER,payload};
 return {ctx,state,sheet,call,sign,input,post:data=>call(sign(data))};
}
test('signed write recalculates mean and SD and preserves paired goals and KPI fields',()=>{
 const h=harness();assert.equal(h.post(h.input).success,true);
 const row=h.sheet.rows[1];assert.equal(row.length,47);assert.equal(h.sheet.rows[0][31],'ค่าเฉลี่ย');
 assert.equal(row[31],3);assert.ok(Math.abs(row[45]-Math.sqrt(16/3))<1e-12);
 assert.equal(JSON.parse(row[43])[0].actual,'32 คน');assert.equal(JSON.parse(row[44])[0].planned,'ผ่านร้อยละ 80');
 assert.equal(JSON.parse(row[34])[0].target,'30 คน');assert.equal(JSON.parse(row[42]).evalOverallMean,3);
 assert.match(row[46],/จากตาราง พบว่า/);assert.match(row[46],/ข้อสูง/);assert.ok(row[46].indexOf('สูงสุด')<row[46].indexOf('ต่ำสุด'));
 assert.equal(h.state.locks,h.state.released);assert.equal(h.state.expansions,1);
});
test('unsigned, expired, bad signatures and invalid owner identities write nothing',()=>{
 const h=harness();assert.equal(h.call({payload:h.input.payload}).success,false);
 assert.equal(h.post({...h.input,timestamp:Date.now()-3600000}).success,false);
 assert.equal(h.call({...h.sign(h.input),signature:'wrong'}).success,false);
 assert.equal(h.post({...h.input,ownerId:'admin'}).success,false);
 assert.equal(h.sheet.rows.length,0);assert.equal(h.state.files.length,0);
});
test('retries are idempotent, new versions update one row, and older versions cannot overwrite it',()=>{
 const h=harness();assert.equal(h.post(h.input).success,true);assert.equal(h.post(h.input).duplicate,true);
 assert.equal(h.post({...h.input,version:2,payload:{...h.input.payload,projectName:'ชื่อใหม่'}}).success,true);
 assert.equal(h.post(h.input).duplicate,true);assert.equal(h.sheet.rows.length,2);assert.equal(h.sheet.rows[1][4],'ชื่อใหม่');
 assert.equal(h.sheet.rows[1][1],2);assert.equal(h.state.locks,h.state.released);
});
test('one report ID cannot be overwritten or acknowledged as a duplicate by another owner',()=>{
 const h=harness();h.post(h.input);
 for(const version of [1,2])assert.equal(h.post({...h.input,version,ownerId:PHOTO}).success,false);
 assert.equal(h.sheet.rows[1][2],OWNER);assert.equal(h.sheet.rows[1][1],1);
});
test('owner migration copies the entire legacy sheet before changing headers and is repeatable',()=>{
 const before=harness();const legacy=Array.from(before.ctx.LEGACY_REPORT_HEADERS);
 const old=Array(43).fill('');old[0]=ID;old[1]=1;old[2]=OWNER;old[4]='เก็บข้อมูลเดิม';old[31]=4.25;
 const h=harness([legacy,old]);h.ctx.upgradeReportSheet_();
 assert.equal(h.state.backups.length,1);assert.deepEqual(h.state.backups[0].rows,[legacy,old]);
 assert.deepEqual(h.sheet.rows[1],old);assert.equal(h.sheet.rows[0].length,47);assert.equal(h.sheet.rows[0][31],'ค่าเฉลี่ย');
 h.ctx.upgradeReportSheet_();assert.equal(h.state.backups.length,1);
 assert.equal(h.post({...h.input,version:2}).success,true);assert.equal(h.sheet.rows[1][45],Math.sqrt(16/3));
});
test('legacy headers require explicit upgrade, unknown or extra legacy columns remain untouched',()=>{
 const legacy=Array.from(harness().ctx.LEGACY_REPORT_HEADERS);
 const h=harness([legacy]);assert.equal(h.post(h.input).success,false);assert.deepEqual(h.sheet.rows,[legacy]);
 const extra=[...legacy,'คอลัมน์ของผู้ใช้'];const other=harness([extra]);assert.throws(()=>other.ctx.upgradeReportSheet_());assert.deepEqual(other.sheet.rows,[extra]);assert.equal(other.state.backups.length,0);
});
test('photo uploads keep MIME extension, versioned filenames and no embedded Base64 in Sheets',()=>{
 const h=harness();const data={...h.input,payload:{...h.input.payload,photos:[{id:PHOTO,caption:'ภาพทดสอบ',base64:'data:image/png;base64,aGk='}]}};
 assert.equal(h.post(data).success,true);assert.equal(h.state.files.length,1);assert.equal(h.state.files[0].name,PHOTO+'-v1.png');
 assert.equal(h.state.files[0].mime,'image/png');assert.doesNotMatch(h.sheet.rows[1][42],/base64/);
 h.post(data);assert.equal(h.state.files.length,1);
});
test('invalid counts, malformed targets and overlong cells are rejected before Drive side effects',()=>{
 for(const update of [{evaluations:[{topic:'x',s5:-1}]},{quantGoals:[{actual:{bad:true}}]},{q7Discuss:'x'.repeat(49001)}]){
  const h=harness();assert.equal(h.post({...h.input,payload:{...h.input.payload,...update}}).success,false);assert.equal(h.state.folders,0);assert.equal(h.sheet.rows.length,0);
 }
 const h=harness();assert.equal(h.ctx.safeCell_('  +SUM(A1)'),"'  +SUM(A1)");assert.throws(()=>h.ctx.safeCell_('x'.repeat(49001)));
});
test('legacy narrative target remains intact and never becomes an invented actual result',()=>{
 const h=harness();delete h.input.payload.quantGoals;delete h.input.payload.qualGoals;
 h.input.payload.q4Quant='ผู้เข้าร่วม 30 คน\nอบรม 1 ครั้ง';assert.equal(h.post(h.input).success,true);
 const goals=JSON.parse(h.sheet.rows[1][43]);assert.equal(goals[0].planned,h.input.payload.q4Quant);assert.equal(goals[0].actual,'');assert.equal(goals.length,2);
});
test('only doGet and doPost are exposed as callable Apps Script functions',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../apps-script/Code.gs'),'utf8');
 const names=[...source.matchAll(/^function (\w+)\(/gm)].map(m=>m[1]);assert.deepEqual(names.filter(n=>!n.endsWith('_')),['doGet','doPost']);
 assert.equal(harness().ctx.saveDataToServer,undefined);
});
