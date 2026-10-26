const {test}=require('node:test');
const assert=require('node:assert/strict');
const C=require('../dist/report-editor/core.js');

test('old target narratives migrate intact without inventing actual results',()=>{
 const old=C.blank();delete old.quantGoals;delete old.qualGoals;
 old.q4Quant='1. บุคลากร 30 คน\n2. อบรม 1 ครั้ง';old.q4Qual='ใช้ระบบได้ตามเกณฑ์';
 const normalized=C.normalizeGoals(old),imported=C.importReport(old);
 assert.equal(normalized.quantGoals[0].planned,old.q4Quant);
 assert.equal(imported.qualGoals[0].planned,old.q4Qual);
 for(const key of ['quantGoals','qualGoals']){assert.equal(imported[key].length,2);assert.ok(imported[key].every(x=>x.actual===''));}
 assert.equal('quantGoals' in old,false);
});
test('paired goals, multiline actuals and old KPI fields survive export, import and repeated saves',()=>{
 const r=C.blank();r.quantGoals=[{planned:'เข้าร่วม 30 คน',actual:'เข้าร่วม 32 คน\nลงทะเบียนครบ'}];r.qualGoals=[{planned:'ผ่านเกณฑ์ร้อยละ 80',actual:'ผ่านเกณฑ์ร้อยละ 90'}];
 r.kpis=[{kpiText:'ผู้เข้าร่วม',target:'30 คน',actual:'32 คน',status:'บรรลุ'}];
 const once=C.derived(r),again=C.importReport(JSON.parse(JSON.stringify(once))),third=C.derived(again);
 assert.deepEqual(again.quantGoals,once.quantGoals);assert.deepEqual(third.qualGoals,once.qualGoals);assert.equal(third.q4Quant,once.q4Quant);
 assert.deepEqual(again.kpis,r.kpis);assert.equal(C.kpiPlanned(again.kpis[0]),'ผู้เข้าร่วม\nค่าเป้าหมาย: 30 คน');
 assert.match(once.q4Quant,/ที่ดำเนินได้จริง: เข้าร่วม 32 คน/);
});
test('cleared structured goals stay cleared even if old narrative is still present',()=>{
 const r=C.blank();r.q4Quant='ข้อความเก่าที่ล้างแล้ว';r.quantGoals=[];
 const imported=C.importReport(r);assert.equal(imported.quantGoals.length,2);assert.ok(imported.quantGoals.every(x=>x.planned===''&&x.actual===''));assert.equal(imported.q4Quant,'');
});
test('paired goal validation rejects malformed or excessive imported rows',()=>{
 for(const value of ['text',{},[null],[{planned:{unexpected:true}}],Array(201).fill({planned:'',actual:''}),[{actual:'x'.repeat(100001)}]])assert.throws(()=>C.importReport({...C.blank(),quantGoals:value}));
 const r=C.importReport({...C.blank(),quantGoals:[{planned:30,actual:32}]});assert.equal(r.quantGoals[0].actual,'32');
});

test('large structured goals reimport without the legacy text-field size limit losing data',()=>{const r=C.blank();r.quantGoals=[{planned:'ก'.repeat(60000),actual:'ผลจริง A'},{planned:'ข'.repeat(60000),actual:'ผลจริง B'}];const exported=C.derived(r);assert.ok(exported.q4Quant.length>100000);assert.deepEqual(C.importReport(exported).quantGoals,exported.quantGoals);});
